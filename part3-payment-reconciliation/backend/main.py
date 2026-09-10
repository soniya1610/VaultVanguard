"""
Part 3 — Payment Orchestration API (FastAPI)
Port: 8001

Endpoints:
  GET  /api/health
  POST /api/passport/import
  GET  /api/passport/{passport_id}
  POST /api/payment/initiate
  POST /api/payment/gateway-callback
  POST /api/payment/reconcile
  GET  /api/payment/{payment_ref}
  GET  /api/merchant/{passport_id}
  GET  /api/audit/{passport_id}
  GET  /api/audit/all
  GET  /api/settlements
  POST /api/demo/seed
  POST /api/demo/reset
"""
import uuid
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import HOST, PORT, DEMO_PAYER, DEMO_RECEIVER, DEMO_AMOUNT, DEMO_CURRENCY, DEMO_PURPOSE
from models import (
    ImportPassportRequest,
    InitiatePaymentRequest,
    GatewayCallbackRequest,
    ReconcileRequest,
    SeedDemoRequest,
    PassportRecord,
    PaymentRecord,
    MerchantRecord,
    PassportState,
    GatewayStatus,
    MerchantStatus,
    AuditEventType,
)
from store import store
from gateway import simulate_upi_payment, generate_payment_reference
from reconciliation import detect_mismatch, run_reconciliation

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("TrustBridge-P3-API")

app = FastAPI(
    title="TrustBridge — Part 3: Payment Orchestration & Reconciliation Engine",
    description=(
        "Mock UPI Gateway, Payment State Machine, and Reconciliation Engine. "
        "Demonstrates: CONFIRMED → PAYMENT_INITIATED → PAYMENT_PROCESSED → "
        "MISMATCH_DETECTED → RECONCILING → VERIFIED → SETTLED "
        "with idempotent exactly-once settlement."
    ),
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "layer": "Part 3 — Payment Orchestration & Reconciliation Engine",
        "port": PORT,
        "passports": len(store.passports),
        "payments": len(store.payments),
        "settlements": store.settlement_count(),
        "audit_events": len(store.audit_log),
    }


# ---------------------------------------------------------------------------
# Passport — import & inspect
# ---------------------------------------------------------------------------

@app.post("/api/passport/import")
def import_passport(req: ImportPassportRequest):
    """
    Import a CONFIRMED Transaction Passport from Part 2 into Part 3.
    Only CONFIRMED passports may be imported — Part 3 does not accept earlier states.
    """
    if req.passport_id in store.passports:
        existing = store.get_passport(req.passport_id)
        return {
            "passport": existing,
            "already_existed": True,
            "message": f"Passport {req.passport_id} was already imported",
        }

    passport = PassportRecord(
        passport_id=req.passport_id,
        conversation_id=req.conversation_id,
        payer=req.payer,
        receiver=req.receiver,
        amount=req.amount,
        currency=req.currency,
        purpose=req.purpose,
        state=PassportState.CONFIRMED,
        original_evidence=req.original_evidence,
    )
    store.add_passport(passport)

    # Create the merchant ledger entry immediately (starts at PENDING)
    merchant = MerchantRecord(
        passport_id=req.passport_id,
        amount=req.amount,
        currency=req.currency,
        payer=req.payer,
        receiver=req.receiver,
        status=MerchantStatus.PENDING,
        last_update_reason="Merchant record created on passport import — awaiting payment",
    )
    store.add_merchant_record(merchant)

    store.append_audit(
        passport_id=req.passport_id,
        event_type=AuditEventType.PASSPORT_IMPORTED,
        description=f"Passport {req.passport_id} imported in CONFIRMED state — ready for payment",
        data={
            "payer": req.payer,
            "receiver": req.receiver,
            "amount": req.amount,
            "currency": req.currency,
            "purpose": req.purpose,
            "merchant_status": MerchantStatus.PENDING.value,
        },
    )

    logger.info(f"Passport imported: {req.passport_id} ({req.payer}→{req.receiver} {req.currency}{req.amount})")

    return {
        "passport": passport,
        "merchant": merchant,
        "message": f"Passport {req.passport_id} imported successfully in CONFIRMED state",
    }


