// ============================================================
//  app.js  —  Frontend SPA with JWT-based Auth
//  Connects to Express backend running on localhost:3000
// ============================================================

const API = 'http://localhost:3000';

// ── HELPER: Get auth header with JWT token ──────────────────
function getAuthHeader() {
  const token = sessionStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── HELPER: Show a message to the user ─────────────────────
function showMessage(msg, isError = false) {
  const el = document.getElementById('message');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#ff6b6b' : '#43e97b';
}

// ============================================================
//  AUTH FUNCTIONS
// ============================================================

// ── REGISTER ────────────────────────────────────────────────
async function register(username, password) {
  try {
    const response = await fetch(`${API}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(`✅ Registered successfully as "${data.username}"! You can now log in.`);
    } else {
      showMessage(`❌ Registration failed: ${data.error}`, true);
    }
  } catch (err) {
    showMessage('❌ Network error — is the backend running?', true);
  }
}

// ── LOGIN ───────────────────────────────────────────────────
async function login(username, password) {
  try {
    const response = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Save JWT token in sessionStorage (cleared when tab/browser closes)
      sessionStorage.setItem('authToken', data.token);

      // Show the dashboard with user info
      showDashboard(data.user);
    } else {
      showMessage(`❌ Login failed: ${data.error}`, true);
    }
  } catch (err) {
    showMessage('❌ Network error — is the backend running?', true);
  }
}

// ── LOGOUT ──────────────────────────────────────────────────
function logout() {
  sessionStorage.removeItem('authToken');
  showLoginView();
}

// ============================================================
//  PROTECTED API CALLS
// ============================================================

// ── Load user profile (any logged-in user) ──────────────────
async function loadProfile() {
  try {
    const res = await fetch(`${API}/api/profile`, {
      headers: getAuthHeader()
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(`👤 Profile: ${data.user.username} (${data.user.role})`);
    } else {
      showMessage(`❌ ${data.error}`, true);
    }
  } catch (err) {
    showMessage('❌ Network error', true);
  }
}

// ── Load admin dashboard (admin only) ───────────────────────
async function loadAdminDashboard() {
  try {
    const res = await fetch(`${API}/api/admin/dashboard`, {
      headers: getAuthHeader()
    });

    const data = await res.json();
    const content = document.getElementById('content');

    if (res.ok) {
      if (content) content.innerText = `🛡️ ${data.message} — ${data.data}`;
      showMessage('✅ Admin dashboard loaded!');
    } else {
      if (content) content.innerText = '🚫 Access denied!';
      showMessage(`❌ ${data.error}`, true);
    }
  } catch (err) {
    showMessage('❌ Network error', true);
  }
}

// ── Load public/guest content (no login needed) ─────────────
async function loadGuestContent() {
  try {
    const res = await fetch(`${API}/api/content/guest`);
    const data = await res.json();
    const content = document.getElementById('content');
    if (content) content.innerText = `🌐 ${data.message}`;
  } catch (err) {
    showMessage('❌ Network error', true);
  }
}

// ============================================================
//  UI VIEWS
// ============================================================

// ── Show the login/register form ────────────────────────────
function showLoginView() {
  document.getElementById('auth-section').style.display  = 'block';
  document.getElementById('dashboard-section').style.display = 'none';
  document.getElementById('content').innerText = '';
  showMessage('');
}

// ── Show the dashboard after login ──────────────────────────
function showDashboard(user) {
  document.getElementById('auth-section').style.display      = 'none';
  document.getElementById('dashboard-section').style.display = 'block';

  // Display username and role
  const usernameEl = document.getElementById('username-display');
  const roleEl     = document.getElementById('role-display');
  if (usernameEl) usernameEl.textContent = user.username;
  if (roleEl)     roleEl.textContent     = user.role;

  // Show Admin Dashboard button ONLY for admins
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.style.display = user.role === 'admin' ? 'inline-block' : 'none';
  }

  showMessage(`✅ Welcome, ${user.username}!`);
}

// ============================================================
//  PAGE LOAD — Check if already logged in
// ============================================================
async function init() {
  const token = sessionStorage.getItem('authToken');

  if (!token) {
    showLoginView();
    return;
  }

  // Token exists — verify it and get user info from backend
  try {
    const res  = await fetch(`${API}/api/profile`, {
      headers: getAuthHeader()
    });
    const data = await res.json();

    if (res.ok) {
      showDashboard(data.user);
    } else {
      // Token is invalid or expired — clear it and show login
      sessionStorage.removeItem('authToken');
      showLoginView();
    }
  } catch (err) {
    showLoginView();
  }
}

// ============================================================
//  EVENT LISTENERS — Wire up buttons and forms
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // ── Login form submit ──────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value.trim();
      if (username && password) login(username, password);
    });
  }

  // ── Register form submit ───────────────────────────────────
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const password = document.getElementById('reg-password').value.trim();
      if (username && password) register(username, password);
    });
  }

  // ── Logout button ──────────────────────────────────────────
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // ── Admin Dashboard button ─────────────────────────────────
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) adminBtn.addEventListener('click', loadAdminDashboard);

  // ── Profile button ─────────────────────────────────────────
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) profileBtn.addEventListener('click', loadProfile);

  // ── Guest content button ───────────────────────────────────
  const guestBtn = document.getElementById('guestBtn');
  if (guestBtn) guestBtn.addEventListener('click', loadGuestContent);

  // ── Run init to check login state ─────────────────────────
  init();
});