// Cutting a message without breaking what it is made of.
//
// Two callers, one problem. `capText` truncates a reply at MAX_POST_CHARS and
// `textSections` splits a body into ≤3000-character Block Kit sections, and
// until 2026-08-22 both cut at "the last newline or space before the limit"
// with no idea what they were cutting through. A cut inside a fenced code
// block leaves ONE ``` behind, so the truncation notice — and, on the blocks
// path, the whole next section — renders inside a code block. A cut inside an
// inline code span does the same to the rest of the line.
//
// Nothing here tries to be a Markdown parser. It tracks exactly one piece of
// state, the open fence, because that is the one construct that spans lines and
// therefore the one a line-boundary cut can break. Emphasis (`**x**`, `*x*`,
// `` `x` ``) never spans a line in either dialect — the converter's own regexes
// are `[^\n]`-bounded — so splitting only at line boundaries keeps it intact
// for free. The single exception is a line longer than the limit, which has to
// be cut mid-line; `balancedCut` handles that case explicitly.
//
// Pure and import-free so it is unit-testable — delivery.ts reaches for Env and
// the Slack API, neither of which exists under `npm test`.

/** ```` ``` ```` or ```` ```lang ````, with optional leading whitespace. */
const FENCE = /^\s*```/;

/** A closing fence costs this much when we have to add one. */
const FENCE_CLOSE = "```";

/**
 * Split `text` into chunks of at most `limit` characters, each one
 * independently well-formed.
 *
 * A chunk that ends inside a fenced code block gets a closing ``` and the next
 * chunk reopens the fence with the same info string, so a language-tagged block
 * stays language-tagged across the cut.
 *
 * Returns `[]` for empty input and `[text]` when it already fits — callers rely
 * on both.
 */
export function splitBalanced(text: string, limit: number): string[] {
  if (!text) return [];
  if (text.length <= limit) return [text];

  const chunks: string[] = [];

  // The mutable state lives on ONE object rather than in four `let`s.
  //
  // Not style: `flush` and `append` are closures that reassign these, and
  // TypeScript's control-flow analysis cannot see through a closure call. With
  // plain `let`s it narrows `openFence` to `null` at every read after the
  // declaration, so `openFence ? openFence.length : 0` fails with "Property
  // 'length' does not exist on type 'never'". Narrowing of a property is reset
  // after any function call, which is exactly the behaviour this needs.
  const state: {
    /** Lines of the chunk being built. */
    current: string[];
    /** Its length, including the newlines that will join it. */
    length: number;
    /** The opening fence we are inside, e.g. "```sql" — null when outside. */
    openFence: string | null;
    /** After a flush inside a fence: the opener the next chunk reopens with. */
    pendingReopen: string | null;
  } = { current: [], length: 0, openFence: null, pendingReopen: null };

  const flush = () => {
    if (!state.current.length) return;
    // Drop trailing blank lines — they would otherwise end a chunk with
    // whitespace Slack renders as a gap.
    while (state.current.length && !state.current[state.current.length - 1]!.trim()) {
      state.current.pop();
    }
    if (!state.current.length) {
      state.length = 0;
      return;
    }
    if (state.openFence) state.current.push(FENCE_CLOSE);
    chunks.push(state.current.join("\n"));
    state.current = [];
    state.length = 0;
    state.pendingReopen = state.openFence;
  };

  const append = (line: string) => {
    if (state.pendingReopen) {
      state.current.push(state.pendingReopen);
      state.length += state.pendingReopen.length + 1;
      state.pendingReopen = null;
    }
    state.current.push(line);
    state.length += line.length + 1;
  };

  for (const rawLine of text.split("\n")) {
    // Room a reopened fence plus a closing fence would need, so a chunk that
    // has to grow both still fits under the limit.
    const overhead = state.openFence ? state.openFence.length + FENCE_CLOSE.length + 2 : 1;
    for (const line of hardSplit(rawLine, Math.max(16, limit - overhead))) {
      const cost =
        line.length + 1 + (state.pendingReopen ? state.pendingReopen.length + 1 : 0);
      const reserve = state.openFence ? FENCE_CLOSE.length + 1 : 0;
      if (state.current.length && state.length + cost + reserve > limit) flush();
      append(line);
      if (FENCE.test(line)) {
        // Toggle. A closing fence carries no info string, so only the opener is
        // worth remembering.
        state.openFence = state.openFence ? null : line.trimEnd();
      }
    }
  }
  flush();

  return chunks;
}

/**
 * One line into pieces of at most `max` characters.
 *
 * Prefers a cut where inline markup is balanced, then any space, and only then
 * a hard character cut — a `<url|label>` sliced in half shipped a broken link
 * above a truncation notice on 2026-07-10, which is the failure the space
 * preference exists for.
 */
function hardSplit(line: string, max: number): string[] {
  if (line.length <= max) return [line];
  const pieces: string[] = [];
  let rest = line;
  while (rest.length > max) {
    const cut = balancedCut(rest, max);
    pieces.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).replace(/^\s+/, "");
  }
  if (rest) pieces.push(rest);
  return pieces;
}

/**
 * The best index ≤ max to cut `s` at: the latest space that leaves inline
 * markup balanced, else the latest space, else `max`.
 *
 * "Balanced" means an even number of backticks and of `**` runs in the prefix.
 * An odd backtick count is the one that actually bites — an unterminated inline
 * code span swallows the rest of the line visually in both dialects.
 */
function balancedCut(s: string, max: number): number {
  const window = s.slice(0, max);
  const floor = Math.floor(max * 0.6);
  let lastSpace = -1;
  for (let i = window.length - 1; i > floor; i--) {
    if (window[i] !== " ") continue;
    if (lastSpace === -1) lastSpace = i;
    if (isBalanced(window.slice(0, i))) return i;
  }
  return lastSpace > 0 ? lastSpace : max;
}

function isBalanced(s: string): boolean {
  const backticks = (s.match(/`/g) ?? []).length;
  const doubles = (s.match(/\*\*/g) ?? []).length;
  return backticks % 2 === 0 && doubles % 2 === 0;
}