@app.get("/api/passport/{passport_id}")
def get_passport(passport_id: str):
    passport = store.get_passport(passport_id)
    if not passport:
        raise HTTPException(status_code=404, detail=f"Passport not found: {passport_id}")

    payment = store.get_payment_by_passport(passport_id)
    merchant = store.get_merchant_record(passport_id)
    audit = store.get_audit_log(passport_id)
    settlement = None
    if payment:
        settlement = store.get_settlement(passport_id, payment.payment_reference)

    return {
        "passport": passport,
        "payment": payment,
        "merchant": merchant,
        "settlement": settlement,
        "audit_log": audit,
        "settlement_count": store.settlement_count(),
    }


@app.get("/api/passports")
def list_passports():
    result = []
    for pid, passport in store.passports.items():
        payment = store.get_payment_by_passport(pid)
        merchant = store.get_merchant_record(pid)
        result.append({
            "passport": passport,
            "payment": payment,
            "merchant": merchant,
        })
    return {"count": len(result), "passports": result}


# ---------------------------------------------------------------------------
# Payment — initiation & gateway callback
# ---------------------------------------------------------------------------

@app.post("/api/payment/initiate")
def initiate_payment(req: InitiatePaymentRequest):
    """
    Initiate a payment for a CONFIRMED passport.
    Transitions: CONFIRMED → PAYMENT_INITIATED → PAYMENT_PENDING
    Creates payment record and merchant ledger entry.
    """
    passport = store.get_passport(req.passport_id)
    if not passport:
        # Attempt auto-import from Part 2 if available
        try:
            import httpx
            with httpx.Client(timeout=0.5) as client:
                res = client.get(f"http://localhost:8002/api/passport/{req.passport_id}")
                if res.status_code == 200:
                    p_data = res.json().get("passport")
                    if p_data:
                        passport = PassportRecord(
                            passport_id=p_data["passport_id"],
                            conversation_id=p_data.get("conversation_id", "conv-12345"),
                            payer=p_data["payer"],
                            receiver=p_data["receiver"],
                            amount=p_data["amount"],
                            currency=p_data.get("currency", "INR"),
                            purpose=p_data.get("purpose", "tea"),
                            state=PassportState.CONFIRMED,
                            original_evidence=p_data.get("original_evidence", {}),
                        )
                        store.add_passport(passport)
                        merchant = MerchantRecord(
                            passport_id=passport.passport_id,
                            amount=passport.amount,
                            currency=passport.currency,
                            payer=passport.payer,
                            receiver=passport.receiver,
                            status=MerchantStatus.PENDING,
                            last_update_reason="Auto-imported from Part 2 Transaction Passport",
                        )
                        store.add_merchant_record(merchant)
        except Exception:
            pass

    if not passport:
        raise HTTPException(status_code=404, detail=f"Passport not found: {req.passport_id}")

    if passport.state != PassportState.CONFIRMED:
        raise HTTPException(
            status_code=400,
            detail=f"Payment can only be initiated for CONFIRMED passports. Current state: {passport.state.value}",
        )

    # Check if payment already exists for this passport
    existing_payment = store.get_payment_by_passport(req.passport_id)
    if existing_payment:
        return {
            "payment": existing_payment,
            "passport": passport,
            "already_existed": True,
            "message": f"Payment already initiated: {existing_payment.payment_reference}",
        }

    payment_ref = generate_payment_reference()

    # CONFIRMED → PAYMENT_INITIATED
    store.update_passport_state(
        req.passport_id,
        PassportState.PAYMENT_INITIATED,
        payment_reference=payment_ref,
    )

    store.append_audit(
        passport_id=req.passport_id,
        event_type=AuditEventType.PAYMENT_INITIATED,
        description=f"Payment initiated — Pay Now clicked by {passport.payer}",
        data={
            "payment_reference": payment_ref,
            "payer": passport.payer,
            "receiver": passport.receiver,
            "amount": passport.amount,
            "currency": passport.currency,
        },
    )

    # PAYMENT_INITIATED → PAYMENT_PENDING
    store.update_passport_state(req.passport_id, PassportState.PAYMENT_PENDING)

    store.append_audit(
        passport_id=req.passport_id,
        event_type=AuditEventType.GATEWAY_REQUEST_SENT,
        description="Payment request dispatched to Mock UPI Gateway — awaiting callback",
        data={"payment_reference": payment_ref, "gateway": "Mock UPI Gateway"},
    )

    # Create payment record
    payment = PaymentRecord(
        payment_reference=payment_ref,
        passport_id=req.passport_id,
        payer=passport.payer,
        receiver=passport.receiver,
        amount=passport.amount,
        currency=passport.currency,
        purpose=passport.purpose,
        gateway_callback_count=0,
    )
    store.add_payment(payment)

    return {
        "payment_reference": payment_ref,
        "payment": payment,
        "passport": store.get_passport(req.passport_id),
        "message": f"Payment initiated — awaiting UPI gateway callback for {payment_ref}",
    }


