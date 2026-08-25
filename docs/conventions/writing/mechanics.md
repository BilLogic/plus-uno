---
embodiment: ide
summary: Sentence and paragraph mechanics, the structural pattern, what never to do, and the pre-ship checklist.
---

# Writing — mechanics

<!-- canonical per ADR-017 (docs/adr/) · distilled 2026-07 from Anthropic's public writing, split into this folder 2026-08-24 (#163). -->

The line-level moves. `principles.md` says what to aim for; this says how a
sentence, a paragraph and a draft are actually assembled, and what to run the
draft against before it ships.

## Sentence and paragraph mechanics

- **Paragraph length.** 2–6 sentences; most run 3–4. A single-sentence paragraph is a
  deliberate emphasis device, used sparingly (once or twice per piece), not a default rhythm.
- **Sentence length.** Mixed, not uniform. A long, information-carrying sentence (25–40 words)
  is regularly followed by a short one (7–15 words) that lands the point. Avoid a paragraph
  where every sentence is the same length — that's the single most identifiable "AI-generated"
  tell, and the opposite of how these pieces read.
- **Clause discipline.** One idea per sentence. If a sentence needs two parentheticals to hold
  together, it's two sentences.
- **Voice.** Active. "The Worker drops DMs," not "DMs are dropped by the Worker." Passive voice
  appears only when the actor is genuinely unknown or irrelevant.
