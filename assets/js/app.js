/* =====================================================================
   Goharimanesh Video Academy — app.js
   Powered by Dr. Masoud Goharimanesh
   Hash routes: #  #c-<cat>  #v-<uid>  #series  #s-<id>  #popular  #latest
                #saved  #search  #qr  #qr-c-<cat>  #qr-s-<id>
   ===================================================================== */
(function () {
  "use strict";

  const CFG = Object.assign({
    channel: "goharimanesh", siteTitle: "آکادمی ویدیویی", popularCount: 60, hotBadgeTop: 40,
    latestCount: 7, liveFeed: true, liveFeedUrl: "", siteUrl: "", soundDefault: true, links: {}
  }, window.ACADEMY_CONFIG || {});

  /* ------------------------------------------------------------ utils */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const FA = "۰۱۲۳۴۵۶۷۸۹";
  const fa = (x) => String(x).replace(/\d/g, (d) => FA[d]).replace(/\./g, "٫");
  const nf = new Intl.NumberFormat("fa-IR");
  const num = (n) => nf.format(n || 0);
  const compact = (n) => {
    n = n || 0;
    if (n >= 1e6) return fa((n / 1e6).toFixed(1).replace(/\.0$/, "")) + " میلیون";
    if (n >= 1e3) return fa((n / 1e3).toFixed(1).replace(/\.0$/, "")) + " هزار";
    return fa(n);
  };
  const pad = (n) => String(n).padStart(2, "0");
  const dur = (s) => {
    s = Math.max(0, Math.round(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return fa(h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`);
  };
  const hoursOf = (s) => (s / 3600 >= 10 ? fa(Math.round(s / 3600)) : fa((s / 3600).toFixed(1).replace(/\.0$/, "")));
  const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  const jparts = (j) => (j || "1400/01/01").split("/").map(Number);
  const jdisp = (j) => { const [y, m, d] = jparts(j); return `${fa(d)} ${MONTHS[m - 1] || ""} ${fa(y)}`; };
  function j2g(jy, jm, jd) {
    jy += 1595;
    let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    let gy = 400 * Math.floor(days / 146097); days %= 146097;
    if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * Math.floor(days / 1461); days %= 1461;
    if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    let gd = days + 1;
    const sal = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (gm = 0; gm < 13 && gd > sal[gm]; gm++) gd -= sal[gm];
    return [gy, gm, gd];
  }
  function ago(j) {
    const [y, m, d] = jparts(j);
    const [gy, gm, gd] = j2g(y, m, d);
    const days = Math.floor((Date.now() - new Date(gy, gm - 1, gd).getTime()) / 864e5);
    if (days < 1) return "امروز";
    if (days < 2) return "دیروز";
    if (days < 7) return fa(days) + " روز پیش";
    if (days < 31) return fa(Math.floor(days / 7)) + " هفته پیش";
    if (days < 365) return fa(Math.floor(days / 30)) + " ماه پیش";
    return fa(Math.floor(days / 365)) + " سال پیش";
  }
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "")
    .replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[ةۀ]/g, "ه").replace(/[أإآ]/g, "ا")
    .replace(/[۰-۹]/g, (d) => FA.indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[\u200c\u200e\u200f]/g, " ")
    .replace(/[\-_–—:،,؛;!؟?.()[\]«»"'/|#*+]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem("academy:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("academy:" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  const aparatUrl = (uid) => `https://www.aparat.com/v/${uid}`;
  const siteBase = () => CFG.siteUrl || (location.origin + location.pathname);
  const siteUrlOf = (uid) => siteBase().replace(/#.*$/, "") + "#v-" + uid;

  /* ------------------------------------------------------------ icons */
  const ICONS = {
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5V5.5M9 7.5h7M9 11h5"/>',
    sigma: '<path d="M18 4H6l6.5 8L6 20h12"/>',
    car: '<path d="M3 15v-3l2.2-4.4A2 2 0 0 1 7 6.5h10a2 2 0 0 1 1.8 1.1L21 12v3"/><path d="M3 12h18M3 15h2.5M18.5 15H21"/><circle cx="7.5" cy="16" r="2"/><circle cx="16.5" cy="16" r="2"/>',
    robot: '<path d="M3 21h9"/><path d="M7.5 21v-4.5l4-6.5 6 2.2"/><circle cx="7.5" cy="16.5" r="1.7"/><circle cx="11.5" cy="10" r="1.7"/><path d="M17.5 12.2l2.8-2.6M17.5 12.2l2.8 2.2"/>',
    control: '<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    wave: '<path d="M2 12c2.2-7 4.4-7 6.6 0s4.4 7 6.6 0 4.4-7 6.8 0"/>',
    cube: '<path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="M12 21.5V12M20.5 7.3L12 12 3.5 7.3"/>',
    flask: '<path d="M9 3h6M10 3v6.2L4.4 18.6A1.6 1.6 0 0 0 5.8 21h12.4a1.6 1.6 0 0 0 1.4-2.4L14 9.2V3"/><path d="M7.2 15h9.6"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9.5 2.5v3.5M14.5 2.5v3.5M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/>',
    spark: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23"/>',
    matrix: '<path d="M7 4H4v16h3M17 4h3v16h-3"/><path d="M8.5 9h.01M12 9h.01M15.5 9h.01M8.5 15h.01M12 15h.01M15.5 15h.01"/>',
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    wrench: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M8.5 7.5V5h7v2.5M3 13h18M11 12v2.5h2V12"/>',
    cap: '<path d="M2 9.5L12 4.5l10 5-10 5z"/><path d="M6 11.5v5c3.5 2.2 8.5 2.2 12 0v-5M22 9.5v5"/>',
    heart: '<path d="M12 20s-7.5-4.6-9.2-9.4A4.9 4.9 0 0 1 12 7.4a4.9 4.9 0 0 1 9.2 3.2C19.5 15.4 12 20 12 20z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16"/>',
    play: '<path d="M8 5.5v13l11-6.5z"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    like: '<path d="M7 11v9H4v-9zM7 11l4-8a2.5 2.5 0 0 1 2.5 2.5V9h5.2a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.5 20H7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    bookmark: '<path d="M6 3.5h12v17l-6-4.2-6 4.2z"/>',
    share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.3 10.8l7.4-4M8.3 13.2l7.4 4"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 19h1M19 14h1.5"/>',
    download: '<path d="M12 3.5v12M7 11l5 5 5-5M4 20.5h16"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    up: '<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>',
    list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    fire: '<path d="M12 21c4 0 7-2.7 7-6.6 0-3.7-2.6-6.3-4.3-8.4-.3 2.2-1.3 3.4-2.5 4.1C12.4 7.2 10.8 4.6 8.6 3c.3 3-1.8 5-3 7.2A7.4 7.4 0 0 0 5 14.4C5 18.3 8 21 12 21z"/>',
    bolt: '<path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12z"/>',
    print: '<path d="M7 9V3.5h10V9M7 17.5H5A1.5 1.5 0 0 1 3.5 16v-5.5A1.5 1.5 0 0 1 5 9h14a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 1-1.5 1.5h-2"/><rect x="7" y="14" width="10" height="6.5" rx="1"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    prev: '<path d="M9 6l6 6-6 6"/>',
    next: '<path d="M15 6l-6 6 6 6"/>',
    home: '<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5v10.5h13V9.5"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="2"/><path d="M16 8V5a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 4 5v9.5A1.5 1.5 0 0 0 5.5 16H8"/>',
    tag: '<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle cx="8" cy="8" r="1.4"/>'
  };
  const icon = (n, cls = "") => `<svg class="svg ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.grid}</svg>`;

  /* ------------------------------------------------------------ sound */
  const Sound = {
    ctx: null, on: store.get("sound", CFG.soundDefault !== false), last: 0,
    ensure() {
      if (!this.on) return null;
      try {
        if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; this.ctx = new C(); }
        if (this.ctx.state === "suspended") this.ctx.resume();
      } catch (e) { return null; }
      return this.ctx;
    },
    tone(f, f2, d, type = "sine", g = 0.12, delay = 0) {
      const c = this.ensure(); if (!c) return;
      const t = c.currentTime + delay, o = c.createOscillator(), v = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g, t + 0.012); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(v).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
    },
    noise(d = 0.35, from = 400, to = 3000, g = 0.06) {
      const c = this.ensure(); if (!c) return;
      const len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), v = c.createGain(), t = c.currentTime;
      s.buffer = buf; f.type = "bandpass"; f.Q.value = 1.2;
      f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + d);
      v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f).connect(v).connect(c.destination); s.start(t);
    },
    hover() { const n = performance.now(); if (n - this.last < 70) return; this.last = n; this.tone(1750, 2100, 0.035, "triangle", 0.025); },
    click() { this.tone(520, 880, 0.09, "sine", 0.1); },
    whoosh() { this.noise(0.32, 300, 2600, 0.05); },
    open() { this.tone(330, 660, 0.18, "sine", 0.09); this.tone(495, 990, 0.2, "triangle", 0.04, 0.05); },
    success() { [784, 988, 1319].forEach((f, i) => this.tone(f, null, 0.16, "sine", 0.07, i * 0.07)); },
    off() { this.tone(600, 300, 0.14, "sine", 0.06); },
    dice() { for (let i = 0; i < 5; i++) this.tone(900 + Math.random() * 700, null, 0.03, "square", 0.025, i * 0.045); this.tone(660, 1320, 0.15, "sine", 0.07, 0.25); }
  };

  /* ------------------------------------------------------------ state */
  const S = {
    videos: [], byUid: new Map(), cats: [], catMap: new Map(), series: [], seriesMap: new Map(),
    hot: new Set(), rank: new Map(), generated: null, fallback: "misc", rules: [],
    live: { state: "idle", added: 0 },
    saved: new Set(store.get("saved", [])), recent: store.get("recent", []), q: ""
  };
  const cat = (id) => S.catMap.get(id) || S.catMap.get(S.fallback) || { id, title: "", color: "#888", icon: "grid", desc: "" };

  function prepare(vData, cData) {
    S.cats = cData.categories || [];
    S.fallback = cData.fallback || "misc";
    S.cats.forEach((c) => { c.count = 0; c.dur = 0; c.views = 0; S.catMap.set(c.id, c); });
    S.rules = S.cats.map((c) => ({ id: c.id, kws: (c.keywords || []).map((k) => Array.isArray(k) ? [norm(k[0]), +k[1]] : [norm(k), 1]).filter((k) => k[0]) }));
    S.generated = vData.generated;
    S.series = vData.series || [];
    S.series.forEach((s) => S.seriesMap.set(s.id, s));
    (vData.videos || []).forEach(addVideo);
    reindex();
  }
  function addVideo(v, front) {
    if (S.byUid.has(v.uid)) return false;
    v._n = norm(v.title); v._t = norm((v.tags || []).join(" ")); v._d = norm((v.desc || "").slice(0, 400));
    S.byUid.set(v.uid, v);
    front ? S.videos.unshift(v) : S.videos.push(v);
    return true;
  }
  function reindex() {
    S.cats.forEach((c) => { c.count = 0; c.dur = 0; c.views = 0; });
    S.videos.sort((a, b) => b.ts - a.ts);
    S.videos.forEach((v) => { const c = cat(v.cat); c.count++; c.dur += v.duration || 0; c.views += v.views || 0; });
    S.popular = [...S.videos].sort((a, b) => b.views - a.views);
    S.rank = new Map(S.popular.map((v, i) => [v.uid, i + 1]));
    S.hot = new Set(S.popular.slice(0, CFG.hotBadgeTop).map((v) => v.uid));
    S.totalDur = S.videos.reduce((a, v) => a + (v.duration || 0), 0);
    S.totalViews = S.videos.reduce((a, v) => a + (v.views || 0), 0);
  }
  function classify(title) {
    const t = " " + norm(title) + " ";
    let best = S.fallback, bs = 0;
    S.rules.forEach((r) => {
      let s = 0;
      r.kws.forEach(([k, w]) => { if (k.length <= 3 ? t.includes(" " + k + " ") : t.includes(k)) s += 3 * w; });
      if (s > bs) { bs = s; best = r.id; }
    });
    return best;
  }

  /* ------------------------------------------------------------ live feed */
  async function liveFeed() {
    if (!CFG.liveFeed || !CFG.liveFeedUrl) { setLive("idle"); return; }
    setLive("loading");
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(CFG.liveFeedUrl, { signal: ctl.signal, headers: { Accept: "application/json" } });
      clearTimeout(timer);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      const list = j.videobyuser || j.videoByUser || [];
      let added = 0;
      const now = new Date();
      const fmt = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" });
      list.forEach((it, i) => {
        const v = S.byUid.get(it.uid);
        if (v) { if (it.visit_cnt) v.views = Math.max(v.views, +it.visit_cnt); if (it.big_poster && !v.poster) v.poster = it.big_poster; return; }
        let jd;
        const m = String(it.create_date || it.date_exact || "").match(/(\d{4})-(\d{2})-(\d{2})/);
        const g = m ? new Date(+m[1], +m[2] - 1, +m[3]) : now;
        try { const p = fmt.formatToParts(g); const y = p.find((x) => x.type === "year").value, mo = p.find((x) => x.type === "month").value, d = p.find((x) => x.type === "day").value; jd = `${y}/${mo}/${d}`; } catch (e) { jd = "1405/01/01"; }
        const [yy, mm, dd] = jparts(jd);
        const nv = {
          uid: it.uid, title: it.title || "", views: +it.visit_cnt || 0, likes: 0, duration: +it.duration || 0,
          tags: [], desc: "", poster: it.big_poster || it.small_poster || "", jdate: jd, time: "00:00",
          ts: +(String(yy).padStart(4, "0") + pad(mm) + pad(dd) + "2359") - i, live: true, series: null
        };
        nv.cat = classify(nv.title);
        if (addVideo(nv, true)) added++;
      });
      reindex();
      S.live = { state: "live", added };
      setLive("live");
      if (added && (location.hash === "" || location.hash === "#" || location.hash === "#latest")) render();
      if (added) toast(`${fa(added)} آموزش تازه از آپارات اضافه شد`);
    } catch (e) {
      clearTimeout(timer);
      setLive("cached");
    }
  }
  function setLive(state) {
    S.live.state = state;
    $$(".live").forEach((el) => { el.dataset.state = state; el.innerHTML = liveText(); });
  }
  function liveText() {
    const st = S.live.state;
    let t;
    if (st === "loading") t = "در حال دریافت فید آپارات…";
    else if (st === "live") t = S.live.added ? `فید زنده · ${fa(S.live.added)} آموزش تازه` : "فید زنده · همگام با آپارات";
    else {
      let d = "";
      try { d = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium" }).format(new Date(S.generated)); } catch (e) { /* noop */ }
      t = d ? `به‌روزرسانی خودکار · ${d}` : "آرشیو کانال";
    }
    return `<i></i>${t}`;
  }

  /* ------------------------------------------------------------ components */
  function traceSvg(seed, w = 200, h = 60) {
    let s = hash(seed);
    const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296;
    const a1 = 0.5 + rnd() * 0.5, f1 = 1 + Math.floor(rnd() * 3), a2 = rnd() * 0.45, f2 = 3 + Math.floor(rnd() * 5), a3 = rnd() * 0.25, f3 = 7 + Math.floor(rnd() * 8), ph = rnd() * 6.28;
    let d = "";
    for (let i = 0; i <= 60; i++) {
      const x = (i / 60) * w, t = (i / 60) * Math.PI * 2;
      const y = h / 2 - (h * 0.42) * (a1 * Math.sin(f1 * t + ph) + a2 * Math.sin(f2 * t) + a3 * Math.sin(f3 * t + ph * 2)) / (a1 + a2 + a3);
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return `<svg class="trace" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
  }
  // each image may be saved as .webp or .png — both are tried, the missing one is simply skipped
  const imgs = (base) => `url('${base}.webp'),url('${base}.png')`;
  const catImg = (id) => `--img:${imgs('images/cat-' + id)}`;

  function card(v, opt = {}) {
    const c = cat(v.cat), on = S.saved.has(v.uid);
    return `<article class="card${opt.feature ? " card--feature" : ""}" style="--c:${c.color}">
      ${opt.rank ? `<span class="rank rank--${opt.rank}">${fa(opt.rank)}</span>` : ""}
      ${opt.ep ? `<span class="rank" title="قسمت ${fa(opt.ep)}">${fa(opt.ep)}</span>` : ""}
      <a class="card__link" href="#v-${v.uid}" data-hover>
        <div class="cover" style="${catImg(v.cat)}">
          ${traceSvg(v.uid)}
          ${v.poster ? `<img class="cover__poster" src="${esc(v.poster)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
          <span class="cover__icon">${icon(c.icon)}</span>
          <span class="cover__play">${icon("play")}</span>
          ${v.duration ? `<span class="badge-dur">${dur(v.duration)}</span>` : ""}
          ${S.hot.has(v.uid) ? `<span class="badge-hot">${icon("fire")} پربازدید</span>` : ""}
          ${v.live ? `<span class="badge-new">تازه</span>` : ""}
        </div>
        <div class="card__body">
          <span class="card__cat">${esc(c.title)}</span>
          <h3 class="card__title">${esc(v.title)}</h3>
          <div class="card__meta"><span>${icon("eye")} ${compact(v.views)} بازدید</span><span>${icon("cal")} ${opt.ago ? ago(v.jdate) : jdisp(v.jdate)}</span></div>
        </div>
      </a>
      <button class="card__save${on ? " is-on" : ""}" data-save="${v.uid}" aria-label="${on ? "حذف از نشان‌شده‌ها" : "نشان کردن"}" aria-pressed="${on}">${icon("bookmark")}</button>
    </article>`;
  }
  const cards = (list, opt) => list.map((v) => card(v, opt)).join("");

  function secHead(ic, title, sub, more) {
    return `<div class="sec-head"><div><h2>${icon(ic)}${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${more || ""}</div>`;
  }
  function banner({ c, ic, title, desc, img, kpis, extra }) {
    return `<header class="banner" style="--c:${c || "var(--amber)"};--img:${imgs(img.replace(/\.(webp|png)$/, ""))}">
      <div class="banner__icon">${icon(ic)}</div>
      <div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ""}${kpis ? `<div class="kpis">${kpis}</div>` : ""}${extra || ""}</div>
    </header>`;
  }
  const crumbs = (items) => `<nav class="crumbs wrap" aria-label="مسیر">${[`<a href="#">${icon("home")} خانه</a>`, ...items].join(" <span aria-hidden='true'>/</span> ")}</nav>`;

  function tile(c, i) {
    return `<a class="tile${c.count >= 90 ? " tile--big" : ""}" href="#c-${c.id}" style="--c:${c.color};${catImg(c.id)};--delay:${(i % 6) * -1.3}s" data-tilt data-hover>
      <span class="tile__icon">${icon(c.icon)}</span>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.desc || "")}</p>
      <div class="tile__meta"><span><b>${fa(c.count)}</b> آموزش</span><span>${hoursOf(c.dur)} ساعت</span><span>${compact(c.views)} بازدید</span></div>
      <span class="tile__bar"></span>
    </a>`;
  }
  function scard(s) {
    const c = cat(s.cat), n = Math.min(s.count, 12);
    return `<a class="scard" href="#s-${s.id}" style="--c:${c.color}" data-hover>
      <div class="scard__strip">${"<i></i>".repeat(n)}</div>
      <span class="card__cat">${esc(c.title)}</span>
      <h3>${esc(s.title)}</h3>
      <div class="scard__meta"><span>${icon("layers")} ${fa(s.count)} قسمت</span><span>${icon("clock")} ${hoursOf(s.duration || 0)} ساعت</span><span>${icon("eye")} ${compact(s.views)}</span></div>
    </a>`;
  }
  function rrow(v, i, max) {
    const c = cat(v.cat);
    return `<a class="rrow" href="#v-${v.uid}" style="--c:${c.color};--w:${Math.max(2, (v.views / max) * 100).toFixed(1)}%" data-hover>
      <span class="rrow__n">${fa(i)}</span>
      <span class="rrow__t"><b>${esc(v.title)}</b><small>${esc(c.title)} · ${dur(v.duration)}</small></span>
      <span class="rrow__v">${icon("eye")} ${num(v.views)}</span>
      <span class="rrow__bar"></span>
    </a>`;
  }
  function empty(msg, img = "images/empty.webp") {
    return `<div class="empty"><img src="${img}" alt="" onerror="if(!this.dataset.f){this.dataset.f=1;this.src=this.src.replace(/\.webp$/,'.png')}else{this.nextElementSibling.hidden=false;this.remove()}"><span hidden>${icon("search")}</span><p>${msg}</p><a class="btn" href="#">${icon("home")} بازگشت به خانه</a></div>`;
  }

  /* ------------------------------------------------------------ views */
  function viewHome() {
    const latest = S.videos.slice(0, CFG.latestCount);
    const recent = S.recent.map((u) => S.byUid.get(u)).filter(Boolean).slice(0, 4);
    const floaters = [...S.cats].filter((c) => c.count).sort((a, b) => b.count - a.count).slice(0, 6)
      .map((c, i) => `<a class="floater" href="#c-${c.id}" style="--c:${c.color};--delay:${-i * 1.7}s;--dur:${6 + (i % 3)}s;--dx:${i % 2 ? -8 : 8}px" data-hover>${icon(c.icon)}<span>${esc(c.title)}</span><b>${fa(c.count)}</b></a>`).join("");
    const years = {};
    S.videos.forEach((v) => { const y = jparts(v.jdate)[0]; years[y] = (years[y] || 0) + 1; });
    const ys = Object.keys(years).map(Number).sort((a, b) => a - b), ymax = Math.max(...Object.values(years));
    const cmax = Math.max(...S.cats.map((c) => c.count));
    const topSeries = S.series.slice(0, 12);
    return `
    <section class="hero wrap" style="--hero-img:${imgs('images/hero')}">
      <div class="hero__text">
        <span class="eyebrow">${esc(CFG.owner)} · ${esc(CFG.affiliation || "")}</span>
        <h1>مهندسی را <em>جمله‌به‌جمله</em> بسازید</h1>
        <p class="lead">${fa(S.videos.length)} آموزش ویدیویی در ریاضیات مهندسی، کنترل و رباتیک، دینامیک خودرو، متلب و روش پژوهش؛ دسته‌بندی‌شده، قابل جستجو و همگام با کانال آپارات.</p>
        <button class="searchbar" data-palette data-hover>${icon("search")}<span>جستجو در عنوان، برچسب و توضیحات…</span><kbd class="kbd">/</kbd></button>
        <dl class="stats">
          <div><dt>آموزش</dt><dd>${fa(S.videos.length)}</dd></div>
          <div><dt>ساعت محتوا</dt><dd>${hoursOf(S.totalDur)}</dd></div>
          <div><dt>بازدید</dt><dd>${compact(S.totalViews)}</dd></div>
          <div><dt>سری آموزشی</dt><dd>${fa(S.series.length)}</dd></div>
        </dl>
      </div>
      <div class="lab">
        <div class="scope">
          <div class="scope__head"><span class="leds"><i></i><i></i><i></i></span><span><b>اسیلوسکوپ فوریه</b> · هر موج، مجموعی از سینوس‌هاست</span></div>
          <canvas id="fourier" aria-label="نمایش زندهٔ سری فوریه" role="img"></canvas>
          <div class="scope__ctrl">
            <label for="fN">تعداد جمله‌ها <input id="fN" type="range" min="1" max="25" value="5"><output id="fNo">۵</output></label>
            <div class="seg" role="group" aria-label="شکل موج">
              <button type="button" class="is-active" data-wave="square">مربعی</button>
              <button type="button" data-wave="saw">دندان‌اره‌ای</button>
              <button type="button" data-wave="tri">مثلثی</button>
            </div>
          </div>
          <code class="formula" id="fFormula"></code>
        </div>
        <div class="floaters">${floaters}</div>
      </div>
    </section>

    ${recent.length ? `<section class="section wrap">${secHead("clock", "ادامهٔ تماشا", "آخرین آموزش‌هایی که در این مرورگر باز کرده‌اید", `<a class="more" href="#saved">همه ${icon("next")}</a>`)}<div class="grid">${cards(recent)}</div></section>` : ""}

    <section class="section wrap">
      ${secHead("bolt", "تازه‌ترین آموزش‌ها", "جدیدترین بارگذاری‌های کانال، مستقیم از آپارات", `<div class="chips"><span class="live" data-state="${S.live.state}">${liveText()}</span><a class="more" href="#latest">مرور زمانی ${icon("next")}</a></div>`)}
      <div class="grid">${latest.map((v, i) => card(v, { feature: i === 0, ago: true })).join("")}</div>
    </section>

    <section class="section wrap" id="cats">
      ${secHead("grid", "دسته‌بندی‌ها", `${fa(S.cats.filter((c) => c.count).length)} دسته؛ هر آموزش فقط در یک دستهٔ اصلی قرار دارد`)}
      <div class="tiles">${S.cats.filter((c) => c.count).map(tile).join("")}</div>
    </section>

    <section class="section wrap">
      ${secHead("fire", "پربازدیدترین‌ها", "آموزش‌هایی که بیشترین مخاطب را داشته‌اند", `<a class="more" href="#popular">${fa(CFG.popularCount)} آموزش برتر ${icon("next")}</a>`)}
      <div class="podium">${S.popular.slice(0, 3).map((v, i) => card(v, { rank: i + 1 })).join("")}</div>
      <div class="ranklist">${S.popular.slice(3, 10).map((v, i) => rrow(v, i + 4, S.popular[0].views)).join("")}</div>
    </section>

    <section class="section wrap">
      ${secHead("layers", "سری‌های آموزشی", "دوره‌ها و مجموعه‌هایی که قسمت‌به‌قسمت پیش می‌روند", `<a class="more" href="#series">همهٔ ${fa(S.series.length)} سری ${icon("next")}</a>`)}
      <div class="rail">${topSeries.map(scard).join("")}</div>
    </section>

    <section class="section wrap">
      ${secHead("wave", "کانال در یک نگاه")}
      <div class="statgrid">
        <div class="panel"><h3>آموزش‌های منتشرشده در هر سال</h3><p class="sub">سال‌های شمسی، بر اساس تاریخ انتشار در آپارات</p>
          <div class="years">${ys.map((y) => `<div class="col"><div class="bar" style="--h:${((years[y] / ymax) * 100).toFixed(1)}%"><span>${fa(years[y])}</span></div><small>${fa(y)}</small></div>`).join("")}</div>
        </div>
        <div class="panel"><h3>سهم هر دسته</h3><p class="sub">تعداد آموزش در هر دستهٔ اصلی</p>
          <div class="share">${[...S.cats].filter((c) => c.count).sort((a, b) => b.count - a.count).map((c) => `<a href="#c-${c.id}" style="--c:${c.color};--w:${((c.count / cmax) * 100).toFixed(1)}%"><span>${esc(c.title)}</span><span class="track"><i></i></span><b>${fa(c.count)}</b></a>`).join("")}</div>
        </div>
      </div>
    </section>`;
  }

  const PAGE = 24;
  function listControls(id, opts = {}) {
    return `<div class="controls" data-list="${id}">
      <label class="field">${icon("search")}<input id="f-${id}" type="search" placeholder="${opts.ph || "جستجو در این بخش…"}" autocomplete="off"></label>
      <select class="select" id="s-${id}" aria-label="مرتب‌سازی">
        <option value="new">جدیدترین</option><option value="old">قدیمی‌ترین</option>
        <option value="views">پربازدیدترین</option><option value="likes">محبوب‌ترین</option><option value="long">طولانی‌ترین</option><option value="short">کوتاه‌ترین</option>
      </select>
      <button class="ibtn" id="m-${id}" type="button" aria-label="نمایش فهرستی" aria-pressed="false">${icon("list")}</button>
      <span class="count" id="n-${id}"></span>
    </div>`;
  }
  function sortList(list, mode) {
    const l = [...list];
    const f = { new: (a, b) => b.ts - a.ts, old: (a, b) => a.ts - b.ts, views: (a, b) => b.views - a.views, likes: (a, b) => b.likes - a.likes || b.views - a.views, long: (a, b) => b.duration - a.duration, short: (a, b) => a.duration - b.duration }[mode];
    return f ? l.sort(f) : l;
  }
  function filterList(list, q) {
    const toks = norm(q).split(" ").filter(Boolean);
    if (!toks.length) return list;
    return list.filter((v) => toks.every((t) => v._n.includes(t) || v._t.includes(t) || v._d.includes(t)));
  }
  // attach interactive list (search + sort + paging)
  function mountList(id, base, gridSel, extra) {
    const inp = $("#f-" + id), sel = $("#s-" + id), mode = $("#m-" + id), grid = $(gridSel), cnt = $("#n-" + id);
    let shown = PAGE, filt = null;
    const pref = store.get("listmode", false);
    const setMode = (on) => { grid.classList.toggle("is-list", on); mode.setAttribute("aria-pressed", on); };
    setMode(pref);
    const draw = () => {
      let l = filterList(base(), inp.value);
      if (filt) l = l.filter(filt);
      l = sortList(l, sel.value);
      grid.innerHTML = l.length ? cards(l.slice(0, shown)) : `<div class="empty" style="grid-column:1/-1">${icon("search")}<p>نتیجه‌ای پیدا نشد. عبارت دیگری را امتحان کنید.</p></div>`;
      cnt.textContent = fa(l.length) + " آموزش";
      const lm = $("#more-" + id);
      if (lm) lm.hidden = l.length <= shown;
    };
    inp.addEventListener("input", () => { shown = PAGE; draw(); });
    sel.addEventListener("change", () => { shown = PAGE; Sound.click(); draw(); });
    mode.addEventListener("click", () => { const on = mode.getAttribute("aria-pressed") !== "true"; setMode(on); store.set("listmode", on); Sound.click(); });
    const lm = $("#more-" + id);
    if (lm) lm.addEventListener("click", () => { shown += PAGE; Sound.click(); draw(); });
    if (extra) extra((fn) => { filt = fn; shown = PAGE; draw(); });
    draw();
  }

  function viewCategory(id) {
    const c = S.catMap.get(id);
    if (!c) return viewNotFound();
    const sers = S.series.filter((s) => s.cat === id);
    const html = `${crumbs([`<span>${esc(c.title)}</span>`])}
    <section class="wrap">
      ${banner({ c: c.color, ic: c.icon, title: esc(c.title), desc: esc(c.desc || ""), img: `images/cat-${c.id}.webp`,
        kpis: `<span><b>${fa(c.count)}</b>آموزش</span><span><b>${hoursOf(c.dur)}</b>ساعت</span><span><b>${compact(c.views)}</b>بازدید</span><span><b>${fa(sers.length)}</b>سری</span>`,
        extra: `<div class="chips" style="margin-top:14px"><a class="chip" href="#qr-c-${c.id}" style="--c:${c.color}">${icon("qr")} کارت‌های QR این دسته</a></div>` })}
      ${sers.length ? `<div class="chips" style="margin-bottom:14px" id="serchips"><button class="chip is-active" data-sf="" style="--c:${c.color}">همه</button>${sers.map((s) => `<button class="chip" data-sf="${s.id}" style="--c:${c.color}">${icon("layers")} ${esc(s.title)} · ${fa(s.count)}</button>`).join("")}</div>` : ""}
      ${listControls("cat", { ph: `جستجو در ${c.title}…` })}
      <div class="grid" id="g-cat"></div>
      <div class="loadmore"><button class="btn" id="more-cat" type="button">نمایش بیشتر</button></div>
    </section>`;
    return { html, after() {
      mountList("cat", () => S.videos.filter((v) => v.cat === id), "#g-cat", (setF) => {
        $$("#serchips [data-sf]").forEach((b) => b.addEventListener("click", () => {
          $$("#serchips .chip").forEach((x) => x.classList.toggle("is-active", x === b));
          Sound.click(); const sid = b.dataset.sf; setF(sid ? (v) => v.series === sid : null);
        }));
      });
    } };
  }

  function viewPopular() {
    const top = S.popular.slice(0, CFG.popularCount);
    const html = `${crumbs(["<span>پربازدیدترین‌ها</span>"])}
    <section class="wrap">
      ${banner({ c: "#ff9f1c", ic: "fire", title: "پربازدیدترین آموزش‌ها", desc: `${fa(CFG.popularCount)} آموزشی که بیشترین بازدید را در کانال داشته‌اند. این فهرست با هر به‌روزرسانی بازدیدها دوباره مرتب می‌شود.`, img: "images/popular.webp",
        kpis: `<span><b>${compact(top.reduce((a, v) => a + v.views, 0))}</b>بازدید مجموع</span><span><b>${num(top[0] ? top[0].views : 0)}</b>رکورد یک آموزش</span>` })}
      <div class="chips" id="popchips" style="margin-bottom:22px"><button class="chip is-active" data-pc="">همهٔ دسته‌ها</button>${S.cats.filter((c) => c.count).map((c) => `<button class="chip" data-pc="${c.id}" style="--c:${c.color}">${esc(c.title)}</button>`).join("")}</div>
      <div id="popwrap"></div>
    </section>`;
    return { html, after() {
      const draw = (cid) => {
        const l = (cid ? S.popular.filter((v) => v.cat === cid) : S.popular).slice(0, CFG.popularCount);
        if (!l.length) { $("#popwrap").innerHTML = empty("آموزشی در این دسته نیست."); return; }
        $("#popwrap").innerHTML = `<div class="podium">${l.slice(0, 3).map((v, i) => card(v, { rank: i + 1 })).join("")}</div>
          <div class="ranklist">${l.slice(3).map((v, i) => rrow(v, i + 4, l[0].views)).join("")}</div>`;
      };
      $$("#popchips [data-pc]").forEach((b) => b.addEventListener("click", () => { $$("#popchips .chip").forEach((x) => x.classList.toggle("is-active", x === b)); Sound.click(); draw(b.dataset.pc); }));
      draw("");
    } };
  }

  function viewLatest() {
    const byYear = new Map();
    S.videos.forEach((v) => { const [y, m] = jparts(v.jdate); if (!byYear.has(y)) byYear.set(y, new Map()); const ym = byYear.get(y); if (!ym.has(m)) ym.set(m, []); ym.get(m).push(v); });
    const years = [...byYear.keys()].sort((a, b) => b - a);
    const html = `${crumbs(["<span>تازه‌ها و مرور زمانی</span>"])}
    <section class="wrap">
      ${banner({ c: "#34d399", ic: "bolt", title: "تازه‌ها و مرور زمانی", desc: "همهٔ آموزش‌ها به ترتیب تاریخ انتشار. آموزش‌های جدید کانال به‌طور خودکار به بالای این صفحه اضافه می‌شوند.", img: "images/latest.webp",
        extra: `<div style="margin-top:14px"><span class="live" data-state="${S.live.state}">${liveText()}</span></div>` })}
      <div class="chips no-print">${years.map((y) => `<a class="chip" href="#y${y}" data-jump="y${y}">${fa(y)} · ${fa([...byYear.get(y).values()].reduce((a, l) => a + l.length, 0))}</a>`).join("")}</div>
      ${years.map((y, yi) => `<div class="tl-year" id="y${y}"><h2>${fa(y)} <small>${fa([...byYear.get(y).values()].reduce((a, l) => a + l.length, 0))} آموزش</small></h2>
        ${[...byYear.get(y).keys()].sort((a, b) => b - a).map((m) => `<div class="tl-month"><h3>${MONTHS[m - 1]} ${fa(y)}</h3><div class="grid">${yi < 2 ? cards(byYear.get(y).get(m)) : ""}</div>${yi >= 2 ? `<button class="btn" data-expand="${y}-${m}">${icon("expand")} نمایش ${fa(byYear.get(y).get(m).length)} آموزش</button>` : ""}</div>`).join("")}
      </div>`).join("")}
    </section>`;
    return { html, after() {
      $$("[data-jump]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); const t = document.getElementById(a.dataset.jump); if (t) t.scrollIntoView({ behavior: "smooth" }); Sound.click(); }));
      $$("[data-expand]").forEach((b) => b.addEventListener("click", () => {
        const [y, m] = b.dataset.expand.split("-").map(Number);
        b.previousElementSibling.innerHTML = cards(byYear.get(y).get(m)); b.remove(); Sound.open();
      }));
    } };
  }

  function viewSeriesIndex() {
    const groups = S.cats.map((c) => ({ c, list: S.series.filter((s) => s.cat === c.id) })).filter((g) => g.list.length);
    return `${crumbs(["<span>سری‌های آموزشی</span>"])}
    <section class="wrap">
      ${banner({ c: "#5ad1ff", ic: "layers", title: "سری‌های آموزشی", desc: "دوره‌ها و مجموعه‌هایی که قسمت‌به‌قسمت پیش می‌روند. هر سری را از قسمت اول ببینید و با دکمه‌های قبلی/بعدی جلو بروید.", img: "images/series.webp",
        kpis: `<span><b>${fa(S.series.length)}</b>سری</span><span><b>${fa(S.series.reduce((a, s) => a + s.count, 0))}</b>قسمت</span>` })}
      ${groups.map((g) => `<div class="section" style="padding-block:18px">${secHead(g.c.icon, esc(g.c.title), "", `<a class="more" href="#c-${g.c.id}">همهٔ آموزش‌های این دسته ${icon("next")}</a>`)}<div class="sgrid">${g.list.map(scard).join("")}</div></div>`).join("")}
    </section>`;
  }

  function viewSeries(id) {
    const s = S.seriesMap.get(id);
    if (!s) return viewNotFound();
    const c = cat(s.cat), eps = s.uids.map((u) => S.byUid.get(u)).filter(Boolean);
    return `${crumbs([`<a href="#series">سری‌ها</a>`, `<a href="#c-${c.id}">${esc(c.title)}</a>`, `<span>${esc(s.title)}</span>`])}
    <section class="wrap">
      ${banner({ c: c.color, ic: "layers", title: esc(s.title), desc: `یک سری ${fa(eps.length)} قسمتی در دستهٔ «${esc(c.title)}». قسمت‌ها به ترتیب انتشار مرتب شده‌اند.`, img: `images/cat-${c.id}.webp`,
        kpis: `<span><b>${fa(eps.length)}</b>قسمت</span><span><b>${hoursOf(s.duration || 0)}</b>ساعت</span><span><b>${compact(s.views)}</b>بازدید</span>`,
        extra: `<div class="vactions">${eps[0] ? `<a class="btn btn--primary" href="#v-${eps[0].uid}">${icon("play")} شروع از قسمت اول</a>` : ""}<a class="btn" href="#qr-s-${s.id}">${icon("qr")} کارت‌های QR سری</a></div>` })}
      <div class="grid">${eps.map((v, i) => card(v, { ep: i + 1 })).join("")}</div>
    </section>`;
  }

  function viewVideo(uid) {
    const v = S.byUid.get(uid);
    if (!v) return viewNotFound("این آموزش پیدا نشد. ممکن است از کانال حذف شده باشد.");
    const c = cat(v.cat), s = v.series ? S.seriesMap.get(v.series) : null;
    const eps = s ? s.uids.map((u) => S.byUid.get(u)).filter(Boolean) : [];
    const idx = eps.findIndex((x) => x.uid === uid);
    const prev = idx > 0 ? eps[idx - 1] : null, next = idx >= 0 && idx < eps.length - 1 ? eps[idx + 1] : null;
    const related = S.videos.filter((x) => x.cat === v.cat && x.uid !== uid && (!s || x.series !== v.series)).sort((a, b) => b.views - a.views).slice(0, 8);
    const on = S.saved.has(uid);
    const rk = S.rank.get(uid);
    const desc = esc(v.desc || "").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    const side = s
      ? `<div class="panel" style="--c:${c.color}"><h3>${icon("layers")} ${esc(s.title)}</h3><p class="sub">قسمت ${fa(idx + 1)} از ${fa(eps.length)}</p>
          <div class="plist">${eps.map((x, i) => `<a class="pitem${x.uid === uid ? " is-current" : ""}" href="#v-${x.uid}" style="--c:${c.color}"><span class="pitem__n">${fa(i + 1)}</span><span>${esc(x.title)}</span><small>${dur(x.duration)}</small></a>`).join("")}</div></div>`
      : `<div class="panel" style="--c:${c.color}"><h3>${icon(c.icon)} بیشتر از ${esc(c.title)}</h3><p class="sub">پربازدیدترین‌های همین دسته</p>
          <div class="plist">${related.slice(0, 6).map((x, i) => `<a class="pitem" href="#v-${x.uid}" style="--c:${c.color}"><span class="pitem__n">${fa(i + 1)}</span><span>${esc(x.title)}</span><small>${dur(x.duration)}</small></a>`).join("")}</div></div>`;
    const html = `${crumbs([`<a href="#c-${c.id}">${esc(c.title)}</a>`, s ? `<a href="#s-${s.id}">${esc(s.title)}</a>` : "", `<span>${esc(v.title.slice(0, 40))}${v.title.length > 40 ? "…" : ""}</span>`].filter(Boolean))}
    <section class="wrap" style="--c:${c.color}">
      <div class="vgrid" id="vgrid">
        <div class="vmain" style="min-width:0">
          <div class="player" id="player">
            <div class="player__frame">
              <button class="player__start" type="button" data-play="${uid}" style="${catImg(v.cat)}">
                ${v.poster ? `<img src="${esc(v.poster)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : traceSvg(uid)}
                <span class="player__btn"><i>${icon("play")}</i>پخش در همین صفحه</span>
                <span class="player__note">پخش از سرور آپارات · ${dur(v.duration)}</span>
              </button>
            </div>
          </div>
          <h1 class="vtitle">${esc(v.title)}</h1>
          <div class="vmeta">
            <a class="chip" href="#c-${c.id}" style="--c:${c.color}">${icon(c.icon)} ${esc(c.title)}</a>
            <span class="chip">${icon("eye")} ${num(v.views)} بازدید</span>
            ${v.likes ? `<span class="chip">${icon("like")} ${num(v.likes)}</span>` : ""}
            <span class="chip">${icon("clock")} ${dur(v.duration)}</span>
            <span class="chip">${icon("cal")} ${jdisp(v.jdate)} · ${ago(v.jdate)}</span>
            ${rk && rk <= CFG.popularCount ? `<a class="chip" href="#popular" style="--c:#ff9f1c">${icon("fire")} رتبهٔ ${fa(rk)} بازدید</a>` : ""}
          </div>
          <div class="vactions">
            <a class="btn btn--primary" href="${aparatUrl(uid)}" target="_blank" rel="noopener">${icon("external")} مشاهده در آپارات</a>
            <button class="btn" type="button" data-copy="${aparatUrl(uid)}">${icon("link")} کپی لینک</button>
            <button class="btn" type="button" data-share="${uid}">${icon("share")} اشتراک‌گذاری</button>
            <button class="btn${on ? " is-on" : ""}" type="button" data-save="${uid}" aria-pressed="${on}">${icon("bookmark")} ${on ? "نشان‌شده" : "نشان کردن"}</button>
            <button class="btn" type="button" id="theater" aria-pressed="false">${icon("expand")} حالت سینما</button>
          </div>
          ${s ? `<div class="episodes">${prev ? `<a class="btn" href="#v-${prev.uid}">${icon("prev")} قسمت قبل</a>` : "<span></span>"}${next ? `<a class="btn btn--primary" href="#v-${next.uid}">قسمت بعد ${icon("next")}</a>` : ""}</div>` : ""}
          ${v.desc ? `<div class="panel" style="margin-top:20px"><h3>توضیحات</h3><div class="vdesc${v.desc.length > 420 ? " is-clamped" : ""}" id="vdesc">${desc}</div>${v.desc.length > 420 ? `<button class="more" type="button" id="descMore" style="background:none;border:0;margin-top:8px">ادامهٔ توضیحات</button>` : ""}</div>` : ""}
          ${(v.tags || []).length ? `<div class="chips" style="margin-top:18px">${v.tags.map((t) => `<button class="chip" type="button" data-tagq="${esc(t)}">${icon("tag")} ${esc(t)}</button>`).join("")}</div>` : ""}
        </div>
        <aside class="vside">
          <div class="panel qrbox" style="--c:${c.color}">
            <h3>${icon("qr")} QR کد این آموزش</h3>
            <canvas id="qrc" width="440" height="440" aria-label="QR کد"></canvas>
            <div class="seg" role="group" aria-label="مقصد QR"><button type="button" class="is-active" data-qrt="aparat">آپارات</button><button type="button" data-qrt="site">صفحهٔ همین سایت</button></div>
            <div class="qrurl" id="qrurl">${aparatUrl(uid)}</div>
            <div class="row"><button class="btn" type="button" id="qrdl">${icon("download")} دانلود کارت QR</button><button class="btn" type="button" id="qrcp">${icon("copy")} کپی</button></div>
          </div>
          ${side}
        </aside>
      </div>
      ${related.length ? `<div class="section">${secHead(c.icon, "آموزش‌های مرتبط", `از دستهٔ ${esc(c.title)}`, `<a class="more" href="#c-${c.id}">همه ${icon("next")}</a>`)}<div class="grid">${cards(related.slice(0, 8))}</div></div>` : ""}
    </section>`;
    return { html, title: v.title, after() {
      S.recent = [uid, ...S.recent.filter((u) => u !== uid)].slice(0, 24); store.set("recent", S.recent);
      let target = "aparat";
      const url = () => (target === "aparat" ? aparatUrl(uid) : siteUrlOf(uid));
      const drawQ = () => { drawQR($("#qrc"), url(), { color: "#0b1730", accent: c.color }); $("#qrurl").textContent = url(); };
      drawQ();
      $$("[data-qrt]").forEach((b) => b.addEventListener("click", () => { target = b.dataset.qrt; $$("[data-qrt]").forEach((x) => x.classList.toggle("is-active", x === b)); Sound.click(); drawQ(); }));
      $("#qrdl").addEventListener("click", () => { downloadCard(v, url(), c); });
      $("#qrcp").addEventListener("click", () => copy(url()));
      $("#theater").addEventListener("click", (e) => { const g = $("#vgrid"); const on = !g.classList.contains("is-theater"); g.classList.toggle("is-theater", on); e.currentTarget.setAttribute("aria-pressed", on); Sound.whoosh(); });
      const dm = $("#descMore"); if (dm) dm.addEventListener("click", () => { $("#vdesc").classList.remove("is-clamped"); dm.remove(); Sound.click(); });
    } };
  }

  function viewSaved() {
    const saved = [...S.saved].map((u) => S.byUid.get(u)).filter(Boolean);
    const recent = S.recent.map((u) => S.byUid.get(u)).filter(Boolean);
    return `${crumbs(["<span>نشان‌شده‌ها</span>"])}
    <section class="wrap">
      ${banner({ c: "#ff5c7a", ic: "bookmark", title: "نشان‌شده‌ها و تاریخچه", desc: "آموزش‌هایی که نشان کرده‌اید و آن‌هایی که اخیراً دیده‌اید. این فهرست فقط در همین مرورگر نگه‌داری می‌شود.", img: "images/saved.webp" })}
      <div class="section" style="padding-top:0">${secHead("bookmark", "نشان‌شده‌ها", fa(saved.length) + " آموزش")}${saved.length ? `<div class="grid">${cards(saved)}</div>` : empty("هنوز آموزشی را نشان نکرده‌اید. روی آیکون نشان در گوشهٔ هر کارت بزنید.")}</div>
      ${recent.length ? `<div class="section">${secHead("clock", "اخیراً دیده‌شده", "", `<button class="more" type="button" id="clearRecent" style="background:none;border:0">پاک کردن تاریخچه</button>`)}<div class="grid">${cards(recent)}</div></div>` : ""}
    </section>`;
  }

  function search(q, limit = 1e9) {
    const toks = norm(q).split(" ").filter(Boolean);
    if (!toks.length) return [];
    const out = [];
    S.videos.forEach((v) => {
      let sc = 0;
      for (const t of toks) {
        const a = v._n.includes(t), b = v._t.includes(t), d = v._d.includes(t);
        if (!a && !b && !d) return;
        sc += (a ? 10 : 0) + (b ? 4 : 0) + (d ? 1 : 0);
      }
      if (v._n.startsWith(toks[0])) sc += 5;
      sc += Math.log10((v.views || 0) + 1);
      out.push([sc, v]);
    });
    return out.sort((x, y) => y[0] - x[0]).slice(0, limit).map((x) => x[1]);
  }
  function viewSearch() {
    const html = `${crumbs(["<span>جستجو</span>"])}
    <section class="wrap">
      ${banner({ c: "#5ad1ff", ic: "search", title: "جستجو در همهٔ آموزش‌ها", desc: "در عنوان، برچسب‌ها و توضیحات هر ویدیو جستجو می‌شود. حروف عربی و فارسی و ارقام یکسان در نظر گرفته می‌شوند.", img: "images/series.webp" })}
      ${listControls("sr", { ph: "مثلاً: سری فوریه، کارسیم، تاگوچی…" })}
      <div class="grid" id="g-sr"></div>
      <div class="loadmore"><button class="btn" id="more-sr" type="button">نمایش بیشتر</button></div>
    </section>`;
    return { html, after() {
      const inp = $("#f-sr"); inp.value = S.q || "";
      $("#s-sr").insertAdjacentHTML("afterbegin", '<option value="rel" selected>مرتبط‌ترین</option>');
      $("#s-sr").value = "rel";
      mountList("sr", () => (inp.value.trim() ? search(inp.value) : S.popular), "#g-sr");
      inp.addEventListener("input", () => { S.q = inp.value; });
      inp.focus();
    } };
  }

  function viewQR(param) {
    let list = S.videos, title = "کارت‌های QR", sub = "همهٔ آموزش‌ها", c = null;
    let m;
    if ((m = /^c-(.+)$/.exec(param || "")) && S.catMap.get(m[1])) { c = S.catMap.get(m[1]); list = S.videos.filter((v) => v.cat === c.id); sub = c.title; }
    else if ((m = /^s-(.+)$/.exec(param || "")) && S.seriesMap.get(m[1])) { const s = S.seriesMap.get(m[1]); list = s.uids.map((u) => S.byUid.get(u)).filter(Boolean); sub = s.title; c = cat(s.cat); }
    else list = S.popular.slice(0, 48);
    const html = `${crumbs(["<span>کارت‌های QR</span>"])}
    <section class="wrap">
      ${banner({ c: c ? c.color : "#ffb547", ic: "qr", title: `${title}: ${esc(sub)}`, desc: "برای کلاس، پوستر یا جزوه: هر کارت مستقیماً به ویدیوی آپارات می‌رود. دسته را انتخاب کنید و صفحه را چاپ کنید یا هر کارت را جداگانه دانلود کنید.", img: "images/qr.webp",
        extra: `<div class="vactions"><button class="btn btn--primary" type="button" id="doPrint">${icon("print")} چاپ صفحه</button><select class="select" id="qrPick" aria-label="انتخاب مجموعه"><option value="">۴۸ آموزش پربازدید</option>${S.cats.filter((x) => x.count).map((x) => `<option value="c-${x.id}" ${c && c.id === x.id && param.startsWith("c-") ? "selected" : ""}>${esc(x.title)} (${fa(x.count)})</option>`).join("")}<optgroup label="سری‌ها">${S.series.map((s) => `<option value="s-${s.id}" ${param === "s-" + s.id ? "selected" : ""}>${esc(s.title)}</option>`).join("")}</optgroup></select></div>` })}
      <div class="qrsheet">${list.map((v) => `<div class="qrcard"><canvas width="300" height="300" data-qr="${v.uid}"></canvas><b>${esc(v.title)}</b><small>aparat.com/v/${esc(v.uid)}</small><small>Powered by ${esc(CFG.ownerEn || "")}</small></div>`).join("")}</div>
    </section>`;
    return { html, after() {
      const cvs = $$("[data-qr]"); let i = 0;
      const step = () => { const end = Math.min(i + 12, cvs.length); for (; i < end; i++) drawQR(cvs[i], aparatUrl(cvs[i].dataset.qr), { color: "#0b1730", accent: c ? c.color : "#ffb547", badge: false }); if (i < cvs.length) requestAnimationFrame(step); };
      step();
      $("#doPrint").addEventListener("click", () => { Sound.click(); window.print(); });
      $("#qrPick").addEventListener("change", (e) => { location.hash = e.target.value ? "qr-" + e.target.value : "qr"; });
    } };
  }

  function viewNotFound(msg) {
    return `<section class="wrap" style="padding-block:40px">${empty(msg || "این صفحه وجود ندارد. شاید آدرس اشتباه وارد شده است.", "images/404.webp")}</section>`;
  }

  /* ------------------------------------------------------------ QR drawing */
  function drawQR(canvas, text, o = {}) {
    if (!canvas || !window.QRCodeLib) return;
    const ctx = canvas.getContext("2d"), W = canvas.width;
    const qr = new QRCodeLib.QRCode(-1, QRCodeLib.ECL.Q); qr.addData(text); qr.make();
    const n = qr.getModuleCount(), q = 4, cell = W / (n + q * 2), off = q * cell;
    ctx.clearRect(0, 0, W, W); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, W);
    const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    const badge = o.badge !== false;
    const bs = Math.ceil(n * 0.22) | 1, b0 = Math.floor((n - bs) / 2);
    ctx.fillStyle = o.color || "#0b1730";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c) || finder(r, c)) continue;
      if (badge && r >= b0 && r < b0 + bs && c >= b0 && c < b0 + bs) continue;
      const x = off + c * cell, y = off + r * cell;
      const k = o.dot || 1, g = (1 - k) / 2; ctx.beginPath(); roundRect(ctx, x + cell * g - 0.3, y + cell * g - 0.3, cell * k + 0.6, cell * k + 0.6, cell * (o.round == null ? 0.12 : o.round)); ctx.fill();
    }
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r, c]) => {
      const x = off + c * cell, y = off + r * cell;
      ctx.fillStyle = o.color || "#0b1730"; ctx.beginPath(); roundRect(ctx, x, y, cell * 7, cell * 7, cell * 0.5); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); roundRect(ctx, x + cell, y + cell, cell * 5, cell * 5, cell * 0.25); ctx.fill();
      ctx.fillStyle = o.color || "#0b1730"; ctx.beginPath(); roundRect(ctx, x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.35); ctx.fill();
    });
    if (badge) {
      const cx = off + (b0 + bs / 2) * cell, cy = cx, rad = (bs * cell) / 2 - cell * 0.3;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, rad + cell * 0.25, 0, 7); ctx.fill();
      const g = ctx.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad); g.addColorStop(0, o.accent || "#ffb547"); g.addColorStop(1, "#0b1730");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.5, cell * 0.35); ctx.lineCap = "round"; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const t = i / 40, x = cx - rad * 0.62 + t * rad * 1.24, y = cy - Math.sin(t * Math.PI * 2) * rad * 0.32; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrapText(ctx, text, maxW) {
    const words = text.split(" "), lines = []; let line = "";
    words.forEach((w) => { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    return lines;
  }
  async function downloadCard(v, url, c) {
    try { await document.fonts.ready; } catch (e) { /* noop */ }
    const W = 720, H = 1000, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0a1424"); g.addColorStop(1, "#13284a");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(120,170,235,.12)"; x.lineWidth = 1;
    for (let i = 0; i < W; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for (let i = 0; i < H; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
    x.fillStyle = c.color; x.fillRect(0, 0, W, 10);
    x.direction = "rtl"; x.textAlign = "right"; x.fillStyle = c.color; x.font = "700 26px Vazirmatn, Tahoma, sans-serif";
    x.fillText(c.title, W - 56, 82);
    x.fillStyle = "#e9f0fa"; x.font = "800 36px 'Noto Kufi Arabic', Vazirmatn, Tahoma, sans-serif";
    const lines = wrapText(x, v.title, W - 112).slice(0, 3);
    lines.forEach((l, i) => x.fillText(l, W - 56, 140 + i * 56));
    const qc = document.createElement("canvas"); qc.width = qc.height = 460;
    drawQR(qc, url, { color: "#0b1730", accent: c.color });
    const qy = 140 + lines.length * 56 + 30;
    x.fillStyle = "#fff"; x.beginPath(); roundRect(x, (W - 500) / 2, qy, 500, 500, 36); x.fill();
    x.drawImage(qc, (W - 460) / 2, qy + 20);
    x.textAlign = "center"; x.direction = "ltr"; x.fillStyle = "#93a7c4"; x.font = "500 20px 'JetBrains Mono', monospace";
    x.fillText(url.replace(/^https?:\/\//, ""), W / 2, qy + 560);
    x.direction = "rtl"; x.fillStyle = "#e9f0fa"; x.font = "500 22px Vazirmatn, Tahoma, sans-serif";
    x.fillText(`${dur(v.duration)} · ${jdisp(v.jdate)} · ${compact(v.views)} بازدید`, W / 2, qy + 604);
    x.direction = "ltr"; x.fillStyle = "#ffb547"; x.font = "600 20px 'JetBrains Mono', monospace";
    x.fillText("Powered by " + (CFG.ownerEn || "Dr. Masoud Goharimanesh"), W / 2, H - 46);
    const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = `qr-${v.uid}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    Sound.success(); toast("کارت QR آماده شد");
  }

  /* ------------------------------------------------------------ Fourier scope */
  let scopeStop = null;
  function startScope() {
    if (scopeStop) scopeStop();
    const cv = $("#fourier"); if (!cv) return;
    const ctx = cv.getContext("2d"), range = $("#fN"), out = $("#fNo"), formula = $("#fFormula");
    let N = +range.value, shape = "square", t = 0, trace = [], raf = 0, visible = true, W = 0, H = 0, colors = {};
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const readColors = () => { const cs = getComputedStyle(document.documentElement); colors = { amber: cs.getPropertyValue("--amber").trim(), cyan: cs.getPropertyValue("--cyan").trim(), line: cs.getPropertyValue("--line").trim(), muted: cs.getPropertyValue("--muted").trim() }; };
    readColors();
    const resize = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    resize();
    const terms = () => {
      const l = [];
      if (shape === "square") for (let k = 0, n = 1; k < N; k++, n += 2) l.push([n, 4 / (n * Math.PI)]);
      else if (shape === "saw") for (let n = 1; n <= N; n++) l.push([n, (2 / (n * Math.PI)) * (n % 2 ? 1 : -1)]);
      else for (let k = 0, n = 1; k < N; k++, n += 2) l.push([n, (8 / (Math.PI * Math.PI * n * n)) * (k % 2 ? -1 : 1)]);
      return l;
    };
    const setFormula = () => {
      const f = { square: "f(t) = (4/π) · Σ sin(nωt)/n ,  n = 1,3,5,…", saw: "f(t) = (2/π) · Σ (−1)^(n+1) · sin(nωt)/n ,  n = 1,2,3,…", tri: "f(t) = (8/π²) · Σ (−1)^k · sin(nωt)/n² ,  n = 2k+1" }[shape];
      formula.textContent = `${f}   [ ${N} terms ]`; out.textContent = fa(N);
    };
    setFormula();
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      const R = Math.min(H * 0.26, W * 0.15), cx = W - R * 1.55 - 12, cy = H / 2;
      // axes
      ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke(); ctx.setLineDash([]);
      let x = cx, y = cy;
      terms().forEach(([n, a]) => {
        const r = R * Math.abs(a) * (shape === "tri" ? 1.25 : 1), px = x, py = y, s = Math.sign(a) || 1;
        x += r * Math.cos(n * t) * s; y += r * Math.sin(n * t) * s;
        ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = colors.muted; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = 1;
      });
      trace.unshift(y);
      const x0 = cx - R * 1.45, maxLen = Math.max(10, Math.floor(x0 / 1.6));
      if (trace.length > maxLen) trace.length = maxLen;
      ctx.strokeStyle = colors.cyan; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x0, trace[0]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = colors.cyan; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
      ctx.strokeStyle = colors.amber; ctx.lineWidth = 2.4; ctx.shadowColor = colors.amber; ctx.shadowBlur = 12;
      ctx.beginPath(); trace.forEach((ty, i) => { const tx = x0 - i * 1.6; i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty); }); ctx.stroke(); ctx.shadowBlur = 0;
      t += 0.022;
    };
    const loop = () => { if (visible && !document.hidden) frame(); raf = requestAnimationFrame(loop); };
    if (reduce) { for (let i = 0; i < 420; i++) frame(); } else loop();
    range.addEventListener("input", () => { N = +range.value; setFormula(); trace = []; Sound.tone(220 + N * 30, null, 0.05, "sine", 0.05); if (reduce) for (let i = 0; i < 420; i++) frame(); });
    $$("[data-wave]").forEach((b) => b.addEventListener("click", () => { shape = b.dataset.wave; $$("[data-wave]").forEach((x) => x.classList.toggle("is-active", x === b)); trace = []; setFormula(); Sound.click(); if (reduce) for (let i = 0; i < 420; i++) frame(); }));
    const ro = new ResizeObserver(() => { resize(); trace = []; }); ro.observe(cv);
    const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; }); io.observe(cv);
    const onTheme = () => readColors(); document.addEventListener("themechange", onTheme);
    scopeStop = () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("themechange", onTheme); scopeStop = null; };
  }

  /* ------------------------------------------------------------ helpers */
  let toastT = 0;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("is-on"), 2400); }
  function copy(text) {
    const done = () => { Sound.success(); toast("لینک کپی شد"); };
    const fallback = () => { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { toast(text); } ta.remove(); };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
  }
  function toggleSave(uid) {
    const on = !S.saved.has(uid);
    on ? S.saved.add(uid) : S.saved.delete(uid);
    store.set("saved", [...S.saved]);
    $$(`[data-save="${uid}"]`).forEach((b) => {
      b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on);
      if (b.classList.contains("btn")) b.innerHTML = `${icon("bookmark")} ${on ? "نشان‌شده" : "نشان کردن"}`;
    });
    on ? Sound.success() : Sound.off();
    toast(on ? "به نشان‌شده‌ها اضافه شد" : "از نشان‌شده‌ها حذف شد");
  }

  /* ------------------------------------------------------------ palette */
  let palSel = 0, palRes = [];
  function openPalette(q = "") {
    const p = $("#palette"); p.hidden = false; const inp = $("#pq"); inp.value = q; drawPalette(); inp.focus(); Sound.open();
  }
  function closePalette() { $("#palette").hidden = true; }
  function drawPalette() {
    const q = $("#pq").value;
    palRes = q.trim() ? search(q, 8) : S.popular.slice(0, 6);
    palSel = 0;
    const toks = norm(q).split(" ").filter(Boolean);
    const hl = (t) => { let s = esc(t); toks.forEach((k) => { if (k.length > 1) s = s.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), (m) => `<mark>${m}</mark>`); }); return s; };
    $("#pres").innerHTML = (q.trim() ? "" : `<div class="pres" style="color:var(--muted);font-size:.8rem;display:block">پیشنهاد: پربازدیدترین‌ها</div>`) +
      (palRes.length ? palRes.map((v, i) => { const c = cat(v.cat); return `<a class="pres${i === 0 ? " is-sel" : ""}" href="#v-${v.uid}" style="--c:${c.color}" data-pi="${i}"><span class="ico">${icon(c.icon)}</span><span style="min-width:0"><b>${hl(v.title)}</b><small>${esc(c.title)} · ${dur(v.duration)} · ${compact(v.views)} بازدید</small></span><small>${jdisp(v.jdate)}</small></a>`; }).join("") : `<div class="empty" style="padding:24px">${icon("search")}<p>نتیجه‌ای پیدا نشد.</p></div>`);
  }

  /* ------------------------------------------------------------ router */
  const view = () => $("#view");
  function render() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (scopeStop) scopeStop();
    let r;
    let m;
    if (!h) r = viewHome();
    else if ((m = /^c-(.+)$/.exec(h))) r = viewCategory(m[1]);
    else if ((m = /^v-(.+)$/.exec(h))) r = viewVideo(m[1]);
    else if ((m = /^s-(.+)$/.exec(h))) r = viewSeries(m[1]);
    else if (h === "series") r = viewSeriesIndex();
    else if (h === "popular") r = viewPopular();
    else if (h === "latest") r = viewLatest();
    else if (h === "saved") r = viewSaved();
    else if (h === "search") r = viewSearch();
    else if ((m = /^qr(?:-(.+))?$/.exec(h))) r = viewQR(m[1] || "");
    else if (h === "cats") { r = viewHome(); setTimeout(() => { const c = $("#cats"); if (c) c.scrollIntoView(); }, 30); }
    else if (/^y\d{4}$/.test(h)) return;
    else r = viewNotFound();
    const obj = typeof r === "string" ? { html: r } : r;
    view().innerHTML = obj.html;
    document.title = (obj.title ? obj.title + " · " : "") + CFG.siteTitle;
    if (h !== "cats") window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    if (obj.after) obj.after();
    if (!h || h === "cats") startScope();
    const rc = $("#clearRecent"); if (rc) rc.addEventListener("click", () => { S.recent = []; store.set("recent", []); render(); });
    $$(".nav a").forEach((a) => {
      const k = a.dataset.nav;
      const active = (k === "home" && !h) || (k && h.startsWith(k)) || (k === "cats" && /^c-/.test(h)) || (k === "series" && /^s-/.test(h));
      a.classList.toggle("is-active", !!active);
    });
    bindTilt();
  }

  function bindTilt() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg"); el.style.setProperty("--rx", ((0.5 - py) * 10).toFixed(2) + "deg");
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%"); el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ------------------------------------------------------------ chrome */
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
    const dark = t ? t === "dark" : !window.matchMedia("(prefers-color-scheme: light)").matches;
    const b = $("#themeBtn"); if (b) { b.innerHTML = icon(dark ? "sun" : "moon"); b.setAttribute("aria-label", dark ? "حالت روشن" : "حالت تیره"); }
    document.dispatchEvent(new Event("themechange"));
  }
  function setSoundBtn() { const b = $("#soundBtn"); if (b) { b.setAttribute("aria-pressed", Sound.on); b.setAttribute("aria-label", Sound.on ? "خاموش کردن صدا" : "روشن کردن صدا"); b.title = b.getAttribute("aria-label"); } }

  function bindGlobal() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-save],[data-palette],[data-copy],[data-share],[data-play],[data-tagq],[data-random],#themeBtn,#soundBtn,#toTop,[data-close-pal]");
      if (!t) { if (e.target.closest("a[href^='#']")) Sound.click(); return; }
      if (t.dataset.save) { e.preventDefault(); e.stopPropagation(); toggleSave(t.dataset.save); }
      else if (t.hasAttribute("data-palette")) openPalette();
      else if (t.dataset.copy) copy(t.dataset.copy);
      else if (t.dataset.share) {
        const v = S.byUid.get(t.dataset.share), u = aparatUrl(t.dataset.share);
        if (navigator.share) navigator.share({ title: v.title, url: u }).catch(() => {}); else copy(u);
      } else if (t.dataset.play) {
        const uid = t.dataset.play;
        t.parentElement.innerHTML = `<iframe src="https://www.aparat.com/video/video/embed/videohash/${uid}/vt/frame" title="${esc((S.byUid.get(uid) || {}).title || "")}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
        Sound.open();
      } else if (t.dataset.tagq) { S.q = t.dataset.tagq; location.hash = "search"; if (location.hash === "#search") render(); }
      else if (t.hasAttribute("data-random")) {
        Sound.dice(); const pool = S.videos.filter((v) => v.cat !== "culture"); const v = pool[Math.floor(Math.random() * pool.length)];
        toast("پیشنهاد تصادفی: " + v.title.slice(0, 50)); location.hash = "v-" + v.uid;
      } else if (t.id === "themeBtn") {
        const cur = document.documentElement.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
        const nt = cur === "dark" ? "light" : "dark"; store.set("theme", nt); applyTheme(nt); Sound.click();
      } else if (t.id === "soundBtn") { Sound.on = !Sound.on; store.set("sound", Sound.on); setSoundBtn(); if (Sound.on) Sound.success(); toast(Sound.on ? "افکت‌های صوتی روشن شد" : "افکت‌های صوتی خاموش شد"); }
      else if (t.id === "toTop") { window.scrollTo({ top: 0, behavior: "smooth" }); Sound.whoosh(); }
      else if (t.hasAttribute("data-close-pal")) { if (e.target === t) closePalette(); }
    });
    // hover tick
    let lastEl = null;
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      const el = e.target.closest("[data-hover],.btn,.nav a,.chip,.ibtn");
      if (el && el !== lastEl) { lastEl = el; Sound.hover(); } else if (!el) lastEl = null;
    });
    // keyboard
    document.addEventListener("keydown", (e) => {
      const pal = !$("#palette").hidden;
      if (pal) {
        if (e.key === "Escape") { closePalette(); return; }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); const items = $$("#pres [data-pi]"); if (!items.length) return;
          palSel = (palSel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
          items.forEach((x, i) => x.classList.toggle("is-sel", i === palSel)); items[palSel].scrollIntoView({ block: "nearest" }); Sound.hover(); return;
        }
        if (e.key === "Enter") {
          e.preventDefault(); const q = $("#pq").value.trim();
          if (e.shiftKey || !palRes.length) { S.q = q; closePalette(); location.hash = "search"; if (location.hash === "#search") render(); return; }
          closePalette(); location.hash = "v-" + palRes[palSel].uid; return;
        }
        return;
      }
      const typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || "");
      if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); openPalette(); }
    });
    $("#pq").addEventListener("input", drawPalette);
    $("#pres").addEventListener("click", () => closePalette());
    $("#palAll").addEventListener("click", () => { S.q = $("#pq").value; closePalette(); location.hash = "search"; if (location.hash === "#search") render(); });
    // scroll progress + to-top
    const prog = $("#progress"), top = $("#toTop");
    const onScroll = () => {
      const h = document.documentElement, p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      prog.style.setProperty("--p", p.toFixed(4)); top.classList.toggle("is-on", h.scrollTop > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", () => { closePalette(); Sound.whoosh(); render(); });
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => { if (!document.documentElement.getAttribute("data-theme")) applyTheme(null); });
  }

  /* ------------------------------------------------------------ boot */
  async function boot() {
    applyTheme(store.get("theme", null));
    setSoundBtn();
    bindGlobal();
    try {
      const [v, c] = await Promise.all([
        fetch("data/videos.json", { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error("videos.json " + r.status); return r.json(); }),
        fetch("data/categories.json", { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error("categories.json " + r.status); return r.json(); })
      ]);
      prepare(v, c);
    } catch (err) {
      view().innerHTML = `<section class="wrap"><div class="empty">${icon("close")}<p>داده‌های سایت بارگذاری نشد (${esc(err.message)}).<br>اگر فایل را مستقیماً از روی دیسک باز کرده‌اید، سایت را با یک سرور محلی اجرا کنید: <code class="ltr">python -m http.server</code></p></div></section>`;
      return;
    }
    $$("[data-count]").forEach((el) => { el.textContent = fa(S.videos.length); });
    render();
    liveFeed();
  }
  window.Academy = { S, drawQR, norm, j2g };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
