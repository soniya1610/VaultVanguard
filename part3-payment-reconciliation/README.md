# Part 3 — Payment Orchestration & Reconciliation Engine

The **Payment Orchestration & Reconciliation Engine** executes UPI payments, simulates asynchronous downstream failures, runs the 6-point independent reconciliation checks, and performs exactly-once idempotent settlements.

---

## Key Responsibilities

1. **Payment Initiation (`/api/payment/initiate`)**:
   - Transitions `CONFIRMED → PAYMENT_INITIATED → PAYMENT_PENDING`.
   - Dispatches payment requests to Mock UPI Gateway.
2. **Deliberate Failure Injection (Live Demo Contradiction)**:
   - Gateway returns `SUCCESS ₹250.00`.
   - Merchant ledger is intentionally kept at `PENDING ₹250.00`.
   - Surfaces the visible contradiction: **Gateway: SUCCESS** vs **Merchant: PENDING**.
3. **Reconciliation Engine (`/api/payment/reconcile`)**:
   - Executes the 6-point verification:
     1. Payer match
     2. Receiver match
     3. Amount match
     4. Passport ID match
     5. Payment reference match
     6. Authoritative gateway status == SUCCESS
   - Transitions: `MISMATCH_DETECTED → RECONCILING → VERIFIED → SETTLED`.
   - Synchronizes Part 2 and Part 4 (Merchant Dashboard) in real time!
4. **Idempotent Exactly-Once Settlement**:
   - Replaying duplicate gateway callbacks or retrying reconciliation refuses duplicate settlement records.

---

## API Endpoints (`:8001`)

- `GET  /api/health` — Health check & stats.
- `POST /api/passport/import` — Import CONFIRMED passport from Part 2.
- `POST /api/payment/initiate` — Initiate UPI payment.
- `POST /api/payment/gateway-callback` — Process gateway webhook (with replay detection).
- `POST /api/payment/reconcile` — Execute 6-point cross-verification.
- `GET  /api/payment/{ref}` — Fetch payment record.
- `GET  /api/merchant/{id}` — Fetch merchant ledger status.
- `GET  /api/settlements` — List settlements and idempotency keys.
- `GET  /api/audit/{id}` — Full audit event log for a passport.
- `POST /api/demo/seed` — Seed demo passport.
- `POST /api/demo/reset` — Reset store.

---

## Quickstart

### Backend (Port 8001)
```bash
cd part3-payment-reconciliation/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend (Port 5174)
```bash
cd part3-payment-reconciliation/frontend
npm run dev
```

### Unit Tests
```bash
pytest part3-payment-reconciliation/backend/tests
```
