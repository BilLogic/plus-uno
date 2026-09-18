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
 * ─── WHERE THE GRAMMAR AND THE MATHS COME FROM ──────────────────────────────
 * `design-system/src/lib/tokens.mjs` (#506), not from this file (#507): the
 * token grammar, colour parsing and alias resolution are the module's. THE
 * RECORD IS `scripts/lib/ratchet.mjs`'s, entire: #599 moved the classification
 * there — a baseline record is a harness concern rather than a colour one — and
 * #600 moved the read, the stale sweep and the absent-record error mode with
 * it, so this file no longer knows a baseline exists. What is left here is what
 * is about FALLBACKS — capturing the literal beside a token, comparing two
 * values of a FAMILY, and the wording of the two reports.
 */

import {
  parseColour,
  resolveToken,
  toHex,
  tokenDeclarationPattern,
  varReferencePattern,
} from '../design-system/src/lib/tokens.mjs';

/**
 * `#abc`, `#aabbcc` and `rgb(a, b, c)` all normalise to `#aabbcc`.
 *
 * The parsing and the hex are the module's (#507) — this file used to spell
 * both. Out of range is still not a colour: `parseColour` returns null for
 * `rgb(300, 0, 0)` rather than clamping, which is what keeps a typo from
 * reporting agreement with something nobody wrote.
 *
 * The module's parser is slightly STRICTER than the one it replaces: it wants
 * the whole value to be the colour, where this matched an `rgb(` prefix and
 * ignored the tail. Measured over the token sources and every captured
 * fallback literal, nothing in the tree is in the gap — a fallback literal is
 * captured up to the first comma, so an `rgba()` fallback never reaches here at
 * all, and no token value carries trailing content after its `rgb()`.
 */
export function normaliseColour(value) {
  const colour = parseColour(value);
  return colour ? toHex(colour) : null;
}

/**
 * `12px`, `0.75rem` and `120%` normalise to a comparable string.
 *
 * `rem` is 16px and only 16px, the same assumption `check:docs-token-literals`
 * makes and for the same reason: nothing here renders anything, and a repo that
 * changed its root font size would have to revisit both.
 *
 * A PERCENTAGE IS NOT CONVERTED TO PX, and that is the point rather than a
 * shortcut. `--size-element-radius-full` is `999px` and falls back to `50%`
 * eleven times; on a non-square box those are visibly different shapes, so they
 * must compare unequal. Keeping the unit in the key is what makes them so.
 *
 * `0` is accepted in any unit and normalises to `0px`, because zero is zero.
 */
export function normaliseDimension(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  const m = /^(-?\d*\.?\d+)(px|rem|em|%)?$/.exec(v);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  // A bare number is only a length when it is zero: `line-height: 1.5` is a
  // ratio, and calling it `1.5px` would invent a disagreement with every
  // line-height token in the system.
  if (!m[2]) return n === 0 ? '0px' : null;
  if (m[2] === '%') return `${n}%`;
  // `em` is relative to the element's own font size, which this cannot know.
  // It is not comparable, and guessing 16px would report agreement with a
  // number nobody wrote.
  if (m[2] === 'em') return null;
  return `${m[2] === 'rem' ? n * 16 : n}px`;
}

/**
 * Token definitions from the token sources.
 *
 * Later definitions win, which is how the cascade reads them, and is why the
 * light-mode value is what a bare `:root` definition means here. That is the
 * one reason this is not the module's `readTokens`, which takes the FIRST
 * definition because it reads a single stylesheet; the grammar is the module's
 * either way (#507).
 *
 * The pattern this replaced was anchored to the start of a line. Dropping the
 * anchor is measured rather than assumed: over `design-system/src/tokens`, both
 * spellings find the same 518 declarations, because every token in those files
 * is written one per line.
 *
 * @param {{path: string, text: string}[]} files
 * @param {{prefix?: string}} [options] e.g. `--color-`; defaults to every token
 * @returns {Map<string, string>} name -> raw value
 */
export function tokenDefinitions(files, { prefix = '--color-' } = {}) {
  const tokens = new Map();
  for (const { text } of files) {
    for (const m of text.matchAll(tokenDeclarationPattern(prefix))) {
      tokens.set(m[1], m[2].trim());
    }
  }
  return tokens;
}

/**
 * Follow `var(--other)` aliases to the value at the end of the chain.
 *
 * Returns a NEW map rather than mutating, so a caller can still see what each
 * token literally says. Cycle-safe: a token that eventually refers to itself
 * keeps its raw value and is therefore incomparable, which is the honest answer
 * — a cycle has no value.
 *
 * The walk itself is the module's `resolveToken` (#507), including its cycle
 * guard; what stays here is the `?? raw` — the module answers `undefined` for a
 * cycle or a dead end, and this map's contract is that every token keeps a
 * value.
 *
 * One behaviour the module adds: it follows `var(--b, fallback)` through to
 * `--b`, where the pattern here followed only a bare `var(--b)`. No token in
 * `design-system/src/tokens` is declared as an aliased `var()` WITH a fallback,
 * so nothing in the tree is in the gap.
 *
 * @param {Map<string,string>} tokens
 */
export function resolveAliases(tokens) {
  const resolved = new Map();
  for (const [name, raw] of tokens) {
    resolved.set(name, resolveToken(name, tokens) ?? raw);
  }
  return resolved;
}

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
export function fallbackAudit({ tokens, usages, normalise = normaliseColour, reportUndefined = true }) {
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
