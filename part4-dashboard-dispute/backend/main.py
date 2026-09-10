"""
Part 4 — Merchant Dashboard & Dispute Resolution API (FastAPI)
Port: 8003

Endpoints:
  GET  /api/health
  GET  /api/merchant/dashboard
  POST /api/merchant/sync
  POST /api/dispute/file
  POST /api/dispute/{dispute_id}/review
  POST /api/dispute/{dispute_id}/resolve
  GET  /api/dispute/{passport_id}/evidence
  GET  /api/disputes
  POST /api/demo/seed
  POST /api/demo/reset
"""
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

from config import HOST, PORT, P1_URL, P2_URL, P3_URL
from models import (
    MerchantTransaction,
    MerchantSyncStatus,
    DisputeRecord,
    DisputeStatus,
    FileDisputeRequest,
    ResolveDisputeRequest,
    SyncMerchantRequest,
    DisputeEvidencePackage,
)
from store import store
from evidence_service import build_evidence_package

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("TrustBridge-P4-Dispute")

app = FastAPI(
    title="TrustBridge — Part 4: Merchant Dashboard & Dispute Resolution",
    description=(
        "Lender/Merchant-side dashboard (Riya), demonstration of the intentional "
        "PENDING vs SUCCESS contradiction, live state synchronization upon reconciliation, "
        "and structured evidence resolution for later 'he said / she said' disputes."
    ),
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "layer": "Part 4 — Merchant Dashboard & Dispute Resolution",
        "port": PORT,
        "transactions_count": len(store.transactions),
        "disputes_count": len(store.disputes),
        "peers": {
            "p1": P1_URL,
            "p2": P2_URL,
            "p3": P3_URL,
        },
    }


@app.get("/api/merchant/dashboard")
def get_merchant_dashboard():
    """Returns Riya's (the lender/merchant) dashboard view."""
    txs = store.list_transactions()
    pending_count = sum(1 for t in txs if t.status == MerchantSyncStatus.PENDING)
    settled_count = sum(1 for t in txs if t.status == MerchantSyncStatus.SETTLED)
    pending_amount = sum(t.amount for t in txs if t.status == MerchantSyncStatus.PENDING)
    settled_amount = sum(t.amount for t in txs if t.status == MerchantSyncStatus.SETTLED)

    return {
        "merchant_name": "Riya (Lender / Creditor)",
        "summary": {
            "total_transactions": len(txs),
            "pending_count": pending_count,
            "settled_count": settled_count,
            "pending_amount": pending_amount,
            "settled_amount": settled_amount,
            "has_stale_contradiction": any(t.is_stale_demo_mismatch for t in txs),
        },
        "transactions": txs,
    }


@app.post("/api/merchant/sync")
def sync_merchant(req: SyncMerchantRequest):
    """
    Called by Part 3 Reconciliation Engine or payment gateway to update
    merchant-side status from PENDING -> SETTLED in real time!
    """
    updated = store.update_merchant_status(
        passport_id=req.passport_id,
        status=req.status,
        payment_ref=req.payment_reference,
    )
    logger.info(
        f"Synced merchant record for {req.passport_id} -> {req.status.value} "
        f"(Reason: {req.update_reason or 'Reconciliation update'})"
    )
    return {
        "status": "synchronized",
        "transaction": updated,
        "message": f"Merchant status updated to {req.status.value}",
    }


@app.post("/api/dispute/file")
def file_dispute(req: FileDisputeRequest):
    """
    File a dispute when a participant claims non-receipt ('he said / she said').
    Fetches immutable passport evidence and generates the human-readable evidence timeline.
    """
    # Attempt to fetch authoritative evidence from Part 2 if available
    passport_data = None
    try:
        with httpx.Client(timeout=0.5) as client:
            res = client.get(f"{P2_URL}/api/passport/{req.passport_id}")
            if res.status_code == 200:
                passport_data = res.json().get("passport")
    except Exception as e:
        logger.warning(f"Could not reach Part 2 for dispute evidence: {e}")

    dispute = store.file_dispute(req, passport_data=passport_data)
    logger.info(f"Dispute opened: {dispute.dispute_id} for passport {req.passport_id} by {req.initiator}")

    return {
        "dispute": dispute,
        "message": "Dispute filed. Structured evidence timeline generated from immutable passport.",
    }


