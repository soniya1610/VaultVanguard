import unittest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from store import store
from models import MerchantSyncStatus, DisputeStatus

client = TestClient(app)


class TestDisputeService(unittest.TestCase):
    def setUp(self):
        store.reset()

    def tearDown(self):
        store.reset()

    def test_health(self):
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

    def test_merchant_dashboard_and_sync(self):
        # Seed demo
        seed_res = client.post("/api/demo/seed")
        self.assertEqual(seed_res.status_code, 200)
        pid = seed_res.json()["passport_id"]

        # Dashboard shows PENDING
        dash1 = client.get("/api/merchant/dashboard").json()
        self.assertEqual(dash1["summary"]["pending_count"], 1)
        self.assertTrue(dash1["summary"]["has_stale_contradiction"])

        # Sync from Reconciliation (PENDING -> SETTLED)
        sync_res = client.post(
            "/api/merchant/sync",
            json={
                "passport_id": pid,
                "status": "SETTLED",
                "payment_reference": "PAY-UPI-2026-8821",
                "update_reason": "Reconciliation verified"
            }
        )
        self.assertEqual(sync_res.status_code, 200)

        # Dashboard now shows SETTLED
        dash2 = client.get("/api/merchant/dashboard").json()
        self.assertEqual(dash2["summary"]["settled_count"], 1)
        self.assertEqual(dash2["summary"]["pending_count"], 0)

    def test_dispute_workflow_and_evidence(self):
        pid = "TP-2026-TEST"
        # File dispute
        file_res = client.post(
            "/api/dispute/file",
            json={
                "passport_id": pid,
                "initiator": "Riya",
                "claim_text": "I never received that ₹250 for tea",
                "defense_text": "I paid via UPI"
            }
        )
        self.assertEqual(file_res.status_code, 200)
        dispute_id = file_res.json()["dispute"]["dispute_id"]

        # Evidence package check
        ev_res = client.get(f"/api/dispute/{pid}/evidence")
        self.assertEqual(ev_res.status_code, 200)
        pkg = ev_res.json()["evidence_package"]
        self.assertIn("Arjun agreed", pkg["original_agreement"])
        self.assertIn("6/6 checks passed", pkg["reconciliation_verdict"])
        self.assertTrue(pkg["is_tamper_evident"])
        self.assertEqual(len(pkg["items"]), 7)

        # Review & resolve dispute
        rev_res = client.post(f"/api/dispute/{dispute_id}/review")
        self.assertEqual(rev_res.status_code, 200)
        self.assertEqual(rev_res.json()["dispute"]["status"], "UNDER_REVIEW")

        res_res = client.post(
            f"/api/dispute/{dispute_id}/resolve",
            json={"resolution_action": "RESOLVE", "resolution_notes": "Authoritative evidence confirmed payment"}
        )
        self.assertEqual(res_res.status_code, 200)
        self.assertEqual(res_res.json()["dispute"]["status"], "RESOLVED")


if __name__ == "__main__":
    unittest.main()
