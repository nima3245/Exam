// کلاینت API برای ارتباط با بک‌اند

const API_BASE = window.AZMUNYAR_API || '/api';

function getToken() {
  return localStorage.getItem('azmunyar_token');
}

function setToken(token) {
  if (token) localStorage.setItem('azmunyar_token', token);
  else localStorage.removeItem('azmunyar_token');
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.error || `خطای سرور (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Auth
async function apiRegister(name, email, password) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setToken(data.token);
  return data;
}

async function apiLogin(email, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

async function apiMe() {
  return api('/auth/me');
}

function apiLogout() {
  setToken(null);
  localStorage.removeItem('azmunyar_user_cache');
}

// Payment
async function apiRequestPayment(plan) {
  return api('/payment/request', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

async function apiGetSubscription() {
  return api('/subscription');
}

// Results
async function apiSaveResult(testId, score, total) {
  return api('/results', {
    method: 'POST',
    body: JSON.stringify({ test_id: testId, score, total }),
  });
}

async function apiGetResults() {
  return api('/results');
}

async function apiGetStats() {
  return api('/stats');
}
