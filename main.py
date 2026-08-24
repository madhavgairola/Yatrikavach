import os
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from supabase import create_client, Client

# Load environment variables from .env
load_dotenv()

BASE = Path(__file__).resolve().parent

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


# ---------------------------------------------------------
# FASTAPI APP
# ---------------------------------------------------------

app = FastAPI(title="YatriKavach API")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("APP_ORIGIN", "http://127.0.0.1:8000")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.mount(
    "/static",
    StaticFiles(directory=BASE / "static"),
    name="static"
)


# ---------------------------------------------------------
# REQUEST MODELS
# ---------------------------------------------------------

class LocationIn(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    trip_id: Optional[str] = None


class IncidentIn(BaseModel):
    category: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: int = 2
    trip_id: Optional[str] = None


class SosIn(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_name: Optional[str] = None


class TripIn(BaseModel):
    title: str
    destination: Optional[str] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    geofence_radius_m: int = 5000
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    status: str = "planned"


class ChatIn(BaseModel):
    message: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_name: Optional[str] = None


class ProfileIn(BaseModel):
    full_name: Optional[str] = None
    nationality: Optional[str] = None
    emergency_contact: Optional[str] = None


# ---------------------------------------------------------
# DATABASE FUNCTIONS
# ---------------------------------------------------------

def db_for_user(access_token: str) -> Client:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured. Add values to .env"
        )

    client = create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )

    client.postgrest.auth(access_token)

    return client


async def user_from_request(request: Request):
    token = (
        request.headers
        .get("Authorization", "")
        .replace("Bearer ", "")
        .strip()
    )

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Login required"
        )

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )

    client = create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )

    try:
        result = client.auth.get_user(token)

        if not result.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session"
            )

        return result.user, token

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        ) from e


# ---------------------------------------------------------
# HOME PAGE
# ---------------------------------------------------------

@app.get("/")
async def index():
    return FileResponse(
        BASE / "static" / "index.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------

@app.get("/api/config")
async def config():

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Set SUPABASE_URL and SUPABASE_ANON_KEY in .env"
        )

    return {
        "supabaseUrl": SUPABASE_URL,
        "supabaseAnonKey": SUPABASE_ANON_KEY
    }


# ---------------------------------------------------------
# PROFILE
# ---------------------------------------------------------

@app.get("/api/profile")
async def get_profile(request: Request):
    user, token = await user_from_request(request)
    client = db_for_user(token)
    result = client.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    if result.data:
        return result.data[0]
    data = {"id": user.id, "full_name": user.user_metadata.get("full_name") or user.email.split("@")[0]}
    created = client.table("profiles").upsert(data).execute()
    return created.data[0] if created.data else data


@app.put("/api/profile")
async def save_profile(
    body: ProfileIn,
    request: Request
):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    data = body.model_dump(
        exclude_none=True
    )

    data["id"] = user.id

    result = (
        client
        .table("profiles")
        .upsert(data)
        .execute()
    )

    return (
        result.data[0]
        if result.data
        else data
    )


# ---------------------------------------------------------
# LOCATION
# ---------------------------------------------------------

@app.post("/api/location")
async def save_location(
    body: LocationIn,
    request: Request
):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    place = ""

    try:

        async with httpx.AsyncClient(
            timeout=8,
            headers={
                "User-Agent": "YatriKavach/1.0"
            }
        ) as http_client:

            response = await http_client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": body.latitude,
                    "lon": body.longitude,
                    "format": "json"
                }
            )

            if response.is_success:

                place = (
                    response
                    .json()
                    .get("display_name", "")
                )

    except Exception:
        pass

    data = {
        "user_id": user.id,
        "trip_id": body.trip_id,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "accuracy": body.accuracy,
        "place_name": place
    }

    result = (
        client
        .table("location_events")
        .insert(data)
        .execute()
    )

    return {
        "location": (
            result.data[0]
            if result.data
            else data
        ),
        "place_name": place
    }


# ---------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------

