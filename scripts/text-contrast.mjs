/**
 * The pure half of `check:text-contrast` (#268).
 *
 * WHAT THIS MEASURES, AND WHY IT IS NOT `check:button-contrast`. That check
 * reads the Button theme MAP — a generator — and sweeps everything it can
 * produce. This reads arbitrary `color:` declarations naming a `--ds-text*`
 * token in the design system's stylesheets, which no generator produces and no
 * story necessarily renders, and measures each against the ground its rule
 * puts it on. A text token is chosen for the 4.5:1 bar on its intended ground;
 * this catches the one used on a ground it was not chosen for.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. THE REAL GROUND, BEYOND ITS RULES. The ground is resolved STRUCTURALLY
 *     (`scripts/lib/declared-grounds.mjs`, postcss-scss): walking out from the
 *     declaration's rule, the first rule with a `--ds-*` background or a
 *     `// @grounds: …` annotation decides, and the page if none does. So a
 *     nested rule on a parent's fill is measured on that fill, and a rule on a
 *     ground its caller paints declares it and is measured on each one. A
 *     ground painted by a parent COMPONENT is invisible; it falls back to the
 *     page, which is the right default, and a finding that contradicts it is
 *     the check being wrong rather than the code.
 *  2. INLINE STYLES. `style={{ color: 'var(--ds-text-warning)' }}` in JSX is
 *     invisible here. The corpus is stylesheets.
 *  3. THE INVERSE TEXT. `--ds-text-inverse` and `--ds-text-warning-inverse`
 *     exist to be drawn on a bold or dark ground, so they are skipped where the
 *     page is only assumed; where a rule names its ground they are measured.
 *  4. GRAPHIC-ONLY CONTRAST, AND THE INACTIVE EXEMPTION. WCAG asks 3:1 of a
 *     graphical object, 4.5:1 of text, and NOTHING AT ALL of an inactive
 *     component (1.4.11's own exception). The check applies the text threshold
 *     to everything and lets the baseline carry the exemptions with a reason
 *     each, because a checker that tried to infer "is this an inactive
 *     graphic?" from a stylesheet would be guessing about the thing that
 *     matters most. A graphic can instead be DECLARED: `// @contrast: non-text`
 *     opening a rule holds that rule's own colors — never a nested rule's — to
 *     3:1, and only if every resolved selector's subject is an icon glyph (a
 *     selector the `icon-glyph` mixin lists, in
 *     `design-system/src/styles/_icon-glyph.scss`). Otherwise it is an error,
 *     not a lower bar.
 *  5. WHETHER THE REPLACEMENT IS RIGHT. It reports that a token is unreadable
 *     on its ground and names the `-bolder` sibling where one exists. Whether
 *     that sibling is the correct color for the role is a design question.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents } from './lib/corpus.mjs';
import { NON_TEXT, analyzeSheet, groundAt, isNonText } from './lib/declared-grounds.mjs';

import {
  composite,
  contrast,
  parseColor,
  resolveToken,
  varReferencePattern,
} from '../design-system/src/lib/tokens.mjs';

import { AA_TEXT, PAGE_TOKEN, tokenValues } from './button-contrast.mjs';
import { colors } from './focus-ring.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

/** Stylesheets that consume tokens. The files that DEFINE them are not scanned. */
export const CORPUS = 'design-system/src';

/** Roles that are meant to sit on a color, not on the page. See blind spot 3. */
export const OFF_PAGE = /^--ds-(?:text|icon)-(?:inverse|warning-inverse)$/;

export function stylesheets(root = REPO_ROOT, dir = CORPUS) {
  // `tokens/` DEFINES the colors; a definition is not a use of one.
  return documents(dir, { root, ext: ['.scss', '.css'] }).filter(
    (file) => !file.includes('/tokens/'),
  );
}

/**
 * Every `color:` declaration naming a `--ds-text*` token, with the ground its
 * own rule puts it on.
 *
 * Anchored on `(^|[\s;{])color\s*:` so `background-color` and `border-color` —
 * which are grounds and edges, not text — do not match. That distinction is not
 * pedantry: the first draft of the FIX for this defect used a looser pattern
 * and silently rewrote a `background-color` in `main.scss`.
 */
