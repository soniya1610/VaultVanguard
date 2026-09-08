from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class Message(BaseModel):
    id: str
    sender: str
    text: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class DetectionResult(BaseModel):
    has_financial_intent: bool
    financial_intent: Optional[bool] = None  # Additive field matching output schema requirement
    payer: Optional[str] = None
    receiver: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = "INR"
    purpose: Optional[str] = None
    repayment_intent: Any = False  # bool flag for promise/commitment, or string for backward compatibility
    source_message_ids: List[str] = []
    participants: List[str] = []
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    confidence: float = 0.0
    used_fallback: bool = False
    raw_reasoning: Optional[str] = None
    message_id: Optional[str] = None  # Additive field for source message ID


class ConsentStatus(BaseModel):
    transaction_id: str
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str = "Unspecified"
    payer_confirmed: bool = False
    receiver_confirmed: bool = False
    payer_confirmed_at: Optional[str] = None
    receiver_confirmed_at: Optional[str] = None
    status: str = "PENDING"  # PENDING, MUTUAL_CONSENT_REACHED, DISMISSED
    passport_id: Optional[str] = None
    dismissed_by: Optional[str] = None
    detection: DetectionResult


class ConversationEvidence(BaseModel):
    message_id: str
    sender: str
    text: str
    timestamp: str


class ConfirmationsPayload(BaseModel):
    payer_confirmed_at: Optional[str]
    receiver_confirmed_at: Optional[str]


class PassportPayload(BaseModel):
    conversation_id: str = "conv-12345"
    payer: str
    receiver: str
    amount: float
    currency: str = "INR"
    purpose: str = "tea"
    conversation_evidence: List[ConversationEvidence]
    message_ids: List[str] = []
    participants: List[str] = []
    confirmations: ConfirmationsPayload
    payer_confirmed: bool = True
    receiver_confirmed: bool = True
    detection_confidence: float
    confidence: float = 0.91
    detected_at: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class PassportResponse(BaseModel):
    passport_id: str
    status: str = "CREATED"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    payload_received: Dict[str, Any]


class SendChatRequest(BaseModel):
    sender: str
    text: str


class ConsentActionRequest(BaseModel):
    transaction_id: str
    user: str  # "Arjun" or "Riya"
    action: str  # "confirm" or "dismiss"
