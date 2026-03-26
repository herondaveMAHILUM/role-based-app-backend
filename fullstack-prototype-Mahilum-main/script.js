// ============================================================
//  app.js  —  Migrated from script.js
//  Replaced localStorage auth with real backend API (JWT)
//  Backend: http://localhost:3000
// ============================================================

const API = 'http://localhost:3000';
let currentUser = null;

// ── HELPER: Get JWT auth header ─────────────────────────────
function getAuthHeader() {
  const token = sessionStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}


// ============================================================
//  ROUTING (unchanged from script.js)
// ============================================================
function handleRouting() {
  const hash  = window.location.hash || '#/home';
  const route = hash.replace('#/', '');

  const protectedRoutes = [
    'profile', 'employees', 'accounts',
    'departments', 'adminRequests', 'userRequests'
  ];

  if (protectedRoutes.includes(route) && !currentUser) {
    window.location.hash = '#/login';
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

  const page = document.getElementById(route);
  if (page) page.style.display = 'block';
  else document.getElementById('home').style.display = 'block';

  if (hash === 'accounts' && currentUser?.role !== 'admin') {
    window.location.hash = '#/home';
    showToast("Access denied.", "danger");
    return;
  }

  if (route === 'profile')        renderProfile();
  if (route === 'accounts')       renderAccountsList();
  if (route === 'requests')       renderRequestsTable();
  if (route === 'adminRequests')  renderAdminRequests();
  if (route === 'employees')      renderEmployeesTable();
  if (route === 'departments')    renderDepartmentsTable();
  if (route === 'verifyemail')    showVerifyEmail();
}
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);


// ============================================================
//  INITIALIZATION
//  ✅ Now checks sessionStorage + verifies token with backend
//     instead of checking localStorage
// ============================================================
window.addEventListener('load', async () => {
  const token = sessionStorage.getItem('authToken');

  if (token) {
    try {
      const res  = await fetch(`${API}/api/profile`, { headers: getAuthHeader() });
      const data = await res.json();

      if (res.ok) {
        setAuthState(true, data.user);
      } else {
        sessionStorage.removeItem('authToken');
        setAuthState(false);
      }
    } catch (err) {
      setAuthState(false);
    }
  } else {
    setAuthState(false);
  }

  if (!window.location.hash) window.location.hash = '#/home';
  handleRouting();
});


