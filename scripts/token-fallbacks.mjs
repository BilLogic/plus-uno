/**
 * What a colour token says, and what the literal beside it says (#268).
 *
 * `var(--color-on-surface-variant, #5c5c5c)` reads as one decision. It is two,
 * and in this repository they disagree 191 times out of 473 comparable uses —
 * that token resolves to `#3f484a` and carries TEN different fallbacks across
 * its uses, not one of which is the token. `--color-primary` is `#0472a8` and
 * falls back in one place to `#6750a4`, which is Material's default purple and
 * appears nowhere else in this system.
 *
 * A wrong emergency colour is invisible until the token fails to load, and then
 * it is wrong everywhere at once — and, as that spread shows, wrong DIFFERENTLY
 * in each place. The tokens really can fail to load: the Storybook docs iframe
 * and six prototype pages carry no token sheet, which is why the answer is "the
 * fallback must equal the token" rather than "there should be no fallbacks".
 *
 * THREE DEFECTS, NOT ONE, and they need different treatment:
 *
 *   1. a literal that disagrees with its token   — 191, ratcheted
 *   2. a `var(--color-*)` for a token that is
 *      never defined anywhere                    —  31, must be zero
 *   3. a light-mode literal inside a dark rule    — can only ever paint wrong
 *
 * ALL THREE ARE RATCHETED, and (2) only after measuring. The spec for #268 said
 * undefined tokens should fail outright rather than ratchet, on the grounds that
 * they are cheap to triage — a name is either a typo or a token somebody meant to
 * add. That turned out to be wrong about this corpus. There are 27, and they are
 * not aliases waiting for a definition: `--color-border` is used with three
 * different fallbacks (`#e5e7eb`, `#c4c7c5`, and a nested
 * `var(--color-outline-variant)`), so defining it means DECIDING a value, not
 * recording one. A check that cannot pass until someone makes 27 colour
 * decisions is a check that ships red and gets switched off.
 *
 * They are kept in their own section of the baseline rather than merged with the
 * disagreements, because they are a different defect with a different endpoint:
 * the disagreements shrink as files are touched, and this list should be driven
 * to zero deliberately.
 *
 * ─── WHY THIS FILE IS NOT CALLED `colour-fallbacks` ─────────────────────────
 * Because the defect is not about colour. #268 asks for "a fallback that
 * disagrees with its token", unqualified, and the colour half turned out to be
 * the SMALLER half. The same measurement over dimension tokens finds 546
 * disagreements inside `design-system/src` alone, against 191 for colour, and
 * they are worse: `var(--size-section-gap-sm, 16px)` appears 61 times and that
 * token is `8px`. A wrong emergency colour is wrong; a gap that doubles when
 * the token sheet is late is a different layout.
 *
 * So the machinery below is parameterised by FAMILY — which tokens it looks at,
 * and how two values of that kind are compared — and the two families differ in
 * exactly three ways, each of which is a fact about the corpus rather than a
 * preference:
 *
 *   which tokens      colour matches `--color-*` by name. Dimensions have no
 *                     single prefix (`--size-*`, `--spacing-*`, `--font-size-*`,
 *                     `--font-line-height-*` and more), so that family is
 *                     defined by VALUE: a token counts if its resolved value is
 *                     a length. Nothing has to be added here when a new
 *                     dimension family is minted.
 *
 *   undefined names   reported for colour, ignored for dimensions. `--color-border`
 *                     with no definition is a real defect: the fallback IS the
 *                     colour. `var(--table-cell-x, 10px)` is not — it is a
 *                     component-local custom property, defined in the component's
 *                     own stylesheet, and the fallback is its documented default.
 *                     Reporting those would bury the finding in 324 non-findings.
 *
 *   aliases           resolved for both, and it is only load-bearing for
 *                     dimensions: 11 of 195 colour tokens are `var()` aliases
 *                     against 124 of 207 dimension tokens. Without resolution
 *                     most of the semantic size names are simply incomparable
 *                     and the check silently sees a fraction of its corpus.
 *                     Colour's recorded set is unchanged by it — measured, not
 *                     assumed; the test below pins that.
 *
 * ─── WHERE THE GRAMMAR, THE MATHS AND THE CORPUS COME FROM ──────────────────
 * `design-system/src/lib/tokens.mjs` (#506), not from this file (#507): the
 * token grammar and colour parsing are the module's. THE RECORD IS
 * `scripts/lib/ratchet.mjs`'s, entire: #599 moved the classification there — a
 * baseline record is a harness concern rather than a colour one — and #600
 * moved the read, the stale sweep and the absent-record error mode with it, so
 * this file no longer knows a baseline exists.
 *
 * THE CORPUS AND THE EQUALITY ANSWER ARE `tokens-node.mjs`'s (#620), since
 * #621. This file used to carry `tokenDefinitions` and `resolveAliases` — a
 * second walk of the token sources — and `normaliseColour` and
 * `normaliseDimension`, one of the two colour keys and two dimension
 * normalisers #620 exists to collapse. `tokenCorpus` is the walk;
 * `colourKey` and `dimensionKey` are the keys. What is left here is what is
 * about FALLBACKS — capturing the literal beside a token, auditing a FAMILY's
 * uses against their tokens, and the wording of the two reports.
 *
 * THE NEW KEY IS FINER THAN THE ONE IT REPLACES, and the migration was measured
 * rather than assumed. `colourKey` keeps alpha where `normaliseColour`
 * (`parseColour` then `toHex`) dropped it, which over the live corpus is 315
 * token pairs called equal before and unequal after. None of them reaches a
 * comparison here, and the reason is `fallbackUsages` below rather than
 * anything about the key: the fallback literal is captured with `[^),]+`, which
 * admits neither a comma nor a `)`, and the pattern then demands the `var()`'s
 * own `)`. A whole `rgba()` fallback satisfies neither, so the 25 sites writing
 * `var(--color-x, rgba(…))` are not matched at all — not captured, not counted
 * incomparable, simply not seen. Of the 476 comparable colour comparisons that
 * are left in this tree, zero carry alpha on either side.
 * `design-system/tests/tokens-node.test.js` pins that mechanism, so a check
 * that one day widens the capture is told what it has changed.
 */

