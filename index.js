/**
 * آزمون‌یار — Cloudflare Worker
 * API + Static Assets + D1 + Zarinpal
 */

const PLANS = {
  monthly: { name: "اشتراک ماهانه", price: 149000, days: 30 },
  quarterly: { name: "اشتراک سه‌ماهه", price: 379000, days: 90 },
  yearly: { name: "اشتراک سالانه", price: 999000, days: 365 },
};

// ──────────────────── Crypto / Auth helpers ────────────────────

function bytesToBase64Url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Simple salted hash (Workers-compatible, no bcrypt) */
async function hashPassword(password) {
  const salt = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const h = await sha256(salt + ":" + password);
  return `sha256$${salt}$${h}`;
}

async function verifyPassword(stored, password) {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "sha256") return false;
  const h = await sha256(parts[1] + ":" + password);
  return h === parts[2];
}

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToBase64Url(new Uint8Array(sig));
}

async function createToken(secret, userId, email) {
  const header = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const exp = Math.floor(Date.now() / 1000) + 72 * 3600;
  const payload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify({ sub: userId, email, exp, iat: Math.floor(Date.now() / 1000) }))
  );
  const sig = await hmacSign(secret, `${header}.${payload}`);
  return `${header}.${payload}.${sig}`;
}

async function verifyToken(secret, token) {
  try {
    const [header, payload, sig] = token.split(".");
    if (!header || !payload || !sig) return null;
    const expected = await hmacSign(secret, `${header}.${payload}`);
    if (expected !== sig) return null;
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

// ──────────────────── Response helpers ────────────────────

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      ...extraHeaders,
    },
  });
}

