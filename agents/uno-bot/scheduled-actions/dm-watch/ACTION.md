---
embodiment: all
disclosure: reference
summary: DM watch — promise reminders read from a person's own DMs with their own token, for that person alone, after they switch it on in the Home tab.
description: DM watch — read before answering a reminder about a promise in someone's own DMs, a question about the Home tab's DM switches, or "why can uno-bot see my DMs?".
---

# DM watch

<!-- canonical per ADR-017 (docs/adr/) · a scheduled action, read through read_reference as `dm-watch` · built 2026-10-14 from ADR-032, which is the law it keeps, and the headers of agents/uno-bot/src/dm-watch/ · the code is agents/uno-bot/src/dm-watch/. -->

DM watch reads a person's own DMs, with their own Slack token, for promises, and reminds that person alone in their DM with uno-bot. Nobody else is ever told. ADR-032 is the rule: opt-in per purpose, the person's own token with its live scopes checked, output only to them, and nothing of the message kept.

## The switches

The Home tab shows one checkbox per switch to a person who has connected their own Slack token. Each is off until they turn it on, and turning one on reads nothing already said: it counts from that moment.

- **"Remind me about promises I make in my DMs"** (`promises_made`).
- **"Tell me when a promise made to me in my DMs looks overdue"** (`promises_to_me`).
- **"Catch decisions from my DMs"** (`dm_capture`) — Capture, whose cards are the sweep's (`sweep` § Capture).

Turning a switch on checks that their own token holds the scopes the jobs need; missing one, the switch stays off and the Home tab says to link Slack again. Turning a switch off stops its future jobs and lapses every live promise it was tracking, silently. The last switch off forgets how far their DMs were read.

## The jobs

- **Read:** the end-of-day `dm-promise-read` job, one per person with a promise switch on. It checks the token's granted scopes, then reads their DMs, the ones read longest ago first, each forward from where it was last read, up to a nightly cap. A DM it does not reach tonight loses nothing and comes first later. Only top-level DM messages are read. It posts nothing.
- **Remind:** the morning `dm-promise-nudge` job, one per person. Each due promise's message is read again from its permalink with the same token, and what it says is regenerated then; a message gone or no longer reading as a promise lapses silently. If the messages after it, or the promiser's later public posts, show it done, it closes with nothing posted. Otherwise the reminder goes to the person's DM with uno-bot, and only there.
- **Answers:** a reaction on the reminder. A promise they made answers to the thread reminder's four (🙌 done, ⏳ soon, 🙅 not doing it, 🤔 not a promise); a promise made to them to 🙌 got it, ⏳ wait and 🙅 drop. A ⏳ checks back two working days out, at most twice.
- **One follow-up:** an unanswered reminder gets one more two working days later, then lapses.

## What is kept

A `dm_commitments` row holds the permalink, when it is due, its state and the counts that schedule it: no summary and no id of the other person (ADR-030). `dm_watch` holds the switches, and `dm_read_positions` how far each DM was read.
