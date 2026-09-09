"""
Part 4 — Merchant Dashboard & Dispute Resolution API (FastAPI)
Port: 8002

Endpoints:
  GET  /api/health
  GET  /api/dashboard/summary        — Aggregated merchant analytics (from Part 3)
  GET  /api/dashboard/passports      — All passports + payment status (from Part 3)
  GET  /api/dashboard/settlements    — All settlements (from Part 3)
  GET  /api/dashboard/audit          — Full system-wide audit log (from Part 3)
  POST /api/dispute/file             — File a new dispute
  GET  /api/dispute/all              — All disputes
  GET  /api/dispute/{dispute_id}     — Single dispute with evidence
  POST /api/dispute/update           — Update dispute status / resolution
  GET  /api/dispute/passport/{passport_id} — All disputes for a passport
  POST /api/demo/seed-dispute        — Seed a demo dispute
  POST /api/demo/reset               — Reset Part 4 store
"""
import uuid
import logging
import httpx
from datetime import datetime, date
from collections import defaultdict
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import HOST, PORT, PART3_BASE_URL
from models import (
    FileDisputeRequest,
    UpdateDisputeRequest,
    SeedDisputeRequest,
    DisputeRecord,
    DisputeStatus,
    DisputeResolution,
    DisputeReason,
    EvidenceMessage,
    MerchantSummary,
)
from store import store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("TrustBridge-P4-API")

