// سیستم احراز هویت — متصل به بک‌اند واقعی

const USER_CACHE_KEY = 'azmunyar_user_cache';

function getUser() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheUser(user, subscription = null) {
  const data = { ...user, subscription };
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
}

function isLoggedIn() {
  return !!getToken() && !!getUser();
}

function hasPremium() {
  const user = getUser();
  if (!user || !user.subscription) return false;
  try {
    return new Date(user.subscription.expires_at) > new Date();
  } catch {
    return false;
  }
}

function getSubscriptionInfo() {
  const user = getUser();
  if (!user || !user.subscription) return null;
  const exp = new Date(user.subscription.expires_at);
  if (exp <= new Date()) return { active: false, plan: user.subscription.plan };
  const daysLeft = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
  return {
    active: true,
    plan: user.subscription.plan,
    planName: user.subscription.plan_name,
    expiresAt: exp,
    daysLeft,
  };
}

async function register(name, email, password) {
  const data = await apiRegister(name, email, password);
  cacheUser(data.user, data.subscription);
  return data.user;
}

async function login(email, password) {
  const data = await apiLogin(email, password);
  cacheUser(data.user, data.subscription);
  return data.user;
}

function logout() {
  apiLogout();
  updateUIForAuth();
  showToast('با موفقیت خارج شدید', 'info');
  const path = window.location.pathname;
  if (path.includes('dashboard') || path.includes('quiz')) {
    window.location.href = path.includes('/pages/') ? '../index.html' : 'index.html';
  }
}

async function refreshSession() {
  if (!getToken()) return null;
  try {
    const data = await apiMe();
    cacheUser(data.user, data.subscription);
    return data;
  } catch (err) {
    if (err.status === 401) {
      apiLogout();
      updateUIForAuth();
    }
    return null;
  }
}

async function recordTestResult(testId, score, total) {
  if (!isLoggedIn()) return;
  try {
    await apiSaveResult(testId, score, total);
  } catch (e) {
    console.warn('Failed to save result:', e);
  }
}

function updateUIForAuth() {
  const user = getUser();
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const navDashboard = document.getElementById('nav-dashboard');
  const mobileDashboard = document.getElementById('mobile-dashboard');

  if (user && getToken()) {
    if (authButtons) authButtons.classList.add('hidden');
    if (userMenu) {
      userMenu.classList.remove('hidden');
      const avatar = document.getElementById('user-avatar');
      const nameEl = document.getElementById('user-name');
      if (avatar) avatar.textContent = (user.name || '?').charAt(0);
      if (nameEl) nameEl.textContent = user.name;
    }
    if (navDashboard) navDashboard.style.display = '';
    if (mobileDashboard) mobileDashboard.style.display = '';
  } else {
    if (authButtons) authButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
    if (navDashboard) navDashboard.style.display = 'none';
    if (mobileDashboard) mobileDashboard.style.display = 'none';
  }
}

function openModal(type) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  switchAuth(type);
}

function closeModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function switchAuth(type) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  if (type === 'login') {
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
  } else {
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button[type=submit]');
  if (btn) { btn.disabled = true; btn.textContent = 'در حال ورود...'; }
  try {
    await login(email, password);
    closeModal();
    updateUIForAuth();
    showToast('خوش آمدید!', 'success');
    if (typeof renderTests === 'function') renderTests();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'ورود'; }
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn = e.target.querySelector('button[type=submit]');
  if (btn) { btn.disabled = true; btn.textContent = 'در حال ثبت‌نام...'; }
  try {
    await register(name, email, password);
    closeModal();
    updateUIForAuth();
    showToast('حساب شما با موفقیت ساخته شد', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'ثبت‌نام'; }
  }
}

function toggleUserDropdown() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-menu');
  const dd = document.getElementById('user-dropdown');
  if (menu && dd && !menu.contains(e.target)) {
    dd.classList.add('hidden');
  }
});
