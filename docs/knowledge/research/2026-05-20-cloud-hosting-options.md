# UNO Bot v2 — Cloud-Hosted AI Platform Research

> Week 1 deliverable per `~/.claude/plans/piped-riding-melody.md`. Compare candidate platforms for hosting the v2 agentic UNO Bot. Recommend one with rationale.
>
> Author: Bryan • Date: 2026-05-20 • Audience: Bryan + Bill (for the Week 1 Friday decision)

## TL;DR

**Recommendation: Cloudflare Workers + Durable Objects, with the Anthropic Claude Agent SDK running inside it.**

Two-line rationale: Cloudflare Workers gives us a real backend with cheap stateful conversation memory (Durable Objects), and the Agent SDK gives us native handling of the multi-turn tool-use loop. Pipedream is workable but strained for agentic patterns and the paid-tier creep keeps hitting us. The Agent SDK alone isn't a platform — it's a library — so we still need a host, and Workers is the cleanest fit.

**Estimated migration effort:** ~3-5 dev-days to get the Cloudflare scaffolding wired end-to-end, vs. staying on Pipedream which is "0 days but you fight the platform forever." Net positive in Week 2.

**Cost at expected scale (5-10 designers, ~50-200 bot invocations/month):**
- Cloudflare: $0/month on free tier (well under 100k requests/day limit); $5/month if we want the paid tier for higher CPU time
- Pipedream: free tier covers it but Switch/If-Else/concurrency keep being paid-gated
- Anthropic API charges are the same on any platform — ~$15-50/month for this volume after prompt caching

---

## Evaluation criteria

Eight criteria that matter for the v2 agentic bot's specific shape:

