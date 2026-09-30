/**
 * Block annotations for the contrast checks — `@grounds` and `@contrast` — and
 * the ground a declaration sits on, read STRUCTURALLY: the stylesheet is parsed
 * with postcss + postcss-scss and selectors with postcss-selector-parser, so
 * every rule below is about nodes, not about text that happens to look right.
 *
 * WHY. `check:focus-ring` and `check:text-contrast` measure a color against the
 * ground it sits on, and fall back to the page. A component built for a ground
 * its CALLER paints — `CloseButton tone="inverse"` on an intent fill or a dark
 * surface — has no background of its own, so both checks measured its light
 * ring and light × against the light page and reported 1.00:1. The honest
 * answers were an exception that excused the rule, or this: the rule names the
 * grounds it is for, and each one is measured against the same bar.
 *
 * ─── THE ANNOTATIONS ────────────────────────────────────────────────────────
 *
 *   `@grounds: --color-x --color-y`  the grounds this rule and everything nested
 *                                    in it sit on.
 *   `@contrast: non-text`            this rule's own colors are a graphic (an
 *                                    icon glyph), held to WCAG 1.4.11's 3:1
 *                                    instead of text's 4.5:1.
 *
 * An annotation is a comment node at the START of a rule — nothing but other
 * comments before it — and it belongs to that rule. Anywhere else (after a
 * declaration or a nested rule, at the top level, inside an at-rule) it is an
 * error: "must open its block". A second annotation of the same kind in one
 * rule is an error too. Either comment form works; a block comment may span
 * lines.
 *
 * ─── SEMANTICS ──────────────────────────────────────────────────────────────
 *
 *  1. GROUND RESOLUTION. For a measured declaration, walk from its own rule
 *     outward through its ancestors. The FIRST rule that has either a
 *     background declaration naming a `--color-*` token or a `@grounds`
 *     annotation decides: its background, or its declared grounds (each
 *     measured). A rule with both is decided by its background — that is the
 *     paint directly beneath. If no rule decides, the ground is the page. So a
 *     nearer background beats a farther `@grounds`, and a nearer `@grounds`
 *     beats a farther background.
 *
 *  2. `@grounds` SCOPE. It covers the rule it opens and everything nested in
 *     it, up to the first nearer rule that decides for itself. That is the
 *     intent — children of a block on primary are on primary:
 *
 *         .zz {
 *             // @grounds: --color-primary
 *             .a { color: var(--color-surface); }   // measured on primary
 *             .b { color: var(--color-surface); }   // measured on primary
 *         }
 *
 *  3. `@contrast: non-text` applies ONLY to declarations directly in the rule it
 *     opens; it never reaches a nested rule, so nested text cannot inherit a
 *     graphic's bar. It is valid only if EVERY selector in the rule's resolved
 *     list (SCSS nesting resolved, `&` expanded) has an icon SUBJECT: the last
 *     compound, after any combinator, contains one of the glyph selectors the
 *     `icon-glyph` mixin lists (`design-system/src/styles/_icon-glyph.scss`,
 *     which says why those and no others). Anything inside `:not()` or another
 *     functional pseudo-class is ignored when deciding. Otherwise it is an
 *     error and the declarations keep the text bar.
 *
 *  4. `@include icon-glyph { … }` is read as the rule it compiles to: a rule
 *     whose selectors are that mixin's list, nested where the include is. So
 *     an annotation opening the include's block opens that rule, and the
 *     stylesheet and this reader share one definition of an icon.
 *
 * WHAT IT REFUSES, each as an error rather than a silent pass: an annotation
 * that does not open its rule, a second one of a kind in a rule, an empty
 * `@grounds`, a ground token the token files do not define or cannot resolve to
 * a color, an `@contrast` value other than `non-text`, and `@contrast:
 * non-text` without an icon subject. A declared ground is a promise about
 * where the component is used — its docs have to say the same thing, which no
 * check can read.
 */
import fs from 'node:fs';
import path from 'node:path';

import postcss from 'postcss';
import postcssScss from 'postcss-scss';
import selectorParser from 'postcss-selector-parser';

import { parseColour, resolveToken } from '../../design-system/src/lib/tokens.mjs';
import { REPO_ROOT } from './corpus.mjs';

