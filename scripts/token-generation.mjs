/**
 * The rule `npm run generate:tokens` did not follow: a generator may not shrink
 * the thing it generates.
 *
 * WHAT WAS THERE. `scripts/generate-all-tokens.js` opened with
 *
 *   console.warn('⚠️  WARNING: Source JSON files are incomplete. Token generation
 *                 is DISABLED to protect existing tokens.');
 *
 * and then, four lines later, wrote all four token files anyway. The warning was
 * a `console.warn` and nothing else — no return, no exit — so the protection it
 * announced did not exist. Measured on 2026-08-29: one run of the documented,
 * one-word command took `_colors.scss` from 195 colour tokens to 5, keeping only
 * `--color-primary`, `--color-secondary`, `--color-tertiary`, `--color-danger`
 * and `--color-success`, and reported `✅ All token files generated
 * successfully!` while doing it. `--color-warning-text` — the token that carries
 * the one warning value passing 4.5:1, and the fix for #312 — was among the 190
 * it deleted.
 *
 * It is reachable from a skill: `skills/uno-maintain/references/ds-fix.md` lists
 * `npm run generate:tokens` as the way to "regenerate SCSS from token source".
 *
 * WHY A COUNT AND NOT A DIFF. The sources are Figma exports and are expected to
 * change; a generator whose output must match byte for byte is a generator
 * nobody may improve. What must never happen silently is LOSS, so the rule is
 * only about direction, and the escape hatch is explicit rather than absent.
 */

/** Every `--token:` declared in a stylesheet. */
export function tokenNames(scss) {
  return [...scss.matchAll(/^\s*(--[a-z][a-z0-9-]*)\s*:/gm)].map((m) => m[1]);
}

/**
 * `{file, before, after, lost}` for each file, where `before` is what is on disk
 * and `after` is what the generator produced in memory.
 *
 * `lost` is the NAMES, not the count: "190 fewer" is a number to argue with,
 * and `--color-warning-text` is not.
 */
export function compare(files) {
  return files.map(({ file, generated, committed }) => {
    const after = tokenNames(generated);
    const before = tokenNames(committed);
    const now = new Set(after);
    return {
      file,
      before: before.length,
      after: after.length,
      lost: before.filter((name) => !now.has(name)),
    };
  });
}

/**
 * @returns {string[]} One line per file that would lose a token. Empty means
 *   every file is at least as complete as the one it would overwrite, and the
 *   generator may write.
 */
export function refusals(comparisons) {
  return comparisons
    .filter((c) => c.lost.length)
    .map((c) => {
      const shown = c.lost.slice(0, 6).join(', ');
      const rest = c.lost.length > 6 ? `, and ${c.lost.length - 6} more` : '';
      return `${c.file}: ${c.before} tokens on disk, ${c.after} generated — would DELETE ${c.lost.length}: ${shown}${rest}`;
    });
}
