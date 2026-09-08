import sys
import os
import pytest
from unittest.mock import patch

# Ensure parent directory (backend/) is in python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import Message
from nlp_service import (
    detect_financial_intent,
    rule_based_fallback_extraction,
    extract_amount_and_currency,
)


def create_msg(sender: str, text: str, msg_id: str = "m1") -> Message:
    return Message(id=msg_id, sender=sender, text=text)


# =====================================================================
# 1. AMOUNT & CURRENCY NORMALIZATION TESTS
# =====================================================================

@pytest.mark.parametrize("input_text, expected_amount, expected_curr", [
    ("₹400", 400.0, "INR"),
    ("₹ 400", 400.0, "INR"),
    ("Rs 400", 400.0, "INR"),
    ("Rs. 400", 400.0, "INR"),
    ("400 Rs", 400.0, "INR"),
    ("400rs", 400.0, "INR"),
    ("400 rupees", 400.0, "INR"),
    ("400 bucks", 400.0, "INR"),
    ("four hundred rupees", 400.0, "INR"),
    ("1,500 rs", 1500.0, "INR"),
    ("₹250", 250.0, "INR"),
])
def test_extract_amount_and_currency_variants(input_text, expected_amount, expected_curr):
    res = extract_amount_and_currency(input_text)
    assert len(res) >= 1
    match = res[0]
    assert match["amount"] == expected_amount
    assert match["currency"] == expected_curr


# =====================================================================
# 2. POSITIVE INTENT EXTRACTION TESTS
# =====================================================================

@pytest.mark.parametrize("sender, text, expected_amount, expected_payer, expected_receiver, expected_repay", [
    # Existing demo sentence
    ("Riya", "You still owe me ₹250 for the tea yesterday", 250.0, "Arjun", "Riya", False),
    # Phrasing variations
    ("Riya", "you owe me 400rs", 400.0, "Arjun", "Riya", False),
    ("Riya", "you still owe me 400", 400.0, "Arjun", "Riya", False),
    ("Riya", "send me 400", 400.0, "Arjun", "Riya", False),
    ("Riya", "pay me 400", 400.0, "Arjun", "Riya", False),
    ("Riya", "you have to pay me ₹400", 400.0, "Arjun", "Riya", False),
    ("Arjun", "I'll pay you 400", 400.0, "Arjun", "Riya", True),
    ("Arjun", "I'll send you 400rs", 400.0, "Arjun", "Riya", True),
    ("Arjun", "I will pay you back ₹400", 400.0, "Arjun", "Riya", True),
    ("Riya", "can you send me 400 rupees", 400.0, "Arjun", "Riya", False),
])
def test_positive_financial_intent(sender, text, expected_amount, expected_payer, expected_receiver, expected_repay):
    msgs = [create_msg(sender, text)]
    res = detect_financial_intent(msgs, ["Arjun", "Riya"])

    assert res.has_financial_intent is True
    assert res.financial_intent is True
    assert res.amount == expected_amount
    assert res.currency == "INR"
    assert res.payer == expected_payer
    assert res.receiver == expected_receiver
    assert res.repayment_intent == expected_repay
    assert res.confidence >= 0.50


# =====================================================================
# 3. NEGATIVE EXCLUSION FILTERING TESTS
# =====================================================================

@pytest.mark.parametrize("text", [
    "The movie cost 400rs",
    "I have 400rs in my wallet",
    "The bill was 400rs",
])
def test_negative_financial_intent_exclusions(text):
    msgs = [create_msg("Riya", text)]
    res = detect_financial_intent(msgs, ["Arjun", "Riya"])

    assert res.has_financial_intent is False
    assert res.financial_intent is False
    assert res.amount == 400.0
    assert res.confidence <= 0.30


# =====================================================================
# 4. MULTI-TURN CONTEXT-DEPENDENT TESTS
# =====================================================================

def test_context_dependent_bill_then_obligation():
    m1 = create_msg("Riya", "The bill was 400rs", "m1")
    res1 = detect_financial_intent([m1], ["Arjun", "Riya"])
    assert res1.has_financial_intent is False
    assert res1.amount == 400.0

    m2 = create_msg("Riya", "so you owe me that", "m2")
    res2 = detect_financial_intent([m1, m2], ["Arjun", "Riya"])
    assert res2.has_financial_intent is True
    assert res2.amount == 400.0
    assert res2.payer == "Arjun"
    assert res2.receiver == "Riya"


def test_context_dependent_role_consistency():
    m1 = create_msg("Riya", "You owe me 400rs", "m1")
    res1 = detect_financial_intent([m1], ["Arjun", "Riya"])
    assert res1.has_financial_intent is True
    assert res1.amount == 400.0
    assert res1.currency == "INR"
    assert res1.payer == "Arjun"
    assert res1.receiver == "Riya"
    assert res1.repayment_intent is False

    m2 = create_msg("Arjun", "I'll send you 400rs tomorrow", "m2")
    res2 = detect_financial_intent([m1, m2], ["Arjun", "Riya"])
    assert res2.has_financial_intent is True
    assert res2.amount == 400.0
    assert res2.currency == "INR"
    assert res2.payer == "Arjun"
    assert res2.receiver == "Riya"
    assert res2.repayment_intent is True


# =====================================================================
# 5. STANDALONE FALLBACK EXTRACTION EXPLICIT TEST
# =====================================================================

def test_standalone_fallback_path_without_openai():
    with patch("nlp_service.OPENAI_API_KEY", ""):
        m_pos = create_msg("Riya", "you owe me 400rs")
        res_pos = detect_financial_intent([m_pos], ["Arjun", "Riya"])
        assert res_pos.used_fallback is True
        assert res_pos.has_financial_intent is True
        assert res_pos.amount == 400.0
        assert res_pos.currency == "INR"
        assert res_pos.payer == "Arjun"
        assert res_pos.receiver == "Riya"

        m_neg = create_msg("Riya", "The movie cost 400rs")
        res_neg = detect_financial_intent([m_neg], ["Arjun", "Riya"])
        assert res_neg.used_fallback is True
        assert res_neg.has_financial_intent is False
        assert res_neg.amount == 400.0
