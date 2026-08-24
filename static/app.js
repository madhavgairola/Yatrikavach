
/* ---------- routing ---------- */
function showApp(id) { document.querySelectorAll('.app').forEach(a => a.classList.toggle('on', a.id === id)); }
function pickRole(r) {
  document.querySelectorAll('.role').forEach(x => x.style.outline = 'none');
  var f = document.getElementById('loginform'); f.classList.add('on');
  var btn = document.getElementById('signinBtn');
  f.dataset.role = r;
  btn.textContent = r === 'admin' ? 'Sign In as Admin' : 'Sign In as Tourist';
  f.scrollIntoView({ behavior: 'smooth' });
}
async function doSignIn() { await window.YKAuth.signIn(); }
async function logout() { await window.YKAuth.signOut(); }

/* ---------- tourist page router ---------- */
function show(page) {
  document.querySelectorAll('#tourist-app .page').forEach(p => p.classList.toggle('active', p.id === page));
  var mains = ['home', 'map', 'chatbot', 'messages'];
  var nav = document.getElementById('t-nav');
  nav.style.display = mains.includes(page) ? 'flex' : 'none';
  document.querySelectorAll('#t-nav .n').forEach(n => n.classList.toggle('on', n.dataset.tab === page));
  var el = document.getElementById(page); if (el) el.scrollTop = 0;
  closeDrawer();
}

/* ---------- drawer ---------- */
function openDrawer() { document.getElementById('drawer').classList.add('on'); document.getElementById('scrim').classList.add('on'); }
function closeDrawer() { document.getElementById('drawer').classList.remove('on'); document.getElementById('scrim').classList.remove('on'); }

/* ---------- toast ---------- */
function toast(msg) {
  var wrap = document.querySelector('#tourist-app.on') ? { t: 'toast', x: 'toastText' } : { t: 'toast2', x: 'toastText2' };
  var el = document.getElementById(wrap.t); if (!el) { el = document.getElementById('toast'); }
  var tx = document.getElementById(wrap.x); if (!tx) { tx = document.getElementById('toastText'); }
  tx.textContent = msg; el.classList.add('on');
  clearTimeout(window._tt); window._tt = setTimeout(() => el.classList.remove('on'), 2200);
}

/* ---------- chips ---------- */
function pickChip(el) {
  var row = el.parentElement;
  row.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  toast('Filter: ' + el.textContent);
}

/* ---------- SOS ---------- */
var sosCount = 0, sosTimer = null, sosFired = false;
function openSOS() { document.getElementById('sos').classList.add('on'); resetSOS(); }
function closeSOS() { clearInterval(sosTimer); document.getElementById('sos').classList.remove('on'); resetSOS(); }
function resetSOS() {
  sosFired = false; sosCount = 0; clearInterval(sosTimer);
  document.getElementById('sosNum').innerHTML = '<svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M6.6 2.5 3.9 3.2A2 2 0 0 0 2.5 5.6c.6 6.6 6.3 12.3 12.9 12.9a2 2 0 0 0 2.4-1.4l.7-2.7a1.6 1.6 0 0 0-1-1.9l-2.9-1.1a1.6 1.6 0 0 0-1.8.5l-.9 1.1a12 12 0 0 1-4.6-4.6l1.1-.9a1.6 1.6 0 0 0 .5-1.8L8.5 3.5a1.6 1.6 0 0 0-1.9-1z" fill="#fff"/></svg>';
  document.getElementById('sosLabel').textContent = 'HOLD TO ALERT';
  document.getElementById('sosTitle').textContent = 'EMERGENCY SOS';
  document.getElementById('sosSub').textContent = 'Press & hold to alert tourist police, your embassy & trusted contacts with your live location.';
  ['n-police', 'n-helpline', 'n-sarah'].forEach(id => document.getElementById(id).classList.remove('done'));
}
function startHold() {
  if (sosFired) return;
  sosCount = 3; document.getElementById('sosNum').textContent = '3'; document.getElementById('sosLabel').textContent = 'KEEP HOLDING';
  sosTimer = setInterval(() => {
    sosCount--;
    if (sosCount <= 0) { clearInterval(sosTimer); fireSOS(); }
    else document.getElementById('sosNum').textContent = sosCount;
  }, 1000);
}
function endHold() {
  if (sosFired) return;
  clearInterval(sosTimer);
  document.getElementById('sosNum').innerHTML = '<svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M6.6 2.5 3.9 3.2A2 2 0 0 0 2.5 5.6c.6 6.6 6.3 12.3 12.9 12.9a2 2 0 0 0 2.4-1.4l.7-2.7a1.6 1.6 0 0 0-1-1.9l-2.9-1.1a1.6 1.6 0 0 0-1.8.5l-.9 1.1a12 12 0 0 1-4.6-4.6l1.1-.9a1.6 1.6 0 0 0 .5-1.8L8.5 3.5a1.6 1.6 0 0 0-1.9-1z" fill="#fff"/></svg>';
  document.getElementById('sosLabel').textContent = 'HOLD TO ALERT';
}
function fireSOS() {
  sosFired = true;
  document.getElementById('sosNum').innerHTML = '<svg width="52" height="52" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.getElementById('sosLabel').textContent = 'ALERT SENT';
  document.getElementById('sosTitle').textContent = 'HELP IS ON THE WAY';
  document.getElementById('sosSub').textContent = 'Your live location and Digital ID have been shared. Stay where you are if safe.';
  var ids = ['n-police', 'n-helpline', 'n-sarah'];
  ids.forEach((id, i) => setTimeout(() => document.getElementById(id).classList.add('done'), 500 + i * 700));
}
document.addEventListener('DOMContentLoaded', () => {
  var c = document.getElementById('sosCircle');
  c.addEventListener('mousedown', startHold);
  c.addEventListener('mouseup', endHold);
  c.addEventListener('mouseleave', endHold);
  c.addEventListener('touchstart', function (e) { e.preventDefault(); startHold(); }, { passive: false });
  c.addEventListener('touchend', function (e) { e.preventDefault(); endHold(); }, { passive: false });
});

