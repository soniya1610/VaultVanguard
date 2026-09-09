"""
Part 3 — Reconciliation Engine

Verifies gateway payment evidence against the Transaction Passport and
merchant system. Implements the 6-point check, state transitions, and
idempotent exactly-once settlement.

State flow managed here:
  MISMATCH_DETECTED → RECONCILING → VERIFIED → SETTLED

Idempotency guarantee:
  Duplicate gateway callbacks, webhook retries, or repeated reconciliation
  calls NEVER produce duplicate settlement records. The idempotency key
  `{passport_id}::{payment_reference}` is checked before any settlement
  is created.
"""
import uuid
import logging
from datetime import datetime
from typing import Optional, Tuple

from models import (
    PassportRecord,
    PaymentRecord,
    MerchantRecord,
    SettlementRecord,
    ReconciliationCheck,
    ReconciliationResult,
    PassportState,
    GatewayStatus,
    MerchantStatus,
    AuditEventType,
)
from store import store

logger = logging.getLogger("TrustBridge-ReconciliationEngine")


def _make_check(name: str, expected, actual) -> ReconciliationCheck:
    passed = str(expected).strip().lower() == str(actual).strip().lower()
    return ReconciliationCheck(
        check_name=name,
        expected=expected,
        actual=actual,
        passed=passed,
    )


def detect_mismatch(passport_id: str) -> Tuple[bool, str]:
    """
    Check whether a PAYMENT_PROCESSED passport has a gateway/merchant mismatch.

    Returns (mismatch_exists: bool, reason: str)
    """
    passport = store.get_passport(passport_id)
    if not passport:
        return False, "Passport not found"

    if passport.state != PassportState.PAYMENT_PROCESSED:
        return False, f"Passport not in PAYMENT_PROCESSED state (currently: {passport.state.value})"

    payment = store.get_payment_by_passport(passport_id)
    if not payment:
        return False, "No payment record found for this passport"

    merchant = store.get_merchant_record(passport_id)
    if not merchant:
        return False, "No merchant record found for this passport"

    gateway_success = (
        payment.gateway_response is not None
        and payment.gateway_response.status == GatewayStatus.SUCCESS
    )
    merchant_pending = merchant.status == MerchantStatus.PENDING

    if gateway_success and merchant_pending:
        return True, (
            f"MISMATCH: Gateway reports SUCCESS ₹{payment.amount} "
            f"but Merchant system shows PENDING ₹{merchant.amount}"
        )

    return False, "No mismatch detected"


