/**
 * The pure half of `check:focus-ring` (#368).
 *
 * WHAT A FOCUS INDICATOR HAS TO DO. WCAG 1.4.11 asks 3:1 of any non-text
 * indicator against what it sits on, and 2.4.11 (Focus Appearance) asks the
 * indicator to be at least as large as a 2px perimeter and to reach 3:1 against
 * the unfocused state. This measures the first of those, because it is the one
 * a stylesheet can answer: the colour of the ring against the ground its own
 * rule puts it on.
 *
 * WHAT THE SWEEP FOUND, 2026-08-29. 53 focus-affordance declarations across the
 * design system, written **20 different ways** — six width tokens (`2px`,
 * `0.2rem`, `--size-element-stroke-sm|md|lg`, `--size-border-stroke-stroke-150`,
 * `--size-card-border-lg`) and seven colours. Three of those colours cannot be
 * seen against the page:
 *
 *   --color-primary-state-08    1.13:1     an 8% tint of primary
 *   --color-inverse-primary     1.62:1     a light tint meant for DARK grounds
 *   --color-on-surface-state-12 1.28:1
 *
 * against `--color-primary` at 5.02:1, which is what the majority of the
 * declarations already use.
 *
 * A GLOW IS NOT AUTOMATICALLY A DEFECT, and this is the correction that shaped
 * the check. Eleven of the fourteen `box-shadow: 0 0 0 0.2rem
 * var(--color-primary-state-08)` declarations sit beside `border-color:
 * var(--color-primary-border)` in the same rule. There the BORDER is the
 * indicator at 5.02:1 and the glow is decoration around it, exactly as
 * Bootstrap intends. Reporting those as failures would be measuring one
 * declaration instead of the rule it lives in. So the rule is scored on its
 * STRONGEST indicator, and only a rule whose best affordance is under 3:1 is a
 * finding.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. THE UNFOCUSED STATE. 2.4.11's other half asks for 3:1 between focused and
 *     unfocused. That needs the base rule's value for the same property, and
 *     the base rule is often in another file or another component. Not
 *     attempted; a check that guessed would report the wrong half of the
 *     criterion confidently.
 *  2. SIZE AND OFFSET. A 1px ring at 5:1 passes here and fails 2.4.11. The
 *     spread of widths is REPORTED (six spellings) rather than judged, because
 *     which one wins is a decision, not a measurement.
 *  3. GROUND BEYOND THE RULE. As with `check:text-contrast`: a background set by
 *     an ancestor is invisible, and the page is assumed.
 *  4. `:focus` VS `:focus-visible`. Both count. Whether a component should use
 *     one or the other is a separate question from whether its ring can be
 *     seen.
 */
import fs from 'node:fs';
import path from 'node:path';

import { PAGE_TOKEN, composite, contrast, parseColour, resolveToken, tokenValues } from './button-contrast.mjs';
import { REPO_ROOT, groundFor, stylesheets } from './text-contrast.mjs';

export { REPO_ROOT, stylesheets };

/** WCAG 1.4.11 — non-text contrast. A ring is a graphical object. */
export const NON_TEXT = 3;

/**
 * The properties that can carry a visible focus affordance.
 *
 * `background-color` is NOT one of them, and the reason is worth stating: a
 * focus style whose only change is its own background has to be measured
 * against the UNFOCUSED background, which is blind spot 1. Scoring it against
 * the ground its own rule sets measures a colour against itself and returns
 * 1.00:1 for every one of them — four findings in the first run, all of them
 * the check misreading its own input. Backgrounds are read as the GROUND here,
 * never as the indicator.
 */
export const AFFORDANCE = new RegExp(
  '(^|[\\s;{])(outline(?:-color)?|box-shadow|border(?:-(?:top|right|bottom|left))?(?:-color)?)\\s*:\\s*([^;{}]*);',
  'g',
);

/**
 * `&:not(:focus)` is the UNFOCUSED state and mentions focus. Six of the first
 * run's 35 findings were `:not(:focus)` rules — the check reporting the resting
 * appearance of an input as a failed focus ring.
 */
export const NEGATED = /:not\(\s*:focus[^)]*\)/gi;

/** Token definitions, from the colour file and the role layer that follows it. */
export function colours(root = REPO_ROOT) {
  const source = ['design-system/src/tokens/_colors.scss', 'design-system/src/tokens/_color_roles.scss']
    .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
    .join('\n');
  return tokenValues(source);
}

