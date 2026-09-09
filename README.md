# VaultVanguard — TrustBridge Autonomous Financial Layer

> **TrustBridge** turns natural conversation into verified, immutable, reconciled financial transactions — autonomously, without manual payment forms.

---

## Overall Architecture

TrustBridge is divided into four decoupled, modular services:

```
VaultVanguard/
├── part1-conversation-nlp/       [ACTIVE ✅]  Conversation, NLP & Mutual Consent Layer
├── part2-transaction-passport/   [PLACEHOLDER ⏳]  Transaction Passport & State Machine
├── part3-payment-reconciliation/ [ACTIVE ✅]  Payment Execution & Settlement Engine
└── part4-dashboard-dispute/      [ACTIVE ✅]  Merchant Dashboard & Dispute Resolution
```

### Data Flow

```
User Chat (Arjun ↔ Riya)
    │
    ▼
[Part 1 — NLP Engine] ──── detects "You owe me ₹250 for tea"
    │                       2-Party Mutual Consent (both click Confirm)
    │  POST /api/passport/create
    ▼
[Part 2 — Passport Service] ──── mints TP-2026-XXXXXXX  ← PLACEHOLDER
    │
    │  Passport handed off (CONFIRMED)
    ▼
[Part 3 — Payment & Reconciliation]
    │  Pay Now → Mock UPI Gateway → MISMATCH_DETECTED → Reconcile → SETTLED
    │
    │  Data consumed live via HTTP
    ▼
[Part 4 — Merchant Dashboard & Disputes]
    │  Analytics · Transaction monitoring · Dispute filing + resolution
```

---

## Module Status & Responsibilities

### Part 1 — Conversation, NLP & Mutual Consent `[ACTIVE ✅]`
- **Port**: Backend `8000`, Frontend `5173`
- **Stack**: Python 3.13 + FastAPI | React 18 + Vite 5 + Tailwind CSS
- **Function**: Reads natural chat streams, extracts financial intent via dual-engine NLP (OpenAI `gpt-4o-mini` + regex fallback), enforces 2-Party Mutual Consent, and emits a structured handoff payload to Part 2.
- **Consent States**: `PENDING → SINGLE_CONFIRMED → MUTUAL_CONSENT_REACHED` / `DISMISSED`
- **Docs**: [`part1-conversation-nlp/README.md`](part1-conversation-nlp/README.md)

### Part 2 — Transaction Passport & State Machine `[PLACEHOLDER ⏳]`
- **Function**: Will receive Part 1's handoff, validate immutable evidence, mint official `TP-2026-XXXXXXX` passports, and manage the lifecycle state machine.
- **Lifecycle**: `CREATED → MUTUAL_CONSENT → IN_SETTLEMENT → SETTLED / DISPUTED`
- **Contract**: [`part1-conversation-nlp/docs/HANDOFF_CONTRACT.md`](part1-conversation-nlp/docs/HANDOFF_CONTRACT.md)

### Part 3 — Payment Execution & Reconciliation `[ACTIVE ✅]`
- **Port**: Backend `8001`, Frontend `5173`
- **Stack**: Python + FastAPI | React 18 + Vite 5
- **Function**: Imports CONFIRMED passports, initiates Mock UPI payments, processes gateway callbacks, detects gateway/merchant mismatches, runs 6-point reconciliation engine, and creates idempotent settlement records.
- **Lifecycle**: `CONFIRMED → PAYMENT_INITIATED → PAYMENT_PENDING → PAYMENT_PROCESSED → MISMATCH_DETECTED → RECONCILING → VERIFIED → SETTLED`
- **Docs**: [`part3-payment-reconciliation/README.md`](part3-payment-reconciliation/README.md)

### Part 4 — Merchant Dashboard & Dispute Resolution `[ACTIVE ✅]`
- **Port**: Backend `8002`, Frontend `5174`
- **Stack**: Python + FastAPI + httpx | React 18 + Vite 5
- **Function**: Aggregates live data from Part 3, provides full merchant analytics dashboard, transaction monitoring, and a complete dispute lifecycle (OPEN → INVESTIGATING → RESOLVED/CLOSED) backed by immutable Part 1 conversation evidence.
- **Features**: 5-tab dashboard (Overview, Transactions, Disputes, Analytics, Audit Trail)
- **Docs**: [`part4-dashboard-dispute/README.md`](part4-dashboard-dispute/README.md)

---

## Quickstart — Running the Full Stack

> Start each service in a separate terminal.

### Part 1 — NLP & Consent (Port 8000 / 5173)
```bash
# Backend
cd part1-conversation-nlp/backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd part1-conversation-nlp/frontend
npm install && npm run dev
```

### Part 2 — Transaction Passport (Port TBD)
```bash
# Not yet implemented — placeholder directory only
```

### Part 3 — Payment & Reconciliation (Port 8001 / 5173)
```bash
# Backend
cd part3-payment-reconciliation/backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd part3-payment-reconciliation/frontend
npm install && npm run dev
```

### Part 4 — Merchant Dashboard & Disputes (Port 8002 / 5174)
```bash
# Backend
cd part4-dashboard-dispute/backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Frontend
cd part4-dashboard-dispute/frontend
npm install && npm run dev
# → http://localhost:5174
```

---

## Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```env
OPENAI_API_KEY=          # Optional — Part 1 falls back to rule-based NLP if absent
CONFIDENCE_THRESHOLD=0.75
DEFAULT_CURRENCY=INR
HOST=0.0.0.0
PORT=8000
P3_PORT=8001
P4_PORT=8002
PART3_BASE_URL=http://localhost:8001
PART1_BASE_URL=http://localhost:8000
```

---

## Part 1 → Part 2 Handoff Contract

When both parties confirm (`payer_confirmed: true` AND `receiver_confirmed: true`), Part 1 POSTs to Part 2's `/api/passport/create`:

```json
{
  "conversation_id": "conv-12345",
  "payer": "Arjun",
  "receiver": "Riya",
  "amount": 250.0,
  "currency": "INR",
  "purpose": "tea",
  "message_ids": ["m1", "m2"],
  "participants": ["Arjun", "Riya"],
  "confidence": 0.91,
  "payer_confirmed": true,
  "receiver_confirmed": true,
  "created_at": "2026-09-08T22:30:00Z",
  "conversation_evidence": [...],
  "confirmations": {
    "payer_confirmed_at": "...",
    "receiver_confirmed_at": "..."
  }
}
```

Full contract spec: [`part1-conversation-nlp/docs/HANDOFF_CONTRACT.md`](part1-conversation-nlp/docs/HANDOFF_CONTRACT.md)

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| NLP & Consent | Python 3.13, FastAPI, OpenAI `gpt-4o-mini`, Regex fallback |
| Payment Engine | Python, FastAPI, Mock UPI Gateway, 6-point Reconciliation |
| Dashboard | Python, FastAPI, `httpx` (upstream calls to Part 3) |
| All Frontends | React 18, Vite 5, Lucide Icons, Vanilla CSS (dark glassmorphism) |
| Storage | In-memory (hackathon) → PostgreSQL/Supabase (production target) |
| Testing | Pytest (Part 1 backend — `test_api.py`, `test_nlp.py`) |