---
embodiment: ide
summary: A scheduled run has no requester whose visibility bounds it, so each finding's own evidence does — a private channel's finding stays in it, a group DM's goes back to it and leaves only as a ✅'d reworded note, and mixed evidence is private (2026-09-29)
status: active
verified: 2026-09-29 (#751)
---

# ADR-031: A run with no requester is bounded by its evidence (2026-09-29)

**Decision.** ADR-020 bounds what uno-bot surfaces by the requester: it reads with the credential it has, and the Slack surface the request came from decides where the result may go. The end-of-day sweep has no requester. So the **audience rule** applies instead: a finding reaches only people who could already see its evidence.

- **Public channel:** the finding is posted in its source thread.
- **Private channel:** read only when it is on `SWEEP_CHANNELS` **and** on `SLACK_SEARCH_PRIVATE_ALLOWLIST`, the team's list of private channels cleared for surfacing. Off the allowlist it is never read, whatever the sweep list says. Its card goes in its source thread (rung 1 of `pickDestination`). The owner and the confirmers are people in that channel: a linked card's Contributor who is not a member is passed over for the thread starter. No text, link or name from it appears in any other message.
- **Group DM uno-bot is in:** read the same way, and its card goes back in that group DM. Something found there leaves it only after a ✅ from someone in it, as a reworded note. The note names the Notion pages the ✅ brought up to date and nothing else: no quote, no names, no link back. It goes to rung 3 or 4, by target alone. The card states this before anyone confirms, so its ✅ is consent to the note.
- **Mixed evidence:** a fix found both in a public thread and in a private place is private. It goes only on the private card, and the public copy leaves the queue.
- **DM:** never read by the sweep.

**Why.** The bot token can read every conversation uno-bot is in, which is wider than any one person's standing to hear about it. With no requester, the evidence is the only honest boundary. The people who saw a message are the people who may be told what it implies. The allowlist is reused rather than a second list, because it already records which private channels the team treats as well organised and safe to surface (Bill, 2026-07-10). The share rule and the mixed-evidence rule are #742's second amendment (Bill, 2026-09-29).

**Consequences.** `agents/uno-bot/src/sweep/` lifts its private-channel skip behind the allowlist, adds a `sweep-group-dms` end-of-day job (`users.conversations`, `types=mpim`, on the bot's existing `mpim:read` scope), reads `conversations.members` for a private place before it names a Contributor owner, and drops a public finding whose fix is also queued from a private place. A group-DM card carries its share on the staged proposal (`sweepShare`). The note posts when the ✅'s batch comes back, from `agent/resolve-proposal.ts`, for the pages whose write succeeded. #plus-design-feedback is the first private channel on the sweep list. A future proactive job with no requester follows this ADR, and one that needs to cross it needs an amendment here. — uno (agent), Sep 2026, applying #742 and #751
