---
embodiment: ide
summary: A scheduled run has no requester whose visibility bounds it, so each finding's own evidence does — a private channel's finding stays in it, a group DM's goes back to it and leaves only as a reworded note on a separate share card someone there ✅s, and mixed evidence is private (2026-09-29)
status: active
verified: 2026-09-29 (#751)
---

# ADR-031: A run with no requester is bounded by its evidence (2026-09-29)

**Decision.** ADR-020 bounds what uno-bot surfaces by the requester: it reads with the credential it has, and the Slack surface the request came from decides where the result may go. The end-of-day sweep has no requester. So the **audience rule** applies instead: a finding reaches only people who could already see its evidence.

- **Public channel:** the finding is posted in its source thread.
- **Private channel:** read only when it is on `SWEEP_CHANNELS` **and** on `SLACK_SEARCH_PRIVATE_ALLOWLIST`, the team's list of private channels cleared for surfacing. Off the allowlist it is never read, whatever the sweep list says. Its card goes in its source thread (rung 1 of `pickDestination`). The owner and the confirmers are people in that channel: a linked card's Contributor who is not a member is passed over for the thread starter. No text, link or name from it appears in any other message.
- **Group DM uno-bot is in:** read the same way, since uno-bot's membership counts as the group's consent to being swept (Bill, 2026-09-29). Its fix card goes back in that group DM, and that card's ✅ applies the fix and nothing more. Something found there leaves only through a **separate share card**, staged in the same thread once the fix batch has written a page. The share card shows the exact note and names its channel, rung 3 or 4 by target alone, never #uno-bot. The note names the Notion pages brought up to date and nothing else: no quote, no names, no link back. The share card's ✅ posts exactly that text; its ⛔ drops it. It has the fix card's confirmers, 72 h and its own slot (`sweep-share`). Only the fix card people were shown carries the pages, so a revised or re-staged one never offers a share (Bill, 2026-09-29: a share is its own decision).
- **Mixed evidence:** a fix found both in a public thread and in a private place is private. It goes only on the private card, and the public copy leaves the queue.
- **DM:** never read by the sweep.
- **The record:** a card staged in a group DM is on the proposal record without its channel, by the rule a turn's record keeps (`storesChannel`). A dry run (`/debug/sweep`) shows a private place's findings and cards as ids and counts only.

**Why.** The bot token can read every conversation uno-bot is in, which is wider than any one person's standing to hear about it. With no requester, the evidence is the only honest boundary. The people who saw a message are the people who may be told what it implies. The allowlist is reused rather than a second list, because it already records which private channels the team treats as well organised and safe to surface (Bill, 2026-07-10). The share rule and the mixed-evidence rule are #742's second amendment (Bill, 2026-09-29).

**Consequences.** `agents/uno-bot/src/sweep/` lifts its private-channel skip behind the allowlist, adds a `sweep-group-dms` end-of-day job (`users.conversations`, `types=mpim`, on the bot's existing `mpim:read` scope), reads `conversations.members` for a private place before it names a Contributor owner, and drops a public finding whose fix is also queued from a private place. A group DM's fix card carries its pages (`sweepShare`). When its batch comes back with a page written, `agent/resolve-proposal.ts` stages the share card (`sweep/share.ts`). That card runs `sweep_share_post`, the tool table's first `worker` row: it has no schema, the model is never offered it, and it posts only to the configured #plus-design or #plus-universal. #plus-design-feedback is the first private channel on the sweep list. A future proactive job with no requester follows this ADR, and one that needs to cross it needs an amendment here. — uno (agent), Sep 2026, applying #742 and #751
