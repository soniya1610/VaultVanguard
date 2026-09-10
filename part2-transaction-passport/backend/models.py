"""
Part 2 — Transaction Passport & State Machine
Domain Models (Pydantic v2)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class PassportState(str, Enum):
    """Complete lifecycle states for Transaction Passport per content.md."""
    DETECTED            = "DETECTED"             # NLP detected commitment
    CONFIRMED           = "CONFIRMED"            # Both parties gave mutual consent -> Passport minted
    PAYMENT_INITIATED   = "PAYMENT_INITIATED"    # Payer tapped 'Pay Now'
    PAYMENT_PENDING     = "PAYMENT_PENDING"      # Dispatched to UPI Gateway, waiting callback
    PAYMENT_PROCESSED   = "PAYMENT_PROCESSED"    # Gateway returned status
    MISMATCH_DETECTED   = "MISMATCH_DETECTED"    # Gateway SUCCESS vs Merchant PENDING
    RECONCILING         = "RECONCILING"          # Reconciliation engine cross-verifying
    VERIFIED            = "VERIFIED"             # Authoritative evidence verified
    SETTLED             = "SETTLED"              # Idempotent settlement recorded
    DISPUTED            = "DISPUTED"             # Dispute opened ('he said / she said')
    UNDER_REVIEW        = "UNDER_REVIEW"         # Evidence timeline under review
    RESOLVED            = "RESOLVED"             # Dispute resolved with evidence


class ConversationEvidenceItem(BaseModel):
    message_id: str
    sender: str
    text: str
    timestamp: str


class ConfirmationsPayload(BaseModel):
    payer_confirmed_at: Optional[str] = None
    receiver_confirmed_at: Optional[str] = None


class CreatePassportRequest(BaseModel):
    """Matches the exact handoff payload emitted by Part 1 upon mutual consent."""
    conversation_id: str = "conv-12345"
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str = "tea"
    message_ids: List[str] = Field(default_factory=list)
    participants: List[str] = Field(default_factory=lambda: ["Arjun", "Riya"])
    confidence: float = 0.95
    payer_confirmed: bool = True
    receiver_confirmed: bool = True
    created_at: Optional[str] = None
    conversation_evidence: List[ConversationEvidenceItem] = Field(default_factory=list)
    confirmations: Optional[ConfirmationsPayload] = None
    detection_confidence: Optional[float] = None
    detected_at: Optional[str] = None


class TimelineEvent(BaseModel):
    event_id: str
    event_type: str
    state: PassportState
    title: str
    description: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    actor: str = "SYSTEM"
    evidence_ref: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PassportRecord(BaseModel):
    passport_id: str
    conversation_id: str
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str
    state: PassportState = PassportState.CONFIRMED
    evidence_hash: str
    upi_deep_link: str
    created_at: str
    updated_at: str
    payer_confirmed_at: Optional[str] = None
    receiver_confirmed_at: Optional[str] = None
    payment_reference: Optional[str] = None
    gateway_transaction_id: Optional[str] = None
    settlement_id: Optional[str] = None
    dispute_id: Optional[str] = None
    original_evidence: Dict[str, Any] = Field(default_factory=dict)
    timeline: List[TimelineEvent] = Field(default_factory=list)


class TransitionRequest(BaseModel):
    new_state: PassportState
    event_type: str
    description: str
    actor: Optional[str] = "SYSTEM"
    payment_reference: Optional[str] = None
    gateway_transaction_id: Optional[str] = None
    settlement_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EvidenceVerification(BaseModel):
    passport_id: str
    stored_hash: str
    computed_hash: str
    is_tamper_evident: bool
    is_valid: bool
    verified_at: str = Field(default_factory=lambda: datetime.now().isoformat())
