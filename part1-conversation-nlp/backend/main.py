import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import CONFIDENCE_THRESHOLD, HOST, PORT
from models import (
    Message,
    DetectionResult,
    ConsentStatus,
    SendChatRequest,
    ConsentActionRequest,
    PassportPayload,
    PassportResponse,
    ConversationEvidence,
    ConfirmationsPayload,
)
from store import store
from nlp_service import detect_financial_intent
from passport_mock import create_mock_passport

app = FastAPI(
    title="TrustBridge - Part 1: Conversation, NLP & Mutual Consent Layer",
    description="API for natural language financial intent detection, mutual consent workflow, and Part 2 Transaction Passport handoff.",
    version="1.0.0",
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
        "layer": "Part 1 - Conversation, NLP & Mutual Consent Layer",
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "message_count": len(store.messages),
        "transaction_count": len(store.transactions),
    }


@app.get("/api/chat/messages")
def get_chat_data():
    return {
        "messages": store.messages,
        "transactions": list(store.transactions.values()),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    }


@app.post("/api/chat/send")
def send_chat_message(req: SendChatRequest):
    if not req.sender or not req.text.strip():
        raise HTTPException(status_code=400, detail="Sender and text are required")

    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    msg = Message(
        id=msg_id,
        sender=req.sender,
        text=req.text.strip(),
        timestamp=datetime.now().isoformat(),
    )
    store.add_message(msg)

    recent_msgs = store.get_recent_messages(limit=10)
    detection = detect_financial_intent(recent_msgs, current_participants=["Arjun", "Riya"])

    new_tx: Optional[ConsentStatus] = None

    if detection.has_financial_intent and detection.confidence >= CONFIDENCE_THRESHOLD:
        existing_tx = None
        for tx in store.transactions.values():
            if (
                tx.status == "PENDING"
                and tx.payer == detection.payer
                and tx.receiver == detection.receiver
                and tx.amount == detection.amount
            ):
                existing_tx = tx
                break

        if not existing_tx:
            tx_id = f"tx-{uuid.uuid4().hex[:8]}"
            new_tx = ConsentStatus(
                transaction_id=tx_id,
                payer=detection.payer or "Arjun",
                receiver=detection.receiver or "Riya",
                amount=detection.amount or 0.0,
                currency=detection.currency or "INR",
                purpose=detection.purpose or "Unspecified",
                payer_confirmed=False,
                receiver_confirmed=False,
                status="PENDING",
                detection=detection,
            )
            store.add_transaction(new_tx)
        else:
            new_tx = existing_tx
    elif detection.has_financial_intent:
        store.log_rejected_detection(
            detection,
            f"Confidence ({detection.confidence:.2f}) below threshold ({CONFIDENCE_THRESHOLD:.2f})",
        )

    return {
        "message": msg,
        "detection": detection,
        "transaction": new_tx,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    }


@app.post("/api/consent/action")
def handle_consent_action(req: ConsentActionRequest):
    tx = store.get_transaction(req.transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if tx.status != "PENDING":
        return {"status": tx.status, "transaction": tx, "message": f"Transaction is already {tx.status}"}

    now_iso = datetime.now().isoformat()

    if req.action == "confirm":
        if req.user == tx.payer:
            tx.payer_confirmed = True
            tx.payer_confirmed_at = now_iso
        elif req.user == tx.receiver:
            tx.receiver_confirmed = True
            tx.receiver_confirmed_at = now_iso
        else:
            raise HTTPException(status_code=400, detail=f"User '{req.user}' is not a participant in this transaction")

        if tx.payer_confirmed and tx.receiver_confirmed:
            tx.status = "MUTUAL_CONSENT_REACHED"

            evidence_msgs: List[ConversationEvidence] = []
            source_ids = set(tx.detection.source_message_ids)
            msg_ids: List[str] = []
            for m in store.messages:
                if m.id in source_ids or any(k in m.text.lower() for k in [tx.purpose.lower(), str(int(tx.amount))]):
                    evidence_msgs.append(
                        ConversationEvidence(
                            message_id=m.id,
                            sender=m.sender,
                            text=m.text,
                            timestamp=m.timestamp,
                        )
                    )
                    msg_ids.append(m.id)

            if not evidence_msgs:
                evidence_msgs = [
                    ConversationEvidence(
                        message_id=m.id,
                        sender=m.sender,
                        text=m.text,
                        timestamp=m.timestamp,
                    )
                    for m in store.messages[-2:]
                ]
                msg_ids = [m.id for m in store.messages[-2:]]

            passport_payload = PassportPayload(
                conversation_id="conv-12345",
                payer=tx.payer,
                receiver=tx.receiver,
                amount=tx.amount,
                currency=tx.currency,
                purpose=tx.purpose,
                conversation_evidence=evidence_msgs,
                message_ids=msg_ids,
                participants=["Arjun", "Riya"],
                confirmations=ConfirmationsPayload(
                    payer_confirmed_at=tx.payer_confirmed_at,
                    receiver_confirmed_at=tx.receiver_confirmed_at,
                ),
                payer_confirmed=True,
                receiver_confirmed=True,
                detection_confidence=tx.detection.confidence,
                confidence=tx.detection.confidence,
                detected_at=tx.detection.timestamp,
                created_at=datetime.now().isoformat(),
            )

            passport_res = create_mock_passport(passport_payload)
            tx.passport_id = passport_res.passport_id

    elif req.action == "dismiss":
        tx.status = "DISMISSED"
        tx.dismissed_by = req.user
        store.log_rejected_detection(
            tx.detection, f"User '{req.user}' dismissed transaction {tx.transaction_id}"
        )
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action '{req.action}'")

    return {
        "transaction": tx,
        "mutual_consent_reached": tx.status == "MUTUAL_CONSENT_REACHED",
        "passport_id": tx.passport_id,
    }


@app.post("/api/passport/create")
def passport_create_endpoint(payload: PassportPayload):
    return create_mock_passport(payload)


@app.post("/api/chat/reset")
def reset_chat_data():
    store.reset()
    return {"status": "success", "message": "All chat history and transactions cleared"}


@app.post("/api/chat/seed-demo")
def seed_demo_data():
    store.reset()

    m1 = Message(
        id="m1",
        sender="Riya",
        text="You still owe me ₹250 for the tea yesterday",
        timestamp=datetime.now().isoformat(),
    )
    store.add_message(m1)

    m2 = Message(
        id="m2",
        sender="Arjun",
        text="Yes, I'll pay you back ₹250 for the tea",
        timestamp=datetime.now().isoformat(),
    )
    store.add_message(m2)

    detection = detect_financial_intent(store.messages, ["Arjun", "Riya"])

    tx_id = f"tx-{uuid.uuid4().hex[:8]}"
    tx = ConsentStatus(
        transaction_id=tx_id,
        payer="Arjun",
        receiver="Riya",
        amount=250.0,
        currency="INR",
        purpose="tea",
        payer_confirmed=False,
        receiver_confirmed=False,
        status="PENDING",
        detection=detection,
    )
    store.add_transaction(tx)

    return {
        "status": "seeded",
        "messages": store.messages,
        "transaction": tx,
    }


@app.get("/api/detections/rejected")
def get_rejected_detections():
    return {
        "count": len(store.rejected_detections),
        "rejected": store.rejected_detections,
    }


@app.get("/api/passport/receipts")
def get_passport_receipts():
    return {
        "count": len(store.passport_receipts),
        "receipts": store.passport_receipts,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