/* ---------- chatbot ---------- */
function addMsg(scrollId, text, who) {
  var s = document.getElementById(scrollId);
  if (who === 'bot') {
    var w = document.createElement('div'); w.className = 'msg bot-wrap';
    w.innerHTML = '<div class="bav"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 4.9L18.7 9l-4.9 1.8L12 15.7l-1.8-4.9L5.3 9l4.9-1.2L12 3z" stroke="#212121" stroke-width="1.6" stroke-linejoin="round"/></svg></div><div class="msg bot">' + text + '</div>';
    s.appendChild(w);
  } else {
    var m = document.createElement('div'); m.className = 'msg ' + who; m.textContent = text; s.appendChild(m);
  }
  s.scrollTop = s.scrollHeight;
}
async function sendChat() { await window.YKApp.sendChat(); }
function quickAsk(q) { document.getElementById('chatInput').value = q; sendChat(); }

/* ---------- messages / threads ---------- */

/* ---------- favourites / faq / about ---------- */
function toggleHeart(el) {
  var i = el.querySelector('i');
  if (el.textContent.trim().startsWith('Saved')) { el.innerHTML = '<i style="background:#8A8A8A"></i>Removed'; toast('Removed from favourites'); }
  else { el.innerHTML = '<i style="background:#FF6B6B"></i>Saved'; toast('Added to favourites'); }
}
function toggleFaq(el) { el.classList.toggle('open'); }
function toggleAbout(el) { el.classList.toggle('open'); }

