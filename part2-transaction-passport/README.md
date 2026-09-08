# Part 2 — Transaction Passport & State Machine

> **Placeholder Directory**: Owned by Teammate building Part 2.

This directory will contain the Part 2 microservice responsible for:
- Receiving the handoff payload from Part 1 (`/api/passport/create`).
- Validating immutable conversation evidence.
- Minting official Transaction Passports (`TP-2026-XXXXXXX`).
- Managing the state machine lifecycle (CREATED -> MUTUAL_CONSENT -> IN_SETTLEMENT -> SETTLED / DISPUTED).