/**
 * WCAG 1.4.11's bar for a graphic: a focus indicator (`check:focus-ring`) and
 * an icon glyph under `@contrast: non-text` (`check:text-contrast`) both need
 * 3:1. One constant, so the two checks cannot hold them to different bars.
 */
export const NON_TEXT = 3;

const KINDS = ['grounds', 'contrast'];
const ANNOTATION = /^@([a-z-]+)\s*:([\s\S]*)$/;
const BACKGROUND = /^background(-color)?$/;
const COLOR_TOKEN = /var\(\s*(--color-[a-z0-9-]+)/;

/** The partial that defines an icon glyph, and the mixin in it. */
export const GLYPH_PARTIAL = 'design-system/src/styles/_icon-glyph.scss';
const GLYPH_MIXIN = 'icon-glyph';

/**
 * The glyph selectors the `icon-glyph` mixin lists. Its body must be one rule
 * holding `@content`, and each selector a single class or type, because that
 * is all `hasIconSubject` can match; anything else throws rather than reading
 * as an empty list, which would refuse every icon.
 *
 * @param {string} source  the partial's text
 */
export function glyphSelectors(source) {
  let mixin = null;
  postcssScss.parse(source).walkAtRules('mixin', (at) => {
    if (at.params.replace(/\(\s*\)$/, '').trim() === GLYPH_MIXIN) mixin = at;
  });
  if (!mixin) throw new Error(`${GLYPH_PARTIAL} defines no @mixin ${GLYPH_MIXIN}`);
  const body = (mixin.nodes ?? []).filter((node) => node.type !== 'comment');
  const [rule] = body;
  const holdsContent = rule?.type === 'rule'
    && rule.nodes.some((node) => node.type === 'atrule' && node.name === 'content');
  if (body.length !== 1 || !holdsContent) {
    throw new Error(`@mixin ${GLYPH_MIXIN} must be one rule holding @content`);
  }
  for (const selector of rule.selectors) {
    if (!/^(\.[a-z][a-z0-9-]*|[a-z]+)$/.test(selector)) {
      throw new Error(`@mixin ${GLYPH_MIXIN}: \`${selector}\` is not a single class or type`);
    }
  }
  return rule.selectors;
}

/** The glyph selectors, read once from the partial. */
export const GLYPH_SELECTORS = glyphSelectors(fs.readFileSync(path.join(REPO_ROOT, GLYPH_PARTIAL), 'utf8'));
const GLYPH_CLASSES = new Set(GLYPH_SELECTORS.filter((s) => s.startsWith('.')).map((s) => s.slice(1)));
const GLYPH_TYPES = new Set(GLYPH_SELECTORS.filter((s) => !s.startsWith('.')));

/** `@include icon-glyph`, bare or through a `@use` namespace, with or without `()`. */
const GLYPH_INCLUDE = new RegExp(`^(?:[\\w-]+\\.)?${GLYPH_MIXIN}\\s*(?:\\(\\s*\\))?$`);

/**
 * Semantics 4: each `@include icon-glyph { … }` becomes the rule it compiles
 * to, in place, keeping its source range so `ruleAt` finds it. Returns the
 * rules made, so a caller can tell them from hand-written ones.
 */
function expandGlyphIncludes(root) {
  const includes = [];
  root.walkAtRules('include', (at) => {
    if (at.nodes && GLYPH_INCLUDE.test(at.params.trim())) includes.push(at);
  });
  const made = new Set();
  for (const at of includes) {
    const rule = postcss.rule({ selector: GLYPH_SELECTORS.join(', '), source: at.source });
    rule.append([...at.nodes]);
    at.replaceWith(rule);
    made.add(rule);
  }
  return made;
}

/** A comment's text as one line: block-comment `*` gutters stripped. */
function commentBody(comment) {
  return comment.text.split('\n').map((line) => line.replace(/^\s*\*\s?/, '')).join(' ').trim();
}

/**
 * Parse a stylesheet once: the tree (with `@include icon-glyph` blocks read as
 * rules), each rule's annotations, the placement errors, and the rules made
 * from glyph includes.
 *
 * @param {string} source
 */
export function analyzeSheet(source) {
  const root = postcssScss.parse(source);
  const glyphRules = expandGlyphIncludes(root);
  /** @type {Map<import('postcss').Rule, {grounds?: object, contrast?: object}>} */
  const annotations = new Map();
  const errors = [];

  root.walkComments((comment) => {
    const match = ANNOTATION.exec(commentBody(comment));
    if (!match || !KINDS.includes(match[1])) return;
    const [, kind, raw] = match;
    const line = comment.source.start.line;
    const parent = comment.parent;
    const siblings = parent.nodes ?? [];
    const opens = parent.type === 'rule'
      && siblings.slice(0, siblings.indexOf(comment)).every((node) => node.type === 'comment');
    if (!opens) {
      errors.push({ line, message: `@${kind} must open its block` });
      return;
    }
    const own = annotations.get(parent) ?? {};
    if (own[kind]) {
      errors.push({ line, message: `a second @${kind} in one block (the first is on line ${own[kind].line})` });
      return;
    }
    own[kind] = kind === 'grounds'
      ? { tokens: raw.trim().split(/[\s,]+/).filter(Boolean), line }
      : { value: raw.trim(), line, rule: parent };
    annotations.set(parent, own);
  });

  return { root, annotations, errors, glyphRules };
}

/** The innermost rule whose source range contains `offset`, or null. */
export function ruleAt(sheet, offset) {
  let found = null;
  sheet.root.walkRules((rule) => {
    const start = rule.source?.start?.offset;
    const end = rule.source?.end?.offset;
    if (start === undefined || end === undefined) return;
    if (start <= offset && offset <= end) {
      if (!found || start >= found.source.start.offset) found = rule;
    }
  });
  return found;
}

/** The `--color-*` token a rule's own background declaration names, or null. */
function ownBackground(rule) {
  for (const node of rule.nodes ?? []) {
    if (node.type !== 'decl' || !BACKGROUND.test(node.prop)) continue;
    const token = COLOR_TOKEN.exec(node.value);
    if (token) return token[1];
  }
  return null;
}

/**
 * The ground for the declaration at `offset` (semantics 1 and 2).
 *
 * `own` says whether a background came from the declaration's own rule or
 * from an ancestor, so a report can say where its ground was found.
 *
 * @returns {{ kind: 'background', token: string, line: number, own: boolean }
 *   | { kind: 'grounds', tokens: string[], line: number }
 *   | { kind: 'page' }}
 */
export function groundAt(sheet, offset) {
  const start = ruleAt(sheet, offset);
  for (let node = start; node; node = node.parent) {
    if (node.type !== 'rule') continue;
    const background = ownBackground(node);
    if (background) return { kind: 'background', token: background, line: node.source.start.line, own: node === start };
    const declared = sheet.annotations.get(node)?.grounds;
    if (declared) return { kind: 'grounds', tokens: declared.tokens, line: declared.line };
  }
  return { kind: 'page' };
}

/** The selectors of `rule` with SCSS nesting resolved and `&` expanded. */
export function resolvedSelectors(rule) {
  let parent = rule.parent;
  while (parent && parent.type !== 'rule' && parent.type !== 'root') parent = parent.parent;
  const own = rule.selectors ?? [rule.selector];
  if (!parent || parent.type !== 'rule') return own;
  const outer = resolvedSelectors(parent);
  return outer.flatMap((p) => own.map((s) => expandParent(s, p) ?? `${p} ${s}`));
}

/**
 * `selector` with every `&` outside a quoted string replaced by `parent`, or
 * null when it has none (the rule then nests as a descendant). Three traps it
 * avoids: an `&` inside an attribute value such as `[data-label="a & b"]` is
 * text, not the parent; so is an escaped `\&`, which is part of a name; and
 * the parent is inserted as written, never through a `String.replace`
 * replacement string, where `$&`, `$'` and `` $` `` are patterns.
 */
function expandParent(selector, parent) {
  let out = '';
  let quote = null;
  let found = false;
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i];
    if (quote) {
      out += ch;
      if (ch === '\\' && i + 1 < selector.length) out += selector[++i];
      else if (ch === quote) quote = null;
    } else if (ch === '\\') {
      // An escape: the next character is literal, whatever it is.
      out += ch;
      if (i + 1 < selector.length) out += selector[++i];
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
    } else if (ch === '&') {
      found = true;
      out += parent;
    } else {
      out += ch;
    }
  }
  return found ? out : null;
}


