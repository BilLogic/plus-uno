// What a reply LOOKS like when it ships — the render, with nothing posted.
//
// Two things live here: the body that will actually be sent
// (`renderDeliveredBody` — trailing-label strip, empty-answer placeholder) and
// a body as `section` blocks (`textSections`). Both lived in
// `slack/delivery.ts`, which takes `Env`, so neither could be reached by
// anything `tsconfig.test.json` compiles: the Turn module could not judge the
// text it was about to deliver, and a proposal card could not be rendered at
// all. Splitting the render from the posting is the whole change; `delivery.ts`
// re-exports both for its existing callers.

import { toSlackMrkdwn } from "./mrkdwn";
import { splitBalanced } from "./split";

// A section's text field caps at 3000 chars, below the 3,900 a single message
// is held to — so even one message's worth of body can overflow one block.
const SECTION_CHARS = 2900;

export function textSections(body: string): Array<Record<string, unknown>> {
  // Two things happen here, in this order, and both are load-bearing.
  //
  // 1. CONVERT. A `section` block's text is mrkdwn — NOT the Markdown the model
  //    writes and NOT what `markdown_text` takes on the stream path. Until
  //    2026-08-22 this path shipped the raw body: `postMessage` converted the
  //    `text` field only, blocks render over `text`, so the sanitized copy was
  //    seen by nothing but notifications and screen readers, and every
  //    `**bold**` on this path reached people as literal asterisks.
  //
  // 2. SPLIT, fence-aware. Converting first also means the splitter sees the
  //    fences it has to keep balanced. The old loop cut at the last newline or
  //    space, so a code block opening in one section "closed" in the next and
  //    mangled both.
  return splitBalanced(toSlackMrkdwn(body), SECTION_CHARS).map((chunk) => ({
    type: "section",
    text: { type: "mrkdwn", text: chunk },
  }));
}

// ── The delivered body ──────────────────────────────────────────────────────

// The body is NOT capped here any more, and that is the point. A cap belongs to
// one message, and a long answer is now several: `answer-posts.ts` splits the
// whole body into continuation messages at paragraph boundaries. What this
// function returns is the whole answer — which is also what the judges score
// and what ThreadState remembers.

// The retired confidence affix, killed deterministically instead of by prompt.
// Banned in the persona since 2026-07-16 and re-worded twice (r19, r21) — it
// still resurfaced while the R1 eval stayed green, so wording is not a reliable
// control here (ADR-021). Precedent ADR-019: a surface rule that must hold on
// every model provider belongs in the renderer.
//
// Two deliberate narrowings, both learned in review:
//  • Only a HIGH rating is stripped. The affix is the model's fallback when it
//    did NOT weave a clause inline, so a trailing "low/medium — from memory,
//    verify" is often the reply's ONLY calibration signal; deleting it would
//    make the answer read more certain than the model was.
//  • Horizontal-whitespace classes and a single leading \n — the first version
//    nested \n+ with two \s* (which also match \n), giving ~O(n^4) backtracking
//    on a run of trailing blank lines: 100 blank lines blew the 10ms Worker CPU
//    limit, which posts nothing at all. Model output is shaped by fetched
//    content, so that was reachable from a read.
const TRAILING_CONFIDENCE =
  /\n[^\S\n]*(?:[-•*][^\S\n]+)?[_*]{0,2}[^\S\n]*confidence[^\S\n]*[_*]{0,2}[^\S\n]*[:—–-][^\S\n]*[_*]{0,2}[^\S\n]*(?:very )?high(?![a-z])[^\n]*$/i;

function stripTrailingConfidence(text: string): string {
  const trimmed = text.trimEnd();
  const cleaned = trimmed.replace(TRAILING_CONFIDENCE, "").trimEnd();
  // Log what was removed, so "stripped a decoration" stays distinguishable from
  // "ate a line that mattered" when someone reads the tail.
  if (cleaned !== trimmed) {
    console.log(`[slack] stripped trailing confidence affix: ${trimmed.slice(cleaned.length).trim().slice(0, 120)}`);
  }
  return cleaned;
}

/**
 * The body that will actually be SENT, for a given draft: the trailing-label
 * strip, then the empty-answer placeholder.
 *
 * Exported so the confidence pre-check judges the delivered text rather than
 * the draft. The two used to diverge silently: a cap truncated the body AFTER
 * the judge had scored the draft, so a woven clause sitting in a closing
 * paragraph could be amputated from a message the telemetry had already
 * recorded as `verdict=pass` (2026-08-21). Nothing is dropped from the body at
 * all now — the length limit belongs to a message, and a long answer is posted
 * as several. postTextVerified calls this rather than repeating it, so the two
 * cannot drift apart again.
 */
export function renderDeliveredBody(text: string): string {
  // NOTHING is stripped from the Markdown here any more, and that is a
  // correction, not an omission.
  //
  // From earlier on 2026-08-22 this ran `stripMarkdownTables` (tables → bullet
  // lines) and `headingsToBold` (`## X` → `**X**`) on every path, on the
  // strength of a probe whose STORED TEXT showed a table missing and a heading
  // reduced to a bare line. Both readings were wrong: Slack keeps a table as a
  // block and a heading as heading styling, and only the plain-text fallback
  // omits them. Rendered in a real client, the table renders as a real table.
  //
  // So the Markdown path leaves the model's Markdown alone. The mrkdwn paths —
  // the blocks fallback and `postMessage`'s `text` — still degrade a table to
  // bullets inside `toSlackMrkdwn`, because a `section` block genuinely cannot
  // hold one. The lesson kept: read the RENDER, never the stored text.
  const cleaned = stripTrailingConfidence(text);
  return cleaned.trim()
    ? cleaned
    : "(I came back with an empty answer — that's a bug on my side. Try rephrasing, and flag this to the team.)";
}

