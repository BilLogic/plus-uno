/**
 * Does the CSS still paint what Figma says?
 *
 * WHAT WAS UNWATCHED. `scripts/figma-variables-snapshot.json` records every
 * variable in the library by NAME and by count, and `check:figma-snapshots`
 * holds it to a date and a floor. Neither records a single VALUE. So a colour
 * could move in Figma, or be hand-edited in `_colors.scss`, and nothing in this
 * repository would notice — the names would still line up perfectly.
 *
 * One had. Measured 2026-08-29 during a sweep of the BS4 library:
 *
 *   --color-success-container   #bdf292 in _colors.scss,  #a1eb83 in Figma
 *
 * Both sides were internally consistent — the CSS state layers built from
 * `rgba(189, 242, 146, …)` and the Figma ones from `#a1eb83` — so each looked
 * correct on its own, and only the comparison showed the split. Which side was
 * right was a decision, not a repair: changing either moves a colour that
 * ships. It sat as a KNOWN divergence until 2026-09-15, when the owner chose
 * #bdf292 and the live library turned out to already hold it: the variable
 * re-measured to #bdf292 into the recording that day. The state layers are NOT
 * evidence either way — `colour-values.json` excludes them by design, because
 * they are the base colour at 8/12/16% and drift with it. The count of
 * divergences is a ratchet.
 *
 * WHY THE MAPPING RUNS FIGMA -> CSS. Figma is the source, and the CSS is
 * generated from it. A variable with no CSS counterpart is normal (candidates
 * under `Proposal/`, the `Surface roles/` set) and is reported as UNMAPPED
 * rather than failed; a CSS token with no Figma variable is a different
 * question, and `check:token-registry` already asks it.
 */
import fs from 'node:fs';
import path from 'node:path';

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { resolveToken, tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';

/**
 * `Mastering-Content/Mastering-Content (Text)` -> `--color-mastering-content-text`
 *
 * The accent groups shed their leading `_` in the 2026-09-06 rename. The strip
 * stays so a name recorded before it still maps to the same token.
 */
export function cssName(figmaName) {
  const parts = figmaName.split('/');
  const leaf = parts[parts.length - 1];
  const group = parts[0].replace(/^_/, '');

  // Proposals are candidates by definition and have no CSS counterpart.
  if (group === 'Proposal') return null;

  const slug = (s) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s*\(text\)$/, '-text')
      .replace(/\s+container$/, '-container')
      .replace(/\s+icon$/, '-icon')
      .replace(/\s+border$/, '-border')
      .replace(/^on\s+/, 'on-')
      .replace(/^inverse\s+/, 'inverse-')
      .replace(/\s+/g, '-');

  return `--color-${slug(leaf)}`;
}

/** Every `--color-*` declaration, with `var()` chains followed to a literal. */
export function cssColours(repoRoot) {
  const files = ['_colors.scss', '_color_roles.scss']
    .map((f) => path.join(repoRoot, TOKEN_DIR, f))
    .filter((f) => fs.existsSync(f));

  const declared = new Map();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(tokenDeclarationPattern('--color-'))) {
      declared.set(m[1], m[2].trim());
    }
  }

  // Grammar and alias-following are the tokens module's (#507). `resolveToken`
  // is cycle-guarded where the walk here was depth-capped, and answers
  // `undefined` for a name that leads nowhere — where the cap returned the
  // value it started from, which is what `??` restores.
  const out = new Map();
  for (const [name, value] of declared) out.set(name, (resolveToken(name, declared) ?? value).toLowerCase());
  return out;
}

/** `#RRGGBB`, or `#RRGGBB@0.32` when translucent. Null when unreadable. */
export function normalise(value) {
  const v = value.trim().toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{6}@[\d.]+$/.test(v)) {
    const [hex, alpha] = v.split('@');
    return `${hex}@${Number(alpha).toFixed(2)}`;
  }
  const rgba = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.]+)\s*)?\)$/.exec(v);
  if (rgba) {
    const p = (n) => Math.round(Number(n)).toString(16).padStart(2, '0');
    const hex = `#${p(rgba[1])}${p(rgba[2])}${p(rgba[3])}`;
    const alpha = rgba[4] === undefined ? 1 : Number(rgba[4]);
    return alpha < 1 ? `${hex}@${alpha.toFixed(2)}` : hex;
  }
  return null;
}

/**
 * `{compared, unmapped, unreadable, divergences}`.
 *
 * `divergences` is `{token, figmaName, figma, css}` for every pair that maps and
 * disagrees.
 */
export function compare(recording, colours) {
  const result = { compared: 0, unmapped: [], unreadable: [], divergences: [] };

  for (const [key, figmaValue] of Object.entries(recording.variables)) {
    const figmaName = key.split('::')[1] ?? key;
    const token = cssName(figmaName);
    if (!token || !colours.has(token)) {
      result.unmapped.push(figmaName);
      continue;
    }
    const theirs = normalise(figmaValue);
    const ours = normalise(colours.get(token));
    if (theirs === null || ours === null) {
      result.unreadable.push(`${token} (${figmaName}): figma ${figmaValue}, css ${colours.get(token)}`);
      continue;
    }
    result.compared += 1;
    if (theirs !== ours) result.divergences.push({ token, figmaName, figma: theirs, css: ours });
  }

  result.unmapped.sort();
  result.divergences.sort((a, b) => a.token.localeCompare(b.token));
  return result;
}

/**
 * @returns {string[]} A line per problem. A divergence that is already recorded
 *   as KNOWN is not a problem; a known entry that no longer diverges is, because
 *   a stale exemption is how the next one gets waved through.
 */
export function failures(result, known) {
  const found = [];
  const knownByToken = new Map(known.map((k) => [k.token, k]));
  const seen = new Set();

  for (const d of result.divergences) {
    seen.add(d.token);
    const exemption = knownByToken.get(d.token);
    if (!exemption) {
      found.push(
        `${d.token}: Figma says ${d.figma} (${d.figmaName}), the CSS says ${d.css}. ` +
          'One of the two moved and nothing followed.',
      );
    } else if (exemption.figma !== d.figma || exemption.css !== d.css) {
      found.push(
        `${d.token}: recorded as ${exemption.css} vs ${exemption.figma}, now ${d.css} vs ${d.figma}. ` +
          'The known divergence changed shape; re-decide it rather than re-record it.',
      );
    }
  }

  for (const k of known) {
    if (!seen.has(k.token)) {
      found.push(`${k.token}: recorded as a known divergence and no longer diverges. Delete the entry.`);
    }
  }

  for (const line of result.unreadable) found.push(`unreadable: ${line}`);
  return found;
}
