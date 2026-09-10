# Part 2 — Transaction Passport & State Machine

The **Transaction Passport & State Machine** layer serves as the permanent identity and central source of truth for every financial commitment in TrustBridge.

---

## Key Responsibilities

1. **Handoff Reception (`/api/passport/create`)**:
   - Receives the 2-party confirmed handoff payload from Part 1.
2. **Cryptographic Proof Generation**:
   - Computes deterministic **SHA-256 evidence digests** of original chat messages, participant identities, and mutual confirmations.
3. **Official Passport Minting**:
   - Mints unique Transaction Passports (e.g., `TP-2026-8F42X91`).
4. **UPI Deep Link Generation**:
   - Generates standard NPCI UPI payment links (`upi://pay?pa=...&am=250.00&cu=INR&tn=TP-2026-...`) for the Pay Now action.
5. **State Machine Lifecycle Management**:
   - Governs legal transitions:
     `DETECTED → CONFIRMED → PAYMENT_INITIATED → PAYMENT_PENDING → PAYMENT_PROCESSED → MISMATCH_DETECTED → RECONCILING → VERIFIED → SETTLED → DISPUTED → UNDER_REVIEW → RESOLVED`.
6. **Permanent Timeline Ledger**:
   - Maintains a chronological audit trail answering what was agreed, who confirmed it, payment gateway results, mismatch detection, reconciliation, settlement, and disputes.

---

## API Endpoints (`:8002`)

- `GET  /api/health` — Microservice health & peer connectivity.
- `POST /api/passport/create` — Mint passport from Part 1 handoff payload.
- `GET  /api/passport/{id}` — Full passport record with evidence and status.
- `GET  /api/passports` — List all minted passports.
- `POST /api/passport/{id}/transition` — Transition lifecycle state (with strict validation).
- `GET  /api/passport/{id}/timeline` — Chronological milestones list.
- `GET  /api/passport/{id}/upi` — UPI Deep Link & QR parameters.
- `GET  /api/passport/{id}/verify` — Live cryptographic evidence verification against SHA-256 hash.
- `POST /api/demo/seed` — Seed demo passport (`TP-2026-...` Arjun → Riya ₹250).
- `POST /api/demo/reset` — Clear store.

---

## Quickstart

### Backend (Port 8002)
```bash
cd part2-transaction-passport/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

### Frontend (Port 5175)
```bash
cd part2-transaction-passport/frontend
npm run dev
```

### Unit Tests
```bash
pytest part2-transaction-passport/backend/tests
```