def run_reconciliation(passport_id: str, payment_reference: str) -> ReconciliationResult:
    """
    Run the 6-point reconciliation check on a MISMATCH_DETECTED passport.

    Checks performed:
      1. Payer matches between passport and gateway response
      2. Receiver matches between passport and gateway response
      3. Amount matches between passport and gateway response
      4. Passport ID matches between record and gateway response
      5. Payment reference matches between record and gateway response
      6. Gateway status is SUCCESS

    On all checks passing:
      - Passport: MISMATCH_DETECTED → RECONCILING → VERIFIED → SETTLED
      - Merchant: PENDING → SETTLED
      - Settlement record created (idempotent)

    Returns:
        ReconciliationResult with all 6 checks and overall pass/fail
    """
    logger.info("=" * 60)
    logger.info("  [RECONCILIATION ENGINE] Starting 6-point verification")
    logger.info(f"  Passport ID       : {passport_id}")
    logger.info(f"  Payment Reference : {payment_reference}")
    logger.info("=" * 60)

    # ── Fetch all required records ──────────────────────────────────────
    passport = store.get_passport(passport_id)
    payment = store.get_payment(payment_reference)
    merchant = store.get_merchant_record(passport_id)

    if not passport:
        raise ValueError(f"Passport not found: {passport_id}")
    if not payment:
        raise ValueError(f"Payment record not found: {payment_reference}")
    if not payment.gateway_response:
        raise ValueError(f"No gateway response for payment: {payment_reference}")
    if not merchant:
        raise ValueError(f"No merchant record for passport: {passport_id}")

    gw = payment.gateway_response  # The authoritative gateway evidence

    # ── Transition to RECONCILING ────────────────────────────────────────
    store.update_passport_state(passport_id, PassportState.RECONCILING)
    store.append_audit(
        passport_id=passport_id,
        event_type=AuditEventType.RECONCILIATION_STARTED,
        description="Reconciliation engine started — running 6-point evidence verification",
        data={
            "payment_reference": payment_reference,
            "gateway_status": gw.status.value,
            "merchant_status": merchant.status.value,
        },
    )

    # ── 6 reconciliation checks ──────────────────────────────────────────
    checks = [
        _make_check("1. Payer Match",          passport.payer,           gw.payer),
        _make_check("2. Receiver Match",       passport.receiver,        gw.receiver),
        _make_check("3. Amount Match",         str(passport.amount),     str(gw.amount)),
        _make_check("4. Passport ID Match",    passport.passport_id,     gw.passportId),
        _make_check("5. Payment Ref Match",    payment_reference,        gw.paymentReference),
        _make_check("6. Gateway Status",       GatewayStatus.SUCCESS,    gw.status),
    ]

    for chk in checks:
        status_icon = "✓" if chk.passed else "✗"
        logger.info(f"  [{status_icon}] {chk.check_name}: expected={chk.expected} actual={chk.actual}")
        store.append_audit(
            passport_id=passport_id,
            event_type=AuditEventType.RECONCILIATION_CHECK,
            description=f"{status_icon} {chk.check_name}: {'PASS' if chk.passed else 'FAIL'}",
            data=chk.model_dump(),
        )

    all_passed = all(c.passed for c in checks)

    result = ReconciliationResult(
        passport_id=passport_id,
        payment_reference=payment_reference,
        checks=checks,
        all_passed=all_passed,
    )

    # ── Act on result ────────────────────────────────────────────────────
    if all_passed:
        logger.info("  ✅ All 6 reconciliation checks PASSED")
        store.append_audit(
            passport_id=passport_id,
            event_type=AuditEventType.RECONCILIATION_PASSED,
            description="All 6 reconciliation checks passed — evidence verified",
            data={"checks_passed": 6, "checks_failed": 0},
        )

        # RECONCILING → VERIFIED
        store.update_passport_state(
            passport_id,
            PassportState.VERIFIED,
            payment_reference=payment_reference,
            gateway_transaction_id=gw.gatewayTransactionId,
        )
        store.append_audit(
            passport_id=passport_id,
            event_type=AuditEventType.PASSPORT_VERIFIED,
            description="Passport state → VERIFIED: gateway evidence confirmed against passport data",
            data={
                "passport_id": passport_id,
                "gateway_transaction_id": gw.gatewayTransactionId,
                "amount": passport.amount,
                "currency": passport.currency,
            },
        )

        # Create idempotent settlement
        settlement = _create_settlement(passport_id, payment_reference, gw.gatewayTransactionId, result)

        # Update merchant from PENDING → SETTLED
        store.update_merchant_status(
            passport_id,
            MerchantStatus.SETTLED,
            reason=f"Reconciliation verified: settlement {settlement.settlement_id}",
        )
        merchant_updated = store.get_merchant_record(passport_id)
        store.append_audit(
            passport_id=passport_id,
            event_type=AuditEventType.MERCHANT_CHECKED,
            description="Merchant system updated: PENDING → SETTLED after reconciliation",
            data={
                "old_status": MerchantStatus.PENDING.value,
                "new_status": MerchantStatus.SETTLED.value,
                "settlement_id": settlement.settlement_id,
            },
        )

        # VERIFIED → SETTLED
        store.update_passport_state(
            passport_id,
            PassportState.SETTLED,
            settlement_id=settlement.settlement_id,
        )

    else:
        failed = [c.check_name for c in checks if not c.passed]
        logger.error(f"  ❌ Reconciliation FAILED: {failed}")
        store.append_audit(
            passport_id=passport_id,
            event_type=AuditEventType.RECONCILIATION_FAILED,
            description=f"Reconciliation FAILED on checks: {', '.join(failed)}",
            data={"failed_checks": failed},
        )
        # Revert to MISMATCH_DETECTED for retry
        store.update_passport_state(passport_id, PassportState.MISMATCH_DETECTED)

    return result


def _create_settlement(
    passport_id: str,
    payment_reference: str,
    gateway_txn_id: str,
    reconciliation_result: ReconciliationResult,
) -> SettlementRecord:
    """
    Create an idempotent settlement record.
    If already settled, returns existing record and logs the duplicate attempt.
    """
    idempotency_key = store.idempotency_key(passport_id, payment_reference)

    if store.is_already_settled(passport_id, payment_reference):
        existing = store.settlement_records[idempotency_key]
        logger.warning(
            f"Duplicate settlement attempt — idempotency key={idempotency_key} "
            f"already settled as {existing.settlement_id}"
        )
        store.append_audit(
            passport_id=passport_id,
            event_type=AuditEventType.DUPLICATE_SETTLEMENT_REJECTED,
            description=f"Duplicate settlement attempt rejected — idempotency key already exists",
            data={
                "idempotency_key": idempotency_key,
                "existing_settlement_id": existing.settlement_id,
                "total_settlement_count": store.settlement_count(),
            },
        )
        return existing

    passport = store.get_passport(passport_id)
    settlement_id = f"SETTLE-{uuid.uuid4().hex[:8].upper()}"
    settlement = SettlementRecord(
        settlement_id=settlement_id,
        idempotency_key=idempotency_key,
        passport_id=passport_id,
        payment_reference=payment_reference,
        gateway_transaction_id=gateway_txn_id,
        payer=passport.payer,
        receiver=passport.receiver,
        amount=passport.amount,
        currency=passport.currency,
        purpose=passport.purpose,
        settled_at=datetime.now().isoformat(),
        reconciliation_result=reconciliation_result,
    )

    created = store.create_settlement(settlement)

    store.append_audit(
        passport_id=passport_id,
        event_type=AuditEventType.SETTLEMENT_CREATED,
        description=f"Settlement created: {settlement_id} — exactly once (idempotent)",
        data={
            "settlement_id": settlement_id,
            "idempotency_key": idempotency_key,
            "amount": passport.amount,
            "currency": passport.currency,
            "total_settlement_count": store.settlement_count(),
        },
    )

    logger.info(f"  ✅ Settlement created: {settlement_id} (key={idempotency_key})")
    return created
