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
 */

/** `#abc`, `#aabbcc` and `rgb(a, b, c)` all normalise to `#aabbcc`. */
export function normaliseColour(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
  if (hex) {
    const h = hex[1];
    return `#${h.length === 3 ? [...h].map((c) => c + c).join('') : h}`;
  }
  const rgb = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/.exec(v);
  if (rgb) {
    const channels = [1, 2, 3].map((i) => Number(rgb[i]));
    // Out of range is not a colour. Clamping or truncating would turn a typo
    // into a plausible value and report agreement with something nobody wrote —
    // this returned `#0000` for `rgb(300, 0, 0)` until a test asked.
    if (channels.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    return `#${channels.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }
  return null;
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
 * light-mode value is what a bare `:root` definition means here.
 *
 * @param {{path: string, text: string}[]} files
 * @returns {Map<string, string>} name -> raw value
 */
export function tokenDefinitions(files, { names = /--color-[a-z0-9-]+/ } = {}) {
  const tokens = new Map();
  const declaration = new RegExp(`^\\s*(${names.source})\\s*:\\s*([^;]+);`, 'gm');
  for (const { text } of files) {
    for (const m of text.matchAll(declaration)) {
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
 * @param {Map<string,string>} tokens
 */
export function resolveAliases(tokens) {
  const resolved = new Map();
  const terminal = (name, seen) => {
    if (seen.has(name)) return null;
    seen.add(name);
    const value = tokens.get(name);
    if (value === undefined) return null;
    const alias = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value.trim());
    if (!alias) return value;
    return terminal(alias[1], seen);
  };
  for (const [name, raw] of tokens) {
    resolved.set(name, terminal(name, new Set()) ?? raw);
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
 * @param {{path: string, text: string}[]} files
 */
export function fallbackUsages(files, { names = /--color-[a-z0-9-]+/ } = {}) {
  const uses = [];
  const call = new RegExp(`var\\(\\s*(${names.source})\\s*(?:,\\s*([^),]+))?\\)`, 'g');
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
 * The ratchet.
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
 * @param {{disagreements: string[], undefinedTokens: string[]}|null} baseline
 */
export function fallbackFailures(audit, baseline, { noun = 'colour' } = {}) {
  const failures = [];

  if (!baseline) {
    failures.push(
      'no baseline is recorded, so this check has nothing to hold to. Run it once with ' +
        '--update and commit the result.',
    );
    return failures;
  }

  const knownUndefined = new Set(baseline.undefinedTokens ?? []);
  const newUndefined = audit.undefinedTokens.filter((u) => !knownUndefined.has(u.token));
  if (newUndefined.length) {
    failures.push(
      `${newUndefined.length} new ${noun} token(s) referenced and never defined:\n` +
        newUndefined.map((u) => `       ${u.token}  (${u.count} use(s))`).join('\n') +
        `\n     For these the fallback IS the ${noun} and the token is fiction — changing the\n` +
        '     token changes nothing. Define it, or fix the name.',
    );
  }

  const recorded = new Set(baseline.disagreements ?? []);
  const added = audit.disagreements.filter((d) => !recorded.has(d.key));
  if (added.length) {
    const seen = new Set();
    const lines = [];
    for (const d of added) {
      if (seen.has(d.key)) continue;
      seen.add(d.key);
      lines.push(`       ${d.token}  is ${d.expected}, fallback says ${d.found}  (${d.where})`);
    }
    failures.push(
      `${seen.size} new fallback(s) that disagree with their token:\n${lines.join('\n')}\n` +
        '     A fallback only paints when the token fails to load, so a wrong one is wrong\n' +
        '     everywhere at once and invisible until then. Make it equal the token.',
    );
  }

  return failures;
}

/** Recorded entries that are no longer true — a baseline must be able to shrink. */
export function staleEntries(audit, baseline) {
  if (!baseline) return [];
  const live = new Set(audit.disagreements.map((d) => d.key));
  const liveUndefined = new Set(audit.undefinedTokens.map((u) => u.token));
  return [
    ...(baseline.disagreements ?? []).filter((key) => !live.has(key)),
    ...(baseline.undefinedTokens ?? []).filter((t) => !liveUndefined.has(t)).map((t) => `${t} (now defined)`),
  ];
}