export function textDeclarations(files, root = REPO_ROOT) {
  const uses = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const sheet = analyzeSheet(source);
    const lines = source.split('\n');
    let offset = 0;
    lines.forEach((line, index) => {
      const declaration = /(^|[\s;{])color\s*:\s*([^;]+);/.exec(line);
      if (declaration) {
        // The ground, resolved structurally: walking out from this rule, the
        // first rule with a background or a `@grounds` decides; the page if
        // none does. `scripts/lib/declared-grounds.mjs` states the rules.
        const at = offset + declaration.index + declaration[1].length;
        const resolved = groundAt(sheet, at);
        const declared = resolved.kind === 'grounds' ? { tokens: resolved.tokens, line: resolved.line } : null;
        const grounds = resolved.kind === 'background'
          ? [resolved.token]
          : (declared?.tokens.length ? declared.tokens : [PAGE_TOKEN]);
        // Where the ground came from, for the report: this rule's own
        // background, an ancestor's, a declared `@grounds`, or the page.
        const origin = resolved.kind === 'background'
          ? { kind: resolved.own ? 'own' : 'ancestor', line: resolved.line }
          : (declared?.tokens.length ? { kind: 'grounds', line: declared.line } : { kind: 'page' });
        // `@contrast: non-text` — a graphic, held to 3:1 — counts only on the
        // declaration's own rule and only with an icon subject. Anywhere else
        // it is an error and the declaration keeps the text bar.
        const nonText = isNonText(sheet, at);
        for (const match of declaration[2].matchAll(varReferencePattern('--ds-text'))) {
          for (const ground of grounds) {
            uses.push({ token: match[1], file, line: index + 1, source: line.trim(), ground, origin, declared, nonText });
          }
        }
      }
      offset += line.length + 1;
    });
  }
  return uses;
}

/**
 * The `-bolder` sibling of a text token, if the token file defines one.
 *
 * `values` is the Map that `tokenValues` returns, not a plain object. The first
 * version of this used `Object.hasOwn`, which is always false on a Map — so the
 * hint that names the fix never fired once, in a report whose whole job is to
 * name the fix. It failed silently and looked like "no sibling exists".
 */
export function textSibling(token, values) {
  const sibling = `${token}-bolder`;
  return values.has(sibling) ? sibling : null;
}

/**
 * The ground as it actually paints.
 *
 * TRANSLUCENT TINTS ARE NOT GROUNDS. An 8% tint of primary is
 * `rgba(4, 114, 168, 0.08)` — a wash over whatever is beneath. Reading it
 * as if it were solid gives brand text at 1.27:1 and a page of
 * failures that are not there. That is the same arithmetic mistake #268's audit
 * made and had to correct, and the first draft of this check made it again: 34
 * of its 48 findings were state layers read as paint. So a translucent ground
 * is composited over the page before anything is measured.
 */
export function opaqueGround(ground, values, page = PAGE_TOKEN) {
  const paint = parseColor(resolveToken(ground, values));
  if (!paint) return null;
  if (paint.a >= 1) return paint;
  const beneath = parseColor(resolveToken(page, values));
  return beneath ? composite(paint, beneath) : null;
}

export function ratio(token, values, ground = PAGE_TOKEN) {
  const foreground = parseColor(resolveToken(token, values));
  const background = opaqueGround(ground, values);
  if (!foreground || !background) return null;
  // A translucent FOREGROUND is a different question — text at 8% alpha is a
  // defect no threshold describes well — and none of the corpus does it, so it
  // is left unhandled rather than guessed at.
  return contrast(foreground, background);
}

/**
 * Declarations whose color is unreadable on the page.
 *
 * A token that cannot be resolved to a literal is NOT a finding — it is a
 * different defect (a dangling token) with a different check, and reporting it
 * here as a contrast failure would name the wrong problem.
 */
