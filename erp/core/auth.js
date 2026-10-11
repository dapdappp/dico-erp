/* ============================================================
   DICO ERP - Authentication & Session Management
   ============================================================ */

let currentUser = null;

// Handle Login Form Submit
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');

  try {
    const response = await fetch('api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    });

    const data = await response.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      showDashboard();
    } else {
      errorEl.textContent = data.message || 'Login gagal';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Koneksi server gagal';
    errorEl.style.display = 'block';
    console.error(err);
  }
}

// Show Dashboard After Login
function showDashboard() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('erpLayout').classList.add('active');
  
  // Update topbar user info
  const user = getCurrentUser();
  document.getElementById('userName').textContent = user.nama;
  document.getElementById('userAvatar').textContent = user.nama.charAt(0).toUpperCase();
  
  // Build sidebar navigation
  buildSidebar();
  
  // Init router
  initRouter();
}

// Get Current User
function getCurrentUser() {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem('user');
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  return null;
}

// Check if User Has Role
function hasRole(allowedRoles) {
  const user = getCurrentUser();
  if (!user) return false;
  return allowedRoles.includes(user.role_name);
}

// Logout
async function logout() {
  try {
    await fetch('api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=logout'
    });
  } catch (err) {
    console.error(err);
  }
  
  currentUser = null;
  localStorage.removeItem('user');
  document.getElementById('erpLayout').classList.remove('active');
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginForm').reset();
}

// Check Session on Page Load
window.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (user) {
    showDashboard();
  }
});
