# YatriKavach — single-server full-stack prototype

## 1. Supabase setup
Create a Supabase project and run `supabase/schema.sql` in SQL Editor.

In Authentication > Providers:
- Enable Email.
- For a demo without email confirmation, disable Confirm email.
- Enable Anonymous Sign-Ins if you want the temporary-session button.

Copy `.env.example` to `.env` and fill:
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, OPENAI_MODEL.

The service-role key is kept server-side only. The browser receives only the Supabase URL and anon key.

## 2. Run ONE server
```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Open http://127.0.0.1:8000

No separate frontend server is required: FastAPI serves the frontend.

## 3. What is connected
- Supabase Auth: email/password or anonymous session
- Supabase Postgres: profiles, trips, location events, incidents, SOS, safety events, AI chat
- RLS: users can access only their own rows
- Browser GPS: live coordinates
- Nominatim: reverse geocoding
- OpenStreetMap/Leaflet: map
- Overpass: nearby police/hospital/fire/toilet discovery
- OpenAI: AI Guide, only when OPENAI_API_KEY is configured

## 4. Important
Do not put the Supabase service-role key in frontend code or commit `.env`.
The safety score is computed from persisted user events/trips; there is no seeded demo tourist/location data.