import { colourKey } from '../design-system/src/lib/tokens-node.mjs';
import { varReferencePattern } from '../design-system/src/lib/tokens.mjs';

/**
 * Every `var(--color-*, …)` in the given files, with the file and line.
 *
 * A nested `var()` fallback is captured with `literal: null` rather than
 * skipped: it is not comparable, but a check that silently dropped it would be
 * unable to say how much of the corpus it actually looked at.
 *
 * The `var(--name` half is the module's `varReferencePattern` (#507); the tail
 * that captures the fallback literal is this check's, because the module
 * deliberately stops at the name.
 *
 * @param {{path: string, text: string}[]} files
 * @param {{prefix?: string}} [options]
 */
export function fallbackUsages(files, { prefix = '--color-' } = {}) {
  const uses = [];
  const call = new RegExp(`${varReferencePattern(prefix).source}\\s*(?:,\\s*([^),]+))?\\)`, 'g');
  for (const { path, text } of files) {
    text.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(call)) {
        uses.push({ path, line: i + 1, token: m[1], literal: m[2] ? m[2].trim() : null });
      }
    });
  }
  return uses;
}

/**
 * @typedef {{path: string, line: number, token: string, literal: string|null}} Usage
 *
 * @param {{tokens: Map<string,string>, usages: Usage[]}} o
 */
export function fallbackAudit({ tokens, usages, normalise = colourKey, reportUndefined = true }) {
  const disagreements = [];
  const undefinedTokens = new Map();
  let comparable = 0;
  let agreeing = 0;
  let incomparable = 0;

  for (const use of usages) {
    if (!tokens.has(use.token)) {
      // For the dimension family this is the overwhelmingly common case and it
      // is not a defect: a component-local custom property with a documented
      // default. See the family note at the top of the file.
      if (reportUndefined) undefinedTokens.set(use.token, (undefinedTokens.get(use.token) ?? 0) + 1);
      continue;
    }
    if (use.literal === null) continue;
    const tokenValue = normalise(tokens.get(use.token));
    const literal = normalise(use.literal);
    // Either side may be a nested `var()` or a keyword. Counted, so the check
    // can say what share of the corpus it was actually able to compare.
    if (tokenValue === null || literal === null) {
      incomparable += 1;
      continue;
    }
    comparable += 1;
    if (tokenValue === literal) {
      agreeing += 1;
      continue;
    }
    disagreements.push({
      key: `${use.token} ${literal}`,
      token: use.token,
      expected: tokenValue,
      found: literal,
      where: `${use.path}:${use.line}`,
    });
  }

  return {
    comparable,
    agreeing,
    incomparable,
    disagreements,
    undefinedTokens: [...undefinedTokens.entries()]
      .map(([token, count]) => ({ token, count }))
      .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token)),
  };
}

