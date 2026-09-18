// A long answer reaches the person whole: several messages, not a stump.
//
// Until now `renderDeliveredBody` cut a reply at 3,900 characters and left
// "…truncated — ask me for the rest." behind it. The cost was not cosmetic. A
// four-document plan was read twice and approved from the remnant — the person
// was agreeing to a proposal whose second half had never been posted, and the
// thread's own history recorded the stump as what the bot had said, so no later
// turn could see the rest either.
//
// So the limit stays (Slack renders badly long before its 40k hard failure) and
// the answer stops being cut to fit it: the body is split into continuation
// messages in the same thread, in order, numbered when there is more than one.
//
// Where the cut goes, in preference order: a blank line between paragraphs; a
// line boundary inside one (`splitBalanced`, which also keeps a code fence
// closed across the cut); a sentence boundary when the paragraph is one long
// unbroken line; and only then a character cut. A fenced block is carried whole
// — the blank lines inside one are not paragraph breaks.
//
// Pure and import-light on purpose: splitting a body is not a Slack call, and
// this module stays free of the posting client so the packing can be checked
// by running it (`tests/answer-posts.test.ts`).

import { splitBalanced } from "./split";

// Slack chat.postMessage hard-fails past 40k chars and renders poorly long
// before that; AGENTS.md tells the model to keep it short, and this is where
// the Worker enforces it — per message now, not per answer.
export const MAX_POST_CHARS = 3900;

// Headroom for the `_(10/10)_` marker line a continuation carries, reserved
// before the split so a numbered piece cannot end up over the limit.
const MARKER_RESERVE = 16;

const PARAGRAPH_JOIN = "\n\n";

/** ```` ``` ````, with optional leading whitespace. */
const FENCE = /^\s*```/;

/**
 * The messages a body is actually posted as: one when it fits, several in
 * reading order when it does not.
 *
 * A single piece is returned untouched — a short answer must look exactly as
 * it always has. Several pieces each lead with `_(i/n)_`, so a person reading
 * the thread knows at a glance that a message is a continuation and how many
 * are still coming.
 */
export function answerMessages(body: string): string[] {
  const budget = MAX_POST_CHARS - MARKER_RESERVE;
  const pieces = pack(atomicUnits(body), budget);
  if (pieces.length <= 1) return [body];
  return pieces.map((piece, i) => `_(${i + 1}/${pieces.length})_\n\n${piece}`);
}

/**
 * The body as its smallest movable parts: paragraphs, with a fenced code block
 * kept whole even though it contains blank lines of its own.
 */
function atomicUnits(text: string): string[] {
  const units: string[] = [];
  let current: string[] = [];
  let openFence = false;

  const flush = () => {
    while (current.length && !current[current.length - 1]!.trim()) current.pop();
    if (current.length) units.push(current.join("\n"));
    current = [];
  };

  for (const line of text.split("\n")) {
    if (FENCE.test(line)) {
      openFence = !openFence;
      current.push(line);
      continue;
    }
    // A blank line is a paragraph break OUTSIDE a fence and ordinary content
    // inside one — a fence split across two messages leaves one ``` behind and
    // renders everything after it as code.
    if (!openFence && !line.trim()) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();

  return units;
}

/** Greedily fill each message with whole paragraphs, in order. */
function pack(units: string[], budget: number): string[] {
  const pieces: string[] = [];
  let current = "";

  for (const unit of units) {
    for (const part of fit(unit, budget)) {
      if (!current) {
        current = part;
      } else if (current.length + PARAGRAPH_JOIN.length + part.length <= budget) {
        current += PARAGRAPH_JOIN + part;
      } else {
        pieces.push(current);
        current = part;
      }
    }
  }
  if (current) pieces.push(current);

  return pieces;
}

/** One paragraph, cut down to size only if it cannot fit in a message alone. */
function fit(unit: string, budget: number): string[] {
  if (unit.length <= budget) return [unit];
  // A paragraph with line breaks has better cut points than anything sentence
  // detection would find, and splitBalanced already prefers them. A single
  // unbroken line has none, so a sentence boundary is the last structure left
  // before a character cut lands mid-clause.
  if (!unit.includes("\n")) {
    const runs = packSentences(unit, budget);
    if (runs.length > 1) return runs.flatMap((run) => splitBalanced(run, budget));
  }
  return splitBalanced(unit, budget);
}

function packSentences(line: string, budget: number): string[] {
  const runs: string[] = [];
  let current = "";
  for (const sentence of line.split(/(?<=[.!?])\s+/)) {
    if (!current) current = sentence;
    else if (current.length + 1 + sentence.length <= budget) current += ` ${sentence}`;
    else {
      runs.push(current);
      current = sentence;
    }
  }
  if (current) runs.push(current);
  return runs;
}

/** How a caller actually gets a piece into the thread. */
export interface AnswerTransport {
  /**
   * Deliver the first piece through a stream. Returns false when streaming is
   * off, unavailable, or failed half-way — the caller then falls back to
   * `post`, because a duplicated answer is bad and a missing one is worse.
   */
  stream(text: string, withFooter: boolean): Promise<boolean>;
  /** An ordinary message in the thread. */
  post(text: string, withFooter: boolean): Promise<boolean>;
}

/**
 * Post the pieces in order: the first one streamed if streaming is on, the
 * continuations as plain follow-ups.
 *
 * Only the first is streamed because a stream IS one message — `appendStream`
 * appends into the message `startStream` opened and `stopStream` closes it for
 * good. A stream per piece would mean a fresh "AGENT" bubble and its own
 * working signal for each continuation, which reads as the bot starting
 * over rather than carrying on.
 *
 * The footer rides the LAST piece only: a feedback note under every
 * continuation is noise, and under the first it reads as the end of the answer.
 */
export async function deliverAnswer(pieces: string[], transport: AnswerTransport): Promise<boolean> {
  let ok = true;
  for (const [i, piece] of pieces.entries()) {
    const withFooter = i === pieces.length - 1;
    if (i === 0 && (await transport.stream(piece, withFooter))) continue;
    // Sequential, not a parallel fan-out: Slack orders by arrival, so posting
    // the pieces at once can land (2/3) above (1/3).
    ok = (await transport.post(piece, withFooter)) && ok;
  }
  return ok;
}
