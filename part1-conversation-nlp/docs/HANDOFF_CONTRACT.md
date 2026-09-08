# TrustBridge Part 1 -> Part 2 Handoff Contract

This document specifies the exact REST API handoff contract between **Part 1 (Conversation, NLP & Mutual Consent Layer)** and **Part 2 (Transaction Passport & State Machine)**.

---

## Overview

Part 1 is responsible for detecting financial intent from natural conversations and collecting explicit 2-Party Mutual Consent from both participants (`payer` and `receiver`).

**Important Architecture Boundaries:**
- **Part 1 does NOT own or mint Transaction Passports.**
- **Part 2 owns the Transaction Passport and full state machine lifecycle.**
- Only when **BOTH** parties confirm (`payer_confirmed: true` AND `receiver_confirmed: true`) does Part 1 emit a `POST /api/passport/create` request to Part 2.

---

## Endpoint Specification

- **Method**: `POST`
- **Path**: `/api/passport/create`
- **Content-Type**: `application/json`

---

## Payload Schema (`PassportPayload`)

```json
{
  "conversation_id": "conv-12345",
  "payer": "Arjun",
  "receiver": "Riya",
  "amount": 250.0,
  "currency": "INR",
  "purpose": "tea",
  "message_ids": ["m1", "m2"],
  "participants": ["Arjun", "Riya"],
  "confidence": 0.91,
  "payer_confirmed": true,
  "receiver_confirmed": true,
  "created_at": "2026-09-08T22:30:00.000000",
  "conversation_evidence": [
    {
      "message_id": "m1",
      "sender": "Riya",
      "text": "You still owe me ₹250 for the tea yesterday",
      "timestamp": "2026-09-08T22:29:50.000000"
    },
    {
      "message_id": "m2",
      "sender": "Arjun",
      "text": "Yes, I'll pay you back ₹250 for the tea",
      "timestamp": "2026-09-08T22:29:55.000000"
    }
  ],
  "confirmations": {
    "payer_confirmed_at": "2026-09-08T22:30:00.000000",
    "receiver_confirmed_at": "2026-09-08T22:30:05.000000"
  },
  "detection_confidence": 0.91,
  "detected_at": "2026-09-08T22:29:55.000000"
}
```

---

## Field Descriptions

| Field | Type | Description |
| :--- | :--- | :--- |
| `conversation_id` | `string` | Unique conversation thread identifier |
| `payer` | `string` | Username of participant owing money |
| `receiver` | `string` | Username of participant owed money |
| `amount` | `number` | Numeric amount (normalized float) |
| `currency` | `string` | 3-letter ISO code or currency identifier (Default: `"INR"`) |
| `purpose` | `string` | Category/purpose extracted from conversation (e.g. `"tea"`) |
| `message_ids` | `array[string]` | Array of message IDs that evidence this intent |
| `participants` | `array[string]` | Array of the two usernames |
| `confidence` | `number` | Intent detection confidence score (0.0 to 1.0) |
| `payer_confirmed` | `boolean` | Must be `true` |
| `receiver_confirmed` | `boolean` | Must be `true` |
| `created_at` | `string` | ISO 8601 timestamp when mutual consent was achieved |
| `conversation_evidence` | `array[object]` | Structured array of supporting raw chat messages |
| `confirmations` | `object` | Confirmation timestamps (`payer_confirmed_at`, `receiver_confirmed_at`) |

---

## Passport Mock (`passport_mock.py`)

To enable Part 1 to run standalone in isolation before Part 2 code is pushed by teammates, Part 1 includes a lightweight mock handler in `passport_mock.py`.
- **Production Integration**: In production deployment, Part 2 will implement the real `/api/passport/create` handler, minting official IDs like `TP-2026-8F42X91` and inserting records into the immutable ledger.
