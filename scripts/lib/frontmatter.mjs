/**
 * One frontmatter parser, for every tool that needs to know where a doc's
 * metadata stops and its content starts.
 *
 * IT LIVES HERE BECAUSE THE ANSWER DECIDES A NUMBER. Frontmatter addresses the
 * tooling, not the model: `agents/uno-bot/scripts/bundle-harness.mjs` strips it
 * before assembly, which is why the char budgets are measured on the bundled
 * BODY and why `check:negation`'s bundled scope counts the body too (#238). The
 * two therefore have to agree on where the fence closes — a second parser that
 * ended the block one line later would charge the prompt for chars it never
 * carries, or credit it with prohibitions the model is never told. That is the
 * one-rule-two-homes defect #159 deleted for membership and #216 deleted for
 * the bundled set; this is the same deletion for the split itself.
 *
 * `embodimentOf` in `bundled-set.mjs` reads its one key through this, rather
 * than re-finding the fence with a regex of its own, for the same reason.
 */

/**
 * A doc's frontmatter keys and the body beneath them.
 *
 * A file with no opening `---\n`, or with no closing fence, is all body and no
 * meta — the bundler has always treated an unterminated block as content rather
 * than guessing where it meant to end.
 *
 * @param {string} text the file's whole contents.
 * @returns {{meta: Record<string, string>, body: string}}
 */
export function splitFrontmatter(text) {
  if (!text.startsWith('---\n')) return { meta: {}, body: text };
  const close = text.indexOf('\n---', 4);
  if (close === -1) return { meta: {}, body: text };
  const meta = {};
  for (const line of text.slice(4, close).split('\n')) {
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body: text.slice(close + 4).replace(/^\n+/, '') };
}
