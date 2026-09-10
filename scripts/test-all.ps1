# TrustBridge (VaultVanguard) - PowerShell Test Suite Runner
$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

Write-Host "`n[1/5] Running Part 1 (NLP & Consent) Unit Tests:" -ForegroundColor Cyan
pytest part1-conversation-nlp/backend/tests
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[2/5] Running Part 2 (Transaction Passport) Unit Tests:" -ForegroundColor Cyan
pytest part2-transaction-passport/backend/tests
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[3/5] Running Part 3 (Payment & Reconciliation) Unit Tests:" -ForegroundColor Cyan
pytest part3-payment-reconciliation/backend/tests
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[4/5] Running Part 4 (Dashboard & Dispute) Unit Tests:" -ForegroundColor Cyan
pytest part4-dashboard-dispute/backend/tests
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[5/5] Running Master End-to-End Continuous Journey Test:" -ForegroundColor Cyan
python tests/test_end_to_end.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " ALL TEST SUITES PASSED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "======================================================================`n" -ForegroundColor Green