app = FastAPI(
    title="TrustBridge — Part 4: Merchant Dashboard & Dispute Resolution",
    description=(
        "Aggregated merchant analytics, transaction monitoring, and dispute resolution "
        "backed by immutable Part 1 conversation evidence. Consumes data from Part 3 "
        "(Payment & Reconciliation) at port 8001."
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


# ---------------------------------------------------------------------------
# Helpers — fetch data from Part 3
# ---------------------------------------------------------------------------

async def fetch_p3(path: str) -> dict:
    """Fetch JSON from Part 3 backend."""
    url = f"{PART3_BASE_URL}{path}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
    except httpx.RequestError as e:
        logger.warning(f"Part 3 unreachable at {url}: {e}")
        return {}
    except httpx.HTTPStatusError as e:
        logger.warning(f"Part 3 returned error for {url}: {e}")
        return {}


def _compute_summary(passports_data: dict, settlements_data: dict, disputes: list) -> MerchantSummary:
    """Derive aggregated merchant summary from raw Part 3 data."""
    passports = passports_data.get("passports", [])
    settlements = settlements_data.get("settlements", [])

    total_passports = len(passports)
    total_volume = sum(p["passport"]["amount"] for p in passports if p.get("passport"))
    settled_volume = sum(s["amount"] for s in settlements)

    state_counts: dict = defaultdict(int)
    payer_counts: dict = defaultdict(float)
    receiver_counts: dict = defaultdict(float)
    purpose_counts: dict = defaultdict(int)
    daily_vol: dict = defaultdict(float)

    for p in passports:
        pp = p.get("passport", {})
        state = pp.get("state", "UNKNOWN")
        state_counts[state] += 1
        payer_counts[pp.get("payer", "?")] += pp.get("amount", 0)
        receiver_counts[pp.get("receiver", "?")] += pp.get("amount", 0)
        purpose_counts[pp.get("purpose", "other")] += 1

        # Daily volume from updated_at
        ts = pp.get("updated_at", pp.get("imported_at", ""))
        try:
            day = ts[:10]
            daily_vol[day] += pp.get("amount", 0)
        except Exception:
            pass

    total_settled = state_counts.get("SETTLED", 0)
    total_pending = state_counts.get("CONFIRMED", 0) + state_counts.get("PAYMENT_INITIATED", 0) + state_counts.get("PAYMENT_PENDING", 0)

    # Dispute counts from local store
    open_disputes = sum(1 for d in disputes if d.status == DisputeStatus.OPEN or d.status == DisputeStatus.INVESTIGATING)
    resolved_disputes = sum(1 for d in disputes if d.status in (DisputeStatus.RESOLVED, DisputeStatus.CLOSED))
    total_disputed = len(disputes)

    top_payers = sorted(
        [{"name": k, "volume": round(v, 2)} for k, v in payer_counts.items()],
        key=lambda x: x["volume"], reverse=True
    )[:5]
    top_receivers = sorted(
        [{"name": k, "volume": round(v, 2)} for k, v in receiver_counts.items()],
        key=lambda x: x["volume"], reverse=True
    )[:5]

    daily_volume = sorted(
        [{"date": k, "volume": round(v, 2)} for k, v in daily_vol.items()],
        key=lambda x: x["date"]
    )[-14:]  # Last 14 days

    return MerchantSummary(
        total_passports=total_passports,
        total_settled=total_settled,
        total_pending=total_pending,
        total_disputed=total_disputed,
        total_volume_inr=round(total_volume, 2),
        settled_volume_inr=round(settled_volume, 2),
        open_disputes=open_disputes,
        resolved_disputes=resolved_disputes,
        top_payers=top_payers,
        top_receivers=top_receivers,
        purpose_breakdown=dict(purpose_counts),
        daily_volume=daily_volume,
    )


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    p3_health = await fetch_p3("/api/health")
    return {
        "status": "online",
        "layer": "Part 4 — Merchant Dashboard & Dispute Resolution",
        "port": PORT,
        "disputes": len(store.disputes),
        "open_disputes": store.open_dispute_count(),
        "part3_status": p3_health.get("status", "unreachable"),
        "part3_passports": p3_health.get("passports", 0),
        "part3_settlements": p3_health.get("settlements", 0),
    }


# ---------------------------------------------------------------------------
# Dashboard — aggregated analytics
# ---------------------------------------------------------------------------

@app.get("/api/dashboard/summary")
async def dashboard_summary():
    """Aggregated merchant analytics — combines Part 3 data + local disputes."""
    passports_data = await fetch_p3("/api/passports")
    settlements_data = await fetch_p3("/api/settlements")
    all_disputes = store.get_all_disputes()
    summary = _compute_summary(passports_data, settlements_data, all_disputes)
    return {
        "summary": summary,
        "dispute_by_status": store.dispute_count_by_status(),
    }


@app.get("/api/dashboard/passports")
async def dashboard_passports():
    """All passports with payment + merchant status, enriched with dispute info."""
    data = await fetch_p3("/api/passports")
    passports = data.get("passports", [])

    # Enrich each passport entry with its disputes
    enriched = []
    for entry in passports:
        pid = entry.get("passport", {}).get("passport_id")
        disputes = store.get_disputes_for_passport(pid) if pid else []
        enriched.append({
            **entry,
            "disputes": [d.model_dump() for d in disputes],
            "has_dispute": len(disputes) > 0,
            "open_dispute_count": sum(1 for d in disputes if d.status in (DisputeStatus.OPEN, DisputeStatus.INVESTIGATING)),
        })

    return {"count": len(enriched), "passports": enriched}


@app.get("/api/dashboard/settlements")
async def dashboard_settlements():
    """All settled transactions from Part 3."""
    return await fetch_p3("/api/settlements")


@app.get("/api/dashboard/audit")
async def dashboard_audit():
    """Full system-wide audit trail from Part 3."""
    return await fetch_p3("/api/audit/all/events")


# ---------------------------------------------------------------------------
# Dispute — file, list, inspect, resolve
# ---------------------------------------------------------------------------

@app.post("/api/dispute/file")
async def file_dispute(req: FileDisputeRequest):
    """
    File a dispute against a settled (or any) transaction passport.
    Automatically pulls conversation evidence from Part 3's passport record.
    """
    # Fetch the passport + evidence from Part 3
    passport_data = await fetch_p3(f"/api/passport/{req.passport_id}")
    passport = passport_data.get("passport")

    if not passport and not passport_data:
        raise HTTPException(
            status_code=404,
            detail=f"Passport {req.passport_id} not found in Part 3. Ensure Part 3 is running."
        )

    # Extract conversation evidence from original_evidence stored in Part 3
    original_evidence = (passport or {}).get("original_evidence", {})
    raw_messages = original_evidence.get("messages", [])
    evidence_messages = [
        EvidenceMessage(
            sender=m.get("sender", "Unknown"),
            text=m.get("text", ""),
            timestamp=m.get("timestamp", datetime.now().isoformat()),
        )
        for m in raw_messages
    ]

    # Reconciliation checks evidence
    settlement = passport_data.get("settlement")
    recon_checks = []
    if settlement and settlement.get("reconciliation_result"):
        recon_checks = settlement["reconciliation_result"].get("checks", [])

    payment = passport_data.get("payment")
    settlement_id = settlement.get("settlement_id") if settlement else None
    payment_reference = payment.get("payment_reference") if payment else None

    dispute_id = f"DISP-{uuid.uuid4().hex[:8].upper()}"
    dispute = DisputeRecord(
        dispute_id=dispute_id,
        passport_id=req.passport_id,
        settlement_id=settlement_id,
        payment_reference=payment_reference,
        filed_by=req.filed_by,
        reason=req.reason,
        description=req.description,
        claimed_amount=req.claimed_amount,
        status=DisputeStatus.OPEN,
        conversation_evidence=evidence_messages,
        reconciliation_checks=recon_checks,
    )
    store.add_dispute(dispute)

    logger.info(f"Dispute filed: {dispute_id} for passport {req.passport_id} by {req.filed_by}")

    return {
        "dispute": dispute,
        "passport": passport,
        "message": f"Dispute {dispute_id} filed successfully — status: OPEN",
    }


@app.get("/api/dispute/all")
def get_all_disputes():
    """List all disputes with summary."""
    disputes = store.get_all_disputes()
    return {
        "count": len(disputes),
        "open": store.open_dispute_count(),
        "by_status": store.dispute_count_by_status(),
        "disputes": [d.model_dump() for d in disputes],
    }


@app.get("/api/dispute/{dispute_id}")
def get_dispute(dispute_id: str):
    """Get a single dispute with full evidence."""
    d = store.get_dispute(dispute_id)
    if not d:
        raise HTTPException(status_code=404, detail=f"Dispute not found: {dispute_id}")
    return {"dispute": d.model_dump()}


@app.post("/api/dispute/update")
def update_dispute(req: UpdateDisputeRequest):
    """Update a dispute's status and optionally set resolution."""
    updated = store.update_dispute(
        dispute_id=req.dispute_id,
        status=req.status,
        resolution=req.resolution,
        resolution_notes=req.resolution_notes,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Dispute not found: {req.dispute_id}")
    return {
        "dispute": updated.model_dump(),
        "message": f"Dispute {req.dispute_id} updated → {req.status.value}",
    }


@app.get("/api/dispute/passport/{passport_id}")
def get_disputes_for_passport(passport_id: str):
    """All disputes filed against a specific passport."""
    disputes = store.get_disputes_for_passport(passport_id)
    return {
        "passport_id": passport_id,
        "count": len(disputes),
        "disputes": [d.model_dump() for d in disputes],
    }


# ---------------------------------------------------------------------------
# Demo — seed & reset
# ---------------------------------------------------------------------------

@app.post("/api/demo/seed-dispute")
async def seed_demo_dispute(req: SeedDisputeRequest = None):
    """
    Seed a demo dispute for the given passport_id.
    Pulls live evidence from Part 3.
    """
    if req is None:
        req = SeedDisputeRequest(passport_id="DEMO")

    file_req = FileDisputeRequest(
        passport_id=req.passport_id,
        filed_by=req.filed_by,
        reason=req.reason,
        description=req.description,
    )
    return await file_dispute(file_req)


@app.post("/api/demo/reset")
def reset_demo():
    """Reset Part 4 store (disputes only — Part 3 data is unaffected)."""
    store.reset()
    return {
        "status": "reset",
        "message": "Part 4 dispute store cleared — Part 3 data is unaffected",
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
