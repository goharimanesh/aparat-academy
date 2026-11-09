#!/usr/bin/env bash
# همگام‌سازی آکادمی ویدیویی با آپارات (لینوکس/مک) — Powered by Dr. Masoud Goharimanesh
set -e
cd "$(dirname "$0")"
git pull --rebase
python3 scripts/aparat_sync.py sync
if git diff --quiet -- data/videos.json; then echo "No new videos."; exit 0; fi
git add data/videos.json
git commit -m "sync: new Aparat videos"
git push
echo "Done. The site updates in 1-2 minutes."
