# VaultVanguard — TrustBridge Autonomous Financial Layer

Welcome to **VaultVanguard**, the monorepo for **TrustBridge** — an autonomous fintech infrastructure that turns natural conversation into verified, immutable, reconciled financial transactions.

Every requirement and narrative milestone from [`content.md`](content.md) has been fully implemented, matched, and interconnected across all 4 microservices.

---

## Overall Architecture

TrustBridge is divided into four decoupled, fully functional microservices:

```
VaultVanguard/
├── part1-conversation-nlp/          # [ACTIVE] Conversation, NLP & Mutual Consent Layer (Backend :8000, Frontend :5173)
├── part2-transaction-passport/      # [ACTIVE] Transaction Passport & State Machine (Backend :8002, Frontend :5175)
├── part3-payment-reconciliation/    # [ACTIVE] Payment Execution & Reconciliation Engine (Backend :8001, Frontend :5174)
├── part4-dashboard-dispute/         # [ACTIVE] Merchant Dashboard & Dispute Resolution (Backend :8003, Frontend :5176)
├── tests/                           # Master End-to-End Validation Suite
└── scripts/                         # Unified Startup & Testing Utilities
```

---

## Port Allocation Matrix

| Service | Backend API | Frontend App | Responsibility |
| :--- | :--- | :--- | :--- |
| **Part 1** | `http://localhost:8000` | `http://localhost:5173` | Chat UI, LLM/Rule-Based NLP detection, 2-Party Mutual Consent |
| **Part 2** | `http://localhost:8002` | `http://localhost:5175` | Minting `TP-2026-XXXXXXX`, SHA-256 evidence hashing, UPI Deep Links, State Machine |
| **Part 3** | `http://localhost:8001` | `http://localhost:5174` | Mock UPI Gateway, Contradiction Injection, 6-Point Reconciliation, Idempotency |
| **Part 4** | `http://localhost:8003` | `http://localhost:5176` | Riya's Merchant Dashboard (Lag display), "He Said / She Said" Dispute Timeline |

---

## The End-to-End Transaction Journey (per `content.md`)

```
1. Casual Chat (Arjun & Riya, ₹250 Tea Repayment)
   └── Part 1 Chat Window
2. NLP Intent Detection & Inline Obligation Card
   └── Extracted: Payer=Arjun, Receiver=Riya, Amount=₹250, Purpose=tea
3. Two-Party Mutual Consent
   └── Both Arjun and Riya confirm -> Status: MUTUAL_CONSENT_REACHED
4. Transaction Passport Minting
   └── Part 2 mints TP-2026-XXXXXXX with SHA-256 evidence digest & UPI deep link
5. Payment Initiation
   └── Arjun clicks 'Pay Now' directly in chat / passport card
6. Gateway SUCCESS vs Merchant PENDING (Deliberate Contradiction)
   └── Gateway reports SUCCESS ₹250.00 while Riya's dashboard remains PENDING ₹250.00
7. Reconciliation Engine Execution
   └── 6-point independent cross-verification against authoritative gateway
8. State Correction & Idempotent Settlement
   └── State moves to VERIFIED -> SETTLED; duplicate callbacks rejected
9. Merchant Dashboard Live Sync
   └── Riya's dashboard updates from PENDING -> SETTLED in real time
10. Later Dispute Resolution ("He Said / She Said")
   └── Participant clicks 'Dispute / View Evidence' to inspect verifiable human-readable findings
```

---

## Quickstart

### Launch All Services (Multi-Process Supervisor)
```bash
python run_production.py
```
*Or on Windows:*
```cmd
scripts\start-all.bat
```

### Run Master Test Suite
```bash
python tests/test_end_to_end.py
```
*Or on Windows:*
```cmd
scripts\test-all.bat
```

### Run Individual Test Suites
```bash
# Part 1 Unit Tests (30 tests)
pytest part1-conversation-nlp/backend/tests

# Part 2 Unit Tests (3 tests)
pytest part2-transaction-passport/backend/tests

# Part 3 Unit Tests (2 tests)
pytest part3-payment-reconciliation/backend/tests

# Part 4 Unit Tests (3 tests)
pytest part4-dashboard-dispute/backend/tests
```

---

## State Machine Lifecycle

```
Normal Flow:
DETECTED → CONFIRMED → PAYMENT_INITIATED → PAYMENT_PENDING → VERIFIED → SETTLED

Failure & Reconciliation Flow:
PAYMENT_PENDING → MISMATCH_DETECTED → RECONCILING → VERIFIED → SETTLED

Post-Settlement Dispute Flow:
SETTLED → DISPUTED → UNDER_REVIEW → RESOLVED
```