"""
Part 4 — Merchant Dashboard & Dispute Resolution
Domain Models (Pydantic v2)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class DisputeStatus(str, Enum):
    OPEN        = "OPEN"         # Dispute filed, under review
    INVESTIGATING = "INVESTIGATING"  # Evidence being examined
    RESOLVED    = "RESOLVED"     # Resolved — decision made
    CLOSED      = "CLOSED"       # Closed without action (invalid dispute)


class DisputeResolution(str, Enum):
    UPHELD      = "UPHELD"       # Dispute upheld — refund/action taken
    DISMISSED   = "DISMISSED"    # Dispute dismissed — original transaction stands
    PARTIAL     = "PARTIAL"      # Partial resolution


class DisputeReason(str, Enum):
    AMOUNT_MISMATCH   = "AMOUNT_MISMATCH"
    UNAUTHORIZED      = "UNAUTHORIZED"
    DOUBLE_CHARGE     = "DOUBLE_CHARGE"
    NOT_RECEIVED      = "NOT_RECEIVED"
    WRONG_RECEIVER    = "WRONG_RECEIVER"
    OTHER             = "OTHER"


# ---------------------------------------------------------------------------
# Core Domain Models
# ---------------------------------------------------------------------------

class EvidenceMessage(BaseModel):
    """A single chat message used as evidence in a dispute."""
    sender: str
    text: str
    timestamp: str


class DisputeRecord(BaseModel):
    """A dispute filed against a specific settled transaction."""
    dispute_id: str                             # DISP-XXXXXXXX
    passport_id: str
    settlement_id: Optional[str] = None
    payment_reference: Optional[str] = None
    filed_by: str                               # Who filed the dispute (payer or receiver)
    reason: DisputeReason
    description: str
    claimed_amount: Optional[float] = None
    status: DisputeStatus = DisputeStatus.OPEN
    resolution: Optional[DisputeResolution] = None
    resolution_notes: Optional[str] = None
    conversation_evidence: List[EvidenceMessage] = Field(default_factory=list)
    reconciliation_checks: List[Dict[str, Any]] = Field(default_factory=list)
    filed_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    resolved_at: Optional[str] = None


class MerchantSummary(BaseModel):
    """Aggregated analytics for the merchant dashboard."""
    total_passports: int = 0
    total_settled: int = 0
    total_pending: int = 0
    total_disputed: int = 0
    total_volume_inr: float = 0.0
    settled_volume_inr: float = 0.0
    open_disputes: int = 0
    resolved_disputes: int = 0
    avg_settlement_time_sec: Optional[float] = None
    top_payers: List[Dict[str, Any]] = Field(default_factory=list)
    top_receivers: List[Dict[str, Any]] = Field(default_factory=list)
    purpose_breakdown: Dict[str, int] = Field(default_factory=dict)
    daily_volume: List[Dict[str, Any]] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# API Request / Response Models
# ---------------------------------------------------------------------------

class FileDisputeRequest(BaseModel):
    passport_id: str
    filed_by: str
    reason: DisputeReason
    description: str
    claimed_amount: Optional[float] = None


class UpdateDisputeRequest(BaseModel):
    dispute_id: str
    status: DisputeStatus
    resolution: Optional[DisputeResolution] = None
    resolution_notes: Optional[str] = None


class SeedDisputeRequest(BaseModel):
    passport_id: str
    filed_by: str = "Arjun"
    reason: DisputeReason = DisputeReason.AMOUNT_MISMATCH
    description: str = "I was charged ₹250 but the agreed amount was ₹200"