/* ---------- admin ---------- */
function adminGo(id) {
  document.querySelectorAll('#admin-app .apage').forEach(p => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('.a-sidebar .srow').forEach(r => r.classList.toggle('on', r.dataset.a === id));
  var el = document.getElementById(id); if (el) el.scrollTop = 0;
  closeSidebar();
}
function openSidebar() { document.getElementById('a-sidebar').classList.add('on'); document.getElementById('a-scrim').classList.add('on'); }
function closeSidebar() { document.getElementById('a-sidebar').classList.remove('on'); document.getElementById('a-scrim').classList.remove('on'); }
function toggleStepper(id) {
  document.querySelectorAll('.stepper').forEach(s => { if (s.id !== id) s.classList.remove('on'); });
  document.getElementById(id).classList.toggle('on');
}
function toggleSwitch(el) {
  var on = el.dataset.on === '1'; el.dataset.on = on ? '0' : '1';
  var knob = el.firstElementChild;
  el.style.background = on ? '#ddd' : '#212121';
  knob.style.left = on ? '3px' : '23px';
  toast(on ? 'Auto-report off' : 'Auto-report scheduled');
}


(function () {
  let sb = null, session = null, currentLocation = null;
  async function init() { const c = await fetch('/api/config').then(r => r.json()); sb = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey); session = (await sb.auth.getSession()).data.session; sb.auth.onAuthStateChange((_e, s) => { session = s; if (s) loadUser(); }); if (session) await loadUser(); }
  async function api(path, opt = {}) { if (!session) throw Error('Please sign in first'); const headers = Object.assign({ 'Content-Type': 'application/json' }, opt.headers || {}, { Authorization: 'Bearer ' + session.access_token }); const r = await fetch(path, Object.assign({}, opt, { headers })); const d = await r.json().catch(() => ({})); if (!r.ok) throw Error(d.detail || 'Request failed'); return d; }
  function txt(id, v) { const e = document.getElementById(id); if (e) e.textContent = v ?? '—'; }
  function initials(n) { return n.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?'; }
  async function loadUser() { try { const p = await api('/api/profile'); const n = p.full_name || session.user.email.split('@')[0]; txt('greeting', 'Hello ' + n + '!'); txt('profileName', n); txt('drawerName', n); txt('homeAvatar', initials(n)); txt('drawerAvatar', initials(n)); txt('profileFullName', n); txt('profileNationality', p.nationality || 'Not added'); const role = p.role || 'tourist'; if (role === 'admin') { showApp('admin-app'); adminGo('a-dashboard'); } else { showApp('tourist-app'); show('home'); await refresh(); track(); } } catch (e) { console.error(e); } }
  async function signIn() { const ins = [...document.querySelectorAll('#loginform input')], em = ins.find(x => x.type !== 'password'), pw = ins.find(x => x.type === 'password'); const email = em?.value.trim(), password = pw?.value || ''; if (!email || !password) return toast('Enter your email and password'); const r = await sb.auth.signInWithPassword({ email, password }); if (r.error) return toast(r.error.message); session = r.data.session; await loadUser(); }
  async function signUp() { const ins = [...document.querySelectorAll('#loginform input')], em = ins.find(x => x.type !== 'password'), pw = ins.find(x => x.type === 'password'); const email = em?.value.trim(), password = pw?.value || ''; if (!email || password.length < 6) return toast('Use a valid email and 6+ character password'); const r = await sb.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0] } } }); if (r.error) return toast(r.error.message); if (r.data.session) { session = r.data.session; await loadUser(); } else toast('Account created. Check your email if confirmation is enabled.'); }
  async function signOut() { if (sb) await sb.auth.signOut(); session = null; showApp('login-app'); document.getElementById('loginform')?.classList.remove('on'); }
  async function refresh() { const [p, c] = await Promise.all([api('/api/profile'), api('/api/context')]); const n = p.full_name || session.user.email.split('@')[0]; txt('greeting', 'Hello ' + n + '!'); txt('profileName', n); txt('drawerName', n); txt('homeAvatar', initials(n)); txt('drawerAvatar', initials(n)); txt('currentLocation', c.location?.place_name || 'Location unavailable'); txt('safetyScore', c.score); currentLocation = c.location; }
  async function sendPos(pos) { try { const d = await api('/api/location', { method: 'POST', body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }) }); currentLocation = d.location; txt('currentLocation', d.place_name || 'Current location'); await refresh(); } catch (e) { console.error(e); } }
  function track() { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(sendPos, () => { }, { enableHighAccuracy: true, timeout: 10000 }); navigator.geolocation.watchPosition(sendPos, () => { }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }); }
  async function chat() { const i = document.getElementById('chatInput'), v = i?.value.trim(); if (!v) return; addMsg('chatScroll', v, 'user'); i.value = ''; try { const d = await api('/api/chat', { method: 'POST', body: JSON.stringify({ message: v, latitude: currentLocation?.latitude || null, longitude: currentLocation?.longitude || null, place_name: currentLocation?.place_name || null }) }); addMsg('chatScroll', d.answer, 'bot'); } catch (e) { addMsg('chatScroll', 'AI service is unavailable right now.', 'bot'); } }
  async function sosReal() { try { await api('/api/sos', { method: 'POST', body: JSON.stringify({ latitude: currentLocation?.latitude || null, longitude: currentLocation?.longitude || null, place_name: currentLocation?.place_name || null }) }); sosFired = true; txt('sosLabel', 'ALERT SENT'); txt('sosTitle', 'HELP IS ON THE WAY'); txt('sosSub', 'Your SOS and current location have been recorded securely.');['n-police', 'n-helpline', 'n-sarah'].forEach((id, i) => setTimeout(() => document.getElementById(id)?.classList.add('done'), 500 + i * 700)); } catch (e) { toast(e.message); } }
  window.YKAuth = { signIn, signUp, signOut }; window.YKApp = { sendChat: chat }; window.doSignIn = signIn; window.logout = signOut; window.fireSOS = sosReal;
  window.openThread = async function () { showApp('tourist-app'); show('thread'); const b = document.getElementById('threadScroll'); if (!b) return; b.innerHTML = ''; try { (await api('/api/chat/history')).forEach(m => addMsg('threadScroll', m.message, m.role === 'assistant' ? 'bot' : 'user')); } catch (e) { } };
  window.sendThread = async function () { const i = document.getElementById('threadInput'), v = i?.value.trim(); if (!v) return; addMsg('threadScroll', v, 'user'); i.value = ''; try { const d = await api('/api/chat', { method: 'POST', body: JSON.stringify({ message: v, latitude: currentLocation?.latitude || null, longitude: currentLocation?.longitude || null, place_name: currentLocation?.place_name || null }) }); addMsg('threadScroll', d.answer, 'bot'); } catch (e) { addMsg('threadScroll', 'Unable to send right now.', 'bot'); } };
  document.addEventListener('DOMContentLoaded', async () => { try { await init(); } catch (e) { console.error(e); toast('Could not connect to Supabase'); } const c = document.querySelector('.newhere b'); if (c) c.onclick = signUp; });
})();

window.signInWithGoogle = async function () {
    const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        toast(error.message);
    }
}

window.signInWithApple = async function () {
    const { error } = await sb.auth.signInWithOAuth({
        provider: 'apple',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        toast(error.message);
    }
}
window.signIn = signIn;
window.signUp = signUp;
window.signInWithGoogle = signInWithGoogle;
window.signInWithApple = signInWithApple;