- **Person.** "We" for the team and its decisions; "you" only when directly instructing the
  reader; "it" for the bot/system/model. No "I" in team-voice pieces like this one — that
  includes the uno-bot recap and the Medium article, both undated/unbylined team output.
  (Consistent with `voice.md`'s "named actors" rule. Anthropic's own 2026 individually
  bylined deep-dives do use "I" — see principle 9's 2026 refinement — but that's a different
  genre from what we're writing here.)
- **Headings.** Sentence-case, and they describe the content, not tease it: "Give Claude a way
  to verify its work," not "Verification Matters." A reader should be able to skim headings
  alone and get the argument.

  **2026 heading-style findings (for the recap retitle).** Pulled real headings from three
  recent pieces to check whether this still holds. It does, with two additive patterns layered
  on top:

  - *Still sentence-case, still descriptive over clever, most of the time.* [An update on
    recent Claude Code quality reports](https://www.anthropic.com/engineering/april-23-postmortem):
    "A change to Claude Code's default reasoning effort," "A caching optimization that dropped
    prior reasoning," "A system prompt change to reduce verbosity." These are the most literal
    headings across the entire corpus, old or new — each one is just the cause, stated flatly,
    no wordplay. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps):
    "Why naive implementations fall short," "Frontend design: making subjective quality
    gradable," "Scaling to full-stack coding." Still sentence-case, still says exactly what the
    section covers.
  - *New: short, aphoristic, imperative-mood headings used as a takeaway device* — punchier than
    anything in the 2024–2025 corpus. [Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents):
    "Don't adopt a pet," "Many brains, many hands." [Building a C compiler with a team of
    parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler): "Write
    extremely high-quality tests," "Put yourself in Claude's shoes," "Make parallelism easy." A
    reader who reads only these headings gets a list of rules, not a table of contents — this
    is principle 8's "bold marks the scan path" logic applied to headings instead of bold text.
  - *New: a repeated-prefix label used as a structural device.* [How we contain Claude across
    products](https://www.anthropic.com/engineering/how-we-contain-claude) reuses "Pattern 1:
    The ephemeral container (claude.ai code execution)," "Pattern 2: The human-in-the-loop
    sandbox (Claude Code)," and — notably — "Risk we missed: Everything before the trust
    dialog," "Risk we missed: The user as an injection vector." The colon-prefix pattern isn't
    new (Building Effective Agents already did "Workflow: ..." headings), but labeling a
    section "Risk we missed" as the heading itself, rather than burying the miss in prose, is.
  - *Closing sections are named for what's next, never for how it went.* Across the 2026
    corpus: "Going forward" (postmortem), "Looking ahead" (How we contain Claude), "Looking
    forward" (C compiler), "What comes next" (Harness design), "What's next" (Auto mode). Pick
    one of this family for the recap's final section — never "Conclusion" or "Wrapping up."
  - *Applied to the recap retitle:* prefer plain descriptive sentence-case for most sections
    (matches the postmortem/harness-design style), but it's fair game to make the "what broke"
    section headings short and pointed the way Managed Agents and the C-compiler post do —
    e.g., "What we missed: silent expiry" over "Lessons Learned," or an imperative takeaway like
    "Confirm the confirmer" if a section's whole point is a one-line rule.
- **Numbers over vague quantifiers.** "10.6% jump," "90.2%," "~55 real requests" — not
  "significantly better" or "a lot of requests." Our recap already does this well (§2's request
  counts); keep it in the article.
- **Hedging words, used precisely.** "Suggests," "we found," "appears to" — always tied to what
  was actually measured or observed. Never a vague hedge like "basically" or "sort of" used to
  soften an unclear claim. (Same rule as `voice.md` §"No filler, no hedging" — hedge
  only where genuine uncertainty exists, and say what's uncertain.)

## Structural pattern: problem → approach → what we learned

The shape that recurs across every engineering piece, and the one to hold the `uno-bot` article
to:

1. **Problem** — the reader-recognizable pain, stated in one paragraph, no bot mentioned yet.
   ("The team refreshes constantly... the standard fixes failed.")
2. **Approach** — what was built and the one or two decisions that mattered most (proactive +
   reactive as one bot; the capability matrix; the confirmation gate).
3. **How it was built** — the real tradeoffs, shown as a comparison (table) or a decision
   (prose), always with the option that was *rejected* and why, not just the one chosen.
4. **What broke, what we learned** — concrete incidents, each with the fix it produced. This is
   the section readers remember; don't compress it into bullet fragments.
5. **What this means for you** — a short, concrete close: what to build first, what to skip,
   where to look next. Not a summary of how well it went.

This maps almost directly onto the recap's existing §0–§9 order — keep that sequence. The
rewrite work is entirely at the sentence level (principles 1–11 above), not a restructuring.

*2026 addition — a second, shorter skeleton for incident writeups specifically:* the postmortem
genre (see "What changed recently" above) skips problem/approach/tradeoffs entirely and opens
straight on cause. Use the five-part shape above for the uno-bot article itself; reach for the
postmortem shape only if writing up a single incident on its own (e.g., a standalone "the day
the confirmation gate almost failed" writeup).

## Never do

- Exclamation marks.
- Rhetorical questions used as a structural device (the "But what if I told you..." move).
- Superlatives or hype adjectives without a number or named example next to them —
  "revolutionary," "game-changing," "seamless," "incredible," "cutting-edge."
- Hedge-filler that softens a claim instead of stating what's actually uncertain — "basically,"
  "sort of," "kind of," "in order to." (Already banned in `voice.md`.)
- More than one parenthetical aside per sentence.
- Passive voice that hides who did the thing.
- Decorative bold or emoji — reserve both for scan-ability, never for tone.
- A technical or house term used before it's been defined once, in plain English.
- First-person singular ("I") in team-voice docs — use "we."
- A bullet carrying more than one idea. Split it into two bullets or a sentence.
- A table used to narrate a story instead of compare discrete options.
- Ending on self-congratulation instead of a concrete next step.

## Checklist — run every draft against this

1. Does the first sentence state the point, not tease it?
2. Is every house term (proactive/reactive, the confirmation gate, MCP, etc.) defined in plain
   English at first use?
3. Does every strong claim have a number, a named incident, or a "we found" attached to it?
4. Any sentence carrying more than one idea, or more than one parenthetical? Split it.
5. Any bullet doing the work of a paragraph? Split it, or promote it to prose.
6. Any exclamation marks, rhetorical questions, or hype adjectives? Cut them.
7. Would a table read better as a table (option comparison) — or is it currently forcing a
   story into cells?
8. Is bold marking only the 2–5 words a skimmer needs, or has it spread to every important
   phrase?
9. Read the piece aloud — does any paragraph run past six sentences, or does every sentence in
   a paragraph land at the same length?
10. Does the piece end on a concrete next step, not a victory lap?
11. Search for "I " — team-voice docs should have none.
