---
name: relay-a-message
embodiment: uno-bot
disclosure: reference
summary: Bot skill — pass something to a named teammate as an attributed DM, approved on one card.
description: send this to Coco, pass this along to X, DM X about this, let X know — read before relaying anything to a teammate on someone's behalf.
---

# Relay a message

A requester wants something passed to a teammate. The bot drafts the DM, the requester approves it on one card, and the Worker sends it with who asked and a link back.

## Steps

1. **Resolve each recipient.** An `<@U…>` mention in the thread is the id. A name → `slack_user_profile` by name; several matches → ask which one and stage nothing yet. Done when every recipient is one Slack user id.
2. **Write the message for a phone.** The recipient reads it cold, so it names the card or doc, its status and its link, in the requester's intent. Draft from what is visible in this conversation; the `dm_relay` description says what a relay carries and what the Worker adds around it. Done when the text stands on its own.
3. **Stage it.** One `dm_relay` call per recipient, all in the same reply, so they stage as one card. Done when the card is staged with the lead line naming who gets what.
4. **An @-mention suits better** when the person is already in this thread or channel and the requester wants the reply here: say so and offer the mention instead. Done when the requester has picked.

## Shape

The DM is ordinary Slack Markdown, people as `<@U…>` ids (`docs/connectors/slack/overview.md` § Message formatting, always loaded); the `dm_relay` card shows it as sent.

## Exit

- **file** — the `dm_relay` card; ✅ sends it.
- **answer** — the recipient is ambiguous or not found: the question that settles who, with the candidates named.