@app.post("/api/payment/gateway-callback")
def gateway_callback(req: GatewayCallbackRequest):
    """
    Receive and process the Mock UPI Gateway callback.

    Gateway returns status=SUCCESS ✅
    Merchant system intentionally stays at PENDING ₹250 ❌

    This creates the contradiction:
      Gateway: SUCCESS ₹250  |  Merchant: PENDING ₹250

    Transitions: PAYMENT_PENDING → PAYMENT_PROCESSED → MISMATCH_DETECTED
    """
    passport = store.get_passport(req.passport_id)
    if not passport:
        raise HTTPException(status_code=404, detail=f"Passport not found: {req.passport_id}")

    payment = store.get_payment(req.payment_reference)
    if not payment:
        raise HTTPException(status_code=404, detail=f"Payment not found: {req.payment_reference}")

    # Track duplicate callback count (for idempotency demo)
    payment.gateway_callback_count += 1
    is_replay = payment.gateway_callback_count > 1

    if is_replay:
        # Already processed — log and return existing state without changes
        store.append_audit(
            passport_id=req.passport_id,
            event_type=AuditEventType.GATEWAY_CALLBACK_REPLAY,
            description=f"Duplicate gateway callback #{payment.gateway_callback_count} received — idempotency protection active",
            data={
                "payment_reference": req.payment_reference,
                "callback_count": payment.gateway_callback_count,
                "passport_state": passport.state.value,
                "settlement_count": store.settlement_count(),
                "already_settled": store.is_already_settled(req.passport_id, req.payment_reference),
            },
        )
        merchant = store.get_merchant_record(req.passport_id)
        settlement = store.get_settlement(req.passport_id, req.payment_reference)
        return {
            "is_replay": True,
            "callback_count": payment.gateway_callback_count,
            "gateway_response": payment.gateway_response,
            "passport": passport,
            "merchant": merchant,
            "settlement": settlement,
            "settlement_count": store.settlement_count(),
            "message": f"Duplicate callback #{payment.gateway_callback_count} — no new settlement created (idempotent)",
        }

    # Only accept gateway callback if in PAYMENT_PENDING state (or re-processing for MISMATCH states)
    allowed_states = {
        PassportState.PAYMENT_PENDING,
        PassportState.PAYMENT_INITIATED,
    }
    if passport.state not in allowed_states:
        # Allow replaying on already-processed passport but log it
        if passport.state in {PassportState.MISMATCH_DETECTED, PassportState.PAYMENT_PROCESSED,
                               PassportState.RECONCILING, PassportState.VERIFIED, PassportState.SETTLED}:
            merchant = store.get_merchant_record(req.passport_id)
            return {
                "is_replay": True,
                "callback_count": payment.gateway_callback_count,
                "gateway_response": payment.gateway_response,
                "passport": passport,
                "merchant": merchant,
                "settlement": store.get_settlement(req.passport_id, req.payment_reference),
                "settlement_count": store.settlement_count(),
                "message": f"Gateway callback for already-processed passport (state={passport.state.value})",
            }

    # ── Simulate the UPI Gateway ──────────────────────────────────────────
    gw_response = simulate_upi_payment(
        passport_id=req.passport_id,
        payment_reference=req.payment_reference,
        payer=passport.payer,
        receiver=passport.receiver,
        amount=passport.amount,
        currency=passport.currency,
    )

    # Store gateway response on payment record
    payment.gateway_response = gw_response
    payment.gateway_status = gw_response.status

    # PAYMENT_PENDING → PAYMENT_PROCESSED
    store.update_passport_state(
        req.passport_id,
        PassportState.PAYMENT_PROCESSED,
        gateway_transaction_id=gw_response.gatewayTransactionId,
    )

    store.append_audit(
        passport_id=req.passport_id,
        event_type=AuditEventType.GATEWAY_SUCCESS,
        description=f"Mock UPI Gateway returned SUCCESS — {passport.currency} {passport.amount} processed",
        data={
            "paymentReference": gw_response.paymentReference,
            "gatewayTransactionId": gw_response.gatewayTransactionId,
            "passportId": gw_response.passportId,
            "payer": gw_response.payer,
            "receiver": gw_response.receiver,
            "amount": gw_response.amount,
            "currency": gw_response.currency,
            "timestamp": gw_response.timestamp,
            "status": gw_response.status.value,
            "gateway_message": gw_response.gateway_message,
        },
    )

    # ── Check merchant system — it is still PENDING (the mismatch) ────────
    merchant = store.get_merchant_record(req.passport_id)

    store.append_audit(
        passport_id=req.passport_id,
        event_type=AuditEventType.MERCHANT_CHECKED,
        description=f"Merchant system checked — status is still PENDING ₹{passport.amount} (MISMATCH!)",
        data={
            "gateway_status": gw_response.status.value,
            "gateway_amount": gw_response.amount,
            "merchant_status": merchant.status.value if merchant else "NOT_FOUND",
            "merchant_amount": merchant.amount if merchant else 0,
            "mismatch": True,
        },
    )

    # ── Detect mismatch and surface it ────────────────────────────────────
    # PAYMENT_PROCESSED → MISMATCH_DETECTED
    store.update_passport_state(req.passport_id, PassportState.MISMATCH_DETECTED)

    store.append_audit(
        passport_id=req.passport_id,
        event_type=AuditEventType.MISMATCH_DETECTED,
        description=(
            f"MISMATCH DETECTED: Gateway SUCCESS ₹{gw_response.amount} "
            f"vs Merchant PENDING ₹{merchant.amount if merchant else '?'} — "
            f"Reconciliation required"
        ),
        data={
            "gateway_status": gw_response.status.value,
            "gateway_amount": gw_response.amount,
            "merchant_status": merchant.status.value if merchant else "NOT_FOUND",
            "merchant_amount": merchant.amount if merchant else 0,
            "contradiction_preserved": True,
            "next_action": "Run Reconciliation Engine",
        },
    )

    # Push mismatch state to Part 2 and Part 4
    try:
        import httpx
        with httpx.Client(timeout=0.5) as client:
            client.post(
                f"http://localhost:8002/api/passport/{req.passport_id}/transition",
                json={
                    "new_state": "MISMATCH_DETECTED",
                    "event_type": "MISMATCH_DETECTED",
                    "description": f"Gateway reported SUCCESS ₹{gw_response.amount} vs Merchant dashboard PENDING ₹{merchant.amount if merchant else '?'}",
                    "payment_reference": req.payment_reference,
                    "gateway_transaction_id": gw_response.gatewayTransactionId,
                }
            )
            client.post(
                "http://localhost:8003/api/merchant/sync",
                json={
                    "passport_id": req.passport_id,
                    "status": "PENDING",
                    "payment_reference": req.payment_reference,
                    "update_reason": "Deliberate downstream delay (Gateway SUCCESS vs Merchant PENDING)",
                }
            )
    except Exception:
        pass

    return {
        "is_replay": False,
        "gateway_response": gw_response,
        "passport": store.get_passport(req.passport_id),
        "merchant": merchant,
        "mismatch_detected": True,
        "mismatch_summary": {
            "gateway": f"SUCCESS ₹{gw_response.amount}",
            "merchant": f"PENDING ₹{merchant.amount if merchant else '?'}",
        },
        "message": (
            f"Gateway: SUCCESS ₹{gw_response.amount} | Merchant: PENDING ₹{merchant.amount if merchant else '?'} "
            f"— MISMATCH_DETECTED — Run reconciliation to resolve"
        ),
    }


