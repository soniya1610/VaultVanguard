@echo off
echo ======================================================================
echo  TrustBridge (VaultVanguard) - Starting All Microservices
echo ======================================================================

cd /d "%~dp0\.."

python run_production.py
pause