@app.get("/api/dashboard")
async def dashboard(request: Request):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    locations = (
        client
        .table("location_events")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
        .data
    )

    incidents = (
        client
        .table("incidents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
        .data
    )

    sos = (
        client
        .table("sos_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
        .data
    )

    trips = (
        client
        .table("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
        .data
    )

    return {
        "location": (
            locations[0]
            if locations
            else None
        ),
        "incidents": incidents,
        "sos": sos,
        "trips": trips
    }


# ---------------------------------------------------------
# INCIDENT
# ---------------------------------------------------------

@app.post("/api/incident")
async def incident(
    body: IncidentIn,
    request: Request
):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    data = body.model_dump()

    data["user_id"] = user.id

    result = (
        client
        .table("incidents")
        .insert(data)
        .execute()
    )

    event = {
        "user_id": user.id,
        "event_type": "incident_reported",
        "score": max(
            1,
            min(
                100,
                body.severity * 20
            )
        ),
        "details": {
            "category": body.category
        }
    }

    (
        client
        .table("safety_events")
        .insert(event)
        .execute()
    )

    return (
        result.data[0]
        if result.data
        else data
    )


# ---------------------------------------------------------
# SOS
# ---------------------------------------------------------

@app.post("/api/sos")
async def sos(
    body: SosIn,
    request: Request
):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    data = body.model_dump()

    data["user_id"] = user.id

    result = (
        client
        .table("sos_events")
        .insert(data)
        .execute()
    )

    (
        client
        .table("safety_events")
        .insert({
            "user_id": user.id,
            "event_type": "sos",
            "score": 100,
            "details": {
                "latitude": body.latitude,
                "longitude": body.longitude
            }
        })
        .execute()
    )

    return {
        "ok": True,
        "event": (
            result.data[0]
            if result.data
            else data
        )
    }


# ---------------------------------------------------------
# DISTANCE CALCULATION
# ---------------------------------------------------------

def haversine(
    a_lat,
    a_lon,
    b_lat,
    b_lon
):

    import math

    R = 6371000

    p1 = math.radians(a_lat)
    p2 = math.radians(b_lat)

    dp = math.radians(
        b_lat - a_lat
    )

    dl = math.radians(
        b_lon - a_lon
    )

    x = (
        math.sin(dp / 2) ** 2
        +
        math.cos(p1)
        *
        math.cos(p2)
        *
        math.sin(dl / 2) ** 2
    )

    return (
        2
        *
        R
        *
        math.asin(
            math.sqrt(x)
        )
    )


# ---------------------------------------------------------
# CREATE TRIP
# ---------------------------------------------------------

@app.post("/api/trip")
async def create_trip(
    body: TripIn,
    request: Request
):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    data = body.model_dump()

    data["user_id"] = user.id

    result = (
        client
        .table("trips")
        .insert(data)
        .execute()
    )

    return (
        result.data[0]
        if result.data
        else data
    )


# ---------------------------------------------------------
# UPDATE TRIP
# ---------------------------------------------------------

@app.patch("/api/trip/{trip_id}")
async def update_trip(
    trip_id: str,
    body: TripIn,
    request: Request
):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    data = body.model_dump()

    data.pop(
        "title",
        None
    )

    result = (
        client
        .table("trips")
        .update(data)
        .eq("id", trip_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not result.data:

        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    return result.data[0]


# ---------------------------------------------------------
# SAFETY CONTEXT
# ---------------------------------------------------------

@app.get("/api/context")
async def context(request: Request):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    locations = (
        client
        .table("location_events")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
        .data
    )

    trips = (
        client
        .table("trips")
        .select("*")
        .eq("user_id", user.id)
        .in_(
            "status",
            ["planned", "active"]
        )
        .order(
            "created_at",
            desc=True
        )
        .limit(10)
        .execute()
        .data
    )

    incidents = (
        client
        .table("incidents")
        .select("*")
        .eq("user_id", user.id)
        .order(
            "created_at",
            desc=True
        )
        .limit(20)
        .execute()
        .data
    )

    location = (
        locations[0]
        if locations
        else None
    )

    now = (
        __import__("datetime")
        .datetime
        .now(
            __import__("datetime")
            .timezone.utc
        )
    )

    overstay = []

    outside = []

    if location:

        for trip in trips:

            if trip.get("end_at"):

                try:

                    end = (
                        __import__("datetime")
                        .datetime
                        .fromisoformat(
                            trip["end_at"]
                            .replace(
                                "Z",
                                "+00:00"
                            )
                        )
                    )

                    if now > end:

                        overstay.append(
                            trip
                        )

                except Exception:
                    pass

            if (
                trip.get(
                    "destination_lat"
                )
                is not None
                and
                trip.get(
                    "destination_lon"
                )
                is not None
            ):

                distance = haversine(
                    location["latitude"],
                    location["longitude"],
                    trip["destination_lat"],
                    trip["destination_lon"]
                )

                if distance > (
                    trip.get(
                        "geofence_radius_m"
                    )
                    or 5000
                ):

                    outside.append({
                        "trip": trip,
                        "distance_m": round(
                            distance
                        )
                    })

    score = max(
        0,
        100
        -
        len(incidents) * 8
        -
        len(overstay) * 25
        -
        len(outside) * 15
    )

    alerts = []

    if overstay:

        alerts.append({
            "type": "overstay",
            "message": (
                "A planned travel window has ended. "
                "Review your trip status."
            )
        })

    if outside:

        alerts.append({
            "type": "geofence",
            "message": (
                "Current location is outside "
                "a configured trip area."
            )
        })

    if incidents:

        alerts.append({
            "type": "incident",
            "message": (
                f"{len(incidents)} incident report(s) "
                "are stored in your activity."
            )
        })

    return {
        "score": score,
        "alerts": alerts,
        "overstay": overstay,
        "outside": outside,
        "location": location
    }


# ---------------------------------------------------------
# CHAT HISTORY
# ---------------------------------------------------------

@app.get("/api/chat/history")
async def chat_history(
    request: Request
):

    user, token = await user_from_request(request)

    client = db_for_user(token)

    result = (
        client
        .table("chat_messages")
        .select(
            "role,message,created_at"
        )
        .eq(
            "user_id",
            user.id
        )
        .order(
            "created_at",
            desc=False
        )
        .limit(50)
        .execute()
    )

    return result.data


# ---------------------------------------------------------
# GEMINI AI CHAT
# ---------------------------------------------------------

@app.post("/api/chat")
async def chat(
    body: ChatIn,
    request: Request
):

    # Try to check logged-in user
    try:
        user, token = await user_from_request(request)
        client_db = db_for_user(token)
        
        # User location/context
        context = {
            "place_name": body.place_name,
            "latitude": body.latitude,
            "longitude": body.longitude
        }
    
        # Save user message
        (
            client_db
            .table("chat_messages")
            .insert({
                "user_id": user.id,
                "role": "user",
                "message": body.message,
                "context": context
            })
            .execute()
        )
    except HTTPException:
        # Proceed anonymously for prototype testing
        user = None
        client_db = None
        context = {}

    answer = None

    # -----------------------------------------------------
    # GEMINI AI
    # -----------------------------------------------------

    if GEMINI_API_KEY:

        try:

            from google import genai

            gemini_client = genai.Client(
                api_key=GEMINI_API_KEY
            )

            system_instruction = """
You are YatriKavach AI Guide.

YatriKavach is a smart tourist safety and travel assistance platform.

Your role is to help tourists with:
- travel planning
- general safety guidance
- what to do in unfamiliar places
- nearby travel guidance based on provided context
- emergency preparedness
- safe travel habits
- trip-related questions

Rules:
1. Give practical and concise answers.
2. Do not invent live information.
3. Do not claim that police, hospitals, transport, weather,
   traffic, crime, or emergency services are currently available
   unless that information has been provided.
4. If the user appears to need immediate emergency assistance,
   clearly advise them to use the SOS feature and contact the
   appropriate local emergency service.
5. Use location information only as context.
6. Do not make immigration, surveillance, law-enforcement,
   or security enforcement decisions.
7. If you do not know something, clearly say so.
8. Be helpful, calm, and easy to understand.
"""

            prompt = f"""
Current user context:

Location name: {body.place_name}
Latitude: {body.latitude}
Longitude: {body.longitude}

User question:

{body.message}
"""

            response = await (
                gemini_client
                .aio
                .models
                .generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config={
                        "system_instruction": system_instruction,
                        "temperature": 0.3,
                        "max_output_tokens": 500
                    }
                )
            )

            answer = response.text

        except Exception as e:

            print(
                "Gemini error:",
                str(e)
            )

            answer = None

    else:

        print(
            "Gemini API key is missing."
        )

    # -----------------------------------------------------
    # FALLBACK RESPONSE
    # -----------------------------------------------------

    if not answer:

        answer = (
            "I can help with travel planning, "
            "safety information, routes, and general travel guidance. "
            "For immediate emergency assistance, please use the SOS "
            "feature and contact the appropriate local emergency service."
        )

    # -----------------------------------------------------
    # SAVE AI RESPONSE
    # -----------------------------------------------------

    if client_db and user:
        (
            client_db
            .table("chat_messages")
            .insert({
                "user_id": user.id,
                "role": "assistant",
                "message": answer,
                "context": context
            })
            .execute()
        )

    return {
        "answer": answer
    }


def admin_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="SUPABASE_SERVICE_ROLE_KEY is missing")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async def require_admin(request: Request):
    user, token = await user_from_request(request)
    client = db_for_user(token)
    profile = client.table("profiles").select("role").eq("id", user.id).limit(1).execute().data
    if not profile or profile[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@app.get("/api/admin/overview")
async def admin_overview(request: Request):
    await require_admin(request)
    client = admin_client()
    sos = client.table("sos_events").select("*").order("created_at", desc=True).limit(25).execute().data
    incidents = client.table("incidents").select("*").order("created_at", desc=True).limit(25).execute().data
    locations = client.table("location_events").select("*").order("recorded_at", desc=True).limit(50).execute().data
    return {"sos": sos, "incidents": incidents, "locations": locations}

@app.patch("/api/admin/sos/{sos_id}")
async def admin_update_sos(sos_id: int, request: Request):
    await require_admin(request)
    result = admin_client().table("sos_events").update({"status":"resolved"}).eq("id", sos_id).execute()
    if not result.data: raise HTTPException(status_code=404, detail="SOS not found")
    return result.data[0]
