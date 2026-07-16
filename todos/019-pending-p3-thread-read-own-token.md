---
status: pending
priority: p3
issue_id: 019
tags: [slack, tools, adr-020]
dependencies: []
created: 2026-07-16
source: ADR-020 follow-up
---

# Extend slack_thread_read to the requester's own token (DM thread permalinks)

## Problem
ADR-020 gave slack_search requester-own visibility, but slack_thread_read still reads with the bot token only — a connected user pasting a permalink to a thread in their own DM/private channel gets "not in channel" even though their own token could read it.

## Proposed solution
In executeSlackThreadRead, on a bot-token access failure AND own-DM surface AND stored own token: retry conversations.replies with the requester's token. Same discretion rule as search (requester-own content answers that requester in that DM only).

## Acceptance
- [ ] Permalink to requester's own DM thread readable in their bot DM; unchanged elsewhere; tsc clean
