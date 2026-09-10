import unittest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from store import store
from models import PassportState

client = TestClient(app)


class TestPassportService(unittest.TestCase):
    def setUp(self):
        store.reset()

    def tearDown(self):
        store.reset()

    def test_health(self):
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

    def test_passport_minting_and_integrity(self):
        payload = {
            "conversation_id": "conv-test-1",
            "payer": "Arjun",
            "receiver": "Riya",
            "amount": 250.0,
            "currency": "INR",
            "purpose": "tea",
            "message_ids": ["m1", "m2"],
            "participants": ["Arjun", "Riya"],
            "confidence": 0.95,
            "payer_confirmed": True,
            "receiver_confirmed": True,
            "created_at": "2026-09-09T12:00:00Z",
            "conversation_evidence": [
                {"message_id": "m1", "sender": "Riya", "text": "You still owe me ₹250 for tea", "timestamp": "2026-09-09T11:59:00Z"},
                {"message_id": "m2", "sender": "Arjun", "text": "Yes, I will pay ₹250", "timestamp": "2026-09-09T11:59:30Z"}
            ],
            "confirmations": {
                "payer_confirmed_at": "2026-09-09T12:00:00Z",
                "receiver_confirmed_at": "2026-09-09T12:00:05Z"
            },
            "detection_confidence": 0.95,
            "detected_at": "2026-09-09T11:59:30Z"
        }
        res = client.post("/api/passport/create", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "CREATED")
        passport_id = data["passport_id"]
        self.assertTrue(passport_id.startswith("TP-2026-"))
        self.assertIn("upi://", data["upi_deep_link"])
        self.assertEqual(data["state"], "CONFIRMED")

        # Verify integrity
        verify_res = client.get(f"/api/passport/{passport_id}/verify")
        self.assertEqual(verify_res.status_code, 200)
        verify_data = verify_res.json()
        self.assertTrue(verify_data["is_valid"])
        self.assertEqual(verify_data["stored_hash"], verify_data["computed_hash"])

    def test_passport_state_transitions(self):
        seed_res = client.post("/api/demo/seed")
        passport_id = seed_res.json()["passport_id"]

        # Transition: CONFIRMED -> PAYMENT_INITIATED
        t1 = client.post(
            f"/api/passport/{passport_id}/transition",
            json={
                "new_state": "PAYMENT_INITIATED",
                "event_type": "PAYMENT_INITIATED",
                "description": "User clicked Pay Now",
                "payment_reference": "PAY-REF-12345"
            }
        )
        self.assertEqual(t1.status_code, 200)
        self.assertEqual(t1.json()["current_state"], "PAYMENT_INITIATED")

        # Timeline check
        tl_res = client.get(f"/api/passport/{passport_id}/timeline")
        self.assertEqual(tl_res.status_code, 200)
        self.assertGreaterEqual(tl_res.json()["event_count"], 5)


if __name__ == "__main__":
    unittest.main()
