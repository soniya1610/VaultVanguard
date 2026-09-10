@echo off
echo ======================================================================
echo  TrustBridge (VaultVanguard) - Running Master Test Suite
echo ======================================================================

cd /d "%~dp0\.."

echo.
echo [1/5] Running Part 1 (NLP & Consent) Unit Tests:
pytest part1-conversation-nlp/backend/tests
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo [2/5] Running Part 2 (Transaction Passport) Unit Tests:
pytest part2-transaction-passport/backend/tests
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo [3/5] Running Part 3 (Payment & Reconciliation) Unit Tests:
pytest part3-payment-reconciliation/backend/tests
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo [4/5] Running Part 4 (Dashboard & Dispute) Unit Tests:
pytest part4-dashboard-dispute/backend/tests
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo [5/5] Running Master End-to-End Continuous Journey Test:
python tests/test_end_to_end.py
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo ======================================================================
echo  ALL TEST SUITES PASSED SUCCESSFULLY!
echo ======================================================================
pause
