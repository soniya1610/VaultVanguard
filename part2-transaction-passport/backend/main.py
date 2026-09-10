"""
Part 2 — Transaction Passport & State Machine API (FastAPI)
Port: 8002

Endpoints:
  GET  /api/health
  POST /api/passport/create
  GET  /api/passport/{passport_id}
  GET  /api/passports
  POST /api/passport/{passport_id}/transition
  GET  /api/passport/{passport_id}/timeline
  GET  /api/passport/{passport_id}/upi
  GET  /api/passport/{passport_id}/verify
  POST /api/demo/seed
  POST /api/demo/reset
"""
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import HOST, PORT, P1_URL, P3_URL, P4_URL
from models import (
    CreatePassportRequest,
    PassportRecord,
    PassportState,
    TransitionRequest,
    EvidenceVerification,
)
from store import store
from passport_service import mint_passport

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("TrustBridge-P2-Passport")

app = FastAPI(
    title="TrustBridge — Part 2: Transaction Passport & State Machine",
    description=(
        "Central source of truth and permanent identity for financial commitments. "
        "Mints TP-2026-XXXXXXX upon mutual consent, computes cryptographic evidence hashes, "
        "generates UPI deep links, and governs state machine transitions."
    ),
    version="2.0.0",
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
        "layer": "Part 2 — Transaction Passport & State Machine",
        "port": PORT,
        "passport_count": len(store.passports),
        "peers": {
            "p1_conversation_nlp": P1_URL,
            "p3_payment_reconciliation": P3_URL,
            "p4_dashboard_dispute": P4_URL,
        },
    }


@app.post("/api/passport/create")
def create_passport(payload: CreatePassportRequest):
    """
    Receives mutual-consent handoff from Part 1 and mints official Transaction Passport.
    """
    if not payload.payer_confirmed or not payload.receiver_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Transaction Passport can only be minted when BOTH payer and receiver have confirmed.",
        )

    record = mint_passport(payload)
    store.add_passport(record)

    logger.info(
        f"Minted Passport {record.passport_id} for {record.payer} -> {record.receiver} "
        f"({record.currency} {record.amount}) [Hash: {record.evidence_hash[:12]}...]"
    )

    return {
        "status": "CREATED",
        "passport_id": record.passport_id,
        "state": record.state.value,
        "created_at": record.created_at,
        "evidence_hash": record.evidence_hash,
        "upi_deep_link": record.upi_deep_link,
        "passport": record,
    }


@app.get("/api/passport/{passport_id}")
def get_passport(passport_id: str):
    record = store.get_passport(passport_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Passport {passport_id} not found")
    return {"passport": record}


@app.get("/api/passports")
def list_passports():
    passports = store.list_passports()
    return {
        "count": len(passports),
        "passports": passports,
    }


@app.post("/api/passport/{passport_id}/transition")
def transition_state(passport_id: str, req: TransitionRequest):
    """
    Transition passport through state machine lifecycle.
    Called by Part 3 (payment / reconciliation) and Part 4 (disputes).
    """
    try:
        updated = store.update_passport_state(
            passport_id=passport_id,
            target_state=req.new_state,
            event_type=req.event_type,
            description=req.description,
            actor=req.actor or "SYSTEM",
            payment_reference=req.payment_reference,
            gateway_transaction_id=req.gateway_transaction_id,
            settlement_id=req.settlement_id,
            metadata=req.metadata,
        )
        return {
            "passport_id": passport_id,
            "previous_state": updated.state.value,
            "current_state": updated.state.value,
            "updated_at": updated.updated_at,
            "passport": updated,
        }
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Passport {passport_id} not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/passport/{passport_id}/timeline")
def get_timeline(passport_id: str):
    record = store.get_passport(passport_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Passport {passport_id} not found")
    return {
        "passport_id": passport_id,
        "event_count": len(record.timeline),
        "timeline": record.timeline,
    }


@app.get("/api/passport/{passport_id}/upi")
def get_upi_link(passport_id: str):
    record = store.get_passport(passport_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Passport {passport_id} not found")
    return {
        "passport_id": passport_id,
        "payer": record.payer,
        "receiver": record.receiver,
        "amount": record.amount,
        "currency": record.currency,
        "upi_deep_link": record.upi_deep_link,
    }


@app.get("/api/passport/{passport_id}/verify")
def verify_passport_integrity(passport_id: str):
    try:
        verification = store.verify_integrity(passport_id)
        return verification
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Passport {passport_id} not found")


@app.post("/api/demo/seed")
def seed_demo():
    """Seed demo passport for standalone testing."""
    now_iso = datetime.now().isoformat()
    req = CreatePassportRequest(
        conversation_id="conv-DEMO-001",
        payer="Arjun",
        receiver="Riya",
        amount=250.0,
        currency="INR",
        purpose="tea",
        message_ids=["m1", "m2"],
        participants=["Arjun", "Riya"],
        confidence=0.96,
        payer_confirmed=True,
        receiver_confirmed=True,
        created_at=now_iso,
        conversation_evidence=[
            {"message_id": "m1", "sender": "Riya", "text": "You still owe me ₹250 for the tea yesterday", "timestamp": now_iso},
            {"message_id": "m2", "sender": "Arjun", "text": "Yes, I'll pay you back ₹250 for the tea", "timestamp": now_iso},
        ],
        confirmations={"payer_confirmed_at": now_iso, "receiver_confirmed_at": now_iso},
        detection_confidence=0.96,
        detected_at=now_iso,
    )
    record = mint_passport(req)
    store.add_passport(record)
    return {
        "status": "seeded",
        "passport_id": record.passport_id,
        "passport": record,
    }


@app.post("/api/demo/reset")
def reset_store():
    store.reset()
    return {"status": "reset", "message": "Part 2 store cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
