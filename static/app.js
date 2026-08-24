/* =========================================================
   YATRIKAVACH - APP.JS
   Full replacement version
   ========================================================= */


/* =========================================================
   ROUTING
   ========================================================= */

function showApp(id) {
  document
    .querySelectorAll(".app")
    .forEach(app => {
      app.classList.toggle("on", app.id === id);
    });
}


function pickRole(role) {

  document
    .querySelectorAll(".role")
    .forEach(x => {
      x.style.outline = "none";
    });

  const form =
    document.getElementById("loginform");

  if (!form) return;

  form.classList.add("on");

  const button =
    document.getElementById("signinBtn");

  form.dataset.role = role;

  if (button) {
    button.textContent =
      role === "admin"
        ? "Sign In as Admin"
        : "Sign In as Tourist";
  }

  form.scrollIntoView({
    behavior: "smooth"
  });
}


/* =========================================================
   SUPABASE STATE
   ========================================================= */

let sb = null;
let session = null;
let currentLocation = null;


/* =========================================================
   TOURIST PAGE ROUTER
   ========================================================= */

function show(page) {

  document
    .querySelectorAll("#tourist-app .page")
    .forEach(p => {
      p.classList.toggle(
        "active",
        p.id === page
      );
    });

  const mains = [
    "home",
    "map",
    "chatbot",
    "messages"
  ];

  const nav =
    document.getElementById("t-nav");

  if (nav) {
    nav.style.display =
      mains.includes(page)
        ? "flex"
        : "none";
  }

  document
    .querySelectorAll("#t-nav .n")
    .forEach(n => {
      n.classList.toggle(
        "on",
        n.dataset.tab === page
      );
    });

  const element =
    document.getElementById(page);

  if (element) {
    element.scrollTop = 0;
  }

  closeDrawer();
}


/* =========================================================
   DRAWER
   ========================================================= */

function openDrawer() {

  document
    .getElementById("drawer")
    ?.classList.add("on");

  document
    .getElementById("scrim")
    ?.classList.add("on");
}


