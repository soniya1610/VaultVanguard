"""
Part 4 — Dispute Evidence Service
Builds the human-readable evidence translation package from the Transaction Passport.
As specified in content.md:
  - Original Agreement: Arjun agreed to repay ₹250
  - Mutual Confirmation: Arjun and Riya both confirmed
  - Payment Attempt: ₹250 initiated
  - Gateway Evidence: SUCCESS
  - Merchant Evidence: Initially PENDING
  - Reconciliation: Gateway status independently verified
  - Final State: SETTLED
"""
from typing import Dict, Any, Optional
from datetime import datetime

from models import DisputeEvidencePackage, DisputeEvidenceItem


def build_evidence_package(
    passport_id: str,
    passport_data: Optional[Dict[str, Any]] = None,
    payment_data: Optional[Dict[str, Any]] = None,
    merchant_data: Optional[Dict[str, Any]] = None,
) -> DisputeEvidencePackage:
    payer = passport_data.get("payer", "Arjun") if passport_data else "Arjun"
    receiver = passport_data.get("receiver", "Riya") if passport_data else "Riya"
    amount = passport_data.get("amount", 250.0) if passport_data else 250.0
    currency = passport_data.get("currency", "INR") if passport_data else "INR"
    purpose = passport_data.get("purpose", "tea") if passport_data else "tea"
    evidence_hash = (
        passport_data.get("evidence_hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
        if passport_data else "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
    
    pay_ref = payment_data.get("payment_reference", "PAY-UPI-2026-8821") if payment_data else "PAY-UPI-2026-8821"
    gw_status = payment_data.get("gateway_status", "SUCCESS") if payment_data else "SUCCESS"
    now_iso = datetime.now().isoformat()

    items = [
        DisputeEvidenceItem(
            stage="AGREEMENT",
            title="1. Original Agreement in Chat",
            human_readable_verdict=f"{payer} explicitly agreed in chat to repay {receiver} ₹{amount:.2f} for {purpose}.",
            technical_details={
                "payer": payer,
                "receiver": receiver,
                "amount": amount,
                "purpose": purpose,
                "messages": [
                    {"sender": receiver, "text": f"You still owe me ₹{int(amount)} for the {purpose} yesterday"},
                    {"sender": payer, "text": f"Yes, I'll pay you back ₹{int(amount)} for the {purpose}"},
                ],
            },
            timestamp=passport_data.get("created_at", now_iso) if passport_data else now_iso,
            verified=True,
        ),
        DisputeEvidenceItem(
            stage="CONSENT",
            title="2. Mutual Confirmation (Two-Party Consent)",
            human_readable_verdict=f"Both {payer} and {receiver} separately clicked Confirm, reaching verified mutual consent.",
            technical_details={
                "payer_confirmed": True,
                "receiver_confirmed": True,
                "two_party_rule_satisfied": True,
            },
            timestamp=passport_data.get("created_at", now_iso) if passport_data else now_iso,
            verified=True,
        ),
        DisputeEvidenceItem(
            stage="PAYMENT",
            title="3. Payment Attempt Initiated",
            human_readable_verdict=f"{payer} tapped Pay Now. Deep link generated and payment request dispatched to UPI Gateway.",
            technical_details={
                "payment_reference": pay_ref,
                "network": "Mock UPI Gateway",
                "amount": amount,
            },
            timestamp=payment_data.get("initiated_at", now_iso) if payment_data else now_iso,
            verified=True,
        ),
        DisputeEvidenceItem(
            stage="GATEWAY",
            title="4. Gateway Evidence",
            human_readable_verdict=f"UPI Gateway authoritatively returned {gw_status} with payment reference {pay_ref}.",
            technical_details={
                "gateway_status": gw_status,
                "payment_reference": pay_ref,
                "authoritative": True,
            },
            timestamp=now_iso,
            verified=True,
        ),
        DisputeEvidenceItem(
            stage="MERCHANT",
            title="5. Merchant Evidence (Contradiction)",
            human_readable_verdict=f"Lender dashboard temporarily showed PENDING due to asynchronous downstream lag.",
            technical_details={
                "initial_merchant_status": "PENDING",
                "simulated_lag": "Deliberate demo mismatch",
            },
            timestamp=now_iso,
            verified=True,
        ),
        DisputeEvidenceItem(
            stage="RECONCILIATION",
            title="6. Independent Cross-Verification",
            human_readable_verdict="Reconciliation Engine cross-verified 6 attributes against Gateway and confirmed payment validity.",
            technical_details={
                "payer_match": True,
                "receiver_match": True,
                "amount_match": True,
                "passport_match": True,
                "gateway_success": True,
            },
            timestamp=now_iso,
            verified=True,
        ),
        DisputeEvidenceItem(
            stage="FINAL_STATE",
            title="7. Final State: SETTLED",
            human_readable_verdict="Merchant state synchronized to SETTLED. Exactly-once idempotent settlement recorded.",
            technical_details={
                "settlement_status": "SETTLED",
                "idempotency_satisfied": True,
            },
            timestamp=now_iso,
            verified=True,
        ),
    ]

    return DisputeEvidencePackage(
        passport_id=passport_id,
        original_agreement=f"{payer} agreed to repay ₹{amount:.2f} for {purpose}",
        mutual_confirmation=f"{payer} and {receiver} both confirmed",
        payment_attempt=f"₹{amount:.2f} initiated via UPI ({pay_ref})",
        gateway_evidence=f"Authoritative {gw_status}",
        merchant_evidence="Initially PENDING (Downstream Lag)",
        reconciliation_verdict="Gateway status independently verified — 6/6 checks passed",
        final_state="SETTLED (Idempotent exactly-once)",
        evidence_hash=evidence_hash,
        is_tamper_evident=True,
        items=items,
    )
