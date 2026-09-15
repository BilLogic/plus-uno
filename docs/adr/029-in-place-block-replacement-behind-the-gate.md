---
embodiment: all
summary: uno-bot may rewrite a named Notion block in place — keyed by a block id plus the last-edited stamp seen at read, behind the ✅ gate — relaxing the append-only rule that made every correction a contradicting section at the bottom of the page (2026-09-15)
status: active
verified: 2026-09-15 (#558)
---

# ADR-029: In-place block replacement, behind the Gate (2026-09-15)

**Decision.** A Notion page body is no longer append-only to the bot.
`notion_update` gains a third operation, `replace`: one or more entries of
*block id · the `last_edited_time` the page read reported for that block · the
new content*, in the same Markdown authoring shape as an `append` section body.
The integration re-reads the block, compares the live stamp against the cited
one, and **writes nothing** when they differ — naming the block and both
stamps. On a match it rewrites that block where it stands.

Four things did **not** change, and each is a fence rather than an oversight:

- **No delete.** There is no path from Slack to removing a block a human wrote.
  The ask "get rid of that section" is answered by rewriting it, or by a human.
- **Properties still exact-match.** A select or status value that is not an
  existing option is still reported back, never created.
- **The ✅ gate still stands in front of every write**, and the proposal card
  now says how many blocks a replace would rewrite and shows the first line of
  each, so the confirmation is informed about the one operation that changes
  text somebody else wrote.
- **Everything outside the named blocks is untouched.** Page structure, order
  and the rest of the body survive a replace intact.

— Bill, Sep 2026 (#554 § "Notion write", implemented in #558)

**Why append-only was relaxed.** The rule was a good default for a bot writing
onto human-owned pages: the worst an append can do is add noise, and noise is
recoverable by eye. But the rule had no answer for the most common maintenance
ask there is — *this page says something that has stopped being true* — and the
answer it gave instead was actively worse than silence.

The Calendar Sync page on 2026-09-15 is the shape. Its TLDR described a nightly
sync that had been hourly for weeks. Asked to fix it, the bot did the only
thing it could: it appended a correctly-worded section saying the sync runs
hourly. The page then asserted both, with the stale claim first and in the
position a reader actually reads. An append-only write had turned one wrong
page into one *self-contradicting* page, and left a human to do the edit
anyway — while the bot's own reply reported success.

So the honest options were to refuse the ask outright ("ask a human to edit
that line") or to allow the edit. Refusing was defensible while the bot could
not target a block at all; it stopped being defensible once the read could
carry block identity, which is the other half of this change.

**Why the last-edited stamp is the key.** The danger in an in-place write is
not that the bot edits the wrong page — the gate and the URL handle that — it
is that it edits the *right* block on top of a change it never saw. Between a
read, a proposal, a person's ✅ and the write there is real wall-clock time,
and a human editing the same paragraph in that window is not exotic.

Notion has no conditional write, so the check is explicit: the read hands the
model each block's `last_edited_time`, a replace cites it back, and the write
re-reads the block and compares before it does anything. A difference means the
replacement was composed against text that no longer exists, and the only
correct response is to write nothing and say so. A missing or unparseable stamp
fails the same way — closed. This is the same invariant as the false-absence
rule elsewhere in the bot: a write that cannot be shown to be safe reports that,
rather than proceeding and reporting success.

**Reads keep block identity.** `readNotionPage` returns a `blocks` list
alongside the rendered text — id, type, last-edited stamp and the line each
block contributed — and `source_read` surfaces it as a trailing index of
`id · type · edited <stamp> · text`.

*Why a trailing index and not inline markers.* Threading
`[block:abc123 · edited …]` through the page text would put the markers inside
the prose the bot quotes back into Slack, where they are at best noise and at
worst repeated to a designer as if they were part of the document. The index
rides beside the content instead: the prose stays exactly as readable as it was,
and every line still has an id to cite.

**Multi-block replacements use `after`.** A replacement that renders to several
blocks updates the first in place and appends the remainder through the
parent's children endpoint with `after` set to the block just written, so the
new material lands where the old block was rather than at the bottom of the
page. The alternative — delete-and-recreate — was rejected: it would need the
delete this ADR refuses, and it would destroy the comments and backlinks
attached to the original block.

Two replacements have no honest in-place write and are refused rather than
approximated: one that renders to nothing, and one whose *first* block carries
children (a table, or a list item with a nested child), because Notion's block
update takes a single block's own payload and cannot create children. Silently
dropping those children would be exactly the corruption this feature exists to
avoid.

**Consequences.**

`notion_update`'s result gains `replaced` and `refused`, and its Slack echo
gains "replaced N block(s)" and "refused: <block> changed since read". A turn
where every replace was refused reports a FAILURE, not a quiet no-change — the
same rule the property path has carried since 2026-07-13.

A replace costs two subrequests (the check plus the write) against the
invocation's 50, three when it spills to a second block. The append and
property paths are unchanged and cost what they always did.

`tests/notion-write.test.ts` is the first mocked-fetch test over a Notion write
in this codebase: the stub goes onto `globalThis` before the integration is
imported, so `net.ts` (ADR-022) binds it at evaluation and every call is still
metered. That test compiles the integration into the Node test build, which is
why `tsconfig.test.json` now carries the Workers binding types beside the Node
ones — the workerd boundary (tests/workerd/) is untouched.
