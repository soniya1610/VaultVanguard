"""
Part 4 — In-Memory Store (DashboardStore)
Holds dispute records. All other data is fetched live from Part 3.
"""
import uuid
import logging
from typing import Dict, List, Optional
from datetime import datetime
from models import DisputeRecord, DisputeStatus, DisputeResolution

logger = logging.getLogger("TrustBridge-P4-Store")


class DashboardStore:
    def __init__(self):
        # Disputes keyed by dispute_id
        self.disputes: Dict[str, DisputeRecord] = {}
        # Index: passport_id → list of dispute_ids
        self._passport_index: Dict[str, List[str]] = {}

    def reset(self):
        self.disputes.clear()
        self._passport_index.clear()
        logger.info("DashboardStore reset to initial state")

    # ------------------------------------------------------------------
    # Dispute operations
    # ------------------------------------------------------------------
    def add_dispute(self, dispute: DisputeRecord) -> DisputeRecord:
        self.disputes[dispute.dispute_id] = dispute
        self._passport_index.setdefault(dispute.passport_id, []).append(dispute.dispute_id)
        logger.info(f"Dispute filed: {dispute.dispute_id} for passport {dispute.passport_id}")
        return dispute

    def get_dispute(self, dispute_id: str) -> Optional[DisputeRecord]:
        return self.disputes.get(dispute_id)

    def get_disputes_for_passport(self, passport_id: str) -> List[DisputeRecord]:
        ids = self._passport_index.get(passport_id, [])
        return [self.disputes[d] for d in ids if d in self.disputes]

    def get_all_disputes(self) -> List[DisputeRecord]:
        return list(self.disputes.values())

    def update_dispute(
        self,
        dispute_id: str,
        status: DisputeStatus,
        resolution: Optional[DisputeResolution] = None,
        resolution_notes: Optional[str] = None,
    ) -> Optional[DisputeRecord]:
        d = self.disputes.get(dispute_id)
        if not d:
            return None
        d.status = status
        d.updated_at = datetime.now().isoformat()
        if resolution:
            d.resolution = resolution
        if resolution_notes:
            d.resolution_notes = resolution_notes
        if status in (DisputeStatus.RESOLVED, DisputeStatus.CLOSED):
            d.resolved_at = datetime.now().isoformat()
        logger.info(f"Dispute {dispute_id} updated → {status.value}")
        return d

    def open_dispute_count(self) -> int:
        return sum(1 for d in self.disputes.values() if d.status == DisputeStatus.OPEN)

    def dispute_count_by_status(self) -> Dict[str, int]:
        counts: Dict[str, int] = {}
        for d in self.disputes.values():
            counts[d.status.value] = counts.get(d.status.value, 0) + 1
        return counts


# Global singleton
store = DashboardStore()
