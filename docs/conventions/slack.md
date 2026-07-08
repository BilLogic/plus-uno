# Slack Conventions

<!--
source: Notion — 🧭 Flow 3/5 docs + 🧩 Templates #4 (share-out) under https://app.notion.com/p/35db7cca49828037-8b4c-f2d5960dcc62
synced: 2026-07-07
applied by: agents/uno-bot (the embodiment IS the Slack actor — no separate writer)
-->

## Channels

| Channel | ID | Use |
|---|---|---|
| #plus-design | `C03FC8AS69K` | review requests, design-team coordination |
| #plus-design-feedback | `C074QG2V7DJ` | share-out bundles + feedback threads |
| #uno-bot | `C0ARJ2A3A69` | Figma-sync notifications (docs saying "#figma-sync" mean this channel) |

Pillar → channel map (group announcements; **all private — uno-bot must be invited before posting/@here**):
`Universal` → #plus-universal `C072E8SFLKV` · `Admin` → #plus-admin `C089A3E9CCW` · `Toolkit` → #plus-toolkit `C08925VDFF1` · `Training` → #plus-training `C07L5RZV6DR` · `Marketing` → #plus-marketing `C052BG9NE86`. Tutoring + Help Center: unmapped — flag at retro.

## Share-out post (Flow 3 feedback rail — bundle completeness is a hard gate)

```
📣 [Project] — [artifact] · fidelity: [low/mid/high] · round N
What this is: 1–2 sentences. · What changed since last round (round 2+).
🎯 Feedback wanted on: 1… 2… (max 3, stage-specific — never "thoughts?")
NOT looking for feedback on: [out of scope this round]
🔗 Loom · Live preview · Figma replica (required for prototypes) · Decision log
cc @reviewers — by [date]
```

## Two gates — never conflate

1. **Proposal-confirmation gate** (uno-bot side-effect proposals): ⚠️ message → ✅/❌ reaction, requester-only, 15-min expiry.
2. **Reviewer-verdict gate** (Flow 5 maintenance review, routed reviewers in #plus-design): ✅ approve · 🔁 request changes · ❌ reject. Never auto-merge; 🔁 loops the proposal with changes.

Decisions reached in threads are written to the project's Decision Log **before** the thread is considered resolved.
