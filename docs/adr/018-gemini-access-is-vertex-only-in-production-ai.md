---
embodiment: ide
summary: Gemini access is Vertex-only in production; AI Studio key is never deployed (2026-07-16)
status: active
verified: 2026-08-24 (#171)
---

# ADR-018: Gemini access is Vertex-only in production; AI Studio key is never deployed (2026-07-16)

**Decision.** uno-bot's Gemini lane always authenticates via the Vertex AI service-account pair (`GEMINI_SA_EMAIL` + `GEMINI_SA_PRIVATE_KEY`, project `hcii-plus`, region `global`). The AI Studio `GEMINI_API_KEY` must never be set as a Worker secret — it exists only as a local-dev emergency fallback. Code enforces the precedence (SA wins whenever set, `src/gemini/client.ts`) and warns loudly when it ever resolves to the API-key path.

**Why.** (Bill, 2026-07-16): during the 2026-07-16 outage (Vertex flash-model quota exhaustion, 429 RESOURCE_EXHAUSTED — not a credential problem), a Vertex-vs-AI-Studio key discussion caused config confusion, and the then-current code made it worse: the API key silently took precedence over the SA pair, so which auth/billing/data boundary served traffic depended on which secrets happened to exist. One canonical path makes credential debugging deterministic and keeps usage attributable to the hcii-plus project quota Cindy Tipper administers.

**Consequences.** Precedence flipped SA-first in `geminiConfigured`; rule documented in `wrangler.toml`, `types.ts`, `.dev.vars.example`, `README.md`, `src/gemini/auth.ts`. A 429/RESOURCE_EXHAUSTED from Vertex means project quota — the fix is a quota bump or a temporary model switch (e.g. the 2026-07-16 fallback to `gemini-2.5-pro`), never a credential swap to AI Studio.
