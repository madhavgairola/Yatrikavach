let sb = null, config = null, map = null, marker = null, accuracyCircle = null, current = null, currentPlace = '', selectedRole = 'tourist', gpsWatch = null;

const $ = id => document.getElementById(id);

const toast = msg => {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
};

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
}[c]));

async function loadConfig() {
    const r = await fetch('/api/config');

    if (!r.ok) {
        throw new Error(await r.text());
    }

    config = await r.json();

    if (!config.supabaseUrl || !config.supabaseAnonKey) {
        throw new Error('Supabase configuration is missing.');
    }

    if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Supabase library is not loaded.');
    }

    sb = window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseAnonKey
    );
}

async function api(path, opt = {}) {
    if (!sb) throw new Error('Auth not ready');

    const { data } = await sb.auth.getSession();

    const headers = {
        'Content-Type': 'application/json',
        ...(opt.headers || {})
    };

    if (data?.session) {
        headers.Authorization = 'Bearer ' + data.session.access_token;
    }

    const r = await fetch(path, {
        ...opt,
        headers
    });

    if (!r.ok) {
        throw new Error(await r.text());
    }

    return r.status === 204 ? {} : r.json();
}

function showPage(page) {
    document.querySelectorAll('.page')
        .forEach(x => x.classList.remove('active-page'));

    const el = $('page-' + page);

    if (!el) return;

    el.classList.add('active-page');

    document
        .querySelectorAll('.bottom-nav:not(.admin-nav) button')
        .forEach(b => b.classList.toggle(
            'active',
            b.dataset.page === page
        ));

    if (page === 'profile') loadProfile();
    if (page === 'activity') loadActivity();
    if (page === 'guide') loadChatHistory();
    if (page === 'nearby') loadNearby();
    if (page === 'trip') loadTrips();

    if (page === 'home') {
        setTimeout(() => map?.invalidateSize(), 100);
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function initNavigation() {
    document.querySelectorAll('[data-page]')
        .forEach(b => {
            b.addEventListener('click', () => {
                showPage(b.dataset.page);
            });
        });

    document.querySelectorAll('.role')
        .forEach(b => {
            b.addEventListener('click', () => {
                document
                    .querySelectorAll('.role')
                    .forEach(x => x.classList.remove('active'));

                b.classList.add('active');

                selectedRole = b.dataset.role;

                if ($('login')) {
                    $('login').textContent =
                        selectedRole === 'admin'
                            ? 'Sign In as Admin'
                            : 'Sign In as Tourist';
                }
            });
        });
}

function initMap(lat = 28.6139, lon = 77.209) {
    if (map) return;

    map = L.map('map', {
        zoomControl: false
    }).setView([lat, lon], 13);

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }
    ).addTo(map);

    setMarker(lat, lon, null);
}

