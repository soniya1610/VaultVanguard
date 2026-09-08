from typing import List, Dict, Optional
import uuid
from models import Message, ConsentStatus, DetectionResult

class InMemoryStore:
    def __init__(self):
        self.messages: List[Message] = []
        self.transactions: Dict[str, ConsentStatus] = {}
        self.rejected_detections: List[dict] = []
        self.passport_receipts: List[dict] = []

    def reset(self):
        self.messages.clear()
        self.transactions.clear()
        self.rejected_detections.clear()
        self.passport_receipts.clear()

    def add_message(self, message: Message) -> Message:
        self.messages.append(message)
        return message

    def get_recent_messages(self, limit: int = 10) -> List[Message]:
        return self.messages[-limit:]

    def add_transaction(self, consent_status: ConsentStatus) -> ConsentStatus:
        self.transactions[consent_status.transaction_id] = consent_status
        return consent_status

    def get_transaction(self, transaction_id: str) -> Optional[ConsentStatus]:
        return self.transactions.get(transaction_id)

    def log_rejected_detection(self, detection: DetectionResult, reason: str):
        self.rejected_detections.append({
            "id": f"rej-{uuid.uuid4().hex[:8]}",
            "reason": reason,
            "detection": detection.model_dump(),
        })

    def log_passport_receipt(self, receipt: dict):
        self.passport_receipts.append(receipt)


# Global singleton instance for Part 1
store = InMemoryStore()
