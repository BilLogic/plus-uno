# Recorded model replies — the local eval transport's input

One file per fixture case, `<case-id>.json`, holding **the model replies that case's turns were answered with** — and nothing else. No scores, no expectations: what a case asserts lives in `../uno-bot-cases.json`, and a recording that carried an expectation would be a second answer key nobody updates.

`agents/uno-bot/scripts/run-evals.mjs --transport=local` replays these through the same `evalTurnRequest → runTurn → evalTurnResponse` path the Worker's `/debug/eval` route takes (`agents/uno-bot/src/eval/turn-adapter.ts`), with the in-memory ThreadState seeded from the runner's history and the recording Delivery. A case with **no** recording here is **skipped** by name — counted apart, never failed.

## The shape

```json
{
  "case": "R3",
  "source": "authored",
  "recordedAt": "2026-09-14",
  "note": "why these replies are what they are",
  "turns": [
    {
      "prompt": "the fixture's prompt, verbatim",
      "replies": [
        { "text": "…", "toolCalls": [{ "name": "shareout_post", "args": { "url": "…" } }] }
      ],
      "toolResults": [{ "tool": "search_blueprint", "text": "{\"ok\":true,\"rows\":[]}" }],
      "references": ["uno-publish/method"],
      "gateAsk": null
    }
  ]
}
```

| Field | What it is |
|---|---|
| `case` | the fixture case id. One recording per case; a duplicate is refused. |
| `source` | **`authored`** — a person wrote the replies from what the case expects. **`captured`** — `scripts/eval-record.mjs` read them off a real `/debug/eval` response. Never inferred, and it reaches the results file in the `build` field. |
| `turns[].prompt` | the case's prompt, **verbatim**. `eval-transport-local.test.mjs` fails when the two drift, so an edited case cannot keep scoring against the old question's draw. |
| `turns[].replies` | one entry per model round-trip, in the fake provider's `ScriptedReply` shape (`src/agent/providers/fake.ts`): `text`, `toolCalls: [{ name, args }]`, optional `stop`. |
| `turns[].toolResults` | what each read-only lookup returned, matched by tool name and consumed once. A lookup with none recorded answers `{ ok: true, rows: [], note: "no result recorded…" }` — empty, and saying so. |
| `turns[].references` | the reference names `read_reference` served that turn, so a receipt-threading case (C1) can be recorded. |
| `turns[].gateAsk` | what preflight asked, when the case is about the gate. The real preflight reaches the DS component list through `Env` and is not available in-process. |

## What an authored recording does and does not prove

It proves **the turn**: that a side-effect call is staged as a gated proposal rather than executed, that a typed `cancel` resolves the pending card, that a repeat of a just-cancelled ask bounces off the store's outcome marker instead of re-carding, that the history write threads a receipt and not a text.

It proves **nothing about the model** — no in-process run can tell you whether Gemini would reach for `shareout_post` today. That is the worker transport's measurement, and the Monday cron of `.github/workflows/uno-bot-evals.yml` keeps making it. `source` and the `transport` field in `eval-results.json` are what keep the two from being read as one.

## Capturing the rest

```bash
WORKER_URL=… DEBUG_TOKEN=… node agents/uno-bot/scripts/eval-record.mjs --case=R1 --case=R2
```

Every turn it records is a live billable model run, so it records nothing unless you name cases (or pass `--all`). Cases that declare a run-time `subject` are refused: their prompt is filled in from a board that is edited daily, so the recording would be a fact about one afternoon. Round-trip boundaries and tool-result bodies are not on the wire — see the header of `scripts/eval-record.mjs` for exactly what is reconstructed and what has to be written in by hand.

## Recorded today

| Case | Source | What the local run measures |
|---|---|---|
| R3 | authored | a publish ask is **staged** as `shareout_post`, not executed |
| R5 | authored | cancel sticks: resolve on turn 2, and turn 3's repeat bounces off the cancel marker rather than re-carding |
| R11 | authored | an empty blueprint read reaches a reply that states the gap |
