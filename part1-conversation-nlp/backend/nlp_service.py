import re
import json
import logging
from typing import List, Optional, Dict, Any, Tuple
from models import Message, DetectionResult
from config import OPENAI_API_KEY, DEFAULT_CURRENCY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TrustBridge-NLP")


# =====================================================================
# MODULAR PATTERNS & UTILITIES FOR FINANCIAL EXTRACTION
# =====================================================================

SPELLED_UNITS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
}

SPELLED_TENS = {
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
}

CASUAL_COMBINED = {
    "two fifty": 250, "three fifty": 350, "four fifty": 450, "five fifty": 550,
    "one hundred": 100, "two hundred": 200, "three hundred": 300, "four hundred": 400,
    "five hundred": 500, "six hundred": 600, "seven hundred": 700, "eight hundred": 800,
    "nine hundred": 900, "one thousand": 1000, "two thousand": 2000, "five thousand": 5000,
}

INTENT_VERBS = [
    r"\bstill owe\b",
    r"\bowe\b",
    r"\bowes\b",
    r"\bpay me\b",
    r"\byou have to pay\b",
    r"\bhave to pay\b",
    r"\bsend me\b",
    r"\bwill send\b",
    r"\bi'll send you\b",
    r"\bi'll send\b",
    r"\bi'll pay you\b",
    r"\bi'll pay\b",
    r"\bi will pay\b",
    r"\bpay you back\b",
    r"\bsend you\b",
    r"\bcan you send\b",
    r"\bplease send\b",
    r"\breturn my money\b",
    r"\bgive me back\b",
    r"\bpay\b",
    r"\bpaying\b",
    r"\bpaid\b",
    r"\bsend\b",
    r"\btransfer\b",
    r"\brepay\b",
    r"\bdue\b",
    r"\bborrowed\b",
    r"\blend\b",
    r"\blent\b",
]

REPAYMENT_COMMITMENT_PHRASES = [
    r"\bi'll pay\b",
    r"\bi will pay\b",
    r"\bi'll send\b",
    r"\bi will send\b",
    r"\bwill send tomorrow\b",
    r"\bwill pay tomorrow\b",
    r"\bi'll transfer\b",
    r"\bi owe\b",
    r"\bpay you back\b",
    r"\bsending tomorrow\b",
    r"\bpay tomorrow\b",
    r"\brepay\b",
]

EXCLUSION_VERBS = [
    r"\bcost\b",
    r"\bcosts\b",
    r"\bcosted\b",
    r"\bhave\b",
    r"\bhas\b",
    r"\bhad\b",
    r"\bwas\b",
    r"\bis priced at\b",
    r"\bpriced at\b",
    r"\bspent\b",
    r"\bworth\b",
]


def parse_spelled_number(text: str) -> Optional[Tuple[float, Tuple[int, int], str]]:
    text_lower = text.lower()

    for phrase, val in CASUAL_COMBINED.items():
        pattern = rf"\b{phrase}\b(?:\s+(?:rupees|rupee|rs\.?|bucks|inr))?"
        match = re.search(pattern, text_lower)
        if match:
            return float(val), match.span(), match.group(0)

    for word, val in SPELLED_UNITS.items():
        if word in text_lower:
            pattern = rf"\b{word}\s+hundred\b(?:\s+(?:rupees|rupee|rs\.?|bucks|inr))?"
            match = re.search(pattern, text_lower)
            if match:
                return float(val * 100), match.span(), match.group(0)

            pattern_single = rf"\b{word}\b\s+(?:rupees|rupee|rs\.?|bucks|inr)\b"
            match_single = re.search(pattern_single, text_lower)
            if match_single:
                return float(val), match_single.span(), match_single.group(0)

    for word, val in SPELLED_TENS.items():
        pattern_ten = rf"\b{word}\b(?:\s+(?:rupees|rupee|rs\.?|bucks|inr))?"
        match_ten = re.search(pattern_ten, text_lower)
        if match_ten:
            return float(val), match_ten.span(), match_ten.group(0)

    return None