// ============================================================
//  REGISTER
//  ✅ Now calls POST /api/register instead of saving to localStorage
// ============================================================
async function register() {
  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName  = document.getElementById('regLastName').value.trim();
  const email     = document.getElementById('regEmail').value.trim().toLowerCase();
  const password  = document.getElementById('regPassword').value;

  if (!firstName || !lastName || !email || !password) {
    showToast("All fields are required.");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters.");
    return;
  }

  try {
    const response = await fetch(`${API}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });

    const data = await response.json();

    if (response.ok) {
      showToast(`Registered successfully! You can now log in.`);
      window.location.hash = '#/login';
    } else {
      showToast(`Registration failed: ${data.error}`);
    }
  } catch (err) {
    showToast('Network error — is the backend running?');
  }
}


// ============================================================
//  EMAIL VERIFICATION (kept for UI compatibility)
// ============================================================
function simVerification() {
  showToast('Email verified! You can now log in.');
  window.location.hash = '#/login';
}

function showVerifyEmail() {
  const display = document.getElementById('verifyEmailDisplay');
  if (display) display.textContent = 'Check your email to verify your account.';
}


// ============================================================
//  LOGIN
//  ✅ Now calls POST /api/login instead of checking localStorage
// ============================================================
async function loginUser() {
  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Save JWT in sessionStorage (replaces localStorage auth_token)
      sessionStorage.setItem('authToken', data.token);
      setAuthState(true, data.user);
      window.location.hash = '#/profile';
    } else {
      showToast(`Login failed: ${data.error}`);
    }
  } catch (err) {
    showToast('Network error — is the backend running?');
  }
}


// ============================================================
//  AUTHENTICATION STATE (unchanged from script.js)
// ============================================================
function setAuthState(isAuth, user = null) {
  currentUser = isAuth ? user : null;

  document.body.classList.toggle('authenticated',     isAuth);
  document.body.classList.toggle('not-authenticated', !isAuth);
  document.body.classList.toggle('is-admin', isAuth && user?.role === 'admin');

  const roleLoggedOut = document.querySelector('.role-logged-out');
  const adminDropdown = document.getElementById('adminDropdownContainer');
  const userNavLink   = document.getElementById('userNavLink');

  if (isAuth) {
    if (roleLoggedOut) roleLoggedOut.classList.add('d-none');
    if (user.role === 'admin') {
      if (adminDropdown) adminDropdown.classList.remove('d-none');
      if (userNavLink)   userNavLink.classList.add('d-none');
    } else {
      if (userNavLink)   userNavLink.classList.remove('d-none');
      if (adminDropdown) adminDropdown.classList.add('d-none');
    }
  } else {
    if (roleLoggedOut) roleLoggedOut.classList.remove('d-none');
    if (adminDropdown) adminDropdown.classList.add('d-none');
    if (userNavLink)   userNavLink.classList.add('d-none');
  }
}

function validateInput(input, condition) {
  if (condition) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
  } else {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
  }
}


// ============================================================
//  LOGOUT
//  ✅ Now clears sessionStorage instead of localStorage
// ============================================================
function logout() {
  sessionStorage.removeItem('authToken');

  const loginEmail    = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  if (loginEmail)    loginEmail.value    = '';
  if (loginPassword) loginPassword.value = '';

  const adminDropdown = document.getElementById('adminDropdownContainer');
  if (adminDropdown) {
    adminDropdown.classList.add('d-none');
    adminDropdown.querySelector('.dropdown-menu')?.classList.remove('show');
  }

  const userDropdown = document.getElementById('userNavLink');
  if (userDropdown) {
    userDropdown.classList.add('d-none');
    userDropdown.querySelector('.dropdown-menu')?.classList.remove('show');
  }

  document.querySelector('.role-logged-out')?.classList.remove('d-none');

  currentUser = null;
  window.location.hash = '#/home';
}

document.getElementById('adminLogoutLink')?.addEventListener('click', e => {
  e.preventDefault();
  logout();
});

document.getElementById('userLogoutLink')?.addEventListener('click', e => {
  e.preventDefault();
  logout();
});


// ============================================================
//  PROFILE (unchanged from script.js)
// ============================================================
function renderProfile() {
  if (!currentUser) return;

  // username field is used as fallback since backend uses username not firstName/lastName
  document.getElementById('profileName').textContent  =
    `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username;
  document.getElementById('profileEmail').textContent = currentUser.email || currentUser.username;
  document.getElementById('profileRole').textContent  =
    currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

  document.getElementById('editProfileBtn')?.addEventListener('click', () => {
    showToast("Edit Profile clicked! (Feature coming soon)");
  });
}


// ============================================================
//  ACCOUNTS (unchanged from script.js)
// ============================================================
function renderAccountsList() {
  const tbody = document.getElementById('accountsTableBody');
  if (!tbody || !window.db) return;
  tbody.innerHTML = '';

  window.db.accounts.forEach((acc, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${acc.firstName} ${acc.lastName}</td>
      <td>${acc.email}</td>
      <td>${acc.role}</td>
      <td>${acc.verified ? '✅' : '❌'}</td>
      <td>
        <button class="btn btn-outline-primary me-1" onclick="showEditForm(${i})">Edit</button>
        <button class="btn btn-outline-warning me-1" onclick="resetPassword(${i})">Reset PW</button>
        <button class="btn btn-outline-danger" onclick="deleteAccount(${i})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('addAccountBtn')?.classList.toggle('d-none', !currentUser || currentUser.role !== 'admin');
}

const toggle = (id, show = true) => {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? 'block' : 'none';
};

document.getElementById('addAccountBtn')?.addEventListener('click',       () => toggle('addAccountForm', true));
document.getElementById('cancelNewAccountBtn')?.addEventListener('click', () => toggle('addAccountForm', false));

document.getElementById('saveNewAccountBtn')?.addEventListener('click', () => {
  const firstName = document.getElementById('addFirstName').value.trim();
  const lastName  = document.getElementById('addLastName').value.trim();
  const email     = document.getElementById('addEmail').value.trim().toLowerCase();
  const password  = document.getElementById('addPassword').value;
  const role      = document.getElementById('addRole').value;
  const verified  = document.getElementById('addVerified').checked;

  if (!firstName || !lastName || !email || !password) return showToast("All fields required");
  if (password.length < 6) return showToast("Password must be at least 6 characters");
  if (window.db?.accounts.some(a => a.email === email)) return showToast("Email already exists");

  window.db?.accounts.push({ firstName, lastName, email, password, role, verified });
  renderAccountsList();
  toggle('addAccountForm', false);
});

let editingAccountIndex = null;

function showEditForm(index) {
  editingAccountIndex = index;
  const acc = window.db.accounts[index];
  document.getElementById('editFirstName').value = acc.firstName;
  document.getElementById('editLastName').value  = acc.lastName;
  document.getElementById('editEmail').value     = acc.email;
  document.getElementById('editRole').value      = acc.role;
  document.getElementById('editVerified').value  = acc.verified ? 'true' : 'false';
  document.getElementById('editAccountForm').style.display = 'block';
}

document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
  editingAccountIndex = null;
  document.getElementById('editAccountForm').style.display = 'none';
});

document.getElementById('saveAccountBtn')?.addEventListener('click', () => {
  if (editingAccountIndex === null) return;
  const acc     = window.db.accounts[editingAccountIndex];
  acc.firstName = document.getElementById('editFirstName').value.trim();
  acc.lastName  = document.getElementById('editLastName').value.trim();
  acc.email     = document.getElementById('editEmail').value.trim().toLowerCase();
  acc.role      = document.getElementById('editRole').value;
  acc.verified  = document.getElementById('editVerified').value === 'true';
  editingAccountIndex = null;
  document.getElementById('editAccountForm').style.display = 'none';
  renderAccountsList();
});

let resettingAccountIndex = null;

function resetPassword(index) {
  resettingAccountIndex = index;
  document.getElementById('newPasswordInput').value = '';
  document.getElementById('resetPasswordForm').style.display = 'block';
}

document.getElementById('cancelPasswordBtn')?.addEventListener('click', () => {
  resettingAccountIndex = null;
  document.getElementById('resetPasswordForm').style.display = 'none';
});

document.getElementById('savePasswordBtn')?.addEventListener('click', () => {
  if (resettingAccountIndex === null) return;
  const newPassword = document.getElementById('newPasswordInput').value.trim();
  if (!newPassword || newPassword.length < 6) return showToast("Password must be at least 6 characters");
  window.db.accounts[resettingAccountIndex].password = newPassword;
  resettingAccountIndex = null;
  document.getElementById('resetPasswordForm').style.display = 'none';
  showToast("Password successfully updated!");
});

function deleteAccount(index) {
  const acc = window.db.accounts[index];
  if (currentUser && acc.email === currentUser.email) {
    showToast("You cannot delete your own account.");
    return;
  }
  if (!confirm(`Are you sure you want to delete ${acc.firstName} ${acc.lastName}?`)) return;
  window.db.accounts.splice(index, 1);
  renderAccountsList();
}


// ============================================================
//  EMPLOYEES & DEPARTMENTS (unchanged from script.js)
// ============================================================
function renderEmployeesTable() {
  const tbody = document.getElementById('employeesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const employees = window.db?.employees || [];
  employees.forEach((e, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${e.email || ''}</td>
      <td>${e.role || ''}</td>
      <td>${e.department || ''}</td>
      <td>
        <button class="btn btn-outline-primary" onclick="showToast('Edit not implemented')">Edit</button>
        <button class="btn btn-outline-danger"  onclick="showToast('Delete not implemented')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('addEmployeeBtn')?.classList.toggle('d-none', !currentUser || currentUser.role !== 'admin');
}

document.getElementById('addEmployeeBtn')?.addEventListener('click',       () => toggle('addEmployeeForm', true));
document.getElementById('cancelNewEmployeeBtn')?.addEventListener('click', () => toggle('addEmployeeForm', false));

document.getElementById('saveNewEmployeeBtn')?.addEventListener('click', () => {
  const email      = document.getElementById('empEmail').value.trim().toLowerCase();
  const role       = document.getElementById('empRole').value;
  const department = document.getElementById('empDept').value;

  if (!email || !role || !department) return showToast("All fields required");
  if (window.db?.employees.some(e => e.email === email)) return showToast("Employee already exists");

  window.db?.employees.push({ email, role, department });
  renderEmployeesTable();
  document.getElementById('empEmail').value = '';
  document.getElementById('empRole').value  = 'staff';
  document.getElementById('empDept').value  = '';
  toggle('addEmployeeForm', false);
});

function renderDepartmentsTable() {
  const tbody = document.getElementById('departmentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const departments = window.db?.departments || [];
  departments.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.name}</td>
      <td>
        <button class="btn btn-outline-primary" onclick="showToast('Edit not implemented')">Edit</button>
        <button class="btn btn-outline-danger"  onclick="showToast('Delete not implemented')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('addDepartmentBtn')?.classList.toggle('d-none', !currentUser || currentUser.role !== 'admin');
}


// ============================================================
//  REQUESTS (unchanged from script.js)
// ============================================================
function renderRequestsTable() {
  if (!currentUser) return;
  const tbody = document.getElementById('userRequestsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const userIdentifier = currentUser.email || currentUser.username;
  const requests = window.db?.requests.filter(r => r.employeeEmail === userIdentifier) || [];

  if (!requests.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">No requests yet.</td></tr>`;
    return;
  }

  requests.forEach(r => {
    const itemsString = r.items ? r.items.map(i => `${i.name} (x${i.qty})`).join(", ") : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.type}</td>
      <td>${itemsString}</td>
      <td>${getStatusBadge(r.status)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdminRequests() {
  if (!currentUser || currentUser.role !== 'admin') return;
  const tbody    = document.getElementById('adminRequestsTableBody');
  const requests = window.db?.requests || [];
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!requests.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">No requests yet.</td></tr>`;
    return;
  }

  requests.forEach((r, i) => {
    const itemsString = r.items
      ? r.items.map(item => `${item.name} (x${item.qty})`).join(", ")
      : r.description || '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.employeeEmail}</td>
      <td>${r.type}</td>
      <td>${itemsString}</td>
      <td id="status-${i}">${getStatusBadge(r.status)}</td>
      <td></td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const newBtn    = document.getElementById('newRequestBtn');
  const form      = document.getElementById('newRequestForm');
  const cancelBtn = document.getElementById('cancelRequestBtn');
  const addItemBtn = document.getElementById('addItemBtn');
  const submitBtn = document.getElementById('submitRequestBtn');

  if (newBtn)    newBtn.addEventListener('click',    () => { if (form) form.style.display = 'block'; });
  if (cancelBtn) cancelBtn.addEventListener('click', () => { if (form) form.style.display = 'none';  });

  if (addItemBtn) addItemBtn.addEventListener('click', () => {
    const container = document.getElementById('requestItemsContainer');
    const div = document.createElement('div');
    div.classList.add('requestItem', 'mb-2', 'd-flex', 'gap-2', 'align-items-center');
    div.innerHTML = `
      <input type="text"   placeholder="Item Name" class="form-control itemName">
      <input type="number" placeholder="Qty"       class="form-control itemQty" min="1">
      <button type="button" class="btn btn-danger removeItemBtn">×</button>
    `;
    container?.appendChild(div);
    div.querySelector('.removeItemBtn').addEventListener('click', () => div.remove());
  });

  if (submitBtn) submitBtn.addEventListener('click', () => {
    const type      = document.getElementById('requestType').value;
    const itemsDivs = document.querySelectorAll('#requestItemsContainer .requestItem');
    const items     = [];

    itemsDivs.forEach(div => {
      const name = div.querySelector('.itemName').value.trim();
      const qty  = parseInt(div.querySelector('.itemQty').value);
      if (name && qty > 0) items.push({ name, qty });
    });

    if (!items.length) return showToast("Add at least one item.");

    const newRequest = {
      type,
      items,
      status: "Pending",
      date: new Date().toLocaleString(),
      employeeEmail: currentUser.email || currentUser.username
    };

    window.db?.requests.push(newRequest);
    if (form) form.style.display = 'none';
    renderRequestsTable();
  });
});


// ============================================================
//  UTILITIES (unchanged from script.js)
// ============================================================
function getStatusBadge(status) {
  if (status === "Pending")  return '<span style="color:orange;">Pending</span>';
  if (status === "Approved") return '<span style="color:green;">Approved</span>';
  if (status === "Rejected") return '<span style="color:red;">Rejected</span>';
  return status;
}

function showToast(message, type = 'primary') {
  const toastEl  = document.getElementById('appToast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toastEl || !toastMsg) return;

  toastEl.className    = `toast align-items-center text-bg-${type} border-0`;
  toastMsg.textContent = message;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}