/** Does this one selector's subject — its last compound — name an icon glyph? */
export function hasIconSubject(selector) {
  let answer = false;
  selectorParser((selectors) => {
    const first = selectors.first;
    if (!first) return;
    const nodes = first.nodes;
    let start = 0;
    nodes.forEach((node, index) => { if (node.type === 'combinator') start = index + 1; });
    // Only the subject compound's own nodes: classes, tags and pseudos at top
    // level. The contents of `:not()` and friends are never walked.
    answer = nodes.slice(start).some((node) => (node.type === 'class' && GLYPH_CLASSES.has(node.value))
      || (node.type === 'tag' && GLYPH_TYPES.has(node.value.toLowerCase())));
  }).processSync(selector);
  return answer;
}

/**
 * The `@contrast` annotation on the declaration's OWN rule (semantics 3), or
 * null. Never inherited from an ancestor.
 */
export function contrastAt(sheet, offset) {
  const rule = ruleAt(sheet, offset);
  return rule ? sheet.annotations.get(rule)?.contrast ?? null : null;
}

/** Why a `@contrast` annotation is not allowed, or `[]`. */
export function contrastErrors(declared) {
  if (declared.value !== 'non-text') return [`@contrast: \`${declared.value}\` is not a known value (only \`non-text\`)`];
  const selectors = resolvedSelectors(declared.rule);
  const text = selectors.filter((s) => !hasIconSubject(s));
  if (text.length) return [`@contrast: non-text on a text selector \`${text.join(', ')}\``];
  return [];
}

