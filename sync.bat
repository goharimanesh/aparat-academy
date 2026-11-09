@echo off
REM ==================================================================
REM  همگام‌سازی آکادمی ویدیویی با آپارات — اجرا روی رایانه‌ای در ایران
REM  Powered by Dr. Masoud Goharimanesh
REM  دوبار کلیک کنید، یا برای اجرای خودکار: sync.bat auto
REM ==================================================================
chcp 65001 >nul
cd /d "%~dp0"

set PY=python
where python >nul 2>&1 || set PY=py

echo.
echo [1/4] Getting latest version from GitHub (git pull)...
git pull --rebase
if errorlevel 1 goto :err

echo.
echo [2/4] Fetching new videos from Aparat...
%PY% scripts\aparat_sync.py sync
if errorlevel 1 goto :err

git diff --quiet -- data/videos.json
if not errorlevel 1 (
  echo.
  echo No new videos or view changes. Nothing to upload.
  goto :end
)

echo.
echo [3/4] Saving changes (git commit)...
git add data/videos.json
git commit -m "sync: new Aparat videos"
if errorlevel 1 goto :err

echo.
echo [4/4] Uploading to GitHub (git push)...
git push
if errorlevel 1 goto :err

echo.
echo Done. The site updates in 1-2 minutes.
:end
if /i not "%1"=="auto" pause
exit /b 0

:err
echo.
echo *** ERROR: see the messages above. ***
if /i not "%1"=="auto" pause
exit /b 1
