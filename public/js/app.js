// منطق اصلی صفحه اصلی و پرداخت — متصل به بک‌اند

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupMobileMenu();
  await refreshSession();
  updateUIForAuth();
  renderTests();
});

function initTheme() {
  const saved = localStorage.getItem('azmunyar_theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('azmunyar_theme', isDark ? 'dark' : 'light');
}

function setupMobileMenu() {
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
  });
}

function renderTests(filter = 'all') {
  const grid = document.getElementById('tests-grid');
  if (!grid) return;

  let list = TESTS;
  if (filter === 'free') list = TESTS.filter(t => t.type === 'free');
  if (filter === 'premium') list = TESTS.filter(t => t.type === 'premium');

  const premium = hasPremium();

  grid.innerHTML = list.map(test => {
    const isPremium = test.type === 'premium';
    const locked = isPremium && !premium;

    return `
      <div class="test-card ${locked ? 'locked' : ''}" data-type="${test.type}">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${test.color} flex items-center justify-center text-2xl shadow-lg">
            ${test.icon}
          </div>
          <span class="${isPremium ? 'badge-premium' : 'badge-free'}">
            ${isPremium ? 'ویژه' : 'رایگان'}
          </span>
        </div>
        <h3 class="font-bold text-lg mb-1">${test.title}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${test.description}</p>
        <div class="flex items-center gap-3 text-xs text-slate-500 mb-5">
          <span class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">سطح ${test.level}</span>
          <span>${test.questionsCount} سوال</span>
          ${!isPremium ? `<span class="text-green-600 dark:text-green-400">${test.freeLimit} سوال رایگان</span>` : ''}
        </div>
        ${locked
          ? `<button onclick="requirePremium('${test.id}')" class="btn-secondary w-full text-sm py-2.5 flex items-center justify-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
               نیاز به اشتراک
             </button>`
          : `<a href="pages/quiz.html?id=${test.id}" class="btn-primary w-full text-sm py-2.5 text-center block">شروع آزمون</a>`
        }
      </div>
    `;
  }).join('');
}

function filterTests(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTests(filter);
}

function requirePremium(testId) {
  if (!isLoggedIn()) {
    openModal('login');
    showToast('برای خرید اشتراک ابتدا وارد شوید', 'info');
    return;
  }
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  showToast('برای دسترسی به این آزمون، یکی از اشتراک‌ها را فعال کنید', 'info');
}

// ─── Payment (Real Backend) ───

async function startPayment(planKey) {
  if (!isLoggedIn()) {
    openModal('login');
    showToast('برای خرید اشتراک ابتدا وارد شوید', 'info');
    return;
  }

  const plan = PLANS[planKey];
  if (!plan) return;

  // نمایش مودال با وضعیت در حال ساخت لینک
  const modal = document.getElementById('payment-modal');
  document.getElementById('pay-plan-name').textContent = plan.name;
  document.getElementById('pay-amount').textContent = plan.price.toLocaleString('fa-IR') + ' تومان';
  document.getElementById('pay-order-id').textContent = 'در حال آماده‌سازی...';
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // دکمه پرداخت را موقتاً غیرفعال کن
  const payBtn = modal.querySelector('button[onclick="confirmPayment()"]');
  if (payBtn) {
    payBtn.disabled = true;
    payBtn.innerHTML = 'در حال اتصال به درگاه...';
  }

  try {
    const data = await apiRequestPayment(planKey);
    document.getElementById('pay-order-id').textContent = data.authority.slice(0, 16) + '...';

    // ذخیره لینک برای دکمه تأیید
    window._pendingPaymentUrl = data.payment_url;
    window._pendingPlan = planKey;
    window._isMockPayment = data.mock;

    if (payBtn) {
      payBtn.disabled = false;
      payBtn.innerHTML = data.mock
        ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> ادامه به درگاه آزمایشی`
        : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> پرداخت امن با زرین‌پال`;
    }
  } catch (err) {
    showToast(err.message || 'خطا در ایجاد درخواست پرداخت', 'error');
    closePaymentModal();
  }
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  window._pendingPaymentUrl = null;
  window._pendingPlan = null;
}

function confirmPayment() {
  const url = window._pendingPaymentUrl;
  if (!url) {
    showToast('لینک پرداخت آماده نیست', 'error');
    return;
  }
  // هدایت به درگاه (واقعی یا شبیه‌سازی)
  window.location.href = url;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const colors = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 dark:bg-slate-700 text-white'
  };

  toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-slide-up ${colors[type] || colors.info}`;
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}
