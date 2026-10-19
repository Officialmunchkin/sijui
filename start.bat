@echo off
title FAM VAULT - Starting...
color 0B
echo ============================================
echo    FAM VAULT - Starting your app...
echo ============================================
echo.

:: Full paths so this works no matter where it's launched from
set "PHP=C:\Users\Admin\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
set "ROOT=C:\Users\Admin\OneDrive\Desktop\famvault-site"

:: --- Start the Laravel backend in its own window ---
start "FAM VAULT - Backend (8000)" cmd /k "cd /d "%ROOT%\backend" && "%PHP%" artisan serve --port=8000"

:: --- Wait for the backend to come up ---
echo Starting backend...
:waitbackend
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if errorlevel 1 goto waitbackend
echo Backend is up.

:: --- Start the React frontend in its own window ---
start "FAM VAULT - Frontend (5173)" cmd /k "cd /d "%ROOT%\frontend" && npm run dev"

:: --- Wait for the frontend to come up ---
echo Starting frontend...
:waitfrontend
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if errorlevel 1 goto waitfrontend
echo Frontend is up.

:: --- Open the app in your default browser ---
echo Opening FAM VAULT in your browser...
start "" "http://127.0.0.1:5173"

echo.
echo ============================================
echo    FAM VAULT is running!
echo    Site:   http://127.0.0.1:5173
echo    API:    http://127.0.0.1:8000
echo.
echo    Keep the two server windows open.
echo    Close them to stop the app.
echo ============================================
echo.
pause
