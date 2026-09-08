# TrustBridge Part 1 — Architectural Notes & Design Decisions

## System Architecture & Boundaries

Part 1 is the **Conversation, NLP & Mutual Consent Layer** of TrustBridge.

### Core Principles

1. **Natural Conversation Entry**: Users converse naturally (e.g. Arjun and Riya). No manual transaction creation forms exist in Part 1.
2. **Two-Tier Extraction Pipeline**:
   - **Tier 1 (LLM Path)**: Calls OpenAI (`gpt-4o-mini`) structured extraction if `OPENAI_API_KEY` is present.
   - **Tier 2 (Fallback Path)**: High-precision regex & heuristic engine that runs automatically when no API key is present or when API calls fail/timeout.
3. **Negative Filtering**: Neutral cost/possession statements (e.g., *"The movie cost 400rs"*, *"I have 400rs in my wallet"*, *"The bill was 400rs"*) are suppressed unless prior context establishes an obligation.
4. **Hard 2-Party Mutual Consent**: No transaction is binding or handed off to Part 2 until both `payer` and `receiver` have explicitly clicked "Confirm".
5. **Decoupled Handoff Boundary**: Part 1 emits a clean JSON payload to Part 2's `/api/passport/create` endpoint.
