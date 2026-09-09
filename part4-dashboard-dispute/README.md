# Part 4 — Merchant Dashboard & Dispute Resolution

Part 4 is the final layer of **TrustBridge**. It provides a full merchant analytics dashboard, real-time transaction monitoring, and a complete dispute resolution workflow backed by the immutable conversation evidence from Part 1.

---

## Folder Structure

```
part4-dashboard-dispute/
├── README.md
├── backend/
│   ├── main.py              # FastAPI server — port 8002
│   ├── config.py            # Settings (P4_HOST, P4_PORT, PART3_BASE_URL)
│   ├── models.py            # Pydantic v2 schemas (DisputeRecord, MerchantSummary, ...)
│   ├── store.py             # In-memory DashboardStore (disputes)
│   └── requirements.txt     # Python dependencies (adds httpx for Part 3 calls)
└── frontend/
    ├── package.json
    ├── vite.config.js       # Dev server port 5174, proxy /api → localhost:8002
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                    # 5-tab dashboard orchestrator
        ├── api.js                     # API client for all Part 4 + proxied Part 3 data
        ├── index.css                  # Dark glassmorphism design system
        └── components/
            ├── StatsOverview.jsx      # 6 animated metric cards
            ├── TransactionTable.jsx   # Full transaction list with state badges + dispute CTA
            ├── DisputePanel.jsx       # Filterable dispute list with inline resolution UI
            ├── FileDisputeModal.jsx   # Rich dispute filing modal with evidence notice
            ├── AuditViewer.jsx        # Scrollable system-wide audit timeline
            └── AnalyticsPanel.jsx     # Charts: daily volume, top payers/receivers, purpose breakdown
```

---

## Technologies

- **Backend**: Python 3.13+, FastAPI, Uvicorn, Pydantic v2, `httpx` (calls Part 3)
- **Frontend**: React 18, Vite 5, Lucide Icons, Vanilla CSS (glassmorphism dark theme)
- **Port**: Backend `8002`, Frontend dev `5174`

---

## How It Integrates

Part 4 **reads data from Part 3** (via `httpx` server-side and Vite proxy client-side). It does **not** duplicate Part 3's data — it aggregates it live:

```
Part 1 (8000) ──→ Part 3 (8001) ──→ Part 4 (8002)  [reads live]
                                  └──→ Dispute Store  [owns disputes]
```

When a dispute is filed, Part 4 automatically pulls:
- **Conversation evidence** from `original_evidence` stored in Part 3's passport record
- **Reconciliation check results** from Part 3's settlement record
- **Payment reference** and **settlement ID** for full cross-reference

---

## Setup & Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

- API: `http://localhost:8002`
- Swagger: `http://localhost:8002/docs`

> **Requires Part 3 running on port 8001** for dashboard data. Part 4's dispute filing still works standalone but evidence won't be populated.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Dev Server: `http://localhost:5174`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check — includes Part 3 status |
| `GET` | `/api/dashboard/summary` | Aggregated merchant analytics |
| `GET` | `/api/dashboard/passports` | All passports enriched with dispute info |
| `GET` | `/api/dashboard/settlements` | All settlements (proxied from Part 3) |
| `GET` | `/api/dashboard/audit` | Full system audit log (proxied from Part 3) |
| `POST` | `/api/dispute/file` | File a new dispute (auto-attaches evidence) |
| `GET` | `/api/dispute/all` | List all disputes |
| `GET` | `/api/dispute/{id}` | Single dispute with full evidence |
| `POST` | `/api/dispute/update` | Update dispute status / resolution |
| `GET` | `/api/dispute/passport/{id}` | All disputes for a passport |
| `POST` | `/api/demo/seed-dispute` | Seed a demo dispute |
| `POST` | `/api/demo/reset` | Reset dispute store |

---

## Dashboard Features

### Overview Tab
- 6 KPI stat cards (volume, settled, pending, open disputes, total disputes, system health)
- Recent transactions table
- Recent disputes list

### Transactions Tab
- Full transaction table with passport state badges
- `File Dispute` button visible only on `SETTLED` passports

### Disputes Tab
- Filter by: All / Open / Investigating / Resolved / Closed
- Expandable dispute rows showing:
  - Description, reason, filed-by, timestamps
  - Conversation evidence messages (from Part 1 via Part 3)
  - Reconciliation check results (pass/fail)
- Inline actions: Begin Investigation → Resolve (UPHELD / DISMISSED / PARTIAL) / Close

### Analytics Tab
- Daily transaction volume bar chart (last 14 days)
- Top payers leaderboard (gradient bars)
- Top receivers leaderboard
- Transaction purpose breakdown

### Audit Trail Tab
- Full system-wide audit log from Part 3
- Color-coded by event type
- Timeline view with key data pills

---

## Dispute Lifecycle

```
Filed (OPEN) → Begin Investigation (INVESTIGATING) → Resolve (RESOLVED)
                                                   → Close   (CLOSED)

Resolution types: UPHELD | DISMISSED | PARTIAL
```
