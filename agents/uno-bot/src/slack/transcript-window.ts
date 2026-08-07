// Which lines of a thread survive the character cap.
//
// The old rule was `kept.shift()` until it fits — drop the oldest first. In a
// thread transcript the oldest line IS THE PARENT: the question everything
// after it is answering. So on exactly the long threads where a summary matters
// most, the model received replies to a question it could not see.
//
// Slack's own docs warn about this shape (conversations.replies returns the
// parent first, so a plain tail slice loses it). We had the inverse spelling of
// the same bug: a plain head-drop.
//
// Rule: keep the parent, then as many of the MOST RECENT lines as fit.

export interface WindowedTranscript {
  lines: string[];
  /** How many middle lines were dropped — surfaced so the model can say the
   *  transcript is partial instead of reasoning over a gap it cannot see. */
  dropped: number;
}

export function windowTranscript(lines: string[], maxChars: number): WindowedTranscript {
  if (lines.length === 0) return { lines: [], dropped: 0 };

  const joined = (ls: string[]) => ls.join("\n").length;
  if (joined(lines) <= maxChars) return { lines, dropped: 0 };

  const parent = lines[0] ?? "";
  // Walk backwards from the newest, keeping what fits alongside the parent.
  const tail: string[] = [];
  let budget = maxChars - parent.length - 1;
  for (let i = lines.length - 1; i >= 1; i--) {
    const l = lines[i] ?? "";
    const cost = l.length + 1;
    if (cost > budget) break;
    tail.unshift(l);
    budget -= cost;
  }

  // A parent longer than the whole budget: keep it alone rather than returning
  // replies with no question. Truncating the parent is the caller's problem —
  // it at least knows what it is holding.
  return { lines: [parent, ...tail], dropped: lines.length - 1 - tail.length };
}
