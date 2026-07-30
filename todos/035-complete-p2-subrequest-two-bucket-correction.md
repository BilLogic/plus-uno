---
status: complete
priority: p2
issue_id: 035
tags: [code-review, worker, budget, correctness]
dependencies: [027]
---

# The subrequest cap is two buckets, not one — internal calls were stealing lookups

## Problem Statement

ADR-022 built the budget on a single counter: `countedFetch` for outbound calls plus `charge()` for Durable Object hops, all added together and compared against 50. Cloudflare actually enforces two separate limits, and mixing them made the lookup gate refuse work every turn could afford.

## Findings

- `developers.cloudflare.com/workers/platform/limits/#subrequests` (read 2026-07-30): "Subrequests per invocation | 50" and "Subrequests to internal services | 1,000". The changelog states it plainly: "Workers on the free plan remain limited to 50 external subrequests and 1000 subrequests to Cloudflare services per invocation."
- `charge(1, …)` fired on every ThreadState hop (`thread-state-client.ts`) and every AgentRunner enqueue (`slack/events.ts`), each one taking a unit from the 38-unit lookup ceiling that the external cap never charged for.
- `DELIVERY_RESERVE = 12` was sized to cover "2 history writes" that are DO hops — reserve held against a bucket they were never in.
- The KV reads in `figma-poll.ts` and `slack/delivery.ts` were uncharged, which read as an inconsistency to fix; under the correct model they are simply in the other bucket, which is now tracked rather than conflated.

## What changed

`charge()` feeds a separate `internal` counter with its own label breakdown. `subrequestsUsed()` — the only thing the gate reads — returns the external count alone. Telemetry prints both (`api.notion.com:7 slack.com:4 | internal do:2 kv:1`), and `/debug/eval` returns `internal_subrequests`. The external path, the enforcement, and the 50-cap behaviour are untouched.

Verified in workerd: 5 internal charges leave `subrequestsUsed()` at 0; one real fetch moves it to 1; a limit set at the external count still stops the next fetch. `{"externalAfterCharges":0,"internal":5,"externalAfterOneFetch":1,"stopsAtExternalLimit":"budget-stop"}`

## Acceptance Criteria

- [x] Internal calls never move the counter the lookup gate reads
- [x] Internal spend still visible in telemetry
- [x] ADR-022 records the correction with the doc citation
- [x] check-fetch still requires DO stub calls to be charged

## Work Log

- 2026-07-30: Found while auditing the KV charge added for the Gemini prompt cache (027) — the question "should KV count?" turned out to have a documented answer that invalidated the single-bucket model.
