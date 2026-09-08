import sys
import os
import pytest

# Ensure parent directory (backend/) is in python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app
from store import store

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "confidence_threshold" in data

def test_demo_script_flow():
    # 1. Reset
    client.post("/api/chat/reset")

    # 2. Riya sends message 1
    r1 = client.post("/api/chat/send", json={"sender": "Riya", "text": "You still owe me ₹250 for the tea yesterday"})
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["message"]["sender"] == "Riya"

    # 3. Arjun sends message 2
    r2 = client.post("/api/chat/send", json={"sender": "Arjun", "text": "Yes, I'll pay you back ₹250 for the tea"})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["detection"]["has_financial_intent"] is True
    assert d2["transaction"] is not None
    tx_id = d2["transaction"]["transaction_id"]
    assert d2["transaction"]["amount"] == 250.0
    assert d2["transaction"]["payer"] == "Arjun"
    assert d2["transaction"]["receiver"] == "Riya"
    assert d2["transaction"]["status"] == "PENDING"

    # 4. Arjun confirms
    c1 = client.post("/api/consent/action", json={"transaction_id": tx_id, "user": "Arjun", "action": "confirm"})
    assert c1.status_code == 200
    t1 = c1.json()["transaction"]
    assert t1["payer_confirmed"] is True
    assert t1["receiver_confirmed"] is False
    assert t1["status"] == "PENDING"

    # 5. Riya confirms
    c2 = client.post("/api/consent/action", json={"transaction_id": tx_id, "user": "Riya", "action": "confirm"})
    assert c2.status_code == 200
    res2 = c2.json()
    t2 = res2["transaction"]
    assert t2["payer_confirmed"] is True
    assert t2["receiver_confirmed"] is True
    assert t2["status"] == "MUTUAL_CONSENT_REACHED"
    assert t2["passport_id"].startswith("TP-2026-")
    assert res2["mutual_consent_reached"] is True

def test_dismiss_flow():
    client.post("/api/chat/reset")

    client.post("/api/chat/send", json={"sender": "Riya", "text": "Pay me ₹500 for dinner"})
    res = client.post("/api/chat/send", json={"sender": "Arjun", "text": "I will send Rs 500"})
    tx_id = res.json()["transaction"]["transaction_id"]

    d_res = client.post("/api/consent/action", json={"transaction_id": tx_id, "user": "Arjun", "action": "dismiss"})
    assert d_res.status_code == 200
    assert d_res.json()["transaction"]["status"] == "DISMISSED"

if __name__ == "__main__":
    test_health()
    test_demo_script_flow()
    test_dismiss_flow()
    print("All Backend API Integration Tests Passed Successfully!")