1. **Agentic loop support** — can the platform run "Claude → tool → Claude → tool → final response" cleanly, with each turn visible/debuggable?
2. **Conversation memory** — built-in persistent state per-thread, or DIY every time?
3. **Slack integration** — first-class receiver/poster, or wire it ourselves?
4. **External API calls** — can call Anthropic, GitHub, Notion easily? (All do this.)
5. **Cost at expected scale** — 5-10 designers, 50-200 invocations/month. Negligible by any cloud's standards.
6. **Latency budget** — designers expect a few-second response. Sub-second cold starts a plus.
7. **Developer experience** — local dev, deploy story, debugging visibility, type safety.
8. **Migration cost from today** — how much existing wiring carries over? (Slack token, GitHub PAT, Anthropic key all carry. Pipedream's Slack source carries only if we stay on Pipedream.)

---

## Candidate 1: Stay on Pipedream

The platform the bot currently runs on. v1 Pipedream workflow wired in sandbox channel; original Pipedream workflow live in production.

### Strengths

- **Already wired.** Slack source connected, env vars set, GitHub dispatch tested. Zero migration cost.
- **$100 of unused credit.** Real money already procured.
- **Fast iteration.** Web UI for editing code steps; test events without deploying.
- **Familiar to the team.** Bryan has built in it; Bill has seen it.

### Weaknesses

- **Agentic loop ergonomics are bad.** Tool use is `Claude → tool result → Claude → tool result → final`. Pipedream's model is "step → step → step", linear. Options:
  - Cram the whole loop into one code step (works but step-level logging shows only the final state; you can't inspect intermediate Claude calls)
  - Multiple steps with re-entry logic (fragile; cross-invocation state via Pipedream's data store)
  
  Neither is what you'd build if starting fresh.

- **No native conversation state.** Pipedream workflows are stateless; each invocation starts fresh. To get thread memory we'd fetch `conversations.replies` from Slack every time. Works, but it's an extra API call + ~500ms per invocation + counts against Slack rate limits.

- **Paid-gated features keep hitting.** Switch operator, If/Else, concurrency caps — all paid-plan-only. We already worked around the Switch limitation in v1 by going sequential-workers. For v2 we'd hit more limits.

- **Code step CPU time limits.** Free tier has ~90s per step. An agentic loop with 3 Claude calls + 2 tool executions could approach this on a slow day.

- **Confirmation-gate state is awkward.** The pattern "bot proposes → user reacts → bot fires action" needs cross-invocation state: workflow run #1 stores the proposed action, workflow run #2 (triggered by the reaction event) retrieves it. Pipedream's data store handles this but it's clunky for the use case.

- **Debugging visibility for in-step loops.** Multi-turn Claude calls inside one code step show up as "step started → step ended" with one big log dump. You can't drill into "what did Claude say on turn 2 of 4?"

### Cost

Free tier: 10k invocations/month + 30 daily compute credits. For ~50-200 bot invocations/month with a few seconds of compute each, well under the free ceiling. The $100 credit we have is more than enough for v2 testing AND production.

### Verdict for v2

**Workable but strained.** Doable if we accept the architectural awkwardness. The Pipedream UI's strength is wiring linear pipelines; agentic loops aren't linear.

---

## Candidate 2: Anthropic Claude Agent SDK

Anthropic's first-party SDK for building agentic Claude applications. Released as a JS/TS library (and Python). Handles the agentic loop natively: you define tools, hand the SDK a user message, and it loops Claude until it produces a final answer.

### Important clarification

**The Agent SDK is a library, not a platform.** You still need to host the code somewhere — a server, a serverless function, a long-running Node process. So "use the Agent SDK" doesn't replace the platform question; it slots *inside* whatever platform we pick.

That means the real comparison is:
- Pipedream + Anthropic API direct calls (current)
- Cloudflare Workers + Agent SDK
- Vercel Functions + Agent SDK
- AWS Lambda + Agent SDK
- A long-running Node process on a VM + Agent SDK

The SDK is purely about **how** we call Claude; the platform question is **where the code runs**.

### What the SDK gives us

- **Native agentic loop.** You call `agent.run({ messages, tools })` once; the SDK iterates Claude through tool calls until it returns a final text response.
- **Tool-use plumbing.** Define tools as JSON schemas; the SDK passes the tool_use blocks to your tool handlers and feeds results back.
- **Prompt caching support out of the box.** Cache control on system prompts, automatic cache-hit billing.
- **Streaming.** If you want to stream responses to Slack, supported.
- **Typed (TypeScript).** Good DX for Node-based platforms.

### What it doesn't give us

- Hosting (it's just a library)
- Slack integration
- Conversation memory (you bring the message history in)
- GitHub dispatch (you call the API yourself in the tool handler)

### When to use it

If we're building on **any custom-code platform** (Cloudflare, Vercel, AWS), use the Agent SDK — it's the right abstraction. If we stay on Pipedream, we'd use direct Anthropic API calls from code steps (which is what v1 does); the SDK doesn't slot cleanly into Pipedream's step model.

### Verdict

**Use it for the agentic loop, regardless of platform.** It's not a competitor to Pipedream/Cloudflare/Vercel — it's a library we'd pair with one of them.

---

## Candidate 3: Cloudflare Workers + Durable Objects

A custom backend on Cloudflare's edge network. Workers run JavaScript/TypeScript globally at sub-millisecond cold-start; Durable Objects give us stateful per-key storage (perfect for per-thread conversation memory).

### Architecture sketch on Cloudflare

```
Slack → POST /slack/events → Cloudflare Worker (verify signature, parse event)
   ↓
   Worker fetches a Durable Object keyed by thread_ts (loads conversation history)
   ↓
   Worker calls Anthropic Agent SDK: agent.run({ messages, tools })
   ↓
   SDK loops Claude with tool handlers (each tool is a function in our code)
     - implement → fires GitHub repository_dispatch
     - marketplace_search → reads cached prototypes-data.js
     - marketplace_add/edit → fires GitHub repository_dispatch
   ↓
   SDK returns final text; Worker posts to Slack via chat.postMessage
   ↓
   Worker updates the Durable Object with the new conversation turn
```

### Strengths

- **Durable Objects are the conversation-memory answer.** One DO per thread_ts. Persistent across invocations (Cloudflare guarantees the DO lives until idle for ~30 days). No re-fetching from Slack every time — the bot has its own memory.
- **Generous free tier.** 100k requests/day, 1M Durable Objects requests/month, 1GB DO storage. For 5-10 designers and ~50-200 messages/month, we're at <1% of the free ceiling.
- **Sub-millisecond cold starts.** Slack expects responses fast; Cloudflare Workers respond instantly. No Lambda-style 1-3s cold-start penalty.
- **Modern DX.** `wrangler` CLI for local dev (real Workers runtime locally), TypeScript-first, `npm run dev` works as expected, deploy is one command.
- **No vendor lock-in for the AI part.** Anthropic SDK works the same on Cloudflare as anywhere else. If we ever want to swap providers, only the SDK call changes.
- **Slack signature verification works cleanly.** Standard pattern; sample code abundant.

### Weaknesses

- **More build effort than Pipedream.** Estimate ~3-5 dev-days:
  - Day 1: Set up Worker + Wrangler + Slack event receiver + signature verification
  - Day 2: Build the Durable Object schema for thread state
  - Day 3: Wire Agent SDK + tool handlers (implement, marketplace_*)
  - Day 4: Wire confirmation-gate logic (proposal message → react listener → fire tool)
  - Day 5: Buffer for the inevitable surprises (Slack reaction events, edge cases, deploy auth)
  
  Pipedream is "0 days" if you accept its limitations; Cloudflare is "3-5 days" if you don't.

- **CPU time limits on free tier.** 50ms CPU per request on free Workers. Most of an agentic loop is I/O wait (Claude calls, Slack API), which doesn't count against CPU time. But if we paid for the standard plan ($5/month), we get 30s CPU, which is unlimited for this use case.

- **No first-class Slack integration.** We hand-write the Slack receiver + signature verification + chat.postMessage calls. Templates exist; not hard but not free.

- **Need to handle Slack's reaction event subscription.** For the confirmation gate, the bot needs to subscribe to `reaction_added` events. Standard Slack app config; one-time setup.

### Cost

- Free tier covers the bot at the expected scale entirely.
- $5/month "Workers Paid" plan gives 30s CPU per request + unlimited DO requests — likely warranted for production safety even if free tier theoretically suffices.
- Anthropic API costs same as today (~$15-50/month at this scale post-caching).

### Verdict for v2

**Best long-term answer.** Real backend with proper state, modern DX, generous free tier. 3-5 day migration cost is one-time; it pays back across the v2 lifetime.

---

## Briefly considered, mostly rejected

### Vercel Functions / Edge Functions

Similar shape to Cloudflare Workers — serverless, edge-deployed, good DX. **AI SDK has solid agent support** (Vercel's `ai` package supports tool use natively, similar to Anthropic Agent SDK but cross-provider).

**Why not first choice:** no Durable Objects equivalent. For conversation memory you'd use Vercel KV (Redis) or pull from Slack every time. KV works but adds a piece. Cloudflare's DO is genuinely the cleaner state primitive.

**When to pick Vercel:** if the team is already deep in the Vercel ecosystem for other projects. We're not.

### AWS Lambda

Same general shape. More enterprise-y, more setup (IAM, CloudFormation/SAM). For a 5-10-person team's bot, way overkill — and cold starts are 1-3s, which feels sluggish for Slack.

**Why not:** complexity-to-value ratio is poor for this size of project.

### Replit Agents

Interesting: hosted agent platform with first-class Slack integration in some templates. Fast to first-working.

**Why not:** vendor lock-in to Replit's runtime, less control over the architecture, less Anthropic-native than the Agent SDK.

### LangGraph Cloud / LangSmith

Built for *complex multi-agent graphs*. We don't have that complexity — we have ONE agent with a few tools. Using LangGraph for this is like using Kubernetes to run a single web server.

**Why not:** wrong tool for the size.

### OpenAI Assistants API (different provider)

Off the table. Plus is committed to Anthropic. Migrating providers isn't the question.

---

## Decision matrix

| Criterion | Pipedream | Cloudflare + Agent SDK | Vercel + AI SDK |
|-----------|-----------|------------------------|-----------------|
| Agentic loop support | ❌ Awkward (cram-in-step or multi-step-with-state) | ✅ Native (SDK handles it) | ✅ Native (AI SDK) |
| Conversation memory | ⚠️ Re-fetch from Slack every time | ✅ Durable Objects, per-thread state | ⚠️ Vercel KV (extra piece) |
| Slack integration | ✅ Built-in source | ⚠️ Hand-written receiver (well-trodden) | ⚠️ Hand-written receiver |
| External API calls | ✅ Easy | ✅ Easy | ✅ Easy |
| Cost at scale | ✅ Free | ✅ Free (paid $5/mo for safety) | ✅ Free |
| Latency | ✅ Fast | ✅ Sub-ms cold start | ✅ Edge fast |
| Developer experience | ⚠️ Web UI, opaque debugging of in-step loops | ✅ Wrangler CLI, TypeScript, proper logs | ✅ Vercel CLI, TypeScript |
| Migration cost | ✅ Zero | ⚠️ 3-5 dev-days | ⚠️ 3-5 dev-days |
| Future-proofing | ❌ Paid-tier creep | ✅ Real backend, owns the stack | ✅ Real backend |

---

## Recommendation: Cloudflare Workers + Durable Objects + Anthropic Agent SDK

**Why:**

1. The architecture fits. Worker = bot endpoint. DO = per-thread conversation memory. Agent SDK = the agentic loop. Each piece is the right primitive for its job.
2. The free tier covers expected usage with room to spare. $5/month for the paid tier if we want safety against CPU spikes.
3. The migration cost (3-5 dev-days) is bounded and one-time. After that we own a real backend that doesn't fight us when we add features.
4. The Agent SDK abstracts the agentic loop properly — multi-turn tool use just works, with each turn visible in our logs (because we control the code).
5. Cloudflare's DX is good: local dev with `wrangler dev` runs the actual Workers runtime against real Slack events (via tunneling); no "works in dev, breaks in prod" surprises.

**Trade-off being accepted:** giving up Pipedream's built-in Slack source (we hand-write the receiver) in exchange for everything else. The receiver code is ~50 lines of TypeScript; well within scope.

**What we keep:**
- The Slack bot user, OAuth scopes, bot token (carries over — we'll just point Slack at the new Worker URL instead of Pipedream's webhook URL)
- The GitHub Action `figma-implement.yml` (untouched — Worker dispatches to it just like Pipedream did)
- The Anthropic API key, GitHub PAT, etc. (carry over as Worker secrets via `wrangler secret put`)
- The `bot-skills/` directory and AGENTS.md (the Worker fetches them from the same GitHub Raw URLs, or bundles them into the Worker at build time — either works)
- The implement script + polling pipeline (untouched, Cloudflare doesn't change anything about how the GitHub Action runs)

**What we throw away:**
- The Pipedream sandbox workflow we built last week (it taught us things; it doesn't ship)
- The Pipedream-specific code patterns (`defineComponent({ async run })`, `$.flow.exit`, `steps.X.$return_value`) — replaced by Worker `fetch()` handler patterns

---

## What I don't know / open questions

1. **Has Anthropic released a Slack template for the Agent SDK?** Worth checking the SDK docs before Week 2. If they have a worked example with Slack, our setup time drops significantly.
2. **Cloudflare's Anthropic Workers AI binding** — Cloudflare has a Workers AI product with first-party model bindings (mostly Llama/etc., but they may have added Claude). If so, we could skip even the API-key handling. Worth checking; probably not relevant for us since we want vanilla Anthropic API access.
3. **Durable Objects pricing edge cases** — DO storage is metered. If we keep thread history forever, storage grows linearly. Decision: prune DOs idle for >30 days (Cloudflare auto-evicts after 30 days idle anyway, so this is mostly free).
4. **Slack signing-secret verification** — needs Slack's signing secret (different from the bot token). One-time config; add it to Bryan's setup checklist.

---

## Next step

End of Week 1 Friday: Bryan + Bill confirm this recommendation, OR push back. If pushed back, fall through to Cloudflare's nearest alternative (Vercel, very similar shape) before considering staying on Pipedream.

**Week 2 builds on this decision.** If we lock Cloudflare on Friday, Week 2 Monday-Tuesday is "wrangler init + signing-secret + Slack receiver + first end-to-end test event." That puts us back on track for end-of-Week-2 working bot.
