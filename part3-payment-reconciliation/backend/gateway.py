"""
Part 3 — Mock UPI Gateway
Returns authoritative payment information with status=SUCCESS.

IMPORTANT: The gateway deliberately does NOT update the merchant/lender system.
This creates the intentional MISMATCH for the TrustBridge reconciliation demo:
  Gateway: SUCCESS ₹250  |  Merchant: PENDING ₹250
"""
import uuid
import logging
from datetime import datetime
from models import GatewayResponse, GatewayStatus

logger = logging.getLogger("TrustBridge-MockUPIGateway")


def generate_payment_reference() -> str:
    """Generate a unique payment reference for a new payment attempt."""
    return f"PAY-{uuid.uuid4().hex[:8].upper()}"


def generate_gateway_txn_id() -> str:
    """Generate a gateway transaction ID (simulates NPCI/bank network ID)."""
    return f"GW-TXN-{uuid.uuid4().hex[:12].upper()}"


def simulate_upi_payment(
    passport_id: str,
    payment_reference: str,
    payer: str,
    receiver: str,
    amount: float,
    currency: str = "INR",
) -> GatewayResponse:
    """
    Simulates a UPI payment through the Mock Gateway.

    Returns authoritative payment information with status=SUCCESS.
    The gateway is the source of truth for the payment network.

    NOTE: This function intentionally does NOT update the merchant system.
    The merchant system remains at PENDING ₹250, creating the contradiction
    that the Reconciliation Engine is designed to detect and resolve.

    Returns:
        GatewayResponse with paymentReference, gatewayTransactionId,
        passportId, payer, receiver, amount, timestamp, status=SUCCESS
    """
    gateway_txn_id = generate_gateway_txn_id()
    timestamp = datetime.now().isoformat()

    logger.info("=" * 60)
    logger.info("  [MOCK UPI GATEWAY] Processing Payment Request")
    logger.info(f"  Payment Reference : {payment_reference}")
    logger.info(f"  Gateway Txn ID    : {gateway_txn_id}")
    logger.info(f"  Passport ID       : {passport_id}")
    logger.info(f"  Payer             : {payer}")
    logger.info(f"  Receiver          : {receiver}")
    logger.info(f"  Amount            : {currency} {amount}")
    logger.info(f"  Timestamp         : {timestamp}")
    logger.info(f"  Gateway Status    : SUCCESS ✅")
    logger.info("")
    logger.info("  ⚠️  NOTE: Merchant system NOT updated — PENDING ₹250")
    logger.info("  → This creates the intentional mismatch for reconciliation demo")
    logger.info("=" * 60)

    return GatewayResponse(
        paymentReference=payment_reference,
        gatewayTransactionId=gateway_txn_id,
        passportId=passport_id,
        payer=payer,
        receiver=receiver,
        amount=amount,
        currency=currency,
        timestamp=timestamp,
        status=GatewayStatus.SUCCESS,
        gateway_message=(
            f"Mock UPI Gateway: Payment of {currency} {amount} from {payer} to {receiver} "
            f"processed successfully. Ref: {payment_reference}"
        ),
    )