function closeDrawer() {

  document
    .getElementById("drawer")
    ?.classList.remove("on");

  document
    .getElementById("scrim")
    ?.classList.remove("on");
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {

  let targetToast =
    document.querySelector(
      "#tourist-app.on"
    )
      ? "toast"
      : "toast2";

  let targetText =
    document.querySelector(
      "#tourist-app.on"
    )
      ? "toastText"
      : "toastText2";

  let toastElement =
    document.getElementById(targetToast);

  if (!toastElement) {
    toastElement =
      document.getElementById("toast");
  }

  let textElement =
    document.getElementById(targetText);

  if (!textElement) {
    textElement =
      document.getElementById("toastText");
  }

  if (!toastElement || !textElement) {
    console.log("TOAST:", message);
    return;
  }

  textElement.textContent = message;

  toastElement.classList.add("on");

  clearTimeout(window._ykToastTimer);

  window._ykToastTimer =
    setTimeout(() => {
      toastElement.classList.remove("on");
    }, 2500);
}


/* =========================================================
   CHIPS
   ========================================================= */

function pickChip(element) {

  if (!element) return;

  const row =
    element.parentElement;

  row
    ?.querySelectorAll(".chip")
    .forEach(chip => {
      chip.classList.remove("on");
    });

  element.classList.add("on");

  toast(
    "Filter: " +
    element.textContent
  );
}


/* =========================================================
   SOS
   ========================================================= */

let sosCount = 0;
let sosTimer = null;
let sosFired = false;


function openSOS() {

  document
    .getElementById("sos")
    ?.classList.add("on");

  resetSOS();
}


function closeSOS() {

  clearInterval(sosTimer);

  document
    .getElementById("sos")
    ?.classList.remove("on");

  resetSOS();
}


function resetSOS() {

  sosFired = false;
  sosCount = 0;

  clearInterval(sosTimer);

  const number =
    document.getElementById("sosNum");

  const label =
    document.getElementById("sosLabel");

  const title =
    document.getElementById("sosTitle");

  const sub =
    document.getElementById("sosSub");

  if (number) {
    number.innerHTML =
      '<svg width="46" height="46" viewBox="0 0 24 24" fill="none">' +
      '<path d="M6.6 2.5 3.9 3.2A2 2 0 0 0 2.5 5.6c.6 6.6 6.3 12.3 12.9 12.9a2 2 0 0 0 2.4-1.4l.7-2.7a1.6 1.6 0 0 0-1-1.9l-2.9-1.1a1.6 1.6 0 0 0-1.8.5l-.9 1.1a12 12 0 0 1-4.6-4.6l1.1-.9a1.6 1.6 0 0 0 .5-1.8L8.5 3.5a1.6 1.6 0 0 0-1.9-1z" fill="#fff"/>' +
      "</svg>";
  }

  if (label) {
    label.textContent =
      "HOLD TO ALERT";
  }

  if (title) {
    title.textContent =
      "EMERGENCY SOS";
  }

  if (sub) {
    sub.textContent =
      "Press & hold to alert tourist police, your embassy & trusted contacts with your live location.";
  }

  [
    "n-police",
    "n-helpline",
    "n-sarah"
  ].forEach(id => {
    document
      .getElementById(id)
      ?.classList.remove("done");
  });
}


function startHold() {

  if (sosFired) return;

  clearInterval(sosTimer);

  sosCount = 3;

  const number =
    document.getElementById("sosNum");

  const label =
    document.getElementById("sosLabel");

  if (number) {
    number.textContent = "3";
  }

  if (label) {
    label.textContent =
      "KEEP HOLDING";
  }

  sosTimer =
    setInterval(() => {

      sosCount--;

      if (sosCount <= 0) {

        clearInterval(sosTimer);

        fireSOS();

      } else {

        if (number) {
          number.textContent =
            sosCount;
        }

      }

    }, 1000);
}


function endHold() {

  if (sosFired) return;

  clearInterval(sosTimer);

  const number =
    document.getElementById("sosNum");

  const label =
    document.getElementById("sosLabel");

  if (number) {
    number.innerHTML =
      '<svg width="46" height="46" viewBox="0 0 24 24" fill="none">' +
      '<path d="M6.6 2.5 3.9 3.2A2 2 0 0 0 2.5 5.6c.6 6.6 6.3 12.3 12.9 12.9a2 2 0 0 0 2.4-1.4l.7-2.7a1.6 1.6 0 0 0-1-1.9l-2.9-1.1a1.6 1.6 0 0 0-1.8.5l-.9 1.1a12 12 0 0 1-4.6-4.6l1.1-.9a1.6 1.6 0 0 0 .5-1.8L8.5 3.5a1.6 1.6 0 0 0-1.9-1z" fill="#fff"/>' +
      "</svg>";
  }

  if (label) {
    label.textContent =
      "HOLD TO ALERT";
  }
}


async function fireSOS() {

  sosFired = true;

  const number =
    document.getElementById("sosNum");

  const label =
    document.getElementById("sosLabel");

  const title =
    document.getElementById("sosTitle");

  const sub =
    document.getElementById("sosSub");

  if (number) {
    number.innerHTML =
      '<svg width="52" height="52" viewBox="0 0 24 24" fill="none">' +
      '<path d="M5 12l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>";
  }

  if (label) {
    label.textContent =
      "ALERT SENT";
  }

  if (title) {
    title.textContent =
      "HELP IS ON THE WAY";
  }

  if (sub) {
    sub.textContent =
      "Your live location and Digital ID have been shared. Stay where you are if safe.";
  }

  [
    "n-police",
    "n-helpline",
    "n-sarah"
  ].forEach((id, index) => {

    setTimeout(() => {

      document
        .getElementById(id)
        ?.classList.add("done");

    }, 500 + index * 700);

  });

  /*
   * Also send the real SOS to backend
   * if the user is authenticated.
   */

  if (session) {

    try {

      await api(
        "/api/sos",
        {
          method: "POST",

          body: JSON.stringify({
            latitude:
              currentLocation?.latitude ||
              null,

            longitude:
              currentLocation?.longitude ||
              null,

            place_name:
              currentLocation?.place_name ||
              null
          })
        }
      );

    } catch (error) {

      console.error(
        "SOS backend error:",
        error
      );

    }

  }
}


/* =========================================================
   CHAT UI
   ========================================================= */

function addMsg(
  scrollId,
  text,
  who
) {

  const container =
    document.getElementById(
      scrollId
    );

  if (!container) return;

  if (who === "bot") {

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "msg bot-wrap";

    wrapper.innerHTML =
      '<div class="bav">' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none">' +
      '<path d="M12 3l1.8 4.9L18.7 9l-4.9 1.8L12 15.7l-1.8-4.9L5.3 9l4.9-1.2L12 3z" stroke="#212121" stroke-width="1.6" stroke-linejoin="round"/>' +
      "</svg>" +
      "</div>" +
      '<div class="msg bot">' +
      text +
      "</div>";

    container.appendChild(wrapper);

  } else {

    const message =
      document.createElement("div");

    message.className =
      "msg " + who;

    message.textContent =
      text;

    container.appendChild(message);
  }

  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   SUPABASE INITIALIZATION
   ========================================================= */

async function init() {

  try {

    console.log(
      "Initializing YatriKavach..."
    );

    const response =
      await fetch(
        "/api/config",
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {

      throw new Error(
        "Unable to load Supabase configuration."
      );
    }

    const config =
      await response.json();

    console.log(
      "Supabase config received:",
      {
        hasUrl:
          !!config.supabaseUrl,

        hasAnonKey:
          !!config.supabaseAnonKey
      }
    );

    if (
      !config.supabaseUrl ||
      !config.supabaseAnonKey
    ) {

      throw new Error(
        "Supabase URL or anon key is missing."
      );
    }

    if (!window.supabase) {

      throw new Error(
        "Supabase JavaScript library is not loaded."
      );
    }

    /*
     * Create Supabase client.
     */

    sb =
      window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseAnonKey
      );

    /*
     * Get existing session.
     */

    const {
      data,
      error
    } =
      await sb.auth.getSession();

    if (error) {

      console.error(
        "Session error:",
        error
      );

    }

    session =
      data?.session ||
      null;

    /*
     * Auth listener.
     */

    sb.auth.onAuthStateChange(
      async (
        event,
        newSession
      ) => {

        console.log(
          "Supabase auth event:",
          event
        );

        session =
          newSession;

        if (newSession) {

          /*
           * Avoid loading profile
           * during some intermediate
           * OAuth events.
           */

          if (
            event === "SIGNED_IN" ||
            event === "INITIAL_SESSION" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          ) {

            await loadUser();

          }

        } else {

          showApp(
            "login-app"
          );

        }

      }
    );

    /*
     * If a session already exists,
     * load the user.
     */

    if (session) {

      await loadUser();

    } else {

      showApp(
        "login-app"
      );

    }

    console.log(
      "YatriKavach Supabase initialized successfully."
    );

    return true;

  } catch (error) {

    console.error(
      "Supabase initialization error:",
      error
    );

    toast(
      error.message ||
      "Could not connect to Supabase."
    );

    return false;
  }
}


/* =========================================================
   BACKEND API HELPER
   ========================================================= */

async function api(
  path,
  options = {}
) {

  if (!session) {

    throw new Error(
      "Please sign in first."
    );
  }

  const headers =
    Object.assign(

      {
        "Content-Type":
          "application/json"
      },

      options.headers || {},

      {
        Authorization:
          "Bearer " +
          session.access_token
      }

    );

  const response =
    await fetch(
      path,
      Object.assign(
        {},
        options,
        {
          headers
        }
      )
    );

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {

    throw new Error(
      data.detail ||
      data.message ||
      "Request failed."
    );
  }

  return data;
}


/* =========================================================
   UI HELPERS
   ========================================================= */

function txt(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      value ?? "—";
  }
}


function initials(name) {

  if (!name) {
    return "?";
  }

  return name
    .split(/\s+/)
    .map(
      part =>
        part[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


/* =========================================================
   LOAD USER
   ========================================================= */

async function loadUser() {

  if (!session) {
    return;
  }

  try {

    console.log(
      "Loading user:",
      session.user?.email
    );

    const profile =
      await api(
        "/api/profile"
      );

    const email =
      session.user?.email ||
      "";

    const name =
      profile.full_name ||
      session.user?.user_metadata
        ?.full_name ||
      email.split("@")[0] ||
      "Traveller";

    txt(
      "greeting",
      "Hello " +
      name +
      "!"
    );

    txt(
      "profileName",
      name
    );

    txt(
      "drawerName",
      name
    );

    txt(
      "profileFullName",
      name
    );

    txt(
      "profileNationality",
      profile.nationality ||
      "Not added"
    );

    const avatar =
      initials(name);

    txt(
      "homeAvatar",
      avatar
    );

    txt(
      "drawerAvatar",
      avatar
    );

    const role =
      profile.role ||
      "tourist";

    if (
      role === "admin"
    ) {

      showApp(
        "admin-app"
      );

      adminGo(
        "a-dashboard"
      );

    } else {

      showApp(
        "tourist-app"
      );

      show(
        "home"
      );

      await refresh();

      track();
    }

  } catch (error) {

    console.error(
      "loadUser error:",
      error
    );

    /*
     * Important:
     * Don't destroy the valid Supabase
     * session just because /api/profile
     * has an error.
     */

    toast(
      error.message ||
      "Unable to load your profile."
    );
  }
}


/* =========================================================
   EMAIL SIGN IN
   ========================================================= */

async function signIn() {

  try {

    if (!sb) {

      const initialized =
        await init();

      if (!initialized) {
        return;
      }
    }

    if (!sb) {

      throw new Error(
        "Supabase is not initialized."
      );
    }

    const inputs =
      [
        ...document.querySelectorAll(
          "#loginform input"
        )
      ];

    const emailInput =
      inputs.find(
        input =>
          input.type ===
          "email"
      );

    const passwordInput =
      inputs.find(
        input =>
          input.type ===
          "password"
      );

    const email =
      emailInput
        ?.value
        ?.trim();

    const password =
      passwordInput
        ?.value ||
      "";

    if (!email) {

      toast(
        "Enter your email."
      );

      return;
    }

    if (!password) {

      toast(
        "Enter your password."
      );

      return;
    }

    if (password.length < 6) {

      toast(
        "Password must be at least 6 characters."
      );

      return;
    }

    toast(
      "Signing in..."
    );

    const {
      data,
      error
    } =
      await sb.auth
        .signInWithPassword({
          email,
          password
        });

    if (error) {

      console.error(
        "Sign in error:",
        error
      );

      toast(
        error.message
      );

      return;
    }

    session =
      data?.session ||
      null;

    if (!session) {

      throw new Error(
        "Login succeeded but no session was returned."
      );
    }

    toast(
      "Signed in successfully."
    );

    await loadUser();

  } catch (error) {

    console.error(
      "Sign in failed:",
      error
    );

    toast(
      error.message ||
      "Unable to sign in."
    );
  }
}


/* =========================================================
   CREATE ACCOUNT
   ========================================================= */

async function signUp() {

  try {

    if (!sb) {

      const initialized =
        await init();

      if (!initialized) {
        return;
      }
    }

    if (!sb) {

      throw new Error(
        "Supabase is not initialized."
      );
    }

    const inputs =
      [
        ...document.querySelectorAll(
          "#loginform input"
        )
      ];

    const emailInput =
      inputs.find(
        input =>
          input.type ===
          "email"
      );

    const passwordInput =
      inputs.find(
        input =>
          input.type ===
          "password"
      );

    const email =
      emailInput
        ?.value
        ?.trim();

    const password =
      passwordInput
        ?.value ||
      "";

    if (!email) {

      toast(
        "Enter your email."
      );

      return;
    }

    if (!password) {

      toast(
        "Enter a password."
      );

      return;
    }

    if (password.length < 6) {

      toast(
        "Password must be at least 6 characters."
      );

      return;
    }

    toast(
      "Creating your account..."
    );

    const fullName =
      email.split("@")[0];

    const {
      data,
      error
    } =
      await sb.auth
        .signUp({

          email,

          password,

          options: {

            data: {
              full_name:
                fullName
            }

          }

        });

    if (error) {

      console.error(
        "Signup error:",
        error
      );

      toast(
        error.message
      );

      return;
    }

    /*
     * Supabase may return a session
     * immediately if email confirmation
     * is disabled.
     */

    if (data?.session) {

      session =
        data.session;

      toast(
        "Account created successfully!"
      );

      await loadUser();

      return;
    }

    /*
     * If confirmation is enabled,
     * Supabase creates the account but
     * doesn't give us a session yet.
     */

    toast(
      "Account created! Check your email to confirm your account."
    );

  } catch (error) {

    console.error(
      "Signup failed:",
      error
    );

    toast(
      error.message ||
      "Unable to create account."
    );
  }
}


/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

async function signInWithGoogle() {

  try {

    if (!sb) {

      const initialized =
        await init();

      if (!initialized) {
        return;
      }
    }

    if (!sb) {

      throw new Error(
        "Supabase is not initialized."
      );
    }

    const redirectUrl =
      window.location.origin;

    console.log(
      "Google OAuth redirect:",
      redirectUrl
    );

    const {
      data,
      error
    } =
      await sb.auth
        .signInWithOAuth({

          provider:
            "google",

          options: {

            redirectTo:
              redirectUrl

          }

        });

    if (error) {

      console.error(
        "Google login error:",
        error
      );

      toast(
        error.message ||
        "Google login failed."
      );

      return;
    }

    console.log(
      "Google OAuth started:",
      data
    );

  } catch (error) {

    console.error(
      "Google login failed:",
      error
    );

    toast(
      error.message ||
      "Google login failed."
    );
  }
}


/* =========================================================
   APPLE LOGIN
   ========================================================= */

async function signInWithApple() {

  try {

    if (!sb) {

      const initialized =
        await init();

      if (!initialized) {
        return;
      }
    }

    if (!sb) {

      throw new Error(
        "Supabase is not initialized."
      );
    }

    const redirectUrl =
      window.location.origin;

    console.log(
      "Apple OAuth redirect:",
      redirectUrl
    );

    const {
      data,
      error
    } =
      await sb.auth
        .signInWithOAuth({

          provider:
            "apple",

          options: {

            redirectTo:
              redirectUrl

          }

        });

    if (error) {

      console.error(
        "Apple login error:",
        error
      );

      toast(
        error.message ||
        "Apple login failed."
      );

      return;
    }

    console.log(
      "Apple OAuth started:",
      data
    );

  } catch (error) {

    console.error(
      "Apple login failed:",
      error
    );

    toast(
      error.message ||
      "Apple login failed."
    );
  }
}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function signOut() {

  try {

    if (sb) {

      const {
        error
      } =
        await sb.auth.signOut();

      if (error) {

        console.error(
          "Sign out error:",
          error
        );

        toast(
          error.message
        );
      }
    }

  } catch (error) {

    console.error(
      "Sign out failed:",
      error
    );
  }

  session = null;

  showApp(
    "login-app"
  );

  document
    .getElementById(
      "loginform"
    )
    ?.classList
    .remove("on");
}


/* =========================================================
   CURRENT LOCATION / CONTEXT
   ========================================================= */

async function refresh() {

  if (!session) {
    return;
  }

  try {

    const [
      profile,
      context
    ] =
      await Promise.all([

        api(
          "/api/profile"
        ),

        api(
          "/api/context"
        )

      ]);

    const name =
      profile.full_name ||
      session.user
        ?.email
        ?.split("@")[0] ||
      "Traveller";

    txt(
      "greeting",
      "Hello " +
      name +
      "!"
    );

    txt(
      "profileName",
      name
    );

    txt(
      "drawerName",
      name
    );

    const avatar =
      initials(name);

    txt(
      "homeAvatar",
      avatar
    );

    txt(
      "drawerAvatar",
      avatar
    );

    txt(
      "currentLocation",
      context
        ?.location
        ?.place_name ||
      "Location unavailable"
    );

    txt(
      "safetyScore",
      context?.score ??
      "—"
    );

    currentLocation =
      context?.location ||
      null;

  } catch (error) {

    console.error(
      "Refresh error:",
      error
    );

  }
}


/* =========================================================
   LOCATION TRACKING
   ========================================================= */

async function sendPos(
  position
) {

  if (!session) {
    return;
  }

  try {

    const data =
      await api(
        "/api/location",
        {
          method:
            "POST",

          body:
            JSON.stringify({

              latitude:
                position.coords
                  .latitude,

              longitude:
                position.coords
                  .longitude,

              accuracy:
                position.coords
                  .accuracy

            })

        }
      );

    currentLocation =
      data.location;

    txt(
      "currentLocation",
      data.place_name ||
      "Current location"
    );

    await refresh();

  } catch (error) {

    console.error(
      "Location error:",
      error
    );
  }
}


function track() {

  if (
    !navigator.geolocation
  ) {

    console.warn(
      "Geolocation is not supported."
    );

    return;
  }

  navigator.geolocation
    .getCurrentPosition(

      sendPos,

      error => {

        console.warn(
          "Location permission:",
          error.message
        );

      },

      {
        enableHighAccuracy:
          true,

        timeout:
          10000
      }

    );

  navigator.geolocation
    .watchPosition(

      sendPos,

      error => {

        console.warn(
          "Location watch:",
          error.message
        );

      },

      {

        enableHighAccuracy:
          true,

        maximumAge:
          15000,

        timeout:
          10000

      }

    );
}


/* =========================================================
   AI CHAT
   ========================================================= */

async function chat() {

  const input =
    document.getElementById(
      "chatInput"
    );

  const message =
    input
      ?.value
      ?.trim();

  if (!message) {
    return;
  }

  addMsg(
    "chatScroll",
    message,
    "user"
  );

  input.value = "";

  try {

    const data =
      await api(
        "/api/chat",
        {

          method:
            "POST",

          body:
            JSON.stringify({

              message,

              latitude:
                currentLocation
                  ?.latitude ||
                null,

              longitude:
                currentLocation
                  ?.longitude ||
                null,

              place_name:
                currentLocation
                  ?.place_name ||
                null

            })

        }
      );

    addMsg(
      "chatScroll",
      data.answer,
      "bot"
    );

  } catch (error) {

    console.error(
      "Chat error:",
      error
    );

    addMsg(
      "chatScroll",
      "AI service is unavailable right now.",
      "bot"
    );
  }
}


function sendChat() {

  return chat();
}


function quickAsk(
  question
) {

  const input =
    document.getElementById(
      "chatInput"
    );

  if (!input) return;

  input.value =
    question;

  chat();
}


/* =========================================================
   THREAD CHAT
   ========================================================= */

async function openThread(
  key
) {

  showApp(
    "tourist-app"
  );

  show(
    "thread"
  );

  const threadName =
    document.getElementById(
      "threadName"
    );

  const box =
    document.getElementById(
      "threadScroll"
    );

  if (!box) {
    return;
  }

  /*
   * If a specific demo thread was
   * requested, keep its name.
   */

  const names = {

    support:
      "YatriKavach Support",

    helpline:
      "Tourist Helpline Jaipur",

    sarah:
      "Sarah",

    raj:
      "Local Guide · Raj",

    embassy:
      "German Embassy",

    hotel:
      "Rambagh Hotel · Front Desk"

  };

  if (
    threadName &&
    names[key]
  ) {

    threadName.textContent =
      names[key];
  }

  box.innerHTML = "";

  /*
   * Real chat history from backend.
   */

  if (!session) {

    addMsg(
      "threadScroll",
      "Please sign in to view your messages.",
      "bot"
    );

    return;
  }

  try {

    const messages =
      await api(
        "/api/chat/history"
      );

    if (
      !messages ||
      !messages.length
    ) {

      addMsg(
        "threadScroll",
        "No messages yet. Start a conversation with YatriKavach.",
        "bot"
      );

      return;
    }

    messages.forEach(
      message => {

        addMsg(

          "threadScroll",

          message.message,

          message.role ===
          "assistant"
            ? "bot"
            : "user"

        );

      }
    );

  } catch (error) {

    console.error(
      "Chat history error:",
      error
    );

    addMsg(
      "threadScroll",
      "Unable to load your messages right now.",
      "bot"
    );
  }
}


async function sendThread() {

  const input =
    document.getElementById(
      "threadInput"
    );

  const message =
    input
      ?.value
      ?.trim();

  if (!message) {
    return;
  }

  addMsg(
    "threadScroll",
    message,
    "user"
  );

  input.value = "";

  try {

    const data =
      await api(
        "/api/chat",
        {

          method:
            "POST",

          body:
            JSON.stringify({

              message,

              latitude:
                currentLocation
                  ?.latitude ||
                null,

              longitude:
                currentLocation
                  ?.longitude ||
                null,

              place_name:
                currentLocation
                  ?.place_name ||
                null

            })

        }
      );

    addMsg(
      "threadScroll",
      data.answer,
      "bot"
    );

  } catch (error) {

    console.error(
      "Thread message error:",
      error
    );

    addMsg(
      "threadScroll",
      "Unable to send right now.",
      "bot"
    );
  }
}


/* =========================================================
   FAVOURITES / FAQ / ABOUT
   ========================================================= */

function toggleHeart(
  element
) {

  if (!element) return;

  if (
    element.textContent
      .trim()
      .startsWith("Saved")
  ) {

    element.innerHTML =
      '<i style="background:#8A8A8A"></i>Removed';

    toast(
      "Removed from favourites"
    );

  } else {

    element.innerHTML =
      '<i style="background:#FF6B6B"></i>Saved';

    toast(
      "Added to favourites"
    );
  }
}


function toggleFaq(
  element
) {

  element
    ?.classList
    .toggle("open");
}


function toggleAbout(
  element
) {

  element
    ?.classList
    .toggle("open");
}


/* =========================================================
   ADMIN
   ========================================================= */

function adminGo(id) {

  document
    .querySelectorAll(
      "#admin-app .apage"
    )
    .forEach(page => {

      page.classList.toggle(
        "active",
        page.id === id
      );

    });

  document
    .querySelectorAll(
      ".a-sidebar .srow"
    )
    .forEach(row => {

      row.classList.toggle(
        "on",
        row.dataset.a === id
      );

    });

  const element =
    document.getElementById(id);

  if (element) {
    element.scrollTop = 0;
  }

  closeSidebar();
}


function openSidebar() {

  document
    .getElementById(
      "a-sidebar"
    )
    ?.classList.add("on");

  document
    .getElementById(
      "a-scrim"
    )
    ?.classList.add("on");
}


function closeSidebar() {

  document
    .getElementById(
      "a-sidebar"
    )
    ?.classList.remove("on");

  document
    .getElementById(
      "a-scrim"
    )
    ?.classList.remove("on");
}


function toggleStepper(
  id
) {

  document
    .querySelectorAll(
      ".stepper"
    )
    .forEach(step => {

      if (
        step.id !== id
      ) {

        step.classList.remove(
          "on"
        );

      }

    });

  document
    .getElementById(id)
    ?.classList.toggle("on");
}


function toggleSwitch(
  element
) {

  if (!element) return;

  const on =
    element.dataset.on === "1";

  element.dataset.on =
    on ? "0" : "1";

  const knob =
    element.firstElementChild;

  element.style.background =
    on
      ? "#ddd"
      : "#212121";

  if (knob) {

    knob.style.left =
      on
        ? "3px"
        : "23px";
  }

  toast(
    on
      ? "Auto-report off"
      : "Auto-report scheduled"
  );
}


/* =========================================================
   GLOBAL FUNCTIONS
   =========================================================

   IMPORTANT:
   Your index.html uses inline onclick:
   
   onclick="signUp()"
   onclick="doSignIn()"
   onclick="signInWithGoogle()"
   onclick="signInWithApple()"
   
   Therefore ALL of these MUST be attached to window.
   ========================================================= */


/* AUTH */

window.signIn =
  signIn;

window.signUp =
  signUp;

window.signInWithGoogle =
  signInWithGoogle;

window.signInWithApple =
  signInWithApple;

window.signOut =
  signOut;

window.logout =
  signOut;

window.doSignIn =
  signIn;


/* APP */

window.showApp =
  showApp;

window.pickRole =
  pickRole;

window.show =
  show;

window.openDrawer =
  openDrawer;

window.closeDrawer =
  closeDrawer;

window.toast =
  toast;

window.pickChip =
  pickChip;


/* SOS */

window.openSOS =
  openSOS;

window.closeSOS =
  closeSOS;

window.resetSOS =
  resetSOS;

window.startHold =
  startHold;

window.endHold =
  endHold;

window.fireSOS =
  fireSOS;


/* CHAT */

window.addMsg =
  addMsg;

window.sendChat =
  sendChat;

window.quickAsk =
  quickAsk;

window.openThread =
  openThread;

window.sendThread =
  sendThread;


/* OTHER UI */

window.toggleHeart =
  toggleHeart;

window.toggleFaq =
  toggleFaq;

window.toggleAbout =
  toggleAbout;


/* ADMIN */

window.adminGo =
  adminGo;

window.openSidebar =
  openSidebar;

window.closeSidebar =
  closeSidebar;

window.toggleStepper =
  toggleStepper;

window.toggleSwitch =
  toggleSwitch;


/* =========================================================
   YK API OBJECTS
   ========================================================= */

window.YKAuth = {

  signIn,

  signUp,

  signOut,

  signInWithGoogle,

  signInWithApple

};


window.YKApp = {

  sendChat:
    chat,

  openThread,

  sendThread

};


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /*
     * SOS button listeners
     */

    const sosCircle =
      document.getElementById(
        "sosCircle"
      );

    if (sosCircle) {

      sosCircle.addEventListener(
        "mousedown",
        startHold
      );

      sosCircle.addEventListener(
        "mouseup",
        endHold
      );

      sosCircle.addEventListener(
        "mouseleave",
        endHold
      );

      sosCircle.addEventListener(
        "touchstart",
        event => {

          event.preventDefault();

          startHold();

        },
        {
          passive: false
        }
      );

      sosCircle.addEventListener(
        "touchend",
        event => {

          event.preventDefault();

          endHold();

        },
        {
          passive: false
        }
      );

    }


    /*
     * Initialize Supabase.
     */

    await init();

  }
);