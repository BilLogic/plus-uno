---
embodiment: all
disclosure: reference
summary: Figma library sync — a library publish turned into one drafted intake and one card in #plus-universal, deprecations and unpublished edits, and the two-week tracker.
description: the library publish card — read before answering a reply on a #plus-universal publish card or its thread, a "Library edited, not published" post, or what happens after its Approve.
---

# Figma library sync

<!-- canonical per ADR-017 (docs/adr/) · a scheduled action, read through read_reference as `figma-library` · moved 2026-10-14 out of docs/connectors/figma/uno-bot-access.md · the code is agents/uno-bot/src/figma-poll.ts and src/figma-library/; its copy follows docs/connectors/slack.md § Figma messages. -->

## From a publish to a filed intake

The end-of-day run's `figma-library-poll` job diffs the DS file against its KV snapshot; one poll that finds a change is one change set, kept in KV until morning. The morning run's `figma-library-post` job turns each into:

- **one drafted `harness-intake` issue** — one row per changed component, sets that share a name counted together and each linked, with the code directory `design-system/figma/component-registry.json` maps it to and the proposed change. The components the registry does not map share one "no code mapping" line, and nothing is drafted for them. The intake is the spec; no Notion PRD is filed.
- **one message in #plus-universal** (`PLUS_UNIVERSAL_CHANNEL_ID`), on the shared decision card: a parent line naming the publisher's Figma handle, the publish and how many changed components have code; one card for the publish with Review, Open library and View version; and the table of every changed component under it. Any member of the channel, read at posting time, may decide it in the Review pop-up, for 72 hours. Approve files the intake and nothing more: the code change is IDE work, so no build is dispatched and no PR is tracked. Reject files nothing. A card nobody decides in its 72 hours is closed the next morning: the tracker files its intake, the card reads "Closed, no decision", and its thread is told the intake was filed.

## Deprecations and unpublished edits

Deprecations are not intakes. A set renamed with a `_` prefix is retired: Figma stops publishing it, so the poll reads the removed components' nodes back by id with `/nodes`. A node still in the file whose own name or set's name now starts with `_` is deprecated; a node that is gone is deleted. A publish where every changed component is deprecated or has no code mapping is no work in code: it posts one plain line naming what changed, with no card, no intake and nothing tracked. That line says code is unaffected, or asks for a component with no code mapping to be mapped or confirmed Figma-only. A mapped component deleted outright is still an intake.

A change with no published version is not a publish: it posts "Library edited, not published" in one plain message, naming what changed, with no card and no intake. The change is kept and the next publish's card carries it, because to the poll an autosave and a publish left without a description look the same.

## Tracking

The morning run's `figma-library-track` job follows each card for two weeks, so a card nobody decides still gets its intake filed; while it does, the components the card names count as in flight for the weekly precedence check. It watches for no PR. Nothing about the library posts to #uno-bot any more, and there is no "implement <component>" reply path.