@app.post("/api/dispute/{dispute_id}/review")
def review_dispute(dispute_id: str):
    """Move dispute to UNDER_REVIEW."""
    try:
        updated = store.update_dispute_status(dispute_id, DisputeStatus.UNDER_REVIEW)
        return {"dispute": updated}
    except KeyError:
        raise HTTPException(status_code=404, detail="Dispute not found")


@app.post("/api/dispute/{dispute_id}/resolve")
def resolve_dispute(dispute_id: str, req: ResolveDisputeRequest):
    """
    Resolve dispute using verifiable evidence.
    Transitions: UNDER_REVIEW -> RESOLVED without overwriting original settlement evidence!
    """
    try:
        updated = store.update_dispute_status(
            dispute_id,
            DisputeStatus.RESOLVED,
            notes=req.resolution_notes,
        )
        return {
            "dispute": updated,
            "message": "Dispute RESOLVED. Original settlement evidence preserved and untampered.",
        }
    except KeyError:
        raise HTTPException(status_code=404, detail="Dispute not found")


@app.get("/api/dispute/{passport_id}/evidence")
def get_evidence(passport_id: str):
    """Returns structured human-readable evidence package for a given passport."""
    passport_data = None
    try:
        with httpx.Client(timeout=2.0) as client:
            res = client.get(f"{P2_URL}/api/passport/{passport_id}")
            if res.status_code == 200:
                passport_data = res.json().get("passport")
    except Exception:
        pass

    tx = store.get_transaction(passport_id)
    pkg = build_evidence_package(
        passport_id=passport_id,
        passport_data=passport_data or (tx.model_dump() if tx else None),
    )
    return {"evidence_package": pkg}


@app.get("/api/disputes")
def list_disputes():
    disputes = store.list_disputes()
    return {
        "count": len(disputes),
        "disputes": disputes,
    }


# ---------------------------------------------------------------------------
# Upstream Part 3 Proxies & Compatibility Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/dashboard/summary")
async def dashboard_summary():
    """Aggregated merchant summary combining local store + Part 3."""
    passports = []
    settlements = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            p_res = await client.get(f"{P3_URL}/api/passports")
            if p_res.status_code == 200:
                passports = p_res.json().get("passports", [])
            s_res = await client.get(f"{P3_URL}/api/settlements")
            if s_res.status_code == 200:
                settlements = s_res.json().get("settlements", [])
    except Exception as e:
        logger.warning(f"Could not reach Part 3 for summary: {e}")

    txs = store.list_transactions()
    return {
        "summary": {
            "total_passports": len(passports) or len(txs),
            "settled_count": sum(1 for t in txs if t.status == MerchantSyncStatus.SETTLED) or len(settlements),
            "pending_count": sum(1 for t in txs if t.status == MerchantSyncStatus.PENDING),
            "total_disputes": len(store.disputes),
        },
        "disputes_count": len(store.disputes),
        "transactions_count": len(txs),
    }


@app.get("/api/dashboard/passports")
async def dashboard_passports():
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{P3_URL}/api/passports")
            if res.status_code == 200:
                return res.json()
    except Exception:
        pass
    return {"count": len(store.transactions), "passports": store.list_transactions()}


@app.get("/api/dashboard/settlements")
async def dashboard_settlements():
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{P3_URL}/api/settlements")
            if res.status_code == 200:
                return res.json()
    except Exception:
        pass
    return {"count": 0, "settlements": []}


@app.get("/api/dashboard/audit")
async def dashboard_audit():
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{P3_URL}/api/audit/all/events")
            if res.status_code == 200:
                return res.json()
    except Exception:
        pass
    return {"count": 0, "events": []}


@app.get("/api/dispute/all")
def get_all_disputes_compat():
    return list_disputes()


@app.post("/api/demo/seed")
def seed_demo():
    """Seeds the classic ₹250 Tea scenario with intentional PENDING state."""
    pid = "TP-2026-8F42X91"
    tx = MerchantTransaction(
        passport_id=pid,
        payer="Arjun",
        receiver="Riya",
        amount=250.0,
        purpose="tea",
        status=MerchantSyncStatus.PENDING,
        payment_reference="PAY-UPI-2026-8821",
        is_stale_demo_mismatch=True,
    )
    store.add_transaction(tx)
    return {
        "status": "seeded",
        "passport_id": pid,
        "transaction": tx,
        "message": f"Seeded {pid} in PENDING state (stale mismatch demo ready)",
    }


@app.post("/api/demo/reset")
def reset_store():
    store.reset()
    return {"status": "reset", "message": "Part 4 store reset"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