# ---------------------------------------------------------------------------
# Reconciliation
# ---------------------------------------------------------------------------

@app.post("/api/payment/reconcile")
def reconcile_payment(req: ReconcileRequest):
    """
    Trigger the Reconciliation Engine for a MISMATCH_DETECTED passport.

    Runs the 6-point verification:
      1. Payer match
      2. Receiver match
      3. Amount match
      4. Passport ID match
      5. Payment reference match
      6. Gateway status == SUCCESS

    On all checks passing:
      MISMATCH_DETECTED → RECONCILING → VERIFIED → SETTLED
      Merchant: PENDING → SETTLED
      Settlement created (idempotent)

    Duplicate calls return the same result — no duplicate settlement.
    """
    passport = store.get_passport(req.passport_id)
    if not passport:
        raise HTTPException(status_code=404, detail=f"Passport not found: {req.passport_id}")

    # Already settled — return existing result (idempotent)
    if passport.state == PassportState.SETTLED:
        settlement = store.get_settlement(req.passport_id, req.payment_reference)
        return {
            "already_settled": True,
            "settlement": settlement,
            "passport": passport,
            "merchant": store.get_merchant_record(req.passport_id),
            "settlement_count": store.settlement_count(),
            "message": f"Already settled — settlement count = {store.settlement_count()} (idempotent)",
        }

    allowed_states = {
        PassportState.MISMATCH_DETECTED,
        PassportState.RECONCILIATION_REQUIRED,
        PassportState.PAYMENT_PROCESSED,  # edge case
    }
    if passport.state not in allowed_states:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Reconciliation can only run on MISMATCH_DETECTED passports. "
                f"Current state: {passport.state.value}"
            ),
        )

    result = run_reconciliation(req.passport_id, req.payment_reference)

    passport_updated = store.get_passport(req.passport_id)
    merchant_updated = store.get_merchant_record(req.passport_id)
    settlement = store.get_settlement(req.passport_id, req.payment_reference)

    # Push state updates to Part 2 and Part 4
    if result.all_passed:
        try:
            import httpx
            with httpx.Client(timeout=0.5) as client:
                # Update Part 2 Passport to SETTLED
                client.post(
                    f"http://localhost:8002/api/passport/{req.passport_id}/transition",
                    json={
                        "new_state": "SETTLED",
                        "event_type": "SETTLED",
                        "description": "Reconciliation verified all 6 checks -> Exactly-once settlement recorded",
                        "payment_reference": req.payment_reference,
                        "settlement_id": settlement.settlement_id if settlement else None,
                    }
                )
                # Update Part 4 Merchant Dashboard in real time (PENDING -> SETTLED)
                client.post(
                    "http://localhost:8003/api/merchant/sync",
                    json={
                        "passport_id": req.passport_id,
                        "status": "SETTLED",
                        "payment_reference": req.payment_reference,
                        "update_reason": "Reconciliation engine confirmed gateway payment",
                    }
                )
        except Exception:
            pass

    return {
        "reconciliation_result": result,
        "passport": passport_updated,
        "merchant": merchant_updated,
        "settlement": settlement,
        "settlement_count": store.settlement_count(),
        "all_passed": result.all_passed,
        "message": (
            f"Reconciliation {'PASSED' if result.all_passed else 'FAILED'} — "
            f"Settlement count = {store.settlement_count()}"
        ),
    }


