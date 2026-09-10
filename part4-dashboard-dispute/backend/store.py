"""
Part 4 — In-Memory Store for Merchant Ledger & Disputes
"""
import threading
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from models import (
    MerchantTransaction,
    MerchantSyncStatus,
    DisputeRecord,
    DisputeStatus,
    FileDisputeRequest,
    ResolveDisputeRequest,
)
from evidence_service import build_evidence_package


class DisputeStore:
    def __init__(self):
        self._lock = threading.Lock()
        self.transactions: Dict[str, MerchantTransaction] = {}
        self.disputes: Dict[str, DisputeRecord] = {}

    def add_transaction(self, tx: MerchantTransaction):
        with self._lock:
            self.transactions[tx.passport_id] = tx

    def get_transaction(self, passport_id: str) -> Optional[MerchantTransaction]:
        with self._lock:
            return self.transactions.get(passport_id)

    def list_transactions(self) -> List[MerchantTransaction]:
        with self._lock:
            return list(self.transactions.values())

    def update_merchant_status(
        self,
        passport_id: str,
        status: MerchantSyncStatus,
        payment_ref: Optional[str] = None,
    ) -> Optional[MerchantTransaction]:
        with self._lock:
            tx = self.transactions.get(passport_id)
            if not tx:
                # If transaction doesn't exist yet, create it
                tx = MerchantTransaction(
                    passport_id=passport_id,
                    payer="Arjun",
                    receiver="Riya",
                    amount=250.0,
                    purpose="tea",
                    status=status,
                    payment_reference=payment_ref,
                    is_stale_demo_mismatch=status == MerchantSyncStatus.PENDING,
                )
                self.transactions[passport_id] = tx
            else:
                tx.status = status
                if payment_ref:
                    tx.payment_reference = payment_ref
                if status == MerchantSyncStatus.SETTLED:
                    tx.settled_at = datetime.now().isoformat()
                    tx.is_stale_demo_mismatch = False
            return tx

    def file_dispute(self, req: FileDisputeRequest, passport_data=None, payment_data=None) -> DisputeRecord:
        with self._lock:
            dispute_id = f"disp-{uuid.uuid4().hex[:8]}"
            tx = self.transactions.get(req.passport_id)

            evidence_pkg = build_evidence_package(
                passport_id=req.passport_id,
                passport_data=passport_data or (tx.model_dump() if tx else None),
                payment_data=payment_data,
            )

            record = DisputeRecord(
                dispute_id=dispute_id,
                passport_id=req.passport_id,
                initiator=req.initiator,
                respondent="Arjun" if req.initiator == "Riya" else "Riya",
                claim_text=req.claim_text,
                defense_text=req.defense_text,
                status=DisputeStatus.DISPUTED,
                created_at=datetime.now().isoformat(),
                evidence_package=evidence_pkg,
            )
            self.disputes[dispute_id] = record
            return record

    def update_dispute_status(
        self,
        dispute_id: str,
        status: DisputeStatus,
        notes: Optional[str] = None,
    ) -> DisputeRecord:
        with self._lock:
            record = self.disputes.get(dispute_id)
            if not record:
                raise KeyError(f"Dispute {dispute_id} not found")

            record.status = status
            if status == DisputeStatus.RESOLVED:
                record.resolved_at = datetime.now().isoformat()
                record.resolution_notes = notes or "Dispute resolved with cryptographic evidence verification."
            return record

    def get_dispute(self, dispute_id: str) -> Optional[DisputeRecord]:
        with self._lock:
            return self.disputes.get(dispute_id)

    def get_dispute_by_passport(self, passport_id: str) -> Optional[DisputeRecord]:
        with self._lock:
            for d in self.disputes.values():
                if d.passport_id == passport_id:
                    return d
            return None

    def list_disputes(self) -> List[DisputeRecord]:
        with self._lock:
            return list(self.disputes.values())

    def reset(self):
        with self._lock:
            self.transactions.clear()
            self.disputes.clear()


store = DisputeStore()
