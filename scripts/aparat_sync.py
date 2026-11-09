#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aparat ⇄ Academy data tool
Powered by Dr. Masoud Goharimanesh

دستورها:
  python scripts/aparat_sync.py import-xlsx  path/to/goharimanesh_videos.xlsx
  python scripts/aparat_sync.py sync          # دریافت ویدیوهای جدید و به‌روزرسانی بازدیدها از آپارات
  python scripts/aparat_sync.py sync --full   # پیمایش کامل همهٔ صفحه‌های کانال (برای پر کردن پوسترها)
  python scripts/aparat_sync.py classify      # دسته‌بندی دوباره پس از ویرایش data/categories.json

فقط به کتابخانه‌های استاندارد پایتون نیاز دارد (برای import-xlsx: openpyxl).
"""
import datetime as dt
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
VIDEOS = os.path.join(DATA, "videos.json")
CATS = os.path.join(DATA, "categories.json")
OVERRIDES = os.path.join(DATA, "overrides.json")
SERIES = os.path.join(DATA, "series.json")
USERNAME = os.environ.get("APARAT_USERNAME", "goharimanesh")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# ------------------------------------------------------------------ text utils
FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
DIACRITICS = re.compile(r"[ً-ٰٟـ]")


def normalize(s):
    s = html.unescape(str(s or ""))
    s = s.replace("ي", "ی").replace("ى", "ی").replace("ك", "ک").replace("ة", "ه").replace("ۀ", "ه").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    s = s.translate(FA_DIGITS)
    s = DIACRITICS.sub("", s)
    s = s.replace("‌", " ").replace("‏", " ").replace("‎", " ")
    s = re.sub(r"[\-_–—:،,؛;!؟?\.\(\)\[\]«»\"'/|#*+]", " ", s)
    return re.sub(r"\s+", " ", s).strip().lower()


def clean_text(s):
    s = html.unescape(str(s or ""))
    s = s.replace("\r", "")
    return re.sub(r"\n{3,}", "\n\n", s).strip()


# ------------------------------------------------------------------ dates
FA_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"]


def g2j(gy, gm, gd):
    """Gregorian -> Jalali"""
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) + ((gy2 + 399) // 400) + gd + g_d_m[gm - 1]
    jy = -1595 + (33 * (days // 12053))
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        jm, jd = 1 + days // 31, 1 + days % 31
    else:
        jm, jd = 7 + (days - 186) // 30, 1 + (days - 186) % 30
    return jy, jm, jd


def parse_fa_date(s):
    """'14 خرداد 1405 00:23' -> (1405, 3, 14, '00:23')"""
    s = normalize_digits(str(s or ""))
    m = re.search(r"(\d{1,2})\s+(\S+)\s+(\d{4})(?:\s+(\d{1,2}:\d{2}))?", s)
    if m:
        name = m.group(2).replace("ي", "ی")
        if name in FA_MONTHS:
            return int(m.group(3)), FA_MONTHS.index(name) + 1, int(m.group(1)), m.group(4) or "00:00"
    m = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}:\d{2}))?", s)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y > 1700:  # gregorian
            y, mo, d = g2j(y, mo, d)
        return y, mo, d, m.group(4) or "00:00"
    return None


def normalize_digits(s):
    return s.translate(FA_DIGITS)


def date_fields(parsed):
    if not parsed:
        now = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=3, minutes=30)
        parsed = (*g2j(now.year, now.month, now.day), now.strftime("%H:%M"))
    y, mo, d, t = parsed
    hh, mm = (t.split(":") + ["0"])[:2]
    return {
        "jdate": f"{y:04d}/{mo:02d}/{d:02d}",
        "time": f"{int(hh):02d}:{int(mm):02d}",
        "ts": int(f"{y:04d}{mo:02d}{d:02d}{int(hh):02d}{int(mm):02d}"),
    }


# ------------------------------------------------------------------ classification
def load_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def compile_cats(cfg):
    out = []
    for c in cfg["categories"]:
        kws = []
        for k in c.get("keywords", []):
            word, w = (k, 1.0) if isinstance(k, str) else (k[0], float(k[1]))
            nk = normalize(word)
            if nk:
                kws.append((nk, w))
        out.append((c["id"], kws))
    return out


def contains(hay, needle):
    # word-ish match: for short latin tokens require boundaries
    # short keywords (e.g. «قاب», «ورد», "sam") must match a whole word,
    # otherwise «قاب» would match «مقابل» and «ورد» would match «مورد».
    if len(needle) <= 3 or re.fullmatch(r"[a-z0-9 ]{1,4}", needle):
        return re.search(r"(?<![\w])" + re.escape(needle) + r"(?![\w])", hay) is not None
    return needle in hay


CULTURE_APARAT = {"مذهبی", "فرهنگ و هنر", "شخصی", "طنز و کمدی", "بازی و سرگرمی"}


def classify(v, compiled, fallback, overrides):
    if v["uid"] in overrides:
        return overrides[v["uid"]]
    title = " " + normalize(v.get("title")) + " "
    tags = " " + normalize(" ، ".join(v.get("tags") or [])) + " "
    desc = " " + normalize((v.get("desc") or "")[:600]) + " "
    best, best_score = fallback, 0.0
    for order, (cid, kws) in enumerate(compiled):
        score = 0.0
        for k, w in kws:
            if contains(title, k):
                score += 3 * w
            if contains(tags, k):
                score += 1 * w
        if score == 0:
            for k, w in kws:
                if contains(desc, k):
                    score += 0.3 * w
        if cid == "culture" and v.get("aparat_cat") in CULTURE_APARAT:
            score += 6
        if score > best_score + 1e-9:
            best, best_score = cid, score
    return best


# ------------------------------------------------------------------ series detection
ORDINALS = "اول|دوم|سوم|چهارم|پنجم|ششم|هفتم|هشتم|نهم|دهم|یازدهم|دوازدهم|دوازهم|سیزدهم|چهاردهم|پانزدهم|آخر"


def series_label(title):
    t = html.unescape(title)
    t = re.sub(r"\(.*?\)", " ", t)
    t = re.sub(r"(قسمت|جلسه|بخش|مثال|مرحله|part|session)\s*[:\-]?\s*(" + ORDINALS + r"|[0-9۰-۹]+)?", " ", t, flags=re.I)
    t = re.sub(r"\b(" + ORDINALS + r")\b", " ", t)
    t = re.sub(r"[0-9۰-۹]+", " ", t)
    t = re.sub(r"[:\-–—_،,]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip(" .:-")
    return t


def _rule_match(title, rule):
    t = " " + normalize(title) + " "
    alls = [normalize(k) for k in rule.get("all", [])]
    anys = [normalize(k) for k in rule.get("any", [])]
    nones = [normalize(k) for k in rule.get("none", [])]
    if any(not contains(t, k) for k in alls):
        return False
    if anys and not any(contains(t, k) for k in anys):
        return False
    if any(contains(t, k) for k in nones):
        return False
    return bool(alls or anys)


def detect_series(videos):
    rules = [r for r in load_json(SERIES, {"series": []}).get("series", []) if r.get("id")]
    members = {}
    titles = {}
    rest = []
    for v in sorted(videos, key=lambda x: x["ts"]):
        for r in rules:
            if _rule_match(v["title"], r):
                members.setdefault(r["id"], []).append(v)
                titles[r["id"]] = r.get("title") or r["id"]
                break
        else:
            rest.append(v)
    # automatic grouping for everything else
    groups = {}
    for v in rest:
        lab = series_label(v["title"])
        key = normalize(lab)
        if len(key) >= 6:
            groups.setdefault(key, []).append((v, lab))
    for key, items in groups.items():
        if len(items) >= 3:
            sid = "auto-" + format(hash_str(key) % 0xFFFFFF, "06x")
            members[sid] = [v for v, _ in items]
            titles[sid] = min((lab for _, lab in items), key=len)
    series = []
    for sid, items in members.items():
        if len(items) < 2:
            continue
        items.sort(key=lambda v: v["ts"])
        cats = {}
        for v in items:
            v["series"] = sid
            cats[v["cat"]] = cats.get(v["cat"], 0) + 1
        series.append({
            "id": sid, "title": titles[sid], "count": len(items),
            "cat": max(cats, key=cats.get),
            "uids": [v["uid"] for v in items],
            "views": sum(v.get("views", 0) for v in items),
            "duration": sum(v.get("duration", 0) for v in items),
        })
    series.sort(key=lambda s: -s["views"])
    return series


def hash_str(s):
    h = 2166136261
    for ch in s.encode("utf-8"):
        h = ((h ^ ch) * 16777619) & 0xFFFFFFFF
    return h


# ------------------------------------------------------------------ build / save
def finalize(videos):
    cfg = load_json(CATS, {"categories": [], "fallback": "misc"})
    overrides = {k: v for k, v in load_json(OVERRIDES, {}).items() if not k.startswith("_")}
    compiled = compile_cats(cfg)
    valid = {c["id"] for c in cfg["categories"]}
    for v in videos:
        v.pop("series", None)
        c = classify(v, compiled, cfg.get("fallback", "misc"), overrides)
        v["cat"] = c if c in valid else cfg.get("fallback", "misc")
    videos.sort(key=lambda v: -v["ts"])
    series = detect_series(videos)
    for v in videos:
        v.setdefault("series", None)
    out = {
        "_note": "این فایل به‌صورت خودکار با scripts/aparat_sync.py ساخته می‌شود.",
        "channel": USERNAME,
        "generated": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "count": len(videos),
        "series": series,
        "videos": videos,
    }
    with open(VIDEOS, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=0, separators=(",", ":"))
    counts = {}
    for v in videos:
        counts[v["cat"]] = counts.get(v["cat"], 0) + 1
    print(f"✓ {len(videos)} videos, {len(series)} series →", VIDEOS)
    for c in cfg["categories"]:
        print(f"   {c['id']:<11} {counts.get(c['id'], 0):>4}  {c['title']}")


def load_videos():
    return load_json(VIDEOS, {"videos": []}).get("videos", [])


def make_video(uid, title, views=0, likes=0, duration=0, date=None, tags=None, desc="", poster="", aparat_cat=""):
    v = {
        "uid": uid,
        "title": clean_text(title),
        "views": int(views or 0),
        "likes": int(likes or 0),
        "duration": int(float(duration or 0)),
        "tags": [t.strip() for t in (tags or []) if t and t.strip()],
        "desc": clean_text(desc),
        "poster": poster or "",
        "aparat_cat": aparat_cat or "",
    }
    v.update(date_fields(parse_fa_date(date)))
    return v


# ------------------------------------------------------------------ import from xlsx
def cmd_import_xlsx(path):
    import ast
    import openpyxl
    old = {v["uid"]: v for v in load_videos()}
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    head = [str(h or "").strip() for h in rows[0]]

    def col(r, name, idx):
        i = head.index(name) if name in head else idx
        return r[i] if i < len(r) else None

    videos = []
    for r in rows[1:]:
        uid = col(r, "UID", 1)
        if not uid:
            continue
        cat = col(r, "دسته‌بندی", 10)
        try:
            cat = ast.literal_eval(cat).get("name", "") if cat else ""
        except Exception:
            cat = str(cat or "")
        v = make_video(
            uid=str(uid).strip(),
            title=col(r, "عنوان", 0),
            views=col(r, "تعداد بازدید", 6),
            likes=col(r, "تعداد لایک", 7),
            duration=col(r, "مدت زمان", 8),
            date=col(r, "تاریخ انتشار", 9),
            tags=str(col(r, "برچسب‌ها", 11) or "").split(","),
            desc=col(r, "توضیحات", 12),
            aparat_cat=cat,
        )
        if v["uid"] in old and old[v["uid"]].get("poster"):
            v["poster"] = old[v["uid"]]["poster"]
        videos.append(v)
    # keep videos that exist in json but not in the xlsx (e.g. synced later)
    seen = {v["uid"] for v in videos}
    videos += [v for u, v in old.items() if u not in seen]
    finalize(videos)


# ------------------------------------------------------------------ sync from Aparat
def http_json(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json, text/plain, */*", "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8", "Referer": "https://www.aparat.com/"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8", "replace"))
        except Exception as e:  # noqa
            last = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"fetch failed: {url} → {last}")


def first(d, *keys, default=None):
    for k in keys:
        if isinstance(d, dict) and d.get(k) not in (None, ""):
            return d[k]
    return default


def parse_tags(t):
    if not t:
        return []
    if isinstance(t, str):
        return [x.strip() for x in re.split(r"[,،]", t) if x.strip()]
    out = []
    for x in t:
        out.append(x.get("name") or x.get("title") if isinstance(x, dict) else str(x))
    return [x for x in out if x]


def list_channel(full=False, known=()):
    url = f"https://www.aparat.com/etc/api/videoByUser/username/{USERNAME}/perpage/50"
    items, pages = [], 0
    while url and pages < 60:
        data = http_json(url)
        batch = first(data, "videobyuser", "videoByUser", default=[]) or []
        items += batch
        pages += 1
        if not full and batch and all(b.get("uid") in known for b in batch):
            break
        ui = data.get("ui") or {}
        nxt = ui.get("pagingForward") or ""
        url = nxt if nxt and nxt.startswith("http") else None
        time.sleep(0.8)
    return items


def video_details(uid):
    try:
        d = http_json(f"https://www.aparat.com/etc/api/video/videohash/{uid}")
        return d.get("video") or {}
    except Exception as e:
        print("  ! details failed", uid, e)
        return {}


def cmd_sync(full=False):
    videos = load_videos()
    by_uid = {v["uid"]: v for v in videos}
    try:
        listing = list_channel(full=full, known=set(by_uid))
    except Exception as e:
        print("✗ Aparat is not reachable:", e)
        sys.exit(0 if os.environ.get("CI") else 1)
    new = 0
    for it in listing:
        uid = it.get("uid")
        if not uid:
            continue
        poster = first(it, "big_poster", "small_poster", default="")
        views = first(it, "visit_cnt", "view_cnt", default=None)
        if uid in by_uid:
            v = by_uid[uid]
            if views is not None:
                v["views"] = max(int(views), v.get("views", 0))
            if poster and not v.get("poster"):
                v["poster"] = poster
            continue
        det = video_details(uid)
        v = make_video(
            uid=uid,
            title=first(det, "title", default=it.get("title", "")),
            views=views or first(det, "visit_cnt", default=0),
            likes=first(det, "like_cnt", default=0),
            duration=first(it, "duration", default=first(det, "duration", default=0)),
            date=first(det, "create_date", "date_exact", "sdate_rss", default=first(it, "create_date", "date_exact", default=None)),
            tags=parse_tags(first(det, "tags", default=[])),
            desc=first(det, "description", default=""),
            poster=poster or first(det, "big_poster", "small_poster", default=""),
            aparat_cat=first(det, "cat_name", default=""),
        )
        videos.append(v)
        by_uid[uid] = v
        new += 1
        print("  + new:", v["title"])
        time.sleep(0.5)
    print(f"✓ fetched {len(listing)} items from Aparat, {new} new")
    finalize(videos)


def main(argv):
    if len(argv) < 2 or argv[1] in ("-h", "--help"):
        print(__doc__)
        return
    cmd = argv[1]
    if cmd == "import-xlsx":
        cmd_import_xlsx(argv[2])
    elif cmd == "sync":
        cmd_sync(full="--full" in argv)
    elif cmd == "classify":
        finalize(load_videos())
    else:
        print("unknown command", cmd)
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv)
