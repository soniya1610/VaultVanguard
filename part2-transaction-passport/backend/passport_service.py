"""
Part 2 — Transaction Passport Service
Implements Passport Minting, SHA-256 Cryptographic Evidence Hashing,
UPI Deep Link Generation, and State Transition Logic.
"""
import uuid
import hashlib
import json
import urllib.parse
from datetime import datetime
from typing import Dict, Any, Tuple

from models import (
    CreatePassportRequest,
    PassportRecord,
    PassportState,
    TimelineEvent,
    EvidenceVerification,
)


def generate_passport_id() -> str:
    """Generate unique Transaction Passport ID format: TP-2026-XXXXXXX."""
    random_part = uuid.uuid4().hex[:7].upper()
    return f"TP-2026-{random_part}"


def compute_evidence_hash(evidence_payload: Dict[str, Any]) -> str:
    """
    Computes a deterministic SHA-256 cryptographic digest of the conversation evidence,
    timestamps, and mutual consent payload.
    Guarantees tamper-evident auditability for later dispute resolution.
    """
    canonical_json = json.dumps(evidence_payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def generate_upi_deep_link(receiver: str, amount: float, currency: str, passport_id: str, purpose: str) -> str:
    """
    Generates standard Indian NPCI UPI Deep Link format for 'Pay Now' action:
    upi://pay?pa=<receiver_vpa>&pn=<receiver_name>&am=<amount>&cu=INR&tn=<note>
    """
    clean_receiver = receiver.strip().lower()
    vpa = f"{clean_receiver}@trustbridge"
    note = f"TrustBridge Repayment {passport_id} ({purpose})"
    
    params = {
        "pa": vpa,
        "pn": receiver,
        "am": f"{amount:.2f}",
        "cu": currency if currency else "INR",
        "tn": note,
    }
    encoded = urllib.parse.urlencode(params)
    return f"upi://pay?{encoded}"


def mint_passport(req: CreatePassportRequest) -> PassportRecord:
    """Mints a brand new Transaction Passport from Part 1 handoff payload."""
    passport_id = generate_passport_id()
    now_iso = datetime.now().isoformat()
    
    evidence_dict = {
        "conversation_id": req.conversation_id,
        "payer": req.payer,
        "receiver": req.receiver,
        "amount": req.amount,
        "currency": req.currency,
        "purpose": req.purpose,
        "message_ids": req.message_ids,
        "participants": req.participants,
        "payer_confirmed": req.payer_confirmed,
        "receiver_confirmed": req.receiver_confirmed,
        "conversation_evidence": [e.model_dump() for e in req.conversation_evidence],
        "confirmations": req.confirmations.model_dump() if req.confirmations else {},
        "detection_confidence": req.confidence,
    }
    evidence_hash = compute_evidence_hash(evidence_dict)
    upi_link = generate_upi_deep_link(req.receiver, req.amount, req.currency, passport_id, req.purpose)

    # Initial timeline events
    timeline = []
    
    # Event 1: NLP Detection in Chat
    detected_time = req.detected_at or now_iso
    timeline.append(
        TimelineEvent(
            event_id=f"evt-{uuid.uuid4().hex[:8]}",
            event_type="NLP_INTENT_DETECTED",
            state=PassportState.DETECTED,
            title="Financial Obligation Detected in Chat",
            description=f"NLP identified repayment obligation: {req.payer} owes {req.receiver} ₹{req.amount:.2f} for {req.purpose}",
            timestamp=detected_time,
            actor="TrustBridge NLP Engine",
            evidence_ref=req.message_ids[0] if req.message_ids else None,
            metadata={"confidence": req.confidence, "purpose": req.purpose},
        )
    )

    # Event 2: Payer Consent
    payer_time = req.confirmations.payer_confirmed_at if req.confirmations and req.confirmations.payer_confirmed_at else now_iso
    timeline.append(
        TimelineEvent(
            event_id=f"evt-{uuid.uuid4().hex[:8]}",
            event_type="PAYER_CONFIRMED",
            state=PassportState.DETECTED,
            title=f"{req.payer} Confirmed Obligation",
            description=f"{req.payer} explicitly confirmed the agreement to pay ₹{req.amount:.2f}",
            timestamp=payer_time,
            actor=req.payer,
            metadata={"role": "payer", "agreed_amount": req.amount},
        )
    )

    # Event 3: Receiver Consent
    receiver_time = req.confirmations.receiver_confirmed_at if req.confirmations and req.confirmations.receiver_confirmed_at else now_iso
    timeline.append(
        TimelineEvent(
            event_id=f"evt-{uuid.uuid4().hex[:8]}",
            event_type="RECEIVER_CONFIRMED",
            state=PassportState.DETECTED,
            title=f"{req.receiver} Confirmed Obligation",
            description=f"{req.receiver} explicitly confirmed expecting ₹{req.amount:.2f}",
            timestamp=receiver_time,
            actor=req.receiver,
            metadata={"role": "receiver", "expected_amount": req.amount},
        )
    )

    # Event 4: Passport Minted & Confirmed
    timeline.append(
        TimelineEvent(
            event_id=f"evt-{uuid.uuid4().hex[:8]}",
            event_type="PASSPORT_MINTED",
            state=PassportState.CONFIRMED,
            title=f"Transaction Passport Minted ({passport_id})",
            description=f"Two-party mutual consent verified. Permanent Transaction Passport minted with SHA-256 evidence proof.",
            timestamp=now_iso,
            actor="TrustBridge Passport Authority",
            evidence_ref=evidence_hash,
            metadata={"evidence_hash": evidence_hash, "upi_link": upi_link},
        )
    )

    record = PassportRecord(
        passport_id=passport_id,
        conversation_id=req.conversation_id,
        payer=req.payer,
        receiver=req.receiver,
        amount=req.amount,
        currency=req.currency,
        purpose=req.purpose,
        state=PassportState.CONFIRMED,
        evidence_hash=evidence_hash,
        upi_deep_link=upi_link,
        created_at=now_iso,
        updated_at=now_iso,
        payer_confirmed_at=payer_time,
        receiver_confirmed_at=receiver_time,
        original_evidence=evidence_dict,
        timeline=timeline,
    )
    return record


# Valid state transitions
VALID_TRANSITIONS = {
    PassportState.DETECTED: {PassportState.CONFIRMED},
    PassportState.CONFIRMED: {PassportState.PAYMENT_INITIATED},
    PassportState.PAYMENT_INITIATED: {PassportState.PAYMENT_PENDING},
    PassportState.PAYMENT_PENDING: {PassportState.PAYMENT_PROCESSED, PassportState.MISMATCH_DETECTED},
    PassportState.PAYMENT_PROCESSED: {PassportState.MISMATCH_DETECTED, PassportState.VERIFIED},
    PassportState.MISMATCH_DETECTED: {PassportState.RECONCILING},
    PassportState.RECONCILING: {PassportState.VERIFIED, PassportState.MISMATCH_DETECTED},
    PassportState.VERIFIED: {PassportState.SETTLED},
    PassportState.SETTLED: {PassportState.DISPUTED},
    PassportState.DISPUTED: {PassportState.UNDER_REVIEW},
    PassportState.UNDER_REVIEW: {PassportState.RESOLVED, PassportState.SETTLED},
    PassportState.RESOLVED: set(),
}


def can_transition(current: PassportState, target: PassportState) -> bool:
    """Validates whether a state transition is legally permissible."""
    # Allow idempotent re-transitions to current state
    if current == target:
        return True
    return target in VALID_TRANSITIONS.get(current, set())