/**
 * The audit in the SHAPE ITS RECORD IS WRITTEN IN — two arrays of keys, in the
 * order the audit found them, because both reports render in that order. That
 * is the whole of what the ratchet is handed: the colour record holds two
 * `keys` sets and the dimension record one, and a check on
 * `scripts/lib/ratchet.mjs` measures its side on the form its record declares
 * (#600).
 *
 * `disagreements` is keyed on `token + literal`, so several uses of the same
 * wrong pair collapse to one entry — which is what the old `seen` set did while
 * it walked the list, and what makes the count a count of DECISIONS. The
 * per-key `detail` and `uses` maps come back with them because the WORDING of a
 * finding needs the place and the number, and neither is in the record.
 */
export function fallbackSides(audit) {
  const disagreements = new Map();
  const detail = new Map();
  for (const d of audit.disagreements) {
    disagreements.set(d.key, (disagreements.get(d.key) ?? 0) + 1);
    if (!detail.has(d.key)) detail.set(d.key, d);
  }
  const uses = new Map(audit.undefinedTokens.map((u) => [u.token, u.count]));
  return {
    disagreements: [...disagreements.keys()],
    undefinedTokens: [...uses.keys()],
    detail,
    uses,
  };
}

/**
 * The WORDING of the two ratchet failures — everything about them except which
 * keys are NEW, which is `scripts/lib/ratchet.mjs`'s to decide (#600).
 *
 * WHY IT TAKES KEYS AND NOT A RECORD. Until #600 this function read the
 * baseline object itself and classified against it, which made the direction
 * that fails, the stale sweep and the absent-record error mode this file's
 * business as well as eleven other checks' — each spelling all three
 * differently. The ratchet module owns them now. What could never move is what a
 * finding SAYS, because the two reports have to stay byte-identical across the
 * migration, and saying it needs the place and the use count, neither of which
 * the record holds.
 *
 * 191 disagreements across 30 tokens cannot be fixed in one commit and reviewed
 * honestly — several are load-bearing in prototypes no story renders. So the
 * recorded set may shrink and never grow, which is the shape of the a11y
 * baseline, `check:negation` and `CDN_BASELINE`.
 *
 * KEYED ON `token + literal`, NOT ON FILE AND LINE. A line number changes when
 * someone adds an import above it, and a baseline that churns on every edit is
 * one people regenerate blindly. The pair is the actual decision; where it
 * appears is not.
 *
 * @param {ReturnType<typeof fallbackAudit>} audit
 * @param {{disagreements?: string[], undefinedTokens?: string[]}} fresh
 *        the keys the ratchet reported NEW, per set, in the order it found them.
 */
export function fallbackFailures(audit, fresh, { noun = 'colour' } = {}) {
  const failures = [];
  const found = fallbackSides(audit);
  const newUndefined = fresh.undefinedTokens ?? [];
  const added = fresh.disagreements ?? [];

  if (newUndefined.length) {
    failures.push(
      `${newUndefined.length} new ${noun} token(s) referenced and never defined:\n` +
        newUndefined.map((key) => `       ${key}  (${found.uses.get(key)} use(s))`).join('\n') +
        `\n     For these the fallback IS the ${noun} and the token is fiction — changing the\n` +
        '     token changes nothing. Define it, or fix the name.',
    );
  }

  if (added.length) {
    const lines = added.map((key) => {
      const d = found.detail.get(key);
      return `       ${d.token}  is ${d.expected}, fallback says ${d.found}  (${d.where})`;
    });
    failures.push(
      `${added.length} new fallback(s) that disagree with their token:\n${lines.join('\n')}\n` +
        '     A fallback only paints when the token fails to load, so a wrong one is wrong\n' +
        '     everywhere at once and invisible until then. Make it equal the token.',
    );
  }

  return failures;
}
