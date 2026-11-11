@echo off
cd /d "%~dp0"
echo Telugu Dialogue Battle - local client review
echo If the preview is already running, open http://127.0.0.1:8787/review/
echo Otherwise this command builds and starts it. Keep this window open.
call npm run review
pause
