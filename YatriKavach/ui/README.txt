YATRIKAVACH — Interactive UI Prototype
======================================

WHAT'S INSIDE
-------------
index.html     → The full interactive app. START HERE. Opens on the login screen.
overview.html  → Design board: all 18 screens on one canvas (for handoff / Figma import).


IMPORTANT: FONT SETUP (read this if the UI looks "wrong")
---------------------------------------------------------
This design uses the font URBANIST. If the app looks plain, boxy, or the
text looks like Arial/Times — the font simply didn't load. The layout and
colors are fine; only the typeface fell back.

The file tries to load Urbanist automatically from two CDNs (Google Fonts,
then jsDelivr). That works whenever you have an internet connection.

>>> IF YOU ARE OFFLINE, OR IT STILL LOOKS WRONG, DO THIS ONE-TIME FIX: <<<

  1. Go to:  https://fonts.google.com/specimen/Urbanist
  2. Click "Get font" → "Download all" (it's free)
  3. Unzip the download
  4. Install the font on your computer:
       • Windows → select all .ttf files → right-click → "Install for all users"
       • macOS   → select all .ttf files → double-click → "Install Font"
  5. Fully close and reopen your browser, then open index.html again.

Once Urbanist is installed on your system, the design renders correctly
FOREVER — online or completely offline. This is the permanent fix.


HOW TO VIEW
-----------
Just double-click index.html — it opens in any modern browser
(Chrome, Edge, Firefox, or Safari). No install, no server needed.

Best viewed on a desktop browser at 100% zoom.


WHAT YOU CAN CLICK (it's fully interactive)
--------------------------------------------
LOGIN      → Choose "I'm a Tourist" or "I'm an Admin", then Sign In.

TOURIST APP
  • Bottom nav switches Home / Map / AI Chatbot / Messages
  • Hamburger (top-left) opens the side drawer — every item works
  • SOS (red button, top-right) → PRESS AND HOLD the big red circle
    for 3 seconds to trigger the full emergency alert sequence
  • AI Chatbot actually answers — ask about hospitals, emergency
    numbers, local laws, taxi fares, weather, food, or safety at night
  • Messages → open any thread, type and send, you'll get a reply
  • Profile, Favourites, Help (FAQs expand), About, Settings all work

ADMIN CONSOLE
  • Hamburger opens the sidebar: Dashboard / Tracking / Alerts / Reports
  • Alert rows expand into a status-stepper timeline with actions
  • Reports has a working "Schedule Automated Report" toggle

All data shown is realistic dummy data for demo purposes.


DESIGN SYSTEM
-------------
Base        #FAFAF9   (warm off-white)
Primary     #FCFD76   (pastel yellow)
Lavender    #D7D7F4
Sage        #C3D6D6
Cream       #F5F0DC
SOS Coral   #FF6B6B   (emergency states only)
Ink         #212121   (text + primary buttons)

Type: Urbanist — 40px heading / 28px title / 24px subheading / 16px body
Style: flat pastel, high corner radius, soft shadows. No blur, no glass,
no dark mode.

© 2026 YatriKavach
