@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在啟動電波澎澎內部系統...

echo [1/2] 啟動後端伺服器 (資料庫與 API)...
start "Backend Server" cmd /k "cd backend && npm install && node server.js"

echo [2/2] 啟動前端伺服器 (網頁介面)...
start "Frontend Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo 伺服器啟動中，請稍候...
timeout /t 5 >nul

echo 正在開啟瀏覽器前往系統...
start http://localhost:5173/admin/login
echo.
echo 完成！您可以關閉此視窗（但請勿關閉另外彈出的兩個伺服器黑窗）。
pause
