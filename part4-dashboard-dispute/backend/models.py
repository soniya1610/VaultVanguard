"""
Part 4 — Merchant Dashboard & Dispute Resolution
Domain Models (Pydantic v2)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class MerchantSyncStatus(str, Enum):
    PENDING = "PENDING"      # Deliberate stale state during demo!
    VERIFIED = "VERIFIED"    # Reconciliation confirmed
    SETTLED = "SETTLED"      # Corrected real-time state


class DisputeStatus(str, Enum):
    SETTLED = "SETTLED"           # Clean initial state
    DISPUTED = "DISPUTED"         # Dispute opened by participant
    UNDER_REVIEW = "UNDER_REVIEW" # Evidence timeline being reviewed
    RESOLVED = "RESOLVED"         # Dispute settled using immutable evidence


class MerchantTransaction(BaseModel):
    passport_id: str
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str
    status: MerchantSyncStatus = MerchantSyncStatus.PENDING
    payment_reference: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    settled_at: Optional[str] = None
    is_stale_demo_mismatch: bool = True  # True when artificially held at PENDING


class DisputeEvidenceItem(BaseModel):
    stage: str
    title: str
    human_readable_verdict: str
    technical_details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str
    verified: bool = True


class DisputeEvidencePackage(BaseModel):
    passport_id: str
    original_agreement: str
    mutual_confirmation: str
    payment_attempt: str
    gateway_evidence: str
    merchant_evidence: str
    reconciliation_verdict: str
    final_state: str
    evidence_hash: str
    is_tamper_evident: bool = True
    items: List[DisputeEvidenceItem] = Field(default_factory=list)


class DisputeRecord(BaseModel):
    dispute_id: str
    passport_id: str
    initiator: str  # e.g., 'Riya' claiming 'I never received that ₹250'
    respondent: str # e.g., 'Arjun' saying 'I already paid you'
    claim_text: str
    defense_text: str
    status: DisputeStatus = DisputeStatus.DISPUTED
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    resolved_at: Optional[str] = None
    resolution_notes: Optional[str] = None
    evidence_package: Optional[DisputeEvidencePackage] = None


class FileDisputeRequest(BaseModel):
    passport_id: str
    initiator: str = "Riya"
    claim_text: str = "I never received that ₹250 for tea yesterday"
    defense_text: str = "I already paid you via UPI, check the transaction"


class ResolveDisputeRequest(BaseModel):
    resolution_action: str = "RESOLVE_IN_FAVOR_OF_SETTLEMENT"
    resolution_notes: str = (
        "Reconciliation evidence verified against authoritative Mock UPI Gateway. "
        "Payment was executed successfully. Merchant state corrected. Dispute closed."
    )


class SyncMerchantRequest(BaseModel):
    passport_id: str
    status: MerchantSyncStatus
    payment_reference: Optional[str] = None
    update_reason: Optional[str] = None
