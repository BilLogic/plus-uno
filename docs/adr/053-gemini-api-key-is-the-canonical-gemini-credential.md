---
embodiment: ide
summary: uno-bot's Gemini adapter uses the Gemini API key whenever it is set; the Vertex service account is the loud fallback. Supersedes ADR-018.
status: active
verified: 2026-11-26
---

# ADR-053: The Gemini API key is the canonical Gemini credential (2026-11-26)

**Decision.** uno-bot's Gemini adapter authenticates with `GEMINI_API_KEY` whenever it is set, for generation and for the query embeddings, and all PLUS Gemini usage runs on that key under a $250 per week spend cap. The Vertex service-account pair (`GEMINI_SA_EMAIL` + `GEMINI_SA_PRIVATE_KEY` + `GEMINI_PROJECT_ID`) is the fallback: it serves traffic only when no key is set, and `geminiConfigured` logs a warning each time it does. The same order holds in `embedModelName` and in `scripts/backfill-semantic-search.mjs`, so the query and the index are always embedded and declared with the same model. The `vertex-claude` lane keeps using the service account, because the key cannot reach Claude. This supersedes [ADR-018](018-gemini-access-is-vertex-only-in-production-ai.md).

**Why.** Two facts made ADR-018's reason obsolete. The live semantic index (`semantic_search.index_meta`) is already `gemini-embedding-001` at 768 dimensions, which is the key path's model, so choosing the key needs no re-embed. And `GEMINI_REGION` is `global`, where Vertex's regional `cachedContents` resource is not served, so the adapter already inlined its system prompt and the key path loses no caching. What ADR-018 got right was the mechanism, not the credential: which auth and billing boundary served a request must never depend on which other secrets happen to exist. That lesson stays, with the order reversed.

**Consequences.** `GEMINI_API_KEY` is a declared, required Worker secret and the service-account pair is optional, needed only for the opt-in `vertex-claude` lane (`scripts/secrets.mjs`; the "must not be set" category of secret is gone). `cache.ts` stays Vertex-only and returns no cache off the service-account path, as before. The Netlify docs-agent (`netlify/functions/docs-agent`) still runs on the service account and is not part of this switch. A 429 from the Gemini API means the key's project quota or its spend cap, and the fix is on that project, never a silent switch of credential. Owner steps after merge: create a paid-tier key in a billing-enabled project with a budget alert, `wrangler secret put GEMINI_API_KEY`, deploy, confirm `/debug/gemini` reports `api-key`, and optionally delete the service-account secrets if `vertex-claude` stays off.

**What would reopen it.** The index moving back to a model only Vertex serves, or a regional Vertex deployment where explicit caching would pay for itself.

— Bill, 2026-11-26; recorded by Claude Sonnet 5.5.