function error(msg, status = 400, extra = {}) {
  return json({ error: msg, ...extra }, status);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function getBearer(request) {
  const h = request.headers.get("Authorization") || "";
  if (h.startsWith("Bearer ")) return h.slice(7);
  return null;
}

async function requireUser(request, env) {
  const token = getBearer(request);
  if (!token) return { err: error("توکن احراز هویت لازم است", 401) };
  const secret = env.JWT_SECRET || "azmunyar-dev-secret-change-me";
  const payload = await verifyToken(secret, token);
  if (!payload) return { err: error("توکن نامعتبر یا منقضی شده است", 401) };
  const user = await env.DB.prepare(
    "SELECT id, name, email, created_at FROM users WHERE id = ?"
  )
    .bind(payload.sub)
    .first();
  if (!user) return { err: error("کاربر یافت نشد", 401) };
  return { user };
}

async function getActiveSubscription(db, userId) {
  return db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE user_id = ? AND datetime(expires_at) > datetime('now')
       ORDER BY expires_at DESC LIMIT 1`
    )
    .bind(userId)
    .first();
}

function originFrom(request, env) {
  if (env.FRONTEND_URL) return env.FRONTEND_URL.replace(/\/$/, "");
  const u = new URL(request.url);
  return u.origin;
}

function isMockMerchant(merchantId) {
  if (!merchantId) return true;
  return merchantId.startsWith("xxxx") || merchantId === "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
}

// ──────────────────── API Routes ────────────────────

async function handleApi(request, env, path) {
  const method = request.method;

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Health
  if (path === "/api/health" && method === "GET") {
    return json({
      status: "ok",
      platform: "cloudflare-workers",
      sandbox: env.ZARINPAL_SANDBOX !== "false",
      mock_payment: isMockMerchant(env.ZARINPAL_MERCHANT_ID),
    });
  }

  // Plans
  if (path === "/api/plans" && method === "GET") {
    return json(PLANS);
  }

  // ── Register ──
  if (path === "/api/auth/register" && method === "POST") {
    const body = await readJson(request);
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!name || !email || !password) return error("نام، ایمیل و رمز عبور الزامی است");
    if (password.length < 6) return error("رمز عبور باید حداقل ۶ کاراکتر باشد");
    if (!email.includes("@")) return error("ایمیل نامعتبر است");

    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) return error("این ایمیل قبلاً ثبت شده است", 409);

    const password_hash = await hashPassword(password);
    const result = await env.DB.prepare(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id, name, email, created_at"
    )
      .bind(name, email, password_hash)
      .first();

    const secret = env.JWT_SECRET || "azmunyar-dev-secret-change-me";
    const token = await createToken(secret, result.id, result.email);
    return json({ token, user: result, subscription: null }, 201);
  }

  // ── Login ──
  if (path === "/api/auth/login" && method === "POST") {
    const body = await readJson(request);
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const row = await env.DB.prepare(
      "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (!row || !(await verifyPassword(row.password_hash, password))) {
      return error("ایمیل یا رمز عبور اشتباه است", 401);
    }

    const user = { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
    const secret = env.JWT_SECRET || "azmunyar-dev-secret-change-me";
    const token = await createToken(secret, user.id, user.email);
    const sub = await getActiveSubscription(env.DB, user.id);
    return json({ token, user, subscription: sub || null });
  }

  // ── Me ──
  if (path === "/api/auth/me" && method === "GET") {
    const { user, err } = await requireUser(request, env);
    if (err) return err;
    const sub = await getActiveSubscription(env.DB, user.id);
    return json({ user, subscription: sub || null, has_premium: !!sub });
  }

  // ── Payment request ──
  if (path === "/api/payment/request" && method === "POST") {
    const { user, err } = await requireUser(request, env);
    if (err) return err;

    const body = await readJson(request);
    const planKey = body.plan;
    if (!PLANS[planKey]) return error("پلن نامعتبر است");

    const plan = PLANS[planKey];
    const amount = plan.price;
    const merchantId = env.ZARINPAL_MERCHANT_ID || "";
    const origin = originFrom(request, env);

    if (isMockMerchant(merchantId)) {
      const authority = "MOCK" + [...crypto.getRandomValues(new Uint8Array(16))]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

      await env.DB.prepare(
        "INSERT INTO payments (user_id, plan, amount, authority, status) VALUES (?, ?, ?, ?, 'pending')"
      )
        .bind(user.id, planKey, amount, authority)
        .run();

      const payment_url = `${origin}/api/payment/mock-gateway?authority=${authority}&plan=${planKey}`;
      return json({ authority, payment_url, amount, plan: planKey, mock: true });
    }

    // Real Zarinpal
    const sandbox = env.ZARINPAL_SANDBOX !== "false";
    const requestUrl = sandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
      : "https://api.zarinpal.com/pg/v4/payment/request.json";
    const startPayBase = sandbox
      ? "https://sandbox.zarinpal.com/pg/StartPay/"
      : "https://www.zarinpal.com/pg/StartPay/";

    const callback_url = `${origin}/api/payment/callback`;
    const payload = {
      merchant_id: merchantId,
      amount: amount * 10, // rial
      callback_url,
      description: `خرید ${plan.name} - آزمون‌یار`,
      metadata: { email: user.email, plan: planKey },
    };

    let result;
    try {
      const resp = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      result = await resp.json();
    } catch (e) {
      return error("خطا در ارتباط با درگاه: " + e.message, 502);
    }

    if (result?.data?.code !== 100) {
      return error("خطای درگاه پرداخت", 400, { details: result?.errors || result?.data });
    }

    const authority = result.data.authority;
    await env.DB.prepare(
      "INSERT INTO payments (user_id, plan, amount, authority, status) VALUES (?, ?, ?, ?, 'pending')"
    )
      .bind(user.id, planKey, amount, authority)
      .run();

    return json({
      authority,
      payment_url: startPayBase + authority,
      amount,
      plan: planKey,
      mock: false,
    });
  }

  // ── Mock gateway page ──
  if (path === "/api/payment/mock-gateway" && method === "GET") {
    const url = new URL(request.url);
    const authority = url.searchParams.get("authority") || "";
    const origin = originFrom(request, env);
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>درگاه شبیه‌سازی زرین‌پال</title>
  <style>
    body{font-family:Tahoma,sans-serif;background:#f0f4f8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:#fff;border-radius:16px;padding:40px;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,.1);text-align:center}
    h1{color:#0d9488;margin-bottom:8px;font-size:1.4rem}
    p{color:#64748b;font-size:.9rem}
    .btn{display:inline-block;margin:8px;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;color:#fff}
    .ok{background:#10b981}.no{background:#ef4444}
    code{font-size:.75rem;word-break:break-all}
  </style>
</head>
<body>
  <div class="card">
    <h1>درگاه پرداخت آزمایشی</h1>
    <p>شبیه‌سازی زرین‌پال روی Cloudflare Workers<br><code>${authority}</code></p>
    <a class="btn ok" href="${origin}/api/payment/callback?Authority=${encodeURIComponent(authority)}&Status=OK">پرداخت موفق ✓</a>
    <a class="btn no" href="${origin}/api/payment/callback?Authority=${encodeURIComponent(authority)}&Status=NOK">انصراف</a>
  </div>
</body>
</html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // ── Payment callback ──
  if (path === "/api/payment/callback" && method === "GET") {
    const url = new URL(request.url);
    const authority = url.searchParams.get("Authority") || url.searchParams.get("authority");
    const status = url.searchParams.get("Status") || url.searchParams.get("status");
    const origin = originFrom(request, env);
    const dash = `${origin}/pages/dashboard.html`;

    if (!authority) {
      return Response.redirect(`${dash}?payment=error&msg=missing_authority`, 302);
    }

    const payment = await env.DB.prepare("SELECT * FROM payments WHERE authority = ?")
      .bind(authority)
      .first();

    if (!payment) {
      return Response.redirect(`${dash}?payment=error&msg=not_found`, 302);
    }

    if (status !== "OK") {
      await env.DB.prepare("UPDATE payments SET status = 'failed' WHERE authority = ?")
        .bind(authority)
        .run();
      return Response.redirect(`${dash}?payment=cancelled`, 302);
    }

    if (payment.status === "verified") {
      return Response.redirect(`${dash}?payment=success`, 302);
    }

    let ref_id = null;
    const isMock = authority.startsWith("MOCK");
    const merchantId = env.ZARINPAL_MERCHANT_ID || "";

    if (isMock) {
      ref_id = "MOCK-" + authority.slice(-8);
    } else {
      const sandbox = env.ZARINPAL_SANDBOX !== "false";
      const verifyUrl = sandbox
        ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
        : "https://api.zarinpal.com/pg/v4/payment/verify.json";

      try {
        const resp = await fetch(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant_id: merchantId,
            amount: payment.amount * 10,
            authority,
          }),
        });
        const result = await resp.json();
        const code = result?.data?.code;
        if (code !== 100 && code !== 101) {
          await env.DB.prepare("UPDATE payments SET status = 'failed' WHERE authority = ?")
            .bind(authority)
            .run();
          return Response.redirect(`${dash}?payment=error&msg=verify_failed`, 302);
        }
        ref_id = String(result.data.ref_id || "");
      } catch {
        return Response.redirect(`${dash}?payment=error&msg=verify_exception`, 302);
      }
    }

    const planKey = payment.plan;
    const plan = PLANS[planKey];
    if (!plan) return Response.redirect(`${dash}?payment=error&msg=bad_plan`, 302);

    const now = new Date();
    const expires = new Date(now.getTime() + plan.days * 86400000);

    await env.DB.prepare(
      "UPDATE payments SET status = 'verified', ref_id = ?, verified_at = datetime('now') WHERE authority = ?"
    )
      .bind(ref_id, authority)
      .run();

    await env.DB.prepare(
      `INSERT INTO subscriptions (user_id, plan, plan_name, price, activated_at, expires_at, authority, ref_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        payment.user_id,
        planKey,
        plan.name,
        plan.price,
        now.toISOString(),
        expires.toISOString(),
        authority,
        ref_id
      )
      .run();

    return Response.redirect(`${dash}?payment=success&ref=${encodeURIComponent(ref_id || "")}`, 302);
  }

  // ── Subscription ──
  if (path === "/api/subscription" && method === "GET") {
    const { user, err } = await requireUser(request, env);
    if (err) return err;
    const sub = await getActiveSubscription(env.DB, user.id);
    if (!sub) return json({ active: false, subscription: null });
    const expires = new Date(sub.expires_at);
    const days_left = Math.max(0, Math.ceil((expires - new Date()) / 86400000));
    return json({ active: true, subscription: sub, days_left });
  }

  // ── Results POST ──
  if (path === "/api/results" && method === "POST") {
    const { user, err } = await requireUser(request, env);
    if (err) return err;
    const body = await readJson(request);
    const test_id = body.test_id;
    const score = body.score;
    const total = body.total;
    if (!test_id || score == null || total == null) return error("داده‌های ناقص");
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    await env.DB.prepare(
      "INSERT INTO test_results (user_id, test_id, score, total, percent) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(user.id, test_id, score, total, percent)
      .run();
    return json({ ok: true, percent }, 201);
  }

  // ── Results GET ──
  if (path === "/api/results" && method === "GET") {
    const { user, err } = await requireUser(request, env);
    if (err) return err;
    const { results } = await env.DB.prepare(
      `SELECT test_id, score, total, percent, created_at
       FROM test_results WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`
    )
      .bind(user.id)
      .all();
    return json(results || []);
  }

  // ── Stats ──
  if (path === "/api/stats" && method === "GET") {
    const { user, err } = await requireUser(request, env);
    if (err) return err;
    const { results } = await env.DB.prepare(
      "SELECT percent FROM test_results WHERE user_id = ?"
    )
      .bind(user.id)
      .all();
    if (!results || !results.length) return json({ count: 0, avg: 0, best: 0 });
    const percents = results.map((r) => r.percent);
    return json({
      count: percents.length,
      avg: Math.round(percents.reduce((a, b) => a + b, 0) / percents.length),
      best: Math.max(...percents),
    });
  }

  return error("مسیر یافت نشد", 404);
}

// ──────────────────── Main handler ────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API routes
    if (path.startsWith("/api/")) {
      try {
        return await handleApi(request, env, path);
      } catch (e) {
        console.error(e);
        return error("خطای داخلی سرور: " + (e.message || String(e)), 500);
      }
    }

    // Static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Assets binding missing", { status: 500 });
  },
};
