"""
Part 2 — Transaction Passport In-Memory Thread-Safe Store
"""
import threading
import uuid
from datetime import datetime
from typing import Dict, Optional, List, Any

from models import (
    PassportRecord,
    PassportState,
    TimelineEvent,
    EvidenceVerification,
)
from passport_service import can_transition, compute_evidence_hash


class PassportStore:
    def __init__(self):
        self._lock = threading.Lock()
        self.passports: Dict[str, PassportRecord] = {}

    def add_passport(self, record: PassportRecord):
        with self._lock:
            self.passports[record.passport_id] = record

    def get_passport(self, passport_id: str) -> Optional[PassportRecord]:
        with self._lock:
            return self.passports.get(passport_id)

    def list_passports(self) -> List[PassportRecord]:
        with self._lock:
            return list(self.passports.values())

    def update_passport_state(
        self,
        passport_id: str,
        target_state: PassportState,
        event_type: str,
        description: str,
        actor: str = "SYSTEM",
        payment_reference: Optional[str] = None,
        gateway_transaction_id: Optional[str] = None,
        settlement_id: Optional[str] = None,
        dispute_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> PassportRecord:
        with self._lock:
            record = self.passports.get(passport_id)
            if not record:
                raise KeyError(f"Passport {passport_id} not found")

            # Validate state transition
            if not can_transition(record.state, target_state):
                raise ValueError(
                    f"Illegal state transition from {record.state.value} to {target_state.value}"
                )

            now_iso = datetime.now().isoformat()
            record.state = target_state
            record.updated_at = now_iso

            if payment_reference:
                record.payment_reference = payment_reference
            if gateway_transaction_id:
                record.gateway_transaction_id = gateway_transaction_id
            if settlement_id:
                record.settlement_id = settlement_id
            if dispute_id:
                record.dispute_id = dispute_id

            # Add to chronological timeline
            evt = TimelineEvent(
                event_id=f"evt-{uuid.uuid4().hex[:8]}",
                event_type=event_type,
                state=target_state,
                title=f"State changed to {target_state.value}",
                description=description,
                timestamp=now_iso,
                actor=actor,
                evidence_ref=payment_reference or gateway_transaction_id or settlement_id or dispute_id,
                metadata=metadata or {},
            )
            record.timeline.append(evt)
            return record

    def append_timeline_event(self, passport_id: str, event: TimelineEvent):
        with self._lock:
            record = self.passports.get(passport_id)
            if record:
                record.timeline.append(event)
                record.updated_at = datetime.now().isoformat()

    def verify_integrity(self, passport_id: str) -> EvidenceVerification:
        with self._lock:
            record = self.passports.get(passport_id)
            if not record:
                raise KeyError(f"Passport {passport_id} not found")

            recomputed_hash = compute_evidence_hash(record.original_evidence)
            is_valid = recomputed_hash == record.evidence_hash

            return EvidenceVerification(
                passport_id=passport_id,
                stored_hash=record.evidence_hash,
                computed_hash=recomputed_hash,
                is_tamper_evident=True,
                is_valid=is_valid,
            )

    def reset(self):
        with self._lock:
            self.passports.clear()


store = PassportStore()