# ---------------------------------------------------------------------------
# Data retrieval endpoints
# ---------------------------------------------------------------------------

@app.get("/api/payment/{payment_ref}")
def get_payment(payment_ref: str):
    payment = store.get_payment(payment_ref)
    if not payment:
        raise HTTPException(status_code=404, detail=f"Payment not found: {payment_ref}")
    return {"payment": payment}


@app.get("/api/merchant/{passport_id}")
def get_merchant(passport_id: str):
    merchant = store.get_merchant_record(passport_id)
    if not merchant:
        raise HTTPException(status_code=404, detail=f"No merchant record for passport: {passport_id}")
    return {"merchant": merchant}


@app.get("/api/audit/{passport_id}")
def get_audit_log(passport_id: str):
    events = store.get_audit_log(passport_id)
    return {
        "passport_id": passport_id,
        "count": len(events),
        "events": events,
    }


@app.get("/api/audit/all/events")
def get_all_audit_events():
    events = store.get_all_audit_events()
    return {
        "count": len(events),
        "events": events,
    }


@app.get("/api/settlements")
def list_settlements():
    return {
        "settlement_count": store.settlement_count(),
        "settlements": list(store.settlement_records.values()),
        "idempotency_keys": list(store.settled_keys),
    }


# ---------------------------------------------------------------------------
# Demo — seed, reset
# ---------------------------------------------------------------------------