def extract_amount_and_currency(text: str) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    text_clean = text.strip()

    spelled_res = parse_spelled_number(text_clean)
    if spelled_res:
        val, span, raw = spelled_res
        has_curr = any(c in raw.lower() for c in ["rupee", "rs", "bucks", "inr"])
        results.append({
            "amount": val,
            "currency": DEFAULT_CURRENCY,
            "span": span,
            "raw_match": raw,
            "has_explicit_currency": has_curr or ("rupee" in text_clean.lower() or "rs" in text_clean.lower()),
        })

    pat_prefix = re.compile(r"(?P<curr>₹|rs\.?|inr)\s*(?P<amt>\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)", re.IGNORECASE)
    for m in pat_prefix.finditer(text_clean):
        try:
            raw_amt = m.group("amt").replace(",", "")
            val = float(raw_amt)
            results.append({
                "amount": val,
                "currency": DEFAULT_CURRENCY,
                "span": m.span(),
                "raw_match": m.group(0),
                "has_explicit_currency": True,
            })
        except ValueError:
            pass

    pat_suffix = re.compile(r"(?P<amt>\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?P<curr>rs\.?|rupees|rupee|bucks|inr|₹)", re.IGNORECASE)
    for m in pat_suffix.finditer(text_clean):
        try:
            raw_amt = m.group("amt").replace(",", "")
            val = float(raw_amt)
            if not any(abs(r["span"][0] - m.span()[0]) < 2 for r in results):
                results.append({
                    "amount": val,
                    "currency": DEFAULT_CURRENCY,
                    "span": m.span(),
                    "raw_match": m.group(0),
                    "has_explicit_currency": True,
                })
        except ValueError:
            pass

    if not results:
        pat_bare = re.compile(r"\b(?P<amt>\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\b")
        for m in pat_bare.finditer(text_clean):
            try:
                raw_amt = m.group("amt").replace(",", "")
                val = float(raw_amt)
                if val >= 10 and val != 2024 and val != 2025 and val != 2026:
                    results.append({
                        "amount": val,
                        "currency": DEFAULT_CURRENCY,
                        "span": m.span(),
                        "raw_match": m.group(0),
                        "has_explicit_currency": False,
                    })
            except ValueError:
                pass

    return results


def check_verb_proximity(text: str, amount_span: Tuple[int, int], verb_patterns: List[str]) -> Optional[str]:
    start_char = max(0, amount_span[0] - 60)
    end_char = min(len(text), amount_span[1] + 60)
    window = text[start_char:end_char].lower()

    for pat in verb_patterns:
        match = re.search(pat, window, re.IGNORECASE)
        if match:
            return match.group(0)
    return None


def extract_purpose(text: str) -> Optional[str]:
    purpose_match = re.search(
        r"\bfor\s+(?:the\s+)?([a-zA-Z0-9\s]{2,25}?)(?:yesterday|today|last night|tomorrow|$|\.|,)",
        text,
        re.IGNORECASE,
    )
    if purpose_match:
        purpose_candidate = purpose_match.group(1).strip()
        if not re.search(r"^\d", purpose_candidate) and not any(k in purpose_candidate.lower() for k in ["rs", "rupee", "₹", "bucks"]):
            return purpose_candidate
    return None


# =====================================================================
# RULE-BASED FALLBACK EXTRACTION ENGINE
# =====================================================================

