# Part 4 — Merchant Dashboard & Dispute Resolution

The **Merchant Dashboard & Dispute Resolution** layer visualizes the creditor/merchant ledger, highlights the intentional downstream synchronization failure, receives live reconciliation updates, and resolves post-settlement "he said / she said" disputes using immutable evidence.

---

## Key Responsibilities

1. **Merchant / Creditor Dashboard (Riya's View)**:
   - Renders incoming obligations, ledger balances, and payment statuses.
   - Highlights the live-demo contradiction: **Gateway: SUCCESS** vs **Dashboard: PENDING**.
   - Receives real-time state synchronization when Reconciliation completes (`PENDING → SETTLED`).
2. **The "He Said / She Said" Dispute Simulator**:
   - Reenacts later disagreements: Riya claims *"I never received that ₹250,"* while Arjun replies *"I already paid you."*
3. **Structured Human-Readable Evidence Timeline**:
   - Translates raw backend events and cryptographic hashes into verified human-readable findings:
     - **Original Agreement**: Arjun agreed to repay ₹250 for tea
     - **Mutual Confirmation**: Arjun and Riya both confirmed
     - **Payment Attempt**: ₹250 initiated via UPI
     - **Gateway Evidence**: Authoritative SUCCESS
     - **Merchant Evidence**: Initially PENDING (Lag)
     - **Reconciliation Verdict**: Gateway status independently verified (6/6 checks passed)
     - **Final State**: SETTLED (Idempotent exactly-once)
4. **Dispute State Lifecycle**:
   - Manages: `SETTLED → DISPUTED → UNDER_REVIEW → RESOLVED`.
   - Preserves original settlement evidence without overwriting historical records.

---

## API Endpoints (`:8003`)

- `GET  /api/health` — Health check & peer URLs.
- `GET  /api/merchant/dashboard` — Riya's dashboard metrics and transactions.
- `POST /api/merchant/sync` — Webhook endpoint for live reconciliation updates.
- `POST /api/dispute/file` — File dispute with claim & defense.
- `POST /api/dispute/{id}/review` — Move dispute to `UNDER_REVIEW`.
- `POST /api/dispute/{id}/resolve` — Resolve dispute using verified evidence.
- `GET  /api/dispute/{passport_id}/evidence` — Retrieve structured evidence timeline package.
- `GET  /api/disputes` — List all active and resolved disputes.
- `POST /api/demo/seed` — Seed demo state with deliberate PENDING lag.
- `POST /api/demo/reset` — Clear store.

---

## Quickstart

### Backend (Port 8003)
```bash
cd part4-dashboard-dispute/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

### Frontend (Port 5176)
```bash
cd part4-dashboard-dispute/frontend
npm run dev
```

### Unit Tests
```bash
pytest part4-dashboard-dispute/backend/tests
```