/**
 * Every rule whose selector chain mentions focus, with the affordances it sets.
 *
 * The chain matters: `&:focus { .thumb { box-shadow: … } }` is a focus style on
 * the thumb, and a scanner that only read the innermost selector would miss it.
 */
export function focusRules(files, root = REPO_ROOT) {
  const rules = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const declaration of source.matchAll(AFFORDANCE)) {
      const chain = selectorChain(source, declaration.index);
      if (!/focus/i.test(chain.replace(NEGATED, ''))) continue;
      rules.push({
        file,
        line: source.slice(0, declaration.index).split('\n').length,
        selector: chain,
        property: declaration[2],
        value: declaration[3].split(/\s+/).join(' ').trim(),
        tokens: [...declaration[3].matchAll(/var\(\s*(--color-[a-z0-9-]+)/g)].map((m) => m[1]),
        ground: groundFor(source, declaration.index),
        block: blockStart(source, declaration.index),
      });
    }
  }
  return rules;
}

function blockStart(source, offset) {
  const opens = [];
  for (let i = 0; i < offset; i += 1) {
    if (source[i] === '{') opens.push(i);
    else if (source[i] === '}') opens.pop();
  }
  return opens.length ? opens[opens.length - 1] : -1;
}

export function selectorChain(source, offset) {
  const opens = [];
  for (let i = 0; i < offset; i += 1) {
    if (source[i] === '{') opens.push(i);
    else if (source[i] === '}') opens.pop();
  }
  return opens
    .map((open) => source.slice(source.lastIndexOf('\n', open) + 1, open).trim().replace(/\s+/g, ' '))
    .join(' >> ');
}

/**
 * The contrast of one token against a ground, translucency composited first —
 * on BOTH sides.
 *
 * The ground needs compositing too, and the first draft forgot it. Four
 * findings came back at 1.22:1 for `outline: 2px solid var(--color-primary)` on
 * `background-color: var(--color-primary-state-12)`: a 12% tint of primary is a
 * near-white ground where the ring measures 5.02:1, but read as a raw rgba its
 * channels are primary's own, so the check was comparing primary against
 * primary. A translucent ground is composited over the page before anything is
 * measured against it.
 */
export function ratio(token, ground, values, page = PAGE_TOKEN) {
  const colour = parseColour(resolveToken(token, values));
  const raw = parseColour(resolveToken(ground, values));
  const surface = parseColour(resolveToken(page, values));
  if (!colour || !raw || !surface) return null;
  const base = raw.a < 1 ? composite(raw, surface) : raw;
  return contrast(composite(colour, base), base);
}

/**
 * One entry per focus RULE — not per declaration — carrying its strongest
 * affordance. See the header: a 1.13:1 glow beside a 5.02:1 border is a rule
 * that can be seen.
 */
export function indicators(rules, values) {
  const byBlock = new Map();
  for (const rule of rules) {
    const key = `${rule.file}#${rule.block}`;
    const entry = byBlock.get(key) ?? { file: rule.file, line: rule.line, selector: rule.selector, best: null, spellings: [] };
    entry.spellings.push(`${rule.property}: ${rule.value}`);
    for (const token of rule.tokens) {
      const measured = ratio(token, rule.ground, values);
      if (measured === null) continue;
      if (!entry.best || measured > entry.best.ratio) {
        entry.best = { token, ratio: measured, property: rule.property, ground: rule.ground };
      }
    }
    entry.line = Math.min(entry.line, rule.line);
    byBlock.set(key, entry);
  }
  return [...byBlock.values()].filter((entry) => entry.best);
}

export function failures(entries, baseline) {
  const found = [];
  const recorded = new Set(Object.keys(baseline));
  const seen = new Set();
  for (const entry of entries) {
    if (entry.best.ratio >= NON_TEXT) continue;
    const key = `${entry.file}:${entry.line}`;
    seen.add(key);
    if (recorded.has(key)) continue;
    found.push(
      `${key} — the strongest focus affordance is ${entry.best.property}: ${entry.best.token} at ` +
        `${entry.best.ratio.toFixed(2)}:1 on ${entry.best.ground}, under ${NON_TEXT}:1. ` +
        `Selector \`${entry.selector}\`.`,
    );
  }
  for (const key of recorded) {
    if (!seen.has(key)) {
      found.push(`${key} is recorded as an invisible focus ring and no longer is one. Delete the entry.`);
    }
  }
  return found;
}