def rule_based_fallback_extraction(
    messages: List[Message], current_participants: List[str]
) -> DetectionResult:
    logger.info("[Rule-Based Fallback Extraction] Running heuristic parser")

    if not messages:
        return DetectionResult(
            has_financial_intent=False,
            financial_intent=False,
            confidence=0.0,
            used_fallback=True,
            raw_reasoning="No messages provided",
        )

    last_msg = messages[-1]
    last_text = last_msg.text.strip()
    msg_id = last_msg.id
    timestamp = last_msg.timestamp

    participant_a = current_participants[0] if len(current_participants) > 0 else "Arjun"
    participant_b = current_participants[1] if len(current_participants) > 1 else "Riya"
    sender = last_msg.sender
    other_party = participant_b if sender == participant_a else participant_a

    amount_matches = extract_amount_and_currency(last_text)

    amount = None
    currency = DEFAULT_CURRENCY
    has_explicit_curr = False
    amount_span = (0, len(last_text))

    if amount_matches:
        primary_match = amount_matches[0]
        amount = primary_match["amount"]
        currency = primary_match["currency"]
        has_explicit_curr = primary_match["has_explicit_currency"]
        amount_span = primary_match["span"]
    else:
        for m in reversed(messages[:-1]):
            prior_matches = extract_amount_and_currency(m.text)
            if prior_matches:
                amount = prior_matches[0]["amount"]
                currency = prior_matches[0]["currency"]
                has_explicit_curr = prior_matches[0]["has_explicit_currency"]
                break

    matched_intent_verb = check_verb_proximity(last_text, amount_span, INTENT_VERBS)
    matched_exclusion_verb = check_verb_proximity(last_text, amount_span, EXCLUSION_VERBS)

    if not matched_intent_verb:
        for pat in INTENT_VERBS:
            if re.search(pat, last_text, re.IGNORECASE):
                matched_intent_verb = pat.replace(r"\b", "").replace("\\", "")
                break

    if not matched_exclusion_verb:
        for pat in EXCLUSION_VERBS:
            if re.search(pat, last_text, re.IGNORECASE):
                matched_exclusion_verb = pat.replace(r"\b", "").replace("\\", "")
                break

    has_financial_intent = False
    raw_reasoning = ""

    if matched_intent_verb and amount is not None:
        has_financial_intent = True
        raw_reasoning = f"Matched intent verb '{matched_intent_verb}' with amount {amount} {currency}"
    elif matched_exclusion_verb and not matched_intent_verb:
        has_financial_intent = False
        raw_reasoning = f"Suppressed financial intent due to neutral/exclusion verb '{matched_exclusion_verb}' without obligation verb"
    elif amount is not None and has_explicit_curr and not matched_exclusion_verb:
        has_financial_intent = True
        raw_reasoning = f"Matched explicit currency amount {amount} {currency}"
    else:
        has_financial_intent = False
        raw_reasoning = f"No clear intent verb or explicit amount obligation detected"

    payer = None
    receiver = None
    text_lower = last_text.lower()

    receiver_phrases = ["you owe me", "pay me", "send me", "you have to pay", "give me back", "return my money", "can you send", "please send"]
    is_receiver_statement = any(p in text_lower for p in receiver_phrases)

    payer_phrases = ["i'll pay", "i will pay", "i'll send", "i will send", "i owe", "i'll transfer", "pay you back", "will pay"]
    is_payer_statement = any(p in text_lower for p in payer_phrases)

    if is_receiver_statement:
        receiver = sender
        payer = other_party
    elif is_payer_statement:
        payer = sender
        receiver = other_party
    else:
        prior_payer = None
        prior_receiver = None
        for m in reversed(messages[:-1]):
            m_text = m.text.lower()
            if any(p in m_text for p in receiver_phrases):
                prior_receiver = m.sender
                prior_payer = participant_b if m.sender == participant_a else participant_a
                break
            elif any(p in m_text for p in payer_phrases):
                prior_payer = m.sender
                prior_receiver = participant_b if m.sender == participant_a else participant_a
                break

        if prior_payer and prior_receiver:
            payer = prior_payer
            receiver = prior_receiver
        else:
            payer = other_party
            receiver = sender

    repayment_intent = False
    for pat in REPAYMENT_COMMITMENT_PHRASES:
        if re.search(pat, text_lower):
            repayment_intent = True
            break

    purpose = extract_purpose(last_text)

    confidence = 0.0
    if has_financial_intent:
        confidence = 0.50
        if has_explicit_curr:
            confidence += 0.20
        if matched_intent_verb:
            confidence += 0.20
        if payer and receiver:
            confidence += 0.05
        confidence = min(0.95, confidence)
    else:
        if matched_exclusion_verb:
            confidence = 0.10
        elif amount is not None:
            confidence = 0.30
        else:
            confidence = 0.0

    source_ids = [m.id for m in messages if any(v in m.text.lower() for v in ["owe", "pay", "send"]) or str(int(amount or 0)) in m.text]
    if not source_ids:
        source_ids = [msg_id]

    return DetectionResult(
        has_financial_intent=has_financial_intent,
        financial_intent=has_financial_intent,
        payer=payer,
        receiver=receiver,
        amount=amount,
        currency=currency,
        purpose=purpose,
        repayment_intent=repayment_intent,
        source_message_ids=source_ids,
        participants=current_participants,
        timestamp=timestamp,
        confidence=confidence,
        used_fallback=True,
        raw_reasoning=raw_reasoning,
        message_id=msg_id,
    )