function setMarker(lat, lon, accuracy) {
    if (!map) initMap(lat, lon);

    map.setView(
        [lat, lon],
        15,
        { animate: true }
    );

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.circleMarker(
        [lat, lon],
        {
            radius: 8,
            color: '#fff',
            weight: 3,
            fillColor: '#16785b',
            fillOpacity: 1
        }
    ).addTo(map);

    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
    }

    if (accuracy) {
        accuracyCircle = L.circle(
            [lat, lon],
            {
                radius: accuracy,
                color: '#26785f',
                weight: 1,
                fillColor: '#26785f',
                fillOpacity: .08
            }
        ).addTo(map);
    }

    if ($('coords')) {
        $('coords').textContent =
            `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
}

async function reverseGeocode(lat, lon) {
    try {
        const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
                headers: {
                    'Accept-Language': 'en'
                }
            }
        );

        const d = await r.json();
        const a = d.address || {};

        const city =
            a.city ||
            a.town ||
            a.village ||
            a.municipality ||
            a.state ||
            'Current location';

        const state = a.state || '';
        const country = a.country || '';

        if ($('placeName')) {
            $('placeName').textContent = city;
        }

        if ($('placeSub')) {
            $('placeSub').textContent =
                [state, country]
                    .filter(Boolean)
                    .join(', ');
        }

        currentPlace =
            d.display_name ||
            [city, state, country]
                .filter(Boolean)
                .join(', ');

        return d;
    } catch (e) {
        if ($('placeName')) {
            $('placeName').textContent = 'Current location';
        }

        return null;
    }
}

async function updateLocation(pos) {
    current = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
    };

    setMarker(
        current.latitude,
        current.longitude,
        current.accuracy
    );

    await reverseGeocode(
        current.latitude,
        current.longitude
    );

    try {
        await api('/api/location', {
            method: 'POST',
            body: JSON.stringify(current)
        });
    } catch (e) {
        console.warn(e);
    }

    await refreshContext();
}

function startGPS() {
    if (!navigator.geolocation) {
        toast('Location is not available in this browser.');
        return;
    }

    if (gpsWatch !== null) {
        navigator.geolocation.clearWatch(gpsWatch);
    }

    gpsWatch = navigator.geolocation.watchPosition(
        updateLocation,
        () => {
            toast(
                'Location permission is needed for live safety.'
            );
        },
        {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 15000
        }
    );
}

async function refreshContext() {
    try {
        const c = await api('/api/context');

        const score = c.score ?? '--';

        if ($('scoreRingValue')) {
            $('scoreRingValue').textContent = score;
        }

        if ($('scoreMeter')) {
            $('scoreMeter').style.width =
                (Number(score) || 0) + '%';
        }

        if ($('safetyText')) {
            $('safetyText').textContent =
                c.alerts?.length
                    ? 'Safety alert active'
                    : 'Monitoring your trip';
        }

        if ($('monitorText')) {
            $('monitorText').textContent =
                c.alerts?.length
                    ? 'SAFETY ALERT ACTIVE'
                    : 'LOCATION MONITORING';
        }

        if ($('advisoryText')) {
            $('advisoryText').textContent =
                c.alerts?.length
                    ? c.alerts[0].type
                    : 'Rajasthan region';
        }

    } catch (e) {

        if ($('scoreRingValue')) {
            $('scoreRingValue').textContent = '--';
        }

        if ($('safetyText')) {
            $('safetyText').textContent =
                'Monitoring your trip';
        }
    }
}

function seedPlaces() {
    const places = [
        ['Police Booth', '280 m · Verified', 'Open Now'],
        ['City Hospital', '1.1 km · Emergency', '24×7'],
        ['Embassy', '3.4 km · Support', 'Consular'],
        ['Pharmacy', '420 m · Medicine', 'Verified'],
        ['Taxi Stand', '160 m · Registered', 'Open']
    ];

    if ($('nearbyPlaces')) {
        $('nearbyPlaces').innerHTML =
            places.slice(0, 3)
                .map(p => `
        <div class="place-card">
          <span>⌖</span>
          <div>
            <b>${p[0]}</b>
            <small>${p[1]}</small>
          </div>
          <em>${p[2]}</em>
        </div>
      `)
                .join('');
    }

    if ($('nearbyList')) {
        $('nearbyList').innerHTML =
            places
                .map(p => `
        <div class="place-card">
          <span>⌖</span>
          <div>
            <b>${p[0]}</b>
            <small>${p[1]}</small>
          </div>
          <em>${p[2]}</em>
        </div>
      `)
                .join('');
    }
}

async function loadProfile() {
    try {
        const p = await api('/api/profile');

        if ($('profileName')) {
            $('profileName').textContent =
                p.full_name || 'Tourist';
        }

        if ($('profileFullName')) {
            $('profileFullName').value =
                p.full_name || '';
        }

        if ($('profileNationality')) {
            $('profileNationality').value =
                p.nationality || '';
        }

        if ($('profileEmergency')) {
            $('profileEmergency').value =
                p.emergency_contact || '';
        }

        if ($('profileAvatar')) {
            $('profileAvatar').textContent =
                (p.full_name || 'A')
                    .trim()
                    .charAt(0)
                    .toUpperCase();
        }

        if ($('idName')) {
            $('idName').textContent =
                p.full_name || 'Verified Tourist';
        }

        if ($('idNationality')) {
            $('idNationality').textContent =
                p.nationality || 'Traveller';
        }

    } catch (e) { }
}

async function loadActivity() {
    try {
        const d = await api('/api/dashboard');

        const items = [
            ...(d.sos || []).map(x => ({
                t: 'SOS Alert',
                d: x.place_name || 'Emergency alert recorded',
                date: x.created_at
            })),

            ...(d.incidents || []).map(x => ({
                t: x.category || 'Incident Report',
                d: x.description,
                date: x.created_at
            })),

            ...(d.trips || []).map(x => ({
                t: 'Trip',
                d: x.title,
                date: x.created_at
            }))
        ];

        if ($('activityList')) {
            $('activityList').innerHTML =
                items.length
                    ? items.map(x => `
          <div class="activity">
            <b>${esc(x.t)}</b>
            <span>
              ${x.date
                            ? new Date(x.date).toLocaleDateString()
                            : ''
                        }
            </span>
            <p>${esc(x.d)}</p>
          </div>
        `).join('')
                    : `
          <div class="activity">
            <b>No recent activity</b>
            <p>Your safety activity will appear here.</p>
          </div>
        `;
        }

    } catch (e) {

        if ($('activityList')) {
            $('activityList').innerHTML = `
        <div class="activity">
          <b>Activity unavailable</b>
          <p>Sign in to load your secure history.</p>
        </div>
      `;
        }
    }
}

async function loadTrips() {
    try {
        const d = await api('/api/dashboard');

        if (!$('tripList')) return;

        $('tripList').innerHTML =
            (d.trips || [])
                .map(t => `
        <div class="activity">
          <b>${esc(t.title)}</b>
          <span>${esc(t.status || 'planned')}</span>
          <p>${esc(t.destination || 'Destination not set')}</p>
        </div>
      `)
                .join('')
            ||
            `
        <div class="activity">
          <b>No trips yet</b>
          <p>Create your first trip above.</p>
        </div>
      `;

    } catch (e) { }
}

async function loadNearby() {
    seedPlaces();
}

async function loadChatHistory() {
    try {
        const h = await api('/api/chat/history');

        if (!$('chatMessages')) return;

        $('chatMessages').innerHTML =
            (h || [])
                .map(m => `
        <div class="bubble ${m.role === 'user' ? 'user' : 'ai'}">
          ${esc(m.message)}
          <small>
            ${m.created_at
                        ? new Date(m.created_at)
                            .toLocaleTimeString(
                                [],
                                {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }
                            )
                        : ''
                    }
          </small>
        </div>
      `)
                .join('');

        if (!$('chatMessages').innerHTML) {
            welcomeChat();
        }

    } catch (e) {
        welcomeChat();
    }
}

function welcomeChat() {
    if (!$('chatMessages')) return;

    $('chatMessages').innerHTML =
        `<div class="bubble ai">
      Hi! I'm your safety assistant. Ask me about local laws,
      emergency numbers, safe areas nearby, or your trip.
    </div>`;
}

async function sendChat(text) {
    if (!text) return;

    const box = $('chatMessages');

    if (!box) return;

    box.insertAdjacentHTML(
        'beforeend',
        `<div class="bubble user">${esc(text)}</div>`
    );

    if ($('chatInput')) {
        $('chatInput').value = '';
    }

    try {
        const d = await api('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: text,
                latitude: current?.latitude,
                longitude: current?.longitude,
                place_name: currentPlace
            })
        });

        box.insertAdjacentHTML(
            'beforeend',
            `<div class="bubble ai">
        ${esc(
                d.answer ||
                'I could not generate a response right now.'
            )}
      </div>`
        );

    } catch (e) {

        box.insertAdjacentHTML(
            'beforeend',
            `<div class="bubble ai">
        I could not reach the safety assistant right now.
        Please try again.
      </div>`
        );
    }

    box.scrollTop = box.scrollHeight;
}

async function doSOS() {
    if (!current) {
        toast('Please allow location first.');
        return;
    }

    const btn = $('confirmSos');

    if (!btn) return;

    btn.disabled = true;

    if ($('sosStatus')) {
        $('sosStatus').innerHTML =
            '<b>NOTIFYING</b>' +
            '<span>Recording your current safety event…</span>';
    }

    try {

        await api('/api/sos', {
            method: 'POST',
            body: JSON.stringify({
                latitude: current.latitude,
                longitude: current.longitude,
                place_name: currentPlace
            })
        });

        if ($('sosStatus')) {
            $('sosStatus').innerHTML =
                '<b>ALERT RECORDED</b>' +
                '<span>Your SOS event has been stored securely for the configured response workflow.</span>';
        }

        toast('SOS alert recorded');

        setTimeout(() => {
            if ($('sosModal')) {
                $('sosModal').classList.remove('show');
            }

            btn.disabled = false;
        }, 1200);

    } catch (e) {

        if ($('sosStatus')) {
            $('sosStatus').innerHTML =
                '<b>COULD NOT CONNECT</b>' +
                '<span>Please use your device emergency calling option if you need immediate help.</span>';
        }

        btn.disabled = false;
    }
}

async function initAuth() {

    try {
        await loadConfig();

    } catch (e) {

        if ($('authMsg')) {
            $('authMsg').textContent =
                'Could not load configuration. Check your backend and .env.';
        }

        console.error('Configuration error:', e);
        return;
    }

    const { data } = await sb.auth.getSession();

    if (data.session) {
        await enterApp(data.session);
    }

    sb.auth.onAuthStateChange(
        (_event, session) => {
            if (session) {
                enterApp(session);
            } else {
                showAuth();
            }
        }
    );
}

async function enterApp(session) {

    if (selectedRole === 'admin') {
        showAdmin();
        return;
    }

    if ($('auth')) {
        $('auth').classList.add('hidden');
    }

    if ($('touristApp')) {
        $('touristApp').classList.remove('hidden');
    }

    initMap();
    startGPS();
    seedPlaces();
    await loadProfile();
    await refreshContext();
}

function showAuth() {

    if ($('touristApp')) {
        $('touristApp').classList.add('hidden');
    }

    if ($('adminApp')) {
        $('adminApp').classList.add('hidden');
    }

    if ($('auth')) {
        $('auth').classList.remove('hidden');
    }
}

function showAdmin() {

    if ($('auth')) {
        $('auth').classList.add('hidden');
    }

    if ($('touristApp')) {
        $('touristApp').classList.add('hidden');
    }

    if ($('adminApp')) {
        $('adminApp').classList.remove('hidden');
    }

    loadAdmin();
}

async function loadAdmin() {

    try {
        const d = await api('/api/dashboard');

        const alerts = [
            ...(d.sos || []).map(x => ({
                title: 'SOS Triggered',
                where: x.place_name || 'Current location',
                status: 'Active',
                date: x.created_at
            })),

            ...(d.incidents || []).map(x => ({
                title: x.category || 'Incident',
                where: x.description || 'Reported issue',
                status: 'In Progress',
                date: x.created_at
            }))
        ];

        if ($('adminSosCount')) {
            $('adminSosCount').textContent =
                (d.sos || []).length;
        }

        if ($('adminAlerts')) {
            $('adminAlerts').innerHTML =
                alerts.length
                    ? alerts.map(a => `
          <div class="alert-item">
            <b>${esc(a.title)}</b>
            <span>${esc(a.status)}</span>
            <small>
              ${esc(a.where)}
              ·
              ${a.date
                            ? new Date(a.date).toLocaleString()
                            : ''
                        }
            </small>
          </div>
        `).join('')
                    : `
          <div class="alert-item">
            <b>No active alerts</b>
            <small>
              Live response data will appear here.
            </small>
          </div>
        `;
        }

        if ($('adminLog') && $('adminAlerts')) {
            $('adminLog').innerHTML =
                $('adminAlerts').innerHTML;
        }

    } catch (e) { }
}

function initAdminNav() {

    document
        .querySelectorAll('[data-admin]')
        .forEach(b => {
            b.addEventListener('click', () => {
                const p = b.dataset.admin;

                document
                    .querySelectorAll('.admin-page')
                    .forEach(x => x.classList.remove('active-admin'));

                const target = $('admin-' + p);

                if (target) {
                    target.classList.add('active-admin');
                }

                document
                    .querySelectorAll('.admin-nav button')
                    .forEach(x => {
                        x.classList.toggle(
                            'active',
                            x.dataset.admin === p
                        );
                    });
            });
        });
}

function setAuthMessage(message, isSuccess = false) {

    const el = $('authMsg');

    if (!el) return;

    el.textContent = message;

    el.style.color =
        isSuccess
            ? '#26785f'
            : '';
}

function getSignupCredentials() {

    const emailEl = $('email');
    const passwordEl = $('password');

    if (!emailEl || !passwordEl) {
        throw new Error(
            'Email or password field was not found on this page.'
        );
    }

    const email = String(emailEl.value || '').trim();
    const password = String(passwordEl.value || '');

    if (!email) {
        throw new Error('Please enter your email address.');
    }

    if (!password) {
        throw new Error('Please enter a password.');
    }

    if (password.length < 6) {
        throw new Error(
            'Password must be at least 6 characters.'
        );
    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        throw new Error(
            'Please enter a valid email address.'
        );
    }

    return { email, password };
}

function bind() {

    initNavigation();
    initAdminNav();

    if ($('loginForm')) {

        $('loginForm').addEventListener(
            'submit',
            async e => {
                e.preventDefault();

                setAuthMessage('');

                if (!sb) {
                    setAuthMessage(
                        'Supabase is not ready. Please refresh the page.'
                    );
                    return;
                }

                try {

                    const email =
                        String($('email')?.value || '').trim();

                    const password =
                        String($('password')?.value || '');

                    if (!email) {
                        throw new Error(
                            'Please enter your email address.'
                        );
                    }

                    if (!password) {
                        throw new Error(
                            'Please enter your password.'
                        );
                    }

                    const { error } = await sb.auth.signInWithPassword({
                        email,
                        password
                    });

                    if (error) throw error;

                    if (selectedRole === 'admin') {
                        showAdmin();
                    }

                } catch (err) {

                    console.error('Sign in error:', err);

                    setAuthMessage(
                        err.message || 'Unable to sign in.'
                    );
                }
            }
        );
    }

    /*
     * CREATE ACCOUNT
     *
     * This is the section specifically fixed.
     */
    if ($('signup')) {

        $('signup').onclick = async () => {

            const signupButton = $('signup');

            setAuthMessage('');

            if (!sb) {
                setAuthMessage(
                    'Supabase is not ready. Please refresh the page.'
                );
                return;
            }

            try {

                const { email, password } =
                    getSignupCredentials();

                signupButton.disabled = true;

                signupButton.dataset.originalText =
                    signupButton.textContent;

                signupButton.textContent =
                    'Creating Account...';

                console.log(
                    'Creating Supabase account for:',
                    email
                );

                const result = await sb.auth.signUp({
                    email: email,
                    password: password
                });

                console.log(
                    'Supabase signup response:',
                    result
                );

                const { data, error } = result;

                if (error) {

                    console.error(
                        'Supabase signup error:',
                        error
                    );

                    throw error;
                }

                /*
                 * If Supabase returns a user, signup succeeded.
                 * If session exists, the user can enter immediately.
                 * If session is null, email confirmation is enabled.
                 */
                if (data?.session) {

                    setAuthMessage(
                        'Account created successfully! Signing you in...',
                        true
                    );

                    await enterApp(data.session);

                } else if (data?.user) {

                    setAuthMessage(
                        'Account created successfully. Check your email to verify your account.',
                        true
                    );

                } else {

                    setAuthMessage(
                        'Account creation request completed, but Supabase did not return a user. Please check your Supabase Auth settings.'
                    );
                }

            } catch (e) {

                console.error(
                    'Create Account error:',
                    e
                );

                /*
                 * Show the REAL Supabase error to the user
                 * instead of silently doing nothing.
                 */
                setAuthMessage(
                    e?.message ||
                    e?.error_description ||
                    'Unable to create account.'
                );

            } finally {

                signupButton.disabled = false;

                signupButton.textContent =
                    signupButton.dataset.originalText ||
                    'Create Account';
            }
        };
    }

    if ($('forgot')) {

        $('forgot').onclick = async () => {

            if (!$('email')?.value) {

                setAuthMessage(
                    'Enter your email first.'
                );

                return;
            }

            try {

                const email =
                    String($('email').value).trim();

                const { error } =
                    await sb.auth.resetPasswordForEmail(
                        email,
                        {
                            redirectTo: location.origin
                        }
                    );

                if (error) throw error;

                setAuthMessage(
                    'Password reset email sent.',
                    true
                );

            } catch (e) {

                setAuthMessage(
                    e.message ||
                    'Unable to send reset email.'
                );
            }
        };
    }

    if ($('guest')) {

        $('guest').onclick = () => {
            toast(
                'Temporary sessions are not enabled by the current backend; sign in to use secure features.'
            );
        };
    }

    if ($('locate')) {

        $('locate').onclick = () => {
            navigator.geolocation?.getCurrentPosition(
                updateLocation,
                () => toast('Location permission is needed.')
            );
        };
    }

    if ($('mapLocate')) {

        $('mapLocate').onclick = () => {
            if (current) {
                map?.setView(
                    [
                        current.latitude,
                        current.longitude
                    ],
                    16
                );
            }
        };
    }

    if ($('zoomIn')) {
        $('zoomIn').onclick = () => {
            map?.zoomIn();
        };
    }

    if ($('zoomOut')) {
        $('zoomOut').onclick = () => {
            map?.zoomOut();
        };
    }

    if ($('sosTop')) {

        $('sosTop').onclick = () => {
            $('sosModal')?.classList.add('show');
        };
    }

    if ($('cancelSos')) {

        $('cancelSos').onclick = () => {
            $('sosModal')?.classList.remove('show');
        };
    }

    if ($('confirmSos')) {
        $('confirmSos').onclick = doSOS;
    }

    if ($('profileTop')) {
        $('profileTop').onclick = () => {
            showPage('profile');
        };
    }

    if ($('scoreContact')) {
        $('scoreContact').onclick = () => {
            showPage('profile');
        };
    }

    if ($('chatForm')) {

        $('chatForm').addEventListener(
            'submit',
            e => {
                e.preventDefault();

                sendChat(
                    $('chatInput')?.value.trim()
                );
            }
        );
    }

    document
        .querySelectorAll('.chat-suggestions button')
        .forEach(b => {
            b.onclick = () => {
                sendChat(b.textContent);
            };
        });

    if ($('reportForm')) {

        $('reportForm').addEventListener(
            'submit',
            async e => {
                e.preventDefault();

                try {

                    await api('/api/incident', {
                        method: 'POST',
                        body: JSON.stringify({
                            category: $('reportCategory').value,
                            description: $('reportDescription').value,
                            latitude: current?.latitude,
                            longitude: current?.longitude,
                            severity: Number(
                                $('reportSeverity').value
                            )
                        })
                    });

                    $('reportDescription').value = '';

                    toast('Report submitted');

                    showPage('activity');

                } catch (err) {

                    toast(
                        'Could not submit report'
                    );
                }
            }
        );
    }

    if ($('profileForm')) {

        $('profileForm').addEventListener(
            'submit',
            async e => {
                e.preventDefault();

                try {

                    await api('/api/profile', {
                        method: 'PUT',
                        body: JSON.stringify({
                            full_name: $('profileFullName').value,
                            nationality: $('profileNationality').value,
                            emergency_contact: $('profileEmergency').value
                        })
                    });

                    toast('Profile saved');

                    loadProfile();

                } catch (e) {

                    toast(
                        'Could not save profile'
                    );
                }
            }
        );
    }

    if ($('tripForm')) {

        $('tripForm').addEventListener(
            'submit',
            async e => {
                e.preventDefault();

                try {

                    await api('/api/trip', {
                        method: 'POST',
                        body: JSON.stringify({
                            title: $('tripTitle').value,
                            destination: $('tripDestination').value,
                            start_at: $('tripStart').value || null,
                            end_at: $('tripEnd').value || null,
                            status: 'planned'
                        })
                    });

                    toast('Trip saved');

                    $('tripForm').reset();

                    loadTrips();

                } catch (e) {

                    toast(
                        'Could not save trip'
                    );
                }
            }
        );
    }

    if ($('shareTripBtn')) {

        $('shareTripBtn').onclick = async () => {

            if (!current) {
                toast('Allow location first.');
                return;
            }

            try {

                await api('/api/location', {
                    method: 'POST',
                    body: JSON.stringify(current)
                });

                toast(
                    'Current location shared with your secure trip record.'
                );

            } catch (e) {

                toast(
                    'Could not share location'
                );
            }
        };
    }

    if ($('logout')) {

        $('logout').onclick = async () => {
            await sb.auth.signOut();
            showAuth();
        };
    }

    if ($('adminLogout')) {

        $('adminLogout').onclick = async () => {
            await sb.auth.signOut();
            showAuth();
        };
    }
}

window.addEventListener(
    'DOMContentLoaded',
    async () => {
        bind();
        await initAuth();
    }
);