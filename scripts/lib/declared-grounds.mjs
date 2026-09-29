/**
 * Block annotations for the contrast checks: `@grounds` and `@contrast`.
 *
 * WHY. `check:focus-ring` and `check:text-contrast` read a ground from the
 * declaration's own rule, and fall back to the page. A component built for a
 * ground its CALLER paints — `CloseButton tone="inverse"` on an intent fill or
 * a dark surface — has no background in its own rule, so both checks measured
 * its light ring and light × against the light page and reported 1.00:1. The
 * honest answers were an exception that excused the rule, or this: the rule
 * names the grounds it is for, and each one is measured against the same bar
 * the page would be.
 *
 * THE TWO ANNOTATIONS.
 *
 *   `@grounds: --color-x --color-y`  the grounds the block's colors sit on.
 *   `@contrast: non-text`            the block's colors are a graphic (an icon
 *                                    glyph), held to WCAG 1.4.11's 3:1 instead
 *                                    of text's 4.5:1. Only on an icon selector.
 *
 *     .plus-close-btn--inverse {
 *         // @grounds: --color-inverse-surface --color-primary
 *         &:focus-visible::after { border-color: var(--color-focus-ring-inverse); }
 *         .plus-close-btn__icon.fa-solid {
 *             // @contrast: non-text
 *             color: var(--color-surface);
 *         }
 *     }
 *
 * PLACEMENT. An annotation must OPEN its block — only whitespace and other
 * comments may come before it — so it is unmistakably that block's own and not
 * a note about the next rule. It covers the block and everything nested in it;
 * the innermost annotation of a kind wins. Either comment form works, and a
 * `/* … *\/` may run over several lines.
 *
 * WHAT IT REFUSES, each as an error rather than a silent pass: an annotation
 * that does not open its block, a second annotation of the same kind in one
 * block, an empty `@grounds`, a ground token the token files do not define or
 * cannot resolve to a color, an `@contrast` value other than `non-text`, and
 * `@contrast: non-text` on a selector that is not an icon. A declared ground is
 * a promise about where the component is used — the component's docs have to
 * say the same thing, which no check can read.
 */
import { parseColour, resolveToken } from '../../design-system/src/lib/tokens.mjs';

/** The kinds this module reads, and nothing else — a typo like `@ground` is not one. */
const KINDS = ['grounds', 'contrast'];

/** A selector that names an icon: a Font Awesome class, a BEM `__icon` element, or `svg`. */
export const ICON_SELECTOR = /(\.fa-[a-z0-9-]+|\.fa\b|\.fas\b|\.far\b|__icon\b|(^|[\s>+~(,])svg\b)/;

/** Every `{ … }` block in a stylesheet: where it opens and closes, and its selector. */
function blocks(source) {
  const out = [];
  const stack = [];
  let comment = null;
  for (let i = 0; i < source.length; i += 1) {
    if (comment === 'line') { if (source[i] === '\n') comment = null; continue; }
    if (comment === 'block') { if (source[i] === '*' && source[i + 1] === '/') { comment = null; i += 1; } continue; }
    if (source[i] === '/' && source[i + 1] === '/' && source[i - 1] !== ':') { comment = 'line'; continue; }
    if (source[i] === '/' && source[i + 1] === '*') { comment = 'block'; i += 1; continue; }
    if (source[i] === '{') stack.push(i);
    else if (source[i] === '}') {
      const start = stack.pop();
      if (start === undefined) continue;
      const before = source.slice(0, start);
      const cut = Math.max(before.lastIndexOf(';'), before.lastIndexOf('{'), before.lastIndexOf('}'));
      const selector = before.slice(cut + 1).replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ' ').trim().replace(/\s+/g, ' ');
      out.push({ start, end: i, selector });
    }
  }
  return out;
}

/** The block's own text: nested blocks blanked (newlines kept, so offsets and lines hold). */
function ownText(source, block) {
  const chars = source.slice(block.start + 1, block.end).split('');
  let nested = 0;
  for (let i = 0; i < chars.length; i += 1) {
    if (chars[i] === '{') { nested += 1; chars[i] = ' '; continue; }
    if (chars[i] === '}') { nested -= 1; chars[i] = ' '; continue; }
    if (nested > 0 && chars[i] !== '\n') chars[i] = ' ';
  }
  return chars.join('');
}

const COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
const ANNOTATION = /@([a-z-]+)\s*:([\s\S]*)$/;

/**
 * The annotations a block declares, with their placement errors.
 *
 * @returns {{ grounds: null|{tokens: string[], line: number}, contrast: null|{value: string, line: number}, errors: {line: number, message: string}[] }}
 */
function annotationsOf(source, block) {
  const text = ownText(source, block);
  const lineAt = (index) => source.slice(0, block.start + 1 + index).split('\n').length;
  // Where the block's first real content starts: anything that is not
  // whitespace or a comment. An annotation after it does not open the block.
  const firstContent = text.replace(COMMENT, (m) => ' '.repeat(m.length)).search(/\S/);
  const found = { grounds: null, contrast: null, errors: [] };
  for (const comment of text.matchAll(COMMENT)) {
    const body = comment[0].startsWith('//')
      ? comment[0].slice(2)
      : comment[0].slice(2, -2).split('\n').map((l) => l.replace(/^\s*\*?/, '')).join(' ');
    const match = ANNOTATION.exec(body.trim());
    if (!match || !KINDS.includes(match[1])) continue;
    const [, kind, raw] = match;
    const line = lineAt(comment.index);
    if (firstContent !== -1 && comment.index > firstContent) {
      found.errors.push({ line, message: `@${kind} must open its block` });
      continue;
    }
    if (found[kind]) {
      found.errors.push({ line, message: `a second @${kind} in one block (the first is on line ${found[kind].line})` });
      continue;
    }
    found[kind] = kind === 'grounds'
      ? { tokens: raw.trim().split(/[\s,]+/).filter(Boolean), line, selector: block.selector }
      : { value: raw.trim(), line, selector: block.selector };
  }
  return found;
}

/**
 * Every annotated block in a stylesheet, and every placement error in it —
 * swept over the WHOLE file, so a misplaced or duplicated annotation is found
 * even on a block that holds nothing a check measures.
 */
export function fileAnnotations(source) {
  const all = blocks(source).map((block) => ({ block, ...annotationsOf(source, block) }));
  return {
    blocks: all,
    errors: all.flatMap((a) => a.errors),
  };
}

/**
 * The annotations in force at `offset`: for each kind, the innermost enclosing
 * block that declares it (validly placed).
 *
 * @returns {{ grounds: null|{tokens: string[], line: number}, contrast: null|{value: string, line: number, selector: string} }}
 */
export function annotationsAt(source, offset, annotations = fileAnnotations(source)) {
  const enclosing = annotations.blocks
    .filter((a) => a.block.start < offset && offset < a.block.end)
    .sort((a, b) => b.block.start - a.block.start);
  return {
    grounds: enclosing.find((a) => a.grounds)?.grounds ?? null,
    contrast: enclosing.find((a) => a.contrast)?.contrast ?? null,
  };
}

/** Back-compatible reader: the `@grounds` in force at `offset`, or null. */
export function declaredGrounds(source, offset) {
  return annotationsAt(source, offset).grounds;
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
 * Why a `@contrast` declaration is not allowed, or `[]`. `non-text` is the
 * only value, and only on an icon selector: a 3:1 bar on text would be a text
 * failure the check stopped seeing.
 */
export function contrastErrors(declared) {
  if (declared.value !== 'non-text') return [`@contrast: \`${declared.value}\` is not a known value (only \`non-text\`)`];
  if (!ICON_SELECTOR.test(declared.selector)) return [`@contrast: non-text on a text selector \`${declared.selector}\``];
  return [];
}

/**
 * Every annotation error in one stylesheet, as `file:line — message`: placement
 * errors from the sweep, `@grounds` lists checked against `values`, and (when
 * asked) `@contrast` values and selectors.
 */
export function annotationErrors(file, source, values, { contrast = false } = {}) {
  const annotations = fileAnnotations(source);
  const out = annotations.errors.map((e) => `${file}:${e.line} — ${e.message}.`);
  for (const a of annotations.blocks) {
    if (a.grounds) out.push(...groundErrors(a.grounds, values).map((m) => `${file}:${a.grounds.line} — \`@grounds\` ${m}.`));
    if (contrast && a.contrast) out.push(...contrastErrors(a.contrast).map((m) => `${file}:${a.contrast.line} — ${m}.`));
  }
  return out;
}