@app.post("/api/demo/seed")
def seed_demo(req: SeedDemoRequest = None):
    """
    Seed a CONFIRMED ₹250 Transaction Passport (Arjun → Riya) for the demo.
    Creates the passport in CONFIRMED state, ready for Pay Now.
    """
    if req is None:
        req = SeedDemoRequest()

    random_code = uuid.uuid4().hex[:7].upper()
    passport_id = f"TP-2026-{random_code}"

    passport = PassportRecord(
        passport_id=passport_id,
        conversation_id="conv-DEMO-001",
        payer=req.payer,
        receiver=req.receiver,
        amount=req.amount,
        currency=req.currency,
        purpose=req.purpose,
        state=PassportState.CONFIRMED,
        original_evidence={
            "source": "Part 2 Transaction Passport (Demo Seed)",
            "conversation_id": "conv-DEMO-001",
            "mutual_consent_reached": True,
            "payer_confirmed_at": datetime.now().isoformat(),
            "receiver_confirmed_at": datetime.now().isoformat(),
            "detection_confidence": 0.97,
            "messages": [
                {"sender": req.receiver, "text": f"You still owe me ₹{int(req.amount)} for the {req.purpose} yesterday"},
                {"sender": req.payer, "text": f"Yes, I'll pay you back ₹{int(req.amount)} for the {req.purpose}"},
            ],
        },
    )
    store.add_passport(passport)

    # Merchant ledger starts at PENDING
    merchant = MerchantRecord(
        passport_id=passport_id,
        amount=req.amount,
        currency=req.currency,
        payer=req.payer,
        receiver=req.receiver,
        status=MerchantStatus.PENDING,
        last_update_reason="Merchant record created on demo seed — awaiting payment",
    )
    store.add_merchant_record(merchant)

    store.append_audit(
        passport_id=passport_id,
        event_type=AuditEventType.PASSPORT_IMPORTED,
        description=f"[DEMO] Passport {passport_id} seeded in CONFIRMED state ({req.currency} {req.amount})",
        data={
            "payer": req.payer,
            "receiver": req.receiver,
            "amount": req.amount,
            "currency": req.currency,
            "purpose": req.purpose,
            "source": "demo_seed",
        },
    )

    logger.info(f"[DEMO] Seeded passport {passport_id} — CONFIRMED ₹{req.amount} ({req.payer}→{req.receiver})")

    return {
        "passport": passport,
        "merchant": merchant,
        "message": f"Demo passport seeded: {passport_id} — CONFIRMED ₹{req.amount} ready for Pay Now",
    }


@app.post("/api/demo/reset")
def reset_demo():
    """Reset all payment store state (demo utility)."""
    store.reset()
    return {
        "status": "reset",
        "message": "All payment data cleared — store reset to initial state",
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
