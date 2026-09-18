/**
 * A font-family token's fallback either says the same thing the token does, or
 * it is a trap.
 *
 * WHY A FALLBACK IS THE DANGEROUS PLACE. It only paints when the token fails to
 * load — a stylesheet that has not arrived, a page rendered outside the design
 * system, an email client. So a wrong one is wrong everywhere at once and
 * invisible until the one moment it is used. This is the reasoning
 * `check:colour-fallbacks` already applies to colour; nothing applied it to
 * type.
 *
 * THREE SHAPES, EACH MEASURED 2026-08-29.
 *
 * 1. A STACK WITH NO GENERIC. `--font-family-display4: "Open Sans"` names one
 *    face and nothing after it, so if Open Sans is missing the browser falls
 *    back to ITS default rather than to a family anyone chose. Every other
 *    family token in the file ends in a generic. Inline,
 *    `var(--font-family-header, Lato)` is the same defect one level down.
 *
 * 2. A MONOSPACE TOKEN THAT DOES NOT FALL BACK TO `monospace`. This one shipped
 *    and was fixed in #267: `--font-family-code` fell back to `sans-serif`, and
 *    the stack resolved 171.13px where `monospace` is 480.08px — not a
 *    different mono face, not monospaced at all. The rule is kept so it cannot
 *    come back.
 *
 * 3. A FALLBACK NAMING THE WRONG FACE. `var(--font-family-body, 'Lato', …)` is
 *    in three files. `--font-family-body` is Merriweather Sans; Lato is the
 *    HEADER face. If the token ever fails to load, body text renders in the
 *    heading font — the fallback is not a copy of the token, it is a different
 *    decision.
 *
 * WHAT IS NOT A FINDING. A shorter stack is fine: `var(--font-family-body,
 * "Merriweather Sans", sans-serif)` drops `"Open Sans"` from the middle and
 * still starts with the right face and ends in a generic. The rule is about the
 * FIRST named family and the LAST entry, not about the whole list — a fallback
 * is a safety net, not a duplicate.
 */

import {
  resolveToken,
  tokenDeclarationPattern,
  varReferencePattern,
} from '../design-system/src/lib/tokens.mjs';

/** The CSS generic families a stack may legally end in. */
export const GENERICS = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
]);

/** `"Merriweather Sans", sans-serif` → `['Merriweather Sans', 'sans-serif']`. */
export function stack(value) {
  return value
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/** Every `--font-family-*: …` declaration in the token files. */
export function familyTokens(files) {
  const out = new Map();
  for (const { path: file, text } of files) {
    for (const m of text.matchAll(tokenDeclarationPattern('--font-family-'))) {
      out.set(m[1], { value: m[2].trim(), file, line: text.slice(0, m.index).split('\n').length });
    }
  }
  return out;
}

/**
 * Every `var(--font-family-*, …)` in the corpus. The name is the module's
 * `varReferencePattern`; the fallback is the rest of that `var()` call, so a
 * nested `var()` inside it is one allowance and not a truncated name.
 *
 * @param {{path: string, text: string}[]} files
 */
export function familyFallbacks(files) {
  const out = [];
  for (const { path: file, text } of files) {
    for (const m of text.matchAll(varReferencePattern('--font-family-'))) {
      let i = m.index + m[0].length;
      while (i < text.length && /\s/.test(text[i])) i += 1;
      if (text[i] !== ',') continue;
      i += 1;
      let depth = 1;
      let j = i;
      while (j < text.length && depth > 0) {
        if (text[j] === '(') depth += 1;
        else if (text[j] === ')') {
          depth -= 1;
          if (depth === 0) break;
        }
        j += 1;
      }
      out.push({
        token: m[1],
        fallback: text.slice(i, j).trim(),
        file,
        line: text.slice(0, m.index).split('\n').length,
      });
    }
  }
  return out;
}

/**
 * Resolve a token to its own stack, following aliases through `resolveToken`.
 * `null` when it cannot be resolved — an alias out of the set, or a cycle.
 *
 * @param {string} name
 * @param {Map<string, {value: string}>} tokens
 * @returns {string[]|null}
 */
export function resolve(name, tokens) {
  const values = new Map([...tokens].map(([n, entry]) => [n, entry.value]));
  const literal = resolveToken(name, values);
  return literal === undefined ? null : stack(literal);
}

const wantsMono = (name) => /(^|-)(code|mono|monospace)(-|$)/.test(name);

/**
 * @returns {string[]} One line per problem; empty when every stack is sound.
 */
export function failures(files) {
  const found = [];
  const tokens = familyTokens(files);

  // 1 + 2. The declarations themselves.
  for (const [name, entry] of tokens) {
    const resolved = resolve(name, tokens);
    if (!resolved) {
      found.push(
        `${entry.file}:${entry.line} — ${name} aliases something outside the family token set.`,
      );
      continue;
    }
    const last = resolved[resolved.length - 1];
    if (!GENERICS.has(last)) {
      found.push(
        `${entry.file}:${entry.line} — ${name} ends in "${last}", not a CSS generic. If the ` +
          `face fails to load the browser picks its own default, not one anybody chose.`,
      );
    } else if (wantsMono(name) && last !== 'monospace') {
      found.push(
        `${entry.file}:${entry.line} — ${name} is a monospace token and falls back to ` +
          `"${last}". Measured in #267: that stack resolved 171.13px where monospace is ` +
          `480.08px — not a different mono face, not monospaced at all.`,
      );
    }
  }

  // 3. The inline fallbacks.
  for (const use of familyFallbacks(files)) {
    const where = `${use.file}:${use.line} — var(${use.token}, …)`;
    // An alias to another family token is a fallback that cannot disagree.
    if (new RegExp(`^${varReferencePattern('--font-family-').source}\\s*\\)?$`).test(use.fallback)) {
      continue;
    }

    const given = stack(use.fallback);
    const last = given[given.length - 1];
    if (!GENERICS.has(last)) {
      found.push(
        `${where}: the fallback ends in "${last}", not a CSS generic. A fallback only paints ` +
          `when the token fails, which is exactly when there is nothing else to catch it.`,
      );
      continue;
    }
    if (wantsMono(use.token) && last !== 'monospace') {
      found.push(`${where}: a monospace token whose fallback ends in "${last}".`);
      continue;
    }

    const real = resolve(use.token, tokens);
    if (!real) continue;
    const wanted = real[0];
    const got = given[0];
    // A stack of nothing but a generic is a deliberate minimum, not a claim
    // about which face to use.
    if (GENERICS.has(got)) continue;
    if (wanted && got.toLowerCase() !== wanted.toLowerCase()) {
      found.push(
        `${where}: the fallback names "${got}" where the token is "${wanted}". A fallback that ` +
          `picks a DIFFERENT face is a second decision, not a safety net.`,
      );
    }
  }

  return found;
}
