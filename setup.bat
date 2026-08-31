@echo off
echo ========================================
echo FashionBiz AI - Setup Script
echo ========================================
echo.

echo [1/4] Memeriksa Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker tidak terinstal atau tidak berjalan
    pause
    exit /b 1
)
echo Docker terdeteksi.

echo.
echo [2/4] Membangun Docker images...
docker-compose build

echo.
echo [3/4] Menjalankan containers...
docker-compose up -d

echo.
echo [4/4] Menjalankan setup database...
timeout /t 5 /nobreak >nul
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed

echo.
echo ========================================
echo Setup selesai!
echo ========================================
echo.
echo Akses aplikasi di: http://localhost:3000
echo Demo akun: demo@fashionbiz.ai / demo123
echo.
echo Perintah yang berguna:
echo   docker-compose logs -f    : Melihat logs
echo   docker-compose down       : Menghentikan containers
echo   docker-compose up -d      : Menjalankan kembali
echo.
pause