# =====================================================================
# MAIN PIPELINE WITH OPENAI LLM + FALLBACK
# =====================================================================

def detect_financial_intent(
    messages: List[Message], current_participants: Optional[List[str]] = None
) -> DetectionResult:
    if current_participants is None:
        current_participants = ["Arjun", "Riya"]

    if not messages:
        return DetectionResult(
            has_financial_intent=False,
            financial_intent=False,
            confidence=0.0,
            used_fallback=True,
            raw_reasoning="No messages provided",
        )

    last_msg = messages[-1]
    msg_id = last_msg.id
    timestamp = last_msg.timestamp

    if OPENAI_API_KEY:
        try:
            logger.info("[LLM Extraction] Calling OpenAI API for financial intent detection")
            from openai import OpenAI

            client = OpenAI(api_key=OPENAI_API_KEY)

            conversation_history_text = "\n".join(
                [f"[{m.id}] {m.sender}: {m.text} ({m.timestamp})" for m in messages[-10:]]
            )

            system_prompt = f"""
You are a precision NLP financial extraction model for TrustBridge (an Indian context chat payment app).
Analyze the conversation context between participants: {current_participants}.

Rules:
1. Detect if the latest message or context implies a clear financial obligation, debt, or repayment commitment.
2. Currency/Amount: Support ₹400, Rs 400, 400rs, 400 rupees, 400 bucks, spelled-out numbers like "four hundred rupees" -> amount: 400.0, currency: "INR".
3. EXCLUSION RULE (CRITICAL): Do NOT flag financial intent for neutral statements like "The movie cost 400rs", "I have 400rs in my wallet", or "The bill was 400rs" UNLESS a prior turn established debt. If neutral verb ("cost", "have", "was") is the only verb near amount without an obligation phrase ("owe", "pay me", "send me"), set has_financial_intent: false.
4. Repayment Intent: set repayment_intent to true if the message is a promise/commitment to pay ("I'll pay you back", "will send tomorrow"), false for immediate demands or simple debt statements.
5. Payer/Receiver: Payer is the person owing money, Receiver is the person owed money. Maintain consistent roles across turns.

Return ONLY a single valid JSON object matching this schema:
{{
  "has_financial_intent": boolean,
  "financial_intent": boolean,
  "payer": string or null,
  "receiver": string or null,
  "amount": number or null,
  "currency": string (default "INR"),
  "purpose": string or null,
  "repayment_intent": boolean,
  "source_message_ids": list of string message IDs,
  "participants": list of string participant names,
  "confidence": float between 0.0 and 1.0,
  "reasoning": string short explanation
}}
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Recent Conversation History:\n{conversation_history_text}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                timeout=5.0,
            )

            res_content = response.choices[0].message.content
            data = json.loads(res_content)

            logger.info(f"[LLM Extraction] Successfully parsed response: {data}")

            has_intent = bool(data.get("has_financial_intent", False) or data.get("financial_intent", False))
            raw_repay = data.get("repayment_intent", False)
            repay_bool = bool(raw_repay) if isinstance(raw_repay, bool) else (raw_repay in ["immediate", "later", "true", True])

            return DetectionResult(
                has_financial_intent=has_intent,
                financial_intent=has_intent,
                payer=data.get("payer"),
                receiver=data.get("receiver"),
                amount=float(data["amount"]) if data.get("amount") is not None else None,
                currency=data.get("currency", DEFAULT_CURRENCY),
                purpose=data.get("purpose"),
                repayment_intent=repay_bool,
                source_message_ids=data.get("source_message_ids", [m.id for m in messages[-2:]]),
                participants=data.get("participants", current_participants),
                timestamp=timestamp,
                confidence=float(data.get("confidence", 0.0)),
                used_fallback=False,
                raw_reasoning=data.get("reasoning", "LLM Extraction Success"),
                message_id=msg_id,
            )

        except Exception as e:
            logger.warning(f"[LLM Extraction Failed] Error: {e}. Falling back to rule-based heuristics.")

    return rule_based_fallback_extraction(messages, current_participants)
