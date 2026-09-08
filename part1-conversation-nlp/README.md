# Part 1 — Conversation, NLP & Mutual Consent Layer

Part 1 is the entry-point layer of **TrustBridge**. It continuously monitors natural chat conversations between participants (e.g. Arjun and Riya), automatically extracts structured financial intent, enforces two-party mutual consent, and emits a structured handoff payload to the **Part 2 Transaction Passport** layer.

---

## Folder Structure

```
part1-conversation-nlp/
├── README.md
├── backend/
│   ├── main.py              # FastAPI server & route handlers
│   ├── config.py            # Settings (CONFIDENCE_THRESHOLD, API keys)
│   ├── models.py            # Pydantic data schemas
│   ├── store.py             # In-memory storage with DB abstraction
│   ├── nlp_service.py       # Dual LLM + Rule-Based Fallback NLP engine
│   ├── passport_mock.py     # Mock Part 2 Integration boundary handler
│   ├── requirements.txt     # Python dependencies
│   └── tests/
│       ├── test_api.py      # E2E API integration test suite
│       └── test_nlp.py      # NLP extraction test suite
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx          # Dual-View chat container
│       ├── api.js           # API client
│       └── components/
│           ├── ChatWindow.jsx        # Chat thread & message input
│           ├── DetectionCard.jsx     # Inline 2-party consent card
│           ├── HandoffInspector.jsx  # Real-time Part 2 handoff JSON view
│           ├── UserSwitcher.jsx      # Active user & dual view toggle
│           └── RejectedLogsModal.jsx # Audit log for rejected/dismissed detections
└── docs/
    ├── HANDOFF_CONTRACT.md  # Part 1 -> Part 2 REST API Contract
    └── NOTES.md             # Architectural design decisions
```

---

## Technologies Used

- **Backend**: Python 3.13+, FastAPI, Uvicorn, Pydantic v2, Pytest, OpenAI API.
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide Icons.
- **Communication**: REST API (JSON).

---

## Setup & Installation

### Environment Configuration
Copy `.env.example` to `.env` in the root repository or `backend/` directory:

```env
OPENAI_API_KEY=
CONFIDENCE_THRESHOLD=0.75
DEFAULT_CURRENCY=INR
HOST=0.0.0.0
PORT=8000
```
> **Note**: `OPENAI_API_KEY` is optional. If empty or unavailable, Part 1 operates standalone using its high-precision rule-based fallback engine.

### 1. Backend Startup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- Server: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

### 2. Frontend Startup
```bash
cd frontend
npm install
npm run dev
```
- Dev Server: `http://localhost:5173`


---

## Implemented API Endpoints

- `POST /api/chat/send`: Process chat message, execute NLP extraction, create pending consent card if confidence $\ge 0.75$.
- `GET /api/chat/messages`: Retrieve chat history & consent cards.
- `POST /api/consent/action`: Handle `confirm` or `dismiss` actions. On mutual consent, calls Part 2 handoff `/api/passport/create`.
- `POST /api/passport/create`: Handoff boundary endpoint.
- `POST /api/chat/reset`: Clear in-memory chat data.
- `POST /api/chat/seed-demo`: Seed demo script sequence.
- `GET /api/detections/rejected`: Audit log for low-confidence or dismissed detections.

---

## Two-Party Consent Mechanism

Consent state is tracked per transaction:
- `PENDING`: Card detected, waiting for party confirmation.
- `SINGLE_CONFIRMED`: One participant has confirmed.
- `MUTUAL_CONSENT_REACHED` (`BOTH_CONFIRMED`): Both `payer_confirmed: true` and `receiver_confirmed: true`.
- `DISMISSED`: Either party dismissed the card. Transaction is dropped without partial state lingering.

---

## Integration with Part 2

Part 1 does **NOT** own the Transaction Passport service. `passport_mock.py` exists solely as a temporary boundary mock to allow Part 1 to run standalone. In production, Part 2 will receive the payload at `/api/passport/create` and mint the official Transaction Passport.

---

## Testing

Run tests from the `backend/` directory:
```bash
python -m pytest
```
Tests cover non-financial messages, financial intent detection, amount/currency normalization (`₹250`, `400rs`), payer/receiver resolution, 1-party confirmation, 2-party mutual consent, dismissal, and explicit fallback path execution.

---

## Security Notes & Known Limitations

- **No Hardcoded Keys**: API keys are read from environment variables only.
- **In-Memory Store**: Data is stored in memory (`store.py`) for hackathon speed; production requires replacing `store.py` with a database client (e.g., PostgreSQL/Supabase).
- **Currency Context**: Amounts default to `INR` within this Indian domestic payment application context.