export function findings(uses, values, { threshold = AA_TEXT } = {}) {
  const out = [];
  for (const use of uses) {
    const ground = use.ground || PAGE_TOKEN;
    // The inverse text tokens exist to be drawn on a color. If
    // the rule names its ground they are measured like anything else; only the
    // page-assumption case is skipped, because that is the one that would be
    // measuring them against a surface they were never for.
    if (OFF_PAGE.test(use.token) && ground === PAGE_TOKEN) continue;
    const measured = ratio(use.token, values, ground);
    const bar = use.nonText ? NON_TEXT : threshold;
    if (measured === null || measured >= bar) continue;
    const sibling = textSibling(use.token, values);
    out.push({
      ...use,
      ground,
      ratio: Number(measured.toFixed(2)),
      bar,
      sibling,
      siblingRatio: sibling ? Number(ratio(sibling, values, ground).toFixed(2)) : null,
    });
  }
  return out;
}

export function readValues(root = REPO_ROOT) {
  return colors(root);
}

/** Where a finding's ground came from, in words, from the origin `textDeclarations` gave it. */
export function groundLabel(finding) {
  switch (finding.origin.kind) {
    case 'own': return " (its own rule's background)";
    case 'ancestor': return ` (the background of an ancestor rule, line ${finding.origin.line})`;
    case 'grounds': return ` (declared by @grounds, line ${finding.origin.line})`;
    default: return ' (no rule sets a background, so the page is assumed)';
  }
}

export function report(found, { threshold = AA_TEXT } = {}) {
  const lines = found.map(
    (f) =>
      `  ${f.file}:${f.line}\n` +
      `      ${f.source}\n` +
      `      ${f.token} is ${f.ratio}:1 on ${f.ground}` +
      groundLabel(f) +
      (f.bar === NON_TEXT ? ` — a non-text glyph needs ${NON_TEXT}:1` : ` — AA text needs ${threshold}:1`) +
      (f.sibling ? `\n      → ${f.sibling} is ${f.siblingRatio}:1 and exists for exactly this.` : ''),
  );
  return (
    `[text-contrast] ${found.length} text color${found.length === 1 ? '' : 's'} below AA:\n\n` +
    `${lines.join('\n\n')}\n\n` +
    `  A ground is resolved outward from the declaration's rule: the first rule with a\n` +
    `  --ds-* background or a @grounds decides, and the page if none does. If the\n` +
    `  real ground is painted somewhere this cannot see, the check is wrong and should\n` +
    `  learn the ground; do not silence it by moving the declaration.`
  );
}

/** Baseline identity: a file + token + ground, not a line, so edits above it do not churn. */
export function keyOf(finding) {
  return `${finding.file}|${finding.token}|${finding.ground}`;
}

/** `{key: count}` for a run's findings. */
export function census(found) {
  const counts = {};
  for (const finding of found) counts[keyOf(finding)] = (counts[keyOf(finding)] || 0) + 1;
  return counts;
}

/**
 * A ratchet, not a threshold — the WORDING of one, which is all that is left
 * here.
 *
 * `scripts/lib/ratchet.mjs` owns the record, the direction that fails, the
 * stale sweep and the write (#599); this turns what it classified into the
 * lines this check has always printed. NEW and ROSE are emitted in the order
 * the run found them, not grouped by kind, so the list reads like the run, and
 * STALE follows because it is about the record rather than about the run.
 *
 * @param {import('./lib/ratchet.mjs').RatchetFailure[]} failures
 * @param {{key: string, recorded: number}[]} stale
 * @returns {string[]}
 */
export function ratchetFailures(failures, stale) {
  const columns = (key) => key.split('|').join('  ');
  const lines = [];

  for (const failure of failures) {
    // The one stated absent-record mode arrives already worded, because there
    // is nothing check-specific to say about a record that is not there.
    if (failure.kind === 'absent') {
      lines.push(failure.message);
      continue;
    }
    if (failure.kind === 'new') {
      lines.push(`  NEW      ${columns(failure.key)}\n           not in the baseline. Fix it, or record it with a reason.`);
    } else {
      lines.push(`  ROSE     ${columns(failure.key)}\n           ${failure.recorded} recorded, ${failure.count} found.`);
    }
  }

  for (const { key, recorded } of stale) {
    lines.push(
      `  STALE    ${columns(key)}\n           recorded ${recorded}, found 0 — it was fixed. ` +
        'Remove the entry so the baseline stays a list of live findings.',
    );
  }
  return lines;
}
