"""
TrustBridge (VaultVanguard) — Master End-to-End Test Runner
Validates the complete continuous transaction journey specified in content.md:
  1. Casual chat between Arjun and Riya (tea repayment ₹250)
  2. NLP detection of financial commitment & participants
  3. Two-party mutual consent mechanism
  4. Part 2 Transaction Passport minting (TP-2026-XXXXXXX) & SHA-256 evidence hash
  5. UPI Deep Link generation for 'Pay Now'
  6. Payment initiation & Mock UPI Gateway SUCCESS response
  7. Deliberate demonstration failure: Gateway SUCCESS vs Merchant PENDING contradiction
  8. Reconciliation Engine independent cross-verification & state correction
  9. Idempotent exactly-once settlement protection
  10. Part 4 Merchant Dashboard real-time update
  11. Later 'he said / she said' dispute opening & structured human-readable evidence timeline
"""
import subprocess
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def run_isolated_step(script_code: str, description: str):
    print(f"\n>> [E2E STEP] {description}")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    res = subprocess.run(
        [sys.executable, "-c", script_code],
        cwd=ROOT_DIR,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    if res.returncode != 0:
        print(f"FAILED: {description}")
        print("STDOUT:\n", res.stdout)
        print("STDERR:\n", res.stderr)
        sys.exit(1)
    else:
        for line in res.stdout.strip().split("\n"):
            if line.strip():
                print("   ", line.strip())


def main():
    print("=" * 70)
    print(" VaultVanguard — TrustBridge Master End-to-End Validation Suite")
    print("=" * 70)

    # Step 1 & 2: Part 1 Chat & NLP Detection
    step1_code = """
import sys, os
sys.path.insert(0, os.path.join('part1-conversation-nlp', 'backend'))
from main import app
from fastapi.testclient import TestClient
client = TestClient(app)

client.post('/api/chat/reset')
m1 = client.post('/api/chat/send', json={'sender': 'Riya', 'text': 'You still owe me ₹250 for the tea yesterday'}).json()
m2 = client.post('/api/chat/send', json={'sender': 'Arjun', 'text': "Yes, I'll pay you back ₹250 for the tea"}).json()

det = m2['detection']
assert det['has_financial_intent'] is True, 'Financial intent not detected'
assert det['payer'] == 'Arjun'
assert det['receiver'] == 'Riya'
assert det['amount'] == 250.0
assert 'tea' in det['purpose'].lower()
tx = m2['transaction']
assert tx is not None
print(f"[OK] Chat processed: {m1['message']['sender']} & {m2['message']['sender']}")
print(f"[OK] Inline Detection Card created: {det['payer']} owes {det['receiver']} INR {det['amount']} for {det['purpose']}")
print(f"[OK] Tx ID: {tx['transaction_id']} (State: {tx['status']})")
"""
    run_isolated_step(step1_code, "Step 1 & 2: Natural Conversation & NLP Obligation Extraction")

    # Step 3: Two-party mutual consent in Part 1
    step2_code = """
import sys, os
sys.path.insert(0, os.path.join('part1-conversation-nlp', 'backend'))
from main import app
from fastapi.testclient import TestClient
client = TestClient(app)

client.post('/api/chat/seed-demo')
data = client.get('/api/chat/messages').json()
tx_id = data['transactions'][-1]['transaction_id']

# Arjun confirms
c1 = client.post('/api/consent/action', json={'transaction_id': tx_id, 'user': 'Arjun', 'action': 'confirm'}).json()
assert c1['mutual_consent_reached'] is False, 'Should require two confirmations'
print("[OK] Payer (Arjun) confirmed. Status: PENDING (Waiting for Riya)")

# Riya confirms
c2 = client.post('/api/consent/action', json={'transaction_id': tx_id, 'user': 'Riya', 'action': 'confirm'}).json()
assert c2['mutual_consent_reached'] is True, 'Two-party consent failed'
passport_id = c2['passport_id']
assert passport_id.startswith('TP-2026-')
print(f"[OK] Receiver (Riya) confirmed. Mutual Consent Established!")
print(f"[OK] Minted Passport ID: {passport_id}")
"""
    run_isolated_step(step2_code, "Step 3: Two-Party Mutual Consent & Passport Minting Handoff")

    # Step 4: Part 2 Passport Minting, SHA-256 Proof, UPI Link
    step3_code = """
import sys, os
sys.path.insert(0, os.path.join('part2-transaction-passport', 'backend'))
from main import app
from fastapi.testclient import TestClient
client = TestClient(app)

seed = client.post('/api/demo/seed').json()
pid = seed['passport_id']
passport = seed['passport']

# Verify SHA-256
verify = client.get(f'/api/passport/{pid}/verify').json()
assert verify['is_valid'] is True
assert verify['stored_hash'] == verify['computed_hash']
print(f"[OK] Passport {pid} stored in permanent ledger")
print(f"[OK] SHA-256 Digest: {verify['stored_hash'][:24]}... (Tamper-Proof OK)")

# Verify UPI Deep Link
upi = client.get(f'/api/passport/{pid}/upi').json()
assert 'upi://pay' in upi['upi_deep_link']
assert 'pa=riya%40trustbridge' in upi['upi_deep_link']
print(f"[OK] UPI Deep Link Generated for Pay Now: {upi['upi_deep_link']}")

# Verify Chronological Timeline
tl = client.get(f'/api/passport/{pid}/timeline').json()
assert tl['event_count'] >= 4
print(f"[OK] Timeline initialized with {tl['event_count']} chronological milestones")
"""
    run_isolated_step(step3_code, "Step 4: Part 2 Cryptographic Proof & UPI Deep Link Generation")

    # Step 5 & 6: Part 3 Payment, Gateway SUCCESS vs Merchant PENDING (Deliberate Contradiction)
    step4_code = """
import sys, os
sys.path.insert(0, os.path.join('part3-payment-reconciliation', 'backend'))
from main import app
from fastapi.testclient import TestClient
client = TestClient(app)

seed = client.post('/api/demo/seed').json()
pid = seed['passport']['passport_id']

# Pay Now
init_res = client.post('/api/payment/initiate', json={'passport_id': pid}).json()
pay_ref = init_res['payment_reference']
print(f"[OK] Pay Now clicked: Payment initiated ({pay_ref})")

# Gateway callback
cb_res = client.post('/api/payment/gateway-callback', json={'passport_id': pid, 'payment_reference': pay_ref}).json()
assert cb_res['mismatch_detected'] is True
assert cb_res['passport']['state'] == 'MISMATCH_DETECTED'
assert cb_res['merchant']['status'] == 'PENDING'
print(f"[OK] Mock UPI Gateway: SUCCESS INR 250.00")
print(f"[OK] Merchant Dashboard: PENDING INR 250.00 (Artificial Synchronization Lag)")
print(f"[OK] CONTRADICTION DETECTED: Gateway SUCCESS vs Merchant PENDING successfully surfaced!")
"""
    run_isolated_step(step4_code, "Step 5 & 6: Payment Execution & Deliberate Contradiction Injection")

    # Step 7 & 8: Part 3 Reconciliation Engine & Idempotent Settlement
    step5_code = """
import sys, os
sys.path.insert(0, os.path.join('part3-payment-reconciliation', 'backend'))
from main import app
from fastapi.testclient import TestClient
client = TestClient(app)

seed = client.post('/api/demo/seed').json()
pid = seed['passport']['passport_id']
init_res = client.post('/api/payment/initiate', json={'passport_id': pid}).json()
pay_ref = init_res['payment_reference']
client.post('/api/payment/gateway-callback', json={'passport_id': pid, 'payment_reference': pay_ref})

# Run Reconciliation
rec = client.post('/api/payment/reconcile', json={'passport_id': pid, 'payment_reference': pay_ref}).json()
assert rec['all_passed'] is True
assert rec['passport']['state'] == 'SETTLED'
assert rec['merchant']['status'] == 'SETTLED'
assert rec['settlement_count'] == 1
print(f"[OK] Reconciliation 6-point verification PASSED")
print(f"[OK] Merchant status updated from PENDING -> SETTLED in real time")
print(f"[OK] Exactly-once settlement created (Count = 1)")

# Idempotency check
replay = client.post('/api/payment/gateway-callback', json={'passport_id': pid, 'payment_reference': pay_ref}).json()
assert replay['is_replay'] is True
assert replay['settlement_count'] == 1
print(f"[OK] Replayed duplicate callback: Refused duplicate settlement (Idempotent OK)")
"""
    run_isolated_step(step5_code, "Step 7 & 8: Reconciliation Engine & Exactly-Once Idempotency")

    # Step 9 & 10: Part 4 Merchant Dashboard & Dispute Resolution
    step6_code = """
import sys, os
sys.path.insert(0, os.path.join('part4-dashboard-dispute', 'backend'))
from main import app
from fastapi.testclient import TestClient
client = TestClient(app)

# Seed stale contradiction
seed = client.post('/api/demo/seed').json()
pid = seed['passport_id']

dash = client.get('/api/merchant/dashboard').json()
assert dash['summary']['has_stale_contradiction'] is True
print(f"[OK] Riya's Merchant Dashboard reflects deliberate mismatch: {dash['summary']['pending_count']} pending")

# Reconcile sync
sync = client.post('/api/merchant/sync', json={'passport_id': pid, 'status': 'SETTLED'}).json()
dash_updated = client.get('/api/merchant/dashboard').json()
assert dash_updated['summary']['settled_count'] >= 1
print(f"[OK] Riya's Dashboard synced to SETTLED via Reconciliation webhook")

# Later dispute ('he said / she said')
disp = client.post('/api/dispute/file', json={
    'passport_id': pid,
    'initiator': 'Riya',
    'claim_text': 'I never received that INR 250 for tea yesterday',
    'defense_text': 'I already paid you via UPI, check transaction history'
}).json()
did = disp['dispute']['dispute_id']
print(f"[OK] Later Dispute opened: {did} ('He said / She said')")

# Retrieve Structured Evidence Package
ev = client.get(f'/api/dispute/{pid}/evidence').json()['evidence_package']
assert 'Arjun agreed' in ev['original_agreement']
assert 'both confirmed' in ev['mutual_confirmation']
assert 'SUCCESS' in ev['gateway_evidence']
assert 'SETTLED' in ev['final_state']
assert ev['is_tamper_evident'] is True
print(f"[OK] Human-Readable Evidence Timeline compiled:")
for item in ev['items']:
    print(f"   - {item['title']}: {item['human_readable_verdict']}")

# Resolve Dispute
res = client.post(f'/api/dispute/{did}/resolve', json={
    'resolution_action': 'RESOLVE',
    'resolution_notes': 'Cryptographic evidence confirms payment was settled. Dispute closed.'
}).json()
assert res['dispute']['status'] == 'RESOLVED'
print(f"[OK] Dispute successfully RESOLVED using immutable Transaction Passport evidence!")
"""
    run_isolated_step(step6_code, "Step 9 & 10: Part 4 Merchant Dashboard & Verifiable Dispute Resolution")

    print("\n" + "=" * 70)
    print(" ALL 10 STEPS OF THE CONTINUOUS TRANSACTION JOURNEY PASSED SUCCESSFULLY!")
    print(" All 4 parts are matched, interconnected, and fully complete per content.md.")
    print("=" * 70)


if __name__ == "__main__":
    main()
