/* ---------- routing ---------- */
function showApp(id) { document.querySelectorAll('.app').forEach(a => a.classList.toggle('on', a.id === id)); }
function pickRole(r) {
  document.querySelectorAll('.role').forEach(x => x.style.outline = 'none');
  var lf = document.getElementById('loginform');
  var sf = document.getElementById('signupform');
  lf.classList.add('on');
  sf.classList.remove('on');
  var btn = document.getElementById('signinBtn');
  lf.dataset.role = r;
  sf.dataset.role = r;
  btn.textContent = r === 'admin' ? 'Sign In as Admin' : 'Sign In as Tourist';
  document.getElementById('signupBtn').textContent = r === 'admin' ? 'Create Admin Account' : 'Create Tourist Account';
  lf.scrollIntoView({ behavior: 'smooth' });
}
async function doSignIn() { await window.YKAuth.signIn(); }
async function doSignUp() { await window.YKAuth.signUp(); }
async function logout() { await window.YKAuth.signOut(); }

window.showSignUpForm = function() {
  document.getElementById('loginform').classList.remove('on');
  document.getElementById('signupform').classList.add('on');
}
window.showLoginForm = function() {
  document.getElementById('signupform').classList.remove('on');
  document.getElementById('loginform').classList.add('on');
}

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
  if (c) {
    c.addEventListener('mousedown', startHold);
    c.addEventListener('mouseup', endHold);
    c.addEventListener('mouseleave', endHold);
    c.addEventListener('touchstart', function (e) { e.preventDefault(); startHold(); }, { passive: false });
    c.addEventListener('touchend', function (e) { e.preventDefault(); endHold(); }, { passive: false });
  }
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
  let session = null;
  let tempSetupDID = null; // Stores DID temporarily during setup

  async function init() {
    // Pre-populate dummy user for test
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const defaultUsers = {
      'DID1234': { digitalId: 'DID1234', full_name: 'Madhav Gairola', phone: '+91 7895936487', nationality: '🇮🇳 India (Delhi)', role: 'tourist', dob: '15 Aug 1998', blood: 'B+', lang: 'EN · HI', visa: 'Tourist (e-Visa)', validTill: '12 Dec 2026', entry: '18 Aug 2026', city: 'Delhi', stay: 'Taj Palace', ins: 'Active ✓' },
      'DID0807': { digitalId: 'DID0807', full_name: 'Renesha Sagar', phone: '+34 600123456', nationality: '🇪🇸 Spain', role: 'tourist', dob: '08 Jul 1999', blood: 'O-', lang: 'ES · EN', visa: 'Visa on Arrival', validTill: '01 Nov 2026', entry: '01 Sep 2026', city: 'Goa', stay: 'Taj Exotica', ins: 'Active ✓' },
      'DID6767': { digitalId: 'DID6767', full_name: 'Anupam Anand', phone: '+234 8012345678', nationality: '🇳🇬 Nigeria', role: 'tourist', dob: '22 Jan 1995', blood: 'A+', lang: 'EN · YR', visa: 'Tourist (Regular)', validTill: '15 Jan 2027', entry: '15 Oct 2026', city: 'Mumbai', stay: 'Oberoi', ins: 'Active ✓' },
      'DID9999': { digitalId: 'DID9999', full_name: 'Sarah Chen', phone: '+65 91234567', nationality: '🇸🇬 Singapore', role: 'tourist', dob: '30 May 1990', blood: 'AB+', lang: 'EN · ZH', visa: 'Business', validTill: '05 May 2028', entry: '05 May 2026', city: 'Bangalore', stay: 'Leela Palace', ins: 'Active ✓' },
      'DID1111': { digitalId: 'DID1111', full_name: 'Admin Test', phone: '+1 555000000', nationality: '🇺🇸 USA', role: 'admin', dob: '10 Oct 1985', blood: 'O+', lang: 'EN · ES', visa: 'Work (H1-B)', validTill: '20 Aug 2028', entry: '20 Aug 2025', city: 'New York', stay: 'Local Residence', ins: 'Active ✓' }
    };
    let updated = false;
    for (const [did, data] of Object.entries(defaultUsers)) {
      if (!users[did]) { 
        users[did] = data; 
        updated = true; 
      } else {
        // Merge to update old hardcoded mock data while preserving passwords
        users[did] = { ...users[did], ...data };
        updated = true;
      }
    }
    if (updated) localStorage.setItem('users', JSON.stringify(users));

    const s = localStorage.getItem('session'); 
    if (s) { 
      session = JSON.parse(s); 
      // Update session with latest mock data if available
      if (users[session.digitalId]) {
        session = { ...session, ...users[session.digitalId] };
        localStorage.setItem('session', JSON.stringify(session));
      }
      await loadUser(); 
    } 
  }
  
  function txt(id, v) { const e = document.getElementById(id); if (e) e.textContent = v ?? '—'; }
  function initials(n) { return (n||'').split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?'; }
  
  async function loadUser() {
    try {
      const n = session.full_name || session.digitalId;
      txt('greeting', 'Hello ' + n + '!'); txt('profileName', n); txt('drawerName', n);
      txt('homeAvatar', initials(n)); txt('drawerAvatar', initials(n)); txt('profileFullName', n);
      txt('profileNationality', session.nationality || 'Not added');
      
      // Additional user info
      if (document.getElementById('profilePhone')) txt('profilePhone', session.phone || 'Not added');
      if (document.getElementById('profileDigitalId')) txt('profileDigitalId', session.digitalId);
      if (document.getElementById('profileDetailName')) txt('profileDetailName', n);
      
      // Extended info
      txt('profileDob', session.dob || '—');
      txt('profileBlood', session.blood || '—');
      txt('profileLang', session.lang || '—');
      txt('profileVisa', session.visa || '—');
      txt('profileValidTill', session.validTill || '—');
      txt('profileEntryDate', session.entry || '—');
      txt('profileCity', session.city || '—');
      txt('profileStay', session.stay || '—');
      txt('profileInsurance', session.ins || '—');
      
      const role = session.role || 'tourist';
      if (role === 'admin') { showApp('admin-app'); adminGo('a-dashboard'); }
      else { showApp('tourist-app'); show('home'); }
    } catch (e) { console.error(e); }
  }

  async function signIn() {
    const did = document.getElementById('li-digitalid')?.value.trim();
    const password = document.getElementById('li-password')?.value || '';
    if (!did || !password) return toast('Enter your Digital ID and password');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[did]) return toast('Digital ID not found');
    if (users[did].password !== password) return toast('Wrong password');
    session = users[did];
    localStorage.setItem('session', JSON.stringify(session));
    toast('Signed in successfully');
    await loadUser();
  }

  // FIRST TIME SETUP LOGIC
  window.setupSendOTP = function() {
    const did = document.getElementById('su-digitalid')?.value.trim();
    if (!did) return toast('Please enter a Digital ID');
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[did]) return toast('Digital ID not found in system. Admin must add you first.');
    if (users[did].password) return toast('Account already setup. Please sign in.');
    
    tempSetupDID = did;
    document.getElementById('setup-step-1').style.display = 'none';
    document.getElementById('setup-step-2').style.display = 'block';
    
    // Mask phone number
    const p = users[did].phone || '';
    const masked = p.slice(0, 3) + '****' + p.slice(-4);
    toast(`OTP sent to ${masked}`);
  }

  window.setupVerifyOTP = function() {
    const otp = document.getElementById('su-otp')?.value.trim();
    if (otp !== '1234') return toast('Invalid OTP. Please enter 1234');
    
    document.getElementById('setup-step-2').style.display = 'none';
    document.getElementById('setup-step-3').style.display = 'block';
    toast('OTP Verified');
  }

  window.setupComplete = async function() {
    const pass1 = document.getElementById('su-pass1')?.value || '';
    const pass2 = document.getElementById('su-pass2')?.value || '';
    
    if (pass1.length < 6) return toast('Password must be at least 6 characters');
    if (pass1 !== pass2) return toast('Passwords do not match');
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[tempSetupDID].password = pass1;
    localStorage.setItem('users', JSON.stringify(users));
    
    session = users[tempSetupDID];
    localStorage.setItem('session', JSON.stringify(session));
    
    // Reset forms
    document.getElementById('setup-step-1').style.display = 'block';
    document.getElementById('setup-step-3').style.display = 'none';
    
    toast('Setup complete! Signing in...');
    await loadUser();
  }

  async function signOut() {
    session = null;
    tempSetupDID = null;
    localStorage.removeItem('session');
    
    // Reset forms
    document.getElementById('setup-step-1').style.display = 'block';
    document.getElementById('setup-step-2').style.display = 'none';
    document.getElementById('setup-step-3').style.display = 'none';
    document.getElementById('su-digitalid').value = '';
    document.getElementById('su-otp').value = '';
    document.getElementById('su-pass1').value = '';
    document.getElementById('su-pass2').value = '';
    
    showApp('login-app');
    document.getElementById('loginform')?.classList.add('on');
    document.getElementById('signupform')?.classList.remove('on');
  }

  async function chat() {
    const i = document.getElementById('chatInput'), v = i?.value.trim(); if (!v) return;
    addMsg('chatScroll', v, 'user'); i.value = '';
    setTimeout(() => addMsg('chatScroll', 'Offline prototype: I received your message.', 'bot'), 500);
  }

  async function sosReal() {
    toast('Offline: Mock SOS fired');
    sosFired = true; txt('sosLabel', 'ALERT SENT'); txt('sosTitle', 'HELP IS ON THE WAY'); txt('sosSub', 'Your SOS has been recorded securely.');
    ['n-police', 'n-helpline', 'n-sarah'].forEach((id, i) => setTimeout(() => document.getElementById(id)?.classList.add('done'), 500 + i * 700));
  }

  window.YKAuth = { signIn, signOut }; window.YKApp = { sendChat: chat }; window.fireSOS = sosReal;
  
  window.openThread = async function () { showApp('tourist-app'); show('thread'); const b = document.getElementById('threadScroll'); if (b) b.innerHTML = ''; addMsg('threadScroll', 'Offline thread view', 'bot'); };
  window.sendThread = async function () { const i = document.getElementById('threadInput'), v = i?.value.trim(); if (!v) return; addMsg('threadScroll', v, 'user'); i.value = ''; setTimeout(() => addMsg('threadScroll', 'Offline reply', 'bot'), 500); };
  
  document.addEventListener('DOMContentLoaded', () => { init(); });
})();