/** Is the declaration at `offset` held to the non-text bar? Only when its own rule says so, validly. */
export function isNonText(sheet, offset) {
  const declared = contrastAt(sheet, offset);
  return Boolean(declared && !contrastErrors(declared).length);
}

/**
 * Why a `@grounds` declaration cannot be measured, or `[]` when it can. An
 * empty list and an unknown token are both errors: either would otherwise
 * measure nothing.
 *
 * @param {{ tokens: string[] }} declared
 * @param {Map<string, string>} values  token name → value, as the check reads them
 * @returns {string[]}
 */
export function groundErrors(declared, values) {
  const errors = [];
  if (!declared.tokens.length) errors.push('declares no grounds');
  for (const token of declared.tokens) {
    if (!/^--color-[a-z0-9-]+$/.test(token)) {
      errors.push(`\`${token}\` is not a --color-* token`);
    } else if (!parseColour(resolveToken(token, values) ?? '')) {
      errors.push(`\`${token}\` does not resolve to a color in the token files`);
    }
  }
  return errors;
}

/**
 * Every annotation error in one stylesheet, as `file:line — message`: placement
 * errors, `@grounds` lists checked against `values`, and (when asked)
 * `@contrast` values and selectors. Swept over the whole file.
 */
export function annotationErrors(file, source, values, { contrast = false, sheet = analyzeSheet(source) } = {}) {
  const out = sheet.errors.map((e) => `${file}:${e.line} — ${e.message}.`);
  for (const own of sheet.annotations.values()) {
    if (own.grounds) out.push(...groundErrors(own.grounds, values).map((m) => `${file}:${own.grounds.line} — \`@grounds\` ${m}.`));
    if (contrast && own.contrast) out.push(...contrastErrors(own.contrast).map((m) => `${file}:${own.contrast.line} — ${m}.`));
  }
  return out;
}

/**
 * Annotation errors across the stylesheets, as `file:line — reason`, swept over
 * every file that mentions an annotation, not just the rules a check measures,
 * so a misplaced one is found wherever it is: an annotation that does not open
 * its block, a second one of a kind in a block, an empty or unknown `@grounds`,
 * and, with `contrast`, a `@contrast` that is not `non-text` or sits on a
 * selector that is not an icon. Each is a failure of its own, because a
 * declaration that measures nothing would otherwise read as green.
 *
 * `check:focus-ring` reads only `@grounds`; `check:text-contrast` reads both,
 * so it passes `{ contrast: true }`.
 */
export function declarationErrors(files, root = REPO_ROOT, values, { contrast = false } = {}) {
  return files.flatMap((file) => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    return /@(grounds|contrast)\b/.test(source) ? annotationErrors(file, source, values, { contrast }) : [];
  });
}

/**
 * The `@grounds` list on the rule whose selector is exactly `selector`, for the
 * drift guard that holds an exported list to the stylesheet.
 */
export function groundsOfSelector(source, selector) {
  const sheet = analyzeSheet(source);
  for (const [rule, own] of sheet.annotations) {
    if (rule.selector === selector && own.grounds) return own.grounds.tokens;
  }
  return null;
}
