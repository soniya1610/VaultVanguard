# VaultVanguard — TrustBridge Autonomous Financial Layer

Welcome to **VaultVanguard**, the monorepo repository for **TrustBridge** — an autonomous fintech infrastructure that turns natural conversation into verified, immutable, reconciled financial transactions.

---

## Overall Architecture

TrustBridge is divided into four decoupled, modular services:

```
VaultVanguard/
├── part1-conversation-nlp/          # [ACTIVE] Conversation, NLP & Mutual Consent Layer
├── part2-transaction-passport/      # [PLACEHOLDER] Transaction Passport & State Machine
├── part3-payment-reconciliation/    # [PLACEHOLDER] Payment Execution & Settlement Engine
└── part4-dashboard-dispute/         # [PLACEHOLDER] Merchant Dashboard & Dispute Resolution
```

### Module Responsibilities

1. **Part 1 — Conversation, NLP & Mutual Consent Layer (`part1-conversation-nlp/`)**:
   - **Owner**: Part 1 Team Contribution.
   - **Function**: Continuously analyzes chat streams between users (e.g. Arjun and Riya), detects financial obligations using OpenAI LLM + standalone Rule-Based Fallback, manages 2-Party Mutual Consent, and emits structured handoff payloads to Part 2.
2. **Part 2 — Transaction Passport & State Machine (`part2-transaction-passport/`)**:
   - **Function**: Receives handoff payload from Part 1, validates immutable conversation evidence, generates the official Transaction Passport (`TP-2026-XXXXXXX`), and manages life-cycle state transitions.
3. **Part 3 — Payment Execution & Reconciliation (`part3-payment-reconciliation/`)**:
   - **Function**: Handles payment gateway/UPI execution, webhooks, and ledger reconciliation against issued Transaction Passports.
4. **Part 4 — Merchant Dashboard & Disputes (`part4-dashboard-dispute/`)**:
   - **Function**: Renders analytics, merchant settlement views, and dispute resolution workflows backed by conversation evidence.

---

## Part 1 Integration Handoff Contract

When mutual consent is reached by both participants in Part 1 (`payer_confirmed: true` AND `receiver_confirmed: true`), Part 1 dispatches a POST request to Part 2's endpoint `/api/passport/create`:

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
  "created_at": "2026-09-08T22:30:00Z"
}
```

Detailed specification is located at [`part1-conversation-nlp/docs/HANDOFF_CONTRACT.md`](file:///c:/Users/Monika%20Yadav/OneDrive/Desktop/Hyperion/VaultVanguard/part1-conversation-nlp/docs/HANDOFF_CONTRACT.md).

---

## Quickstart — Running Part 1 Standalone

### Backend Startup (Python + FastAPI)
```bash
cd part1-conversation-nlp/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Startup (React + Vite)
```bash
cd part1-conversation-nlp/frontend
npm run dev
```

### Run Test Suite
```bash
cd part1-conversation-nlp/backend
python -m pytest
```

For comprehensive Part 1 documentation, setup guides, API endpoints, and security considerations, see [`part1-conversation-nlp/README.md`](file:///c:/Users/Monika%20Yadav/OneDrive/Desktop/Hyperion/VaultVanguard/part1-conversation-nlp/README.md).