"""
Part 3 — In-Memory Store (PaymentStore)
Follows the same singleton pattern as Part 1's InMemoryStore.
"""
import uuid
import logging
from typing import Dict, List, Set, Optional
from models import (
    PassportRecord,
    PaymentRecord,
    MerchantRecord,
    SettlementRecord,
    AuditEvent,
    AuditEventType,
    PassportState,
)
from datetime import datetime

logger = logging.getLogger("TrustBridge-P3-Store")


class PaymentStore:
    def __init__(self):
        # Primary domain objects
        self.passports: Dict[str, PassportRecord] = {}         # keyed by passport_id
        self.payments: Dict[str, PaymentRecord] = {}           # keyed by payment_reference
        self.merchant_records: Dict[str, MerchantRecord] = {}  # keyed by passport_id
        self.settlement_records: Dict[str, SettlementRecord] = {}  # keyed by idempotency_key

        # Idempotency: set of "{passport_id}::{payment_reference}" strings
        self.settled_keys: Set[str] = set()

        # Audit trail — append-only, never deleted
        self.audit_log: List[AuditEvent] = []

    # ------------------------------------------------------------------
    # Reset (demo utility)
    # ------------------------------------------------------------------
    def reset(self):
        self.passports.clear()
        self.payments.clear()
        self.merchant_records.clear()
        self.settlement_records.clear()
        self.settled_keys.clear()
        self.audit_log.clear()
        logger.info("PaymentStore reset to initial state")

    # ------------------------------------------------------------------
    # Passport operations
    # ------------------------------------------------------------------
    def add_passport(self, passport: PassportRecord) -> PassportRecord:
        self.passports[passport.passport_id] = passport
        return passport

    def get_passport(self, passport_id: str) -> Optional[PassportRecord]:
        return self.passports.get(passport_id)

    def update_passport_state(self, passport_id: str, new_state: PassportState, **kwargs) -> Optional[PassportRecord]:
        """Transition passport to a new state and optionally update fields."""
        p = self.passports.get(passport_id)
        if not p:
            return None
        p.state = new_state
        p.updated_at = datetime.now().isoformat()
        for k, v in kwargs.items():
            if hasattr(p, k):
                setattr(p, k, v)
        logger.info(f"Passport {passport_id} → {new_state.value}")
        return p

    # ------------------------------------------------------------------
    # Payment operations
    # ------------------------------------------------------------------
    def add_payment(self, payment: PaymentRecord) -> PaymentRecord:
        self.payments[payment.payment_reference] = payment
        return payment

    def get_payment(self, payment_reference: str) -> Optional[PaymentRecord]:
        return self.payments.get(payment_reference)

    def get_payment_by_passport(self, passport_id: str) -> Optional[PaymentRecord]:
        for p in self.payments.values():
            if p.passport_id == passport_id:
                return p
        return None

    # ------------------------------------------------------------------
    # Merchant ledger operations
    # ------------------------------------------------------------------
    def add_merchant_record(self, record: MerchantRecord) -> MerchantRecord:
        self.merchant_records[record.passport_id] = record
        return record

    def get_merchant_record(self, passport_id: str) -> Optional[MerchantRecord]:
        return self.merchant_records.get(passport_id)

    def update_merchant_status(self, passport_id: str, status, reason: str) -> Optional[MerchantRecord]:
        rec = self.merchant_records.get(passport_id)
        if not rec:
            return None
        rec.status = status
        rec.updated_at = datetime.now().isoformat()
        rec.last_update_reason = reason
        return rec

    # ------------------------------------------------------------------
    # Settlement operations — idempotent exactly-once
    # ------------------------------------------------------------------
    def idempotency_key(self, passport_id: str, payment_reference: str) -> str:
        return f"{passport_id}::{payment_reference}"

    def is_already_settled(self, passport_id: str, payment_reference: str) -> bool:
        key = self.idempotency_key(passport_id, payment_reference)
        return key in self.settled_keys

    def create_settlement(self, settlement: SettlementRecord) -> SettlementRecord:
        """
        Create a settlement record — idempotent.
        If the key already exists, returns the existing record unchanged.
        """
        key = settlement.idempotency_key
        if key in self.settled_keys:
            existing = self.settlement_records[key]
            logger.warning(f"Duplicate settlement attempt for key={key} — returning existing record")
            return existing

        self.settled_keys.add(key)
        self.settlement_records[key] = settlement
        logger.info(f"Settlement created: {settlement.settlement_id} (key={key})")
        return settlement

    def get_settlement(self, passport_id: str, payment_reference: str) -> Optional[SettlementRecord]:
        key = self.idempotency_key(passport_id, payment_reference)
        return self.settlement_records.get(key)

    def settlement_count(self) -> int:
        return len(self.settlement_records)

    # ------------------------------------------------------------------
    # Audit log operations
    # ------------------------------------------------------------------
    def append_audit(
        self,
        passport_id: str,
        event_type: AuditEventType,
        description: str,
        data: dict = None,
    ) -> AuditEvent:
        event = AuditEvent(
            event_id=f"audit-{uuid.uuid4().hex[:8]}",
            passport_id=passport_id,
            event_type=event_type,
            timestamp=datetime.now().isoformat(),
            data=data or {},
            description=description,
        )
        self.audit_log.append(event)
        logger.info(f"AUDIT [{event_type.value}] {passport_id}: {description}")
        return event

    def get_audit_log(self, passport_id: str) -> List[AuditEvent]:
        return [e for e in self.audit_log if e.passport_id == passport_id]

    def get_all_audit_events(self) -> List[AuditEvent]:
        return list(self.audit_log)


# Global singleton — same pattern as Part 1
store = PaymentStore()
