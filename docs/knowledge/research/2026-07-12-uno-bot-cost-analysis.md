# uno-bot LLM Cost Analysis — real data + estimates (2026-07-12)

> For the recap article's cost claims. Sources: real Anthropic-era telemetry lines (recovered
> from local session transcripts), Cloudflare GraphQL analytics (request/turn volumes), a
> live `wrangler tail` sample, and measured harness sizes. Historical Workers Logs were not
> API-queryable (the wrangler OAuth token lacks the observability-read scope) — the
> dashboard's Observability → Logs UI can export them without any code change.

## Measured per-turn tokens (Anthropic era, build r4-2026-07-08)

| Turn shape | iterations | tokens_in | cache_read | tokens_out |
|---|---|---|---|---|
| Simple reply, no tools (sonnet-4.6) | 1 | 335–940 | 66.6k–68.4k | 107–437 |
| Proposal turn (sonnet-4.6) | 1 | 792 | 68,418 | 437 |
| 2-round lookup (sonnet-5) | 2 | 3,360 | 154,022 | 249 |
| 3-round search (sonnet-4.6) | 3 | 4,745–8,591 | 205,254 | 389–542 |
| Heavy multi-source (sonnet-5) | 3 | 15,537 | 231,033 | 5,379 |
| 4-round Notion sweep (sonnet-5) | 4 | 7,832 | 231,033 | 843 |
| Heaviest observed (haiku-4.5, 5 rounds) | 5 | 58,426 | 418,928 | 1,024 |

- Cache-write values (67k / 68k / 77k / 85k / 93k) **confirm the Anthropic-era system prefix
  was ~67–93k tokens** (harness + tool defs + hosted-MCP tool lists) — the "~90k-token
  cache" claim is measured, not folklore.
- Measured cost cross-check at sonnet-4.6 pricing: 3-round search ≈ **$0.08/turn**; heaviest
  5-round turn ≈ **$0.10–0.21**.

## Measured volumes (Cloudflare GraphQL)

- Busiest day ever (Jul 10 trial): ~100–120 agent turns (243 AgentRunner DO requests ≈ 2/turn).
- Idle weekday (Jul 11): 97 worker requests ≈ **pure cron — ~0 organic turns**.
- Live tail sample (Sunday midday, 4 min): 1 cron probe, 0 organic turns.
- Hosting: $0 — cron (96/day) + real events sit far under the 100k req/day free tier.

## Current config estimate (Gemini 3.5-flash: $1.50/M in, $9/M out; implicit caching ~90% off)

- Measured prefix bytes: harness 13 files = 71,800 B ≈ 16–18k tokens; tool definitions
  26,877 B ≈ 7–9k tokens → **Gemini per-call prefix ≈ ~25k tokens** (no hosted-MCP tool
  lists on the client-side loop; ~3.5× smaller than the Anthropic-era prefix).
- **Simple lookup (1–2 rounds): ≈ $0.01–0.03 typical** (warm cache), $0.09 worst-case cold.
- **Heavy multi-tool turn (6–12 rounds): ≈ $0.15–0.35 typical**, ~$0.60 worst-case cold.
- Consistency check: Gemini at half the token price with a 3.5× smaller prefix lands at a
  third to a half of the measured Anthropic-era turns. ✓

## Monthly at team scale (5–10 designers, 50–200 turns/mo; blended ~70% simple / 30% heavy ≈ $0.09/turn)

| Scenario | Turns/mo | LLM cost |
|---|---|---|
| Light (all simple, warm cache) | 50 | ~$1–2 |
| **Expected mix** | 50–200 | **~$5–20** |
| Heavy-skewed, poor caching | 200 | ~$40–60 ceiling |

Even a month of trial-day intensity every workday (~2,400 turns) ≈ $200–250 — normal usage
is two orders of magnitude below. Infra stays $0.

## Measured vs. estimated (for honest article claims)

| Number | Status |
|---|---|
| Anthropic-era per-turn tokens + ~67–93k prefix | **Measured** |
| Request/turn volumes; weekend idle = 0 organic turns | **Measured** |
| Gemini prefix ~25k tokens | Measured bytes, estimated tokens |
| Gemini per-turn $ and monthly $5–20 | **Estimated** (real turn shapes × published pricing) |

**Improvement to make the next pull fully measured:** the Gemini telemetry line
(`src/agent/gemini-agent.ts` ~line 150) logs `tokens_in/out/thinking` but not
`cachedContentTokenCount` — adding it would remove the caching-efficiency unknown, the
largest remaining assumption.
