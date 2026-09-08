import uuid
import logging
from datetime import datetime
from models import PassportPayload, PassportResponse
from store import store

logger = logging.getLogger("TrustBridge-PassportMock")


def create_mock_passport(payload: PassportPayload) -> PassportResponse:
    """
    Mock Integration Endpoint for Part 2 Transaction Passport.
    
    NOTE: Part 1 does NOT own the Transaction Passport service.
    Part 2 owns the real Transaction Passport and state machine lifecycle.
    This mock handler exists ONLY to enable standalone integration testing & demo execution
    before Part 2 is deployed by team members.
    """
    random_code = uuid.uuid4().hex[:7].upper()
    passport_id = f"TP-2026-{random_code}"

    logger.info("==================================================")
    logger.info(" [PART 2 HANDOFF MOCK RECEIPT] Passport Created!")
    logger.info(f" Passport ID: {passport_id}")
    logger.info(f" Conversation ID: {payload.conversation_id}")
    logger.info(f" Payer: {payload.payer} -> Receiver: {payload.receiver}")
    logger.info(f" Amount: {payload.currency} {payload.amount}")
    logger.info(f" Purpose: {payload.purpose}")
    logger.info(f" Both Confirmed: Payer={payload.payer_confirmed}, Receiver={payload.receiver_confirmed}")
    logger.info(f" Detection Confidence: {payload.confidence}")
    logger.info("==================================================")

    response = PassportResponse(
        passport_id=passport_id,
        status="CREATED",
        created_at=datetime.now().isoformat(),
        payload_received=payload.model_dump(),
    )

    store.log_passport_receipt(response.model_dump())
    return response
