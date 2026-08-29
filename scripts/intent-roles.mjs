/**
 * The pure half of `check:intent-roles` (#368).
 *
 * WHAT THE ROLE TOKENS ARE. `design-system/src/tokens/_color_roles.scss` names
 * two roles the seven intent colours never had: `--color-X-icon` and
 * `--color-X-border`. Six of the seven borders resolve to the base, because the
 * base already clears WCAG 1.4.11's 3:1 on all five surface steps. Warning does
 * not — #9f8205 falls to 2.87:1 on `--color-surface-container-highest` — so
 * `--color-warning-border` is the one role with a value of its own.
 *
 * WHAT THIS MEASURES. Every `border*` and `outline*` declaration in the design
 * system's stylesheets that paints its edge from an intent BASE rather than
 * from the base's `-border` role. On 2026-08-29 there were 135 of them and the
 * role tokens had no users at all, which is the state the roles file described
 * itself as leaving behind: "these tokens have no users yet, so this file
 * changes no pixel — it is the vocabulary that the uses can then be moved onto,
 * one at a time, against a ratchet." This is that ratchet.
 *
 * WHY A RENAME THAT CHANGES NO PIXEL IS WORTH DOING. `border-color:
 * var(--color-danger)` and `border-color: var(--color-danger-border)` resolve to
 * the same bytes today. They do not say the same thing. The first is a use of
 * the bold fill colour that happens to land on an edge; the second is a
 * declaration that an edge was intended and 3:1 was the bar it was chosen
 * against. The value can then move for borders alone — which is exactly what
 * warning needs and what no amount of care at 110 call sites can deliver.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. INLINE STYLES. `style={{ borderColor: 'var(--color-primary)' }}` in JSX
 *     is invisible here; the corpus is stylesheets. `SidebarTab.jsx` alone
 *     carries an `outline` in a style object.
 *  2. WHETHER THE EDGE SHOULD BE AN EDGE. A `border-bottom` used as a two-pixel
 *     underline on a selected tab is a border to this scanner and arguably a
 *     graphic to a designer. Both are held to 3:1, so the distinction changes
 *     nothing about the bar.
 *  3. A FOCUS RING IS NOT QUITE A BORDER. All 24 `outline` uses take
 *     `--color-primary`, and Atlassian names that role separately —
 *     `color.border.focused` beside `color.border`. We have no
 *     `--color-X-focus-ring`, so those 24 are RECORDED here rather than
 *     migrated: renaming them to `-border` would assert an equivalence nobody
 *     has decided. That is a finding about a missing token, not a defect in the
 *     call sites.
 *  4. THE GROUND. Unlike `check:text-contrast`, this measures no ratio. It asks
 *     which vocabulary a declaration uses. The contrast argument lives in
 *     `_color_roles.scss` beside the values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

/** Stylesheets that consume tokens. The files that DEFINE them are not scanned. */
export const CORPUS = 'design-system/src';

export const INTENTS = ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'info'];

/**
 * An edge declaration and its value.
 *
 * The property alternation is explicit so that `border-radius`, `border-width`
 * and `border-style` — which carry no colour — cannot match. The value part
 * spans newlines on purpose: `border:\n  1px solid var(--color-primary);` is
 * one declaration written across two lines and a line-anchored scanner misses
 * it. `[^;{}]` stops the match at the end of the declaration rather than
 * running into the next rule.
 */
export const EDGE = new RegExp(
  '(^|[\\s;{])(border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?)\\s*:\\s*([^;{}]*);',
  'g',
);

const BASE = new RegExp(`var\\(\\s*(--color-(?:${INTENTS.join('|')}))\\s*[,)]`, 'g');

export function stylesheets(root = REPO_ROOT, dir = CORPUS, out = []) {
  const full = path.join(root, dir);
  let entries;
  try {
    entries = fs.readdirSync(full, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) stylesheets(root, rel, out);
    // `tokens/` DEFINES the roles; `--color-danger-border: var(--color-danger)`
    // is the definition of the role, not a call site that skipped it.
    else if (/\.(scss|css)$/.test(entry.name) && !rel.includes(`${path.sep}tokens${path.sep}`)) out.push(rel);
  }
  return out;
}

/** `border`/`outline` uses of an intent BASE, one entry per token occurrence. */
export function edgeUses(files, root = REPO_ROOT) {
  const uses = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const declaration of source.matchAll(EDGE)) {
      const property = declaration[2];
      const kind = property.startsWith('outline') ? 'outline' : 'border';
      for (const token of declaration[3].matchAll(BASE)) {
        const at = declaration.index + declaration[0].indexOf(token[0]);
        uses.push({
          file,
          line: source.slice(0, at).split('\n').length,
          property,
          kind,
          token: token[1],
          role: `${token[1]}-border`,
        });
      }
    }
  }
  return uses;
}

/** `{ [file]: { border, outline } }` — what the baseline is compared against. */
export function counts(uses) {
  const out = {};
  for (const use of uses) {
    out[use.file] = out[use.file] ?? { border: 0, outline: 0 };
    out[use.file][use.kind] += 1;
  }
  return out;
}

/**
 * The ratchet. A recorded remainder may shrink only after the record shrinks
 * with it: a count BELOW its baseline is a finding in its own right, because a
 * baseline that no longer describes the code is a baseline nobody can read.
 */
export function failures(uses, baseline) {
  const found = [];
  const now = counts(uses);
  const files = new Set([...Object.keys(now), ...Object.keys(baseline)]);
  for (const file of [...files].sort()) {
    const before = baseline[file];
    const after = now[file];
    if (!before) {
      const lines = uses.filter((u) => u.file === file).map((u) => `${u.line} (${u.property})`);
      found.push(
        `${file} paints an edge from an intent base and is not in the baseline: ` +
          `line ${lines.join(', ')}. Use the \`-border\` role, or record the reason it cannot.`,
      );
      continue;
    }
    if (!after) {
      found.push(`${file} is recorded in the baseline and no longer has any use. Delete its entry.`);
      continue;
    }
    for (const kind of ['border', 'outline']) {
      const was = before[kind] ?? 0;
      const is = after[kind] ?? 0;
      if (is > was) {
        found.push(`${file} has ${is} ${kind} use(s) of an intent base, up from ${was}. The roles exist; use them.`);
      } else if (is < was) {
        found.push(
          `${file} has ${is} ${kind} use(s), down from ${was} — the ratchet moved and the record did not. ` +
            'Lower the baseline to match.',
        );
      }
    }
  }
  return found;
}
