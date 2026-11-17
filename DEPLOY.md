# راهنمای استقرار آزمون‌یار روی Cloudflare Workers

این پوشه (`cf-worker`) آماده دیپلوی روی کلادفلر است:
- فرانت‌اند استاتیک
- API روی Worker
- دیتابیس D1 (SQLite ابری)
- پرداخت زرین‌پال (واقعی یا شبیه‌سازی)

---

## پیش‌نیاز

1. حساب [Cloudflare](https://dash.cloudflare.com)
2. نصب Node.js (نسخه ۱۸ یا بالاتر)
3. نصب Wrangler:

```bash
npm install -g wrangler
```

ورود به حساب:

```bash
wrangler login
```

---

## مراحل استقرار (گام‌به‌گام)

### ۱) برو داخل پوشه پروژه

```bash
cd cf-worker
npm install
```

### ۲) ساخت دیتابیس D1

```bash
npx wrangler d1 create azmunyar-db
```

خروجی چیزی شبیه این است:

```
[[d1_databases]]
binding = "DB"
database_name = "azmunyar-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**همان `database_id` را کپی کن** و داخل فایل `wrangler.toml` به‌جای  
`REPLACE_WITH_YOUR_D1_DATABASE_ID` بگذار.

### ۳) اجرای Migration (ساخت جدول‌ها)

لوکال (برای تست):

```bash
npx wrangler d1 execute azmunyar-db --local --file=./migrations/0001_init.sql
```

روی کلادفلر (remote):

```bash
npx wrangler d1 execute azmunyar-db --remote --file=./migrations/0001_init.sql
```

### ۴) تنظیم اسرار (Secrets)

```bash
npx wrangler secret put JWT_SECRET
# یک رشته تصادفی بلند وارد کن (مثلاً از password generator)

npx wrangler secret put ZARINPAL_MERCHANT_ID
# اگر هنوز Merchant نداری، همین را بزن:
# xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# در این حالت درگاه شبیه‌سازی می‌شود
```

### ۵) تست محلی (اختیاری)

```bash
cp .dev.vars.example .dev.vars
# در صورت نیاز .dev.vars را ویرایش کن

npx wrangler d1 execute azmunyar-db --local --file=./migrations/0001_init.sql
npx wrangler dev
```

آدرس معمولاً: `http://127.0.0.1:8787`

### ۶) دیپلوی نهایی

```bash
npx wrangler deploy
```

بعد از موفقیت، آدرسی مثل این می‌گیری:

```
https://azmunyar.<your-subdomain>.workers.dev
```

همین لینک را باز کن — هم سایت و هم API روی یک دامنه هستند.

---

## اتصال دامنه اختصاصی (اختیاری)

در داشبورد کلادفلر:

1. Workers & Pages → worker با نام `azmunyar`
2. Settings → Domains & Routes → Add Custom Domain
3. دامنه خودت را اضافه کن (باید DNS روی کلادفلر باشد)

---

## زرین‌پال واقعی

1. Merchant ID از پنل زرین‌پال بگیر
2. دوباره secret را ست کن:

```bash
npx wrangler secret put ZARINPAL_MERCHANT_ID
```

3. در `wrangler.toml` اگر خواستی سندباکس را خاموش کنی:

```toml
[vars]
ZARINPAL_SANDBOX = "false"
```

و دوباره `npx wrangler deploy`

> **مهم:** در پنل زرین‌پال، آدرس callback باید به  
> `https://دامنه-تو/api/payment/callback`  
> اشاره کند (خود Worker این آدرس را موقع ساخت تراکنش می‌فرستد).

---

## به‌روزرسانی بعدی

بعد از هر تغییر در کد:

```bash
npx wrangler deploy
```

اگر schema دیتابیس عوض شد، migration جدید بساز و با `--remote` اجرا کن.

---

## عیب‌یابی سریع

| مشکل | کار |
|------|-----|
| `database_id` اشتباه | خروجی `d1 create` را دوباره در `wrangler.toml` بگذار |
| خطای جدول وجود ندارد | migration را با `--remote` دوباره اجرا کن |
| پرداخت کار نمی‌کند | `ZARINPAL_MERCHANT_ID` را چک کن؛ با `xxxx` شبیه‌سازی است |
| CORS / API 404 | مطمئن شو مسیرها با `/api/` شروع می‌شوند |
| لاگ‌ها | `npx wrangler tail` |

---

## ساختار فایل‌ها

```
cf-worker/
├── package.json
├── wrangler.toml          ← تنظیمات Worker + D1 + Assets
├── migrations/
│   └── 0001_init.sql      ← اسکیما دیتابیس
├── src/
│   └── index.js           ← کل API (auth, payment, results)
├── public/                ← فرانت‌اند (همان سایت)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── pages/
├── .dev.vars.example
└── DEPLOY.md              ← همین راهنما
```

موفق باشی 🚀
