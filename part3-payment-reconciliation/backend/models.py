"""
Part 3 — Payment Orchestration, Mock UPI Gateway & Reconciliation Engine
Domain Models (Pydantic v2)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


# ---------------------------------------------------------------------------
# Enumerations — strict state machine states
# ---------------------------------------------------------------------------

class PassportState(str, Enum):
    """Transaction Passport lifecycle states in Part 3."""
    CONFIRMED           = "CONFIRMED"            # Handed off from Part 2 — ready for payment
    PAYMENT_INITIATED   = "PAYMENT_INITIATED"    # Pay Now clicked, record created
    PAYMENT_PENDING     = "PAYMENT_PENDING"      # Waiting for gateway response
    PAYMENT_PROCESSED   = "PAYMENT_PROCESSED"    # Gateway returned (SUCCESS or FAILED)
    MISMATCH_DETECTED   = "MISMATCH_DETECTED"    # Gateway SUCCESS but merchant PENDING — contradiction
    RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED"  # Alias for MISMATCH_DETECTED (used in audit)
    RECONCILING         = "RECONCILING"          # Reconciliation engine actively running checks
    VERIFIED            = "VERIFIED"             # All 6 reconciliation checks passed
    SETTLED             = "SETTLED"              # Idempotent settlement record created


class GatewayStatus(str, Enum):
    SUCCESS  = "SUCCESS"
    FAILED   = "FAILED"
    PENDING  = "PENDING"


class MerchantStatus(str, Enum):
    PENDING  = "PENDING"    # Merchant/lender system hasn't registered the payment
    VERIFIED = "VERIFIED"   # Reconciliation confirmed payment
    SETTLED  = "SETTLED"    # Fully settled in merchant ledger


class AuditEventType(str, Enum):
    PASSPORT_IMPORTED     = "PASSPORT_IMPORTED"
    PAYMENT_INITIATED     = "PAYMENT_INITIATED"
    GATEWAY_REQUEST_SENT  = "GATEWAY_REQUEST_SENT"
    GATEWAY_SUCCESS       = "GATEWAY_SUCCESS"
    MERCHANT_CHECKED      = "MERCHANT_CHECKED"
    MISMATCH_DETECTED     = "MISMATCH_DETECTED"
    RECONCILIATION_STARTED = "RECONCILIATION_STARTED"
    RECONCILIATION_CHECK  = "RECONCILIATION_CHECK"
    RECONCILIATION_PASSED = "RECONCILIATION_PASSED"
    RECONCILIATION_FAILED = "RECONCILIATION_FAILED"
    PASSPORT_VERIFIED     = "PASSPORT_VERIFIED"
    SETTLEMENT_CREATED    = "SETTLEMENT_CREATED"
    DUPLICATE_SETTLEMENT_REJECTED = "DUPLICATE_SETTLEMENT_REJECTED"
    GATEWAY_CALLBACK_REPLAY = "GATEWAY_CALLBACK_REPLAY"


# ---------------------------------------------------------------------------
# Core Domain Models
# ---------------------------------------------------------------------------

class PassportRecord(BaseModel):
    """
    Part 3's local copy of a Transaction Passport.
    Imported from Part 2 when status is CONFIRMED.
    Owns the payment state machine from CONFIRMED → SETTLED.
    """
    passport_id: str
    conversation_id: str = "conv-12345"
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str = "Unspecified"
    state: PassportState = PassportState.CONFIRMED
    payment_reference: Optional[str] = None       # Set when payment is initiated
    gateway_transaction_id: Optional[str] = None  # Set after gateway callback
    settlement_id: Optional[str] = None           # Set after idempotent settlement
    imported_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    # Original Part 1/2 evidence — preserved, never overwritten
    original_evidence: Dict[str, Any] = Field(default_factory=dict)


class GatewayResponse(BaseModel):
    """
    Authoritative response from the Mock UPI Gateway.
    This is the source of truth for what the payment network recorded.
    """
    paymentReference: str
    gatewayTransactionId: str
    passportId: str
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    timestamp: str
    status: GatewayStatus
    gateway_message: str = "Transaction processed by Mock UPI Gateway"
    # Note: merchant system is NOT updated by the gateway — that's the deliberate mismatch


class PaymentRecord(BaseModel):
    """
    Internal record of a payment attempt, created when Pay Now is clicked.
    Linked to exactly one Passport.
    """
    payment_reference: str                     # Unique payment reference (PAY-XXXXXXXX)
    passport_id: str
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str = "Unspecified"
    initiated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    gateway_response: Optional[GatewayResponse] = None
    gateway_status: Optional[GatewayStatus] = None
    gateway_callback_count: int = 0            # Tracks duplicate callbacks


class MerchantRecord(BaseModel):
    """
    The merchant/lender system's view of a payment.
    Intentionally NOT updated when gateway returns SUCCESS (creates the demo mismatch).
    Updated only after reconciliation.
    """
    passport_id: str
    payment_reference: Optional[str] = None
    amount: float
    currency: str = "INR"
    payer: str
    receiver: str
    status: MerchantStatus = MerchantStatus.PENDING
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    last_update_reason: str = "Initial merchant record — awaiting payment"


class ReconciliationCheck(BaseModel):
    """A single named check within the reconciliation process."""
    check_name: str
    expected: Any
    actual: Any
    passed: bool
    checked_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ReconciliationResult(BaseModel):
    """Full result of one reconciliation run."""
    passport_id: str
    payment_reference: str
    checks: List[ReconciliationCheck]
    all_passed: bool
    ran_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class SettlementRecord(BaseModel):
    """
    Idempotent, immutable settlement record.
    Keyed by `{passport_id}::{payment_reference}`.
    Exactly one record is ever created per passport+payment pair.
    """
    settlement_id: str                          # SETTLE-XXXXXXXX
    idempotency_key: str                        # "{passport_id}::{payment_reference}"
    passport_id: str
    payment_reference: str
    gateway_transaction_id: str
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str = "Unspecified"
    settled_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    reconciliation_result: Optional[ReconciliationResult] = None


class AuditEvent(BaseModel):
    """
    Immutable audit log entry. Never deleted, never overwritten.
    Preserves the complete chain of evidence including contradictions.
    """
    event_id: str
    passport_id: str
    event_type: AuditEventType
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    data: Dict[str, Any] = Field(default_factory=dict)
    description: str = ""


# ---------------------------------------------------------------------------
# API Request / Response Models
# ---------------------------------------------------------------------------

class ImportPassportRequest(BaseModel):
    """Import a confirmed passport from Part 2 into Part 3."""
    passport_id: str
    conversation_id: str = "conv-12345"
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str = "Unspecified"
    original_evidence: Dict[str, Any] = Field(default_factory=dict)


class InitiatePaymentRequest(BaseModel):
    passport_id: str


class GatewayCallbackRequest(BaseModel):
    """Simulate receiving a UPI gateway callback for a payment."""
    passport_id: str
    payment_reference: str


class ReconcileRequest(BaseModel):
    passport_id: str
    payment_reference: str


class SeedDemoRequest(BaseModel):
    payer: str = "Arjun"
    receiver: str = "Riya"
    amount: float = 250.0
    currency: str = "INR"
    purpose: str = "tea"
