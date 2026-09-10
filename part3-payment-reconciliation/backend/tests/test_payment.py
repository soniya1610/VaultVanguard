import unittest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from store import store
from models import PassportState, MerchantStatus

client = TestClient(app)


class TestPaymentAndReconciliation(unittest.TestCase):
    def setUp(self):
        store.reset()

    def tearDown(self):
        store.reset()

    def test_health(self):
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

    def test_payment_and_mismatch_and_reconcile_flow(self):
        # 1. Seed demo passport (CONFIRMED state)
        seed_res = client.post("/api/demo/seed")
        self.assertEqual(seed_res.status_code, 200)
        pid = seed_res.json()["passport"]["passport_id"]

        # 2. Initiate payment
        init_res = client.post("/api/payment/initiate", json={"passport_id": pid})
        self.assertEqual(init_res.status_code, 200)
        pay_ref = init_res.json()["payment_reference"]
        self.assertTrue(pay_ref.startswith("PAY-"))

        # 3. Gateway callback -> introduces deliberate mismatch:
        # Gateway SUCCESS vs Merchant PENDING
        cb_res = client.post(
            "/api/payment/gateway-callback",
            json={"passport_id": pid, "payment_reference": pay_ref}
        )
        self.assertEqual(cb_res.status_code, 200)
        cb_data = cb_res.json()
        self.assertTrue(cb_data["mismatch_detected"])
        self.assertEqual(cb_data["passport"]["state"], "MISMATCH_DETECTED")
        self.assertEqual(cb_data["merchant"]["status"], "PENDING")

        # 4. Reconcile payment (6 checks verified)
        rec_res = client.post(
            "/api/payment/reconcile",
            json={"passport_id": pid, "payment_reference": pay_ref}
        )
        self.assertEqual(rec_res.status_code, 200)
        rec_data = rec_res.json()
        self.assertTrue(rec_data["all_passed"])
        self.assertEqual(rec_data["passport"]["state"], "SETTLED")
        self.assertEqual(rec_data["merchant"]["status"], "SETTLED")
        self.assertEqual(rec_data["settlement_count"], 1)

        # 5. Idempotent replay protection
        replay_res = client.post(
            "/api/payment/gateway-callback",
            json={"passport_id": pid, "payment_reference": pay_ref}
        )
        self.assertEqual(replay_res.status_code, 200)
        self.assertTrue(replay_res.json()["is_replay"])
        self.assertEqual(replay_res.json()["settlement_count"], 1)


if __name__ == "__main__":
    unittest.main()
