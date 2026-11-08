# آکادمی ویدیویی گوهری‌منش

سایت تعاملی آرشیو آموزش‌های ویدیویی کانال آپارات [goharimanesh](https://www.aparat.com/goharimanesh)، ساخته‌شده برای GitHub Pages.

**Powered by Dr. Masoud Goharimanesh**

## امکانات

- **۷۴۹ آموزش** در **۱۶ دستهٔ اصلی**؛ هر ویدیو دقیقاً در یک دسته قرار دارد.
- **پربازدیدترین‌ها** به‌عنوان یک بخش جداگانه، با سکوی سه‌نفرهٔ اول و فیلتر بر اساس دسته.
- **۴۹ سری آموزشی** (دوره‌های چندقسمتی) با پخش‌کنندهٔ قسمت قبلی/بعدی.
- **فید زنده**: آخرین ویدیوهای کانال هنگام باز شدن سایت از آپارات خوانده می‌شوند، و **GitHub Actions** هر ۶ ساعت ویدیوهای جدید را دریافت، دسته‌بندی و ذخیره می‌کند.
- **پخش در همین صفحه** با iframe آپارات داخل قاب متحرک، به‌همراه حالت سینما.
- **QR کد برای هر آموزش**: انتخاب مقصد (آپارات یا صفحهٔ همین سایت)، دانلود کارت QR آمادهٔ چاپ، و صفحهٔ «کارت‌های QR» برای چاپ یک دسته یا سری کامل.
- اسیلوسکوپ زندهٔ **سری فوریه** در صفحهٔ اول، بلوک‌های شناور، کاشی‌های سه‌بعدی و **افکت‌های صوتی** (قابل خاموش کردن).
- جستجوی سریع با کلید `/` یا `Ctrl+K`، نشان کردن آموزش‌ها، تاریخچهٔ تماشا، پوستهٔ روشن و تیره، و سازگاری با موبایل.

## راه‌اندازی روی GitHub Pages

```bash
git init
git add .
git commit -m "first version of the video academy"
git branch -M main
git remote add origin https://github.com/<USERNAME>/aparat-academy.git
git push -u origin main
```

سپس در GitHub:

1. **Settings → Pages**: گزینهٔ Source را روی `Deploy from a branch` بگذارید، شاخه را `main` و پوشه را `/ (root)` انتخاب کنید.
2. **Settings → Actions → General → Workflow permissions**: گزینهٔ **Read and write permissions** را فعال کنید تا ربات بتواند ویدیوهای جدید را commit کند.
3. **Actions → Sync Aparat videos → Run workflow**: بار اول با تیک `full` اجرا کنید تا پوستر همهٔ ویدیوها و بازدیدها از آپارات دریافت شود.
4. در `assets/js/config.js` مقدار `siteUrl` را آدرس نهایی سایت بگذارید، مثلاً `https://<USERNAME>.github.io/aparat-academy/`.

## اجرای محلی

```bash
python -m http.server 8000
# سپس در مرورگر: http://localhost:8000
```

(اگر `index.html` را مستقیماً با دوبار کلیک باز کنید، مرورگر اجازهٔ خواندن فایل‌های داده را نمی‌دهد.)

## ساختار پوشه‌ها

```
index.html                 صفحهٔ اصلی (برنامهٔ تک‌صفحه‌ای)
assets/css/style.css       ظاهر سایت
assets/js/config.js        تنظیمات: نام کانال، تعداد پربازدیدها، آدرس سایت و …
assets/js/app.js           منطق سایت
assets/js/vendor/qrcode.js کتابخانهٔ QR (MIT، بدون نیاز به اینترنت)
data/videos.json           فهرست ویدیوها (خودکار ساخته می‌شود؛ دستی ویرایش نکنید)
data/categories.json       دسته‌ها و کلیدواژه‌هایشان
data/series.json           قواعد سری‌های آموزشی
data/overrides.json        تعیین دستی دستهٔ یک ویدیو
scripts/aparat_sync.py     ابزار همگام‌سازی با آپارات
images/                    تصاویر سایت (پرامپت‌ها در images/PROMPTS.md)
.github/workflows/         همگام‌سازی خودکار هر ۶ ساعت
```

## کارهای رایج با Git

**یک ویدیو در دستهٔ اشتباه است:** UID ویدیو (بخش آخر لینک آپارات، مثلاً `vkcew3q`) را در `data/overrides.json` بنویسید:

```json
{ "vkcew3q": "ai" }
```

**کلیدواژهٔ یک دسته را تغییر دهید یا دستهٔ جدید بسازید:** فایل `data/categories.json` را ویرایش کنید. کلیدواژه‌ها در عنوان (وزن ۳) و برچسب‌ها (وزن ۱) جستجو می‌شوند و دسته‌ای که بیشترین امتیاز را بگیرد برنده است. برای کلیدواژهٔ قوی‌تر بنویسید `["کلمه", 5]`. کلیدواژه‌های سه‌حرفی یا کوتاه‌تر فقط وقتی حساب می‌شوند که کلمهٔ کامل باشند؛ مثلاً «قاب» درون «مقابل» شمرده نمی‌شود. اگر دستهٔ جدیدی ساختید، تصویر `images/cat-<id>.webp` را هم برایش اضافه کنید.

**سری آموزشی جدید:** یک قاعده به `data/series.json` اضافه کنید.

**بعد از هر تغییر در این سه فایل:**

```bash
python scripts/aparat_sync.py classify
git add data && git commit -m "update categories" && git push
```

**همگام‌سازی دستی** (اگر GitHub به آپارات دسترسی نداشت، از رایانهٔ خودتان در ایران اجرا کنید):

```bash
python scripts/aparat_sync.py sync          # فقط ویدیوهای جدید و بازدیدها
python scripts/aparat_sync.py sync --full   # پیمایش کامل کانال
git add data/videos.json && git commit -m "sync" && git push
```

**ساختن دوبارهٔ همه‌چیز از فایل اکسل:**

```bash
pip install openpyxl
python scripts/aparat_sync.py import-xlsx goharimanesh_videos.xlsx
```

## مسیرهای سایت

| آدرس | صفحه |
|---|---|
| `#` | خانه |
| `#c-math` | یک دسته |
| `#v-vkcew3q` | صفحهٔ یک آموزش |
| `#popular` | پربازدیدترین‌ها |
| `#latest` | تازه‌ها و مرور زمانی |
| `#series` و `#s-fourier` | سری‌ها و یک سری |
| `#qr`، `#qr-c-math` و `#qr-s-fourier` | کارت‌های QR |
| `#saved` | نشان‌شده‌ها |
| `#search` | جستجو |
