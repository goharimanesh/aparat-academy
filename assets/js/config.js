/* =====================================================================
   تنظیمات سایت — این فایل را با خیال راحت ویرایش کنید.
   Powered by Dr. Masoud Goharimanesh
   ===================================================================== */
window.ACADEMY_CONFIG = {
  // نام کاربری کانال آپارات
  channel: "goharimanesh",

  // عنوان‌ها
  siteTitle: "آکادمی ویدیویی گوهری‌منش",
  siteTitleEn: "Goharimanesh Video Academy",
  owner: "دکتر مسعود گوهری‌منش",
  ownerEn: "Dr. Masoud Goharimanesh",
  affiliation: "دانشیار گروه مهندسی مکانیک، دانشگاه تربت حیدریه",

  // پربازدیدها: چند ویدیو در صفحهٔ پربازدیدها نشان داده شود و حداقل بازدید برای نشان «پربازدید»
  popularCount: 60,
  hotBadgeTop: 40,

  // تعداد ویدیوهای بخش «تازه‌ها» در صفحهٔ اصلی
  latestCount: 7,

  // فید زنده: هنگام باز شدن سایت، آخرین ویدیوهای کانال مستقیماً از آپارات خوانده می‌شود.
  // اگر مرورگر اجازه ندهد (CORS)، سایت بی‌صدا از data/videos.json استفاده می‌کند
  // که هر ۶ ساعت با GitHub Actions به‌روز می‌شود.
  liveFeed: true,
  liveFeedUrl: "https://www.aparat.com/etc/api/videoByUser/username/goharimanesh/perpage/20",

  // آدرس نهایی سایت روی GitHub Pages (برای QR کدهایی که به صفحهٔ همین سایت اشاره می‌کنند)
  // مثال: "https://USERNAME.github.io/aparat-academy/"  — خالی بماند تا خودکار تشخیص داده شود.
  siteUrl: "",

  // صداها به‌طور پیش‌فرض روشن باشند؟
  soundDefault: true,

  links: {
    aparat: "https://www.aparat.com/goharimanesh",
    university: "https://www.torbath.ac.ir/"
  }
};
