/**
 * `@grounds` — the grounds a rule is DECLARED to sit on, read from a comment
 * beside the rule, so a contrast check can measure it there instead of on the
 * page.
 *
 * WHY. `check:focus-ring` and `check:text-contrast` read a ground from the
 * declaration's own rule, and fall back to the page. A component built for a
 * ground its CALLER paints — `CloseButton tone="inverse"` on an intent fill or
 * a dark surface — has no background in its own rule, so both checks measured
 * its light ring and light × against the light page and reported 1.00:1. The
 * honest answers were either an exception that excused the rule, or this: the
 * rule names the grounds it is for, and each one is measured against the same
 * bar the page would be.
 *
 * THE SYNTAX. A comment in the block it applies to, listing `--color-*` tokens:
 *
 *     .plus-close-btn--inverse {
 *         // @grounds: --color-inverse-surface --color-primary --color-danger
 *         color: var(--color-surface);
 *         &:focus-visible::after { border-color: var(--color-focus-ring-inverse); }
 *     }
 *
 * It covers its own block and every block nested inside it; the innermost
 * declaration wins. `/* @grounds: … *\/` works too.
 *
 * WHAT IT REFUSES. A declaration that names nothing, or names a token the
 * token files do not define (or cannot resolve to a colour), is an ERROR, not
 * a pass: a typo in the list would otherwise measure nothing and report green.
 * A declared ground is a promise about where the component is used — the
 * component's docs have to say the same thing, which no check can read.
 */
import { parseColour, resolveToken } from '../../design-system/src/lib/tokens.mjs';

const DECLARATION = /(?:\/\/|\/\*)\s*@grounds\s*:([^\n]*?)(?:\*\/|$)/m;

/**
 * The text of each block enclosing `offset`, innermost first, with the blocks
 * nested INSIDE each one blanked — so a comment in a sibling or child rule is
 * not mistaken for this rule's declaration.
 *
 * @param {string} source
 * @param {number} offset
 * @returns {{ text: string, start: number }[]}
 */
function enclosingBlocks(source, offset) {
  const opens = [];
  for (let i = 0; i < offset; i += 1) {
    if (source[i] === '{') opens.push(i);
    else if (source[i] === '}') opens.pop();
  }
  const blocks = [];
  for (const start of opens.reverse()) {
    let depth = 0;
    let end = source.length;
    for (let i = start; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') {
        depth -= 1;
        if (depth === 0) { end = i; break; }
      }
    }
    const chars = source.slice(start + 1, end).split('');
    let nested = 0;
    for (let i = 0; i < chars.length; i += 1) {
      if (chars[i] === '{') { nested += 1; chars[i] = ' '; continue; }
      if (chars[i] === '}') { nested -= 1; chars[i] = ' '; continue; }
      if (nested > 0 && chars[i] !== '\n') chars[i] = ' ';
    }
    blocks.push({ text: chars.join(''), start });
  }
  return blocks;
}

/**
 * The declared grounds for the declaration at `offset`, or null when none is
 * declared. Parsing only; `groundErrors` says whether the list is usable.
 *
 * @param {string} source   the stylesheet
 * @param {number} offset   where the declaration being measured starts
 * @returns {null | { tokens: string[], line: number }}
 */
export function declaredGrounds(source, offset) {
  for (const block of enclosingBlocks(source, offset)) {
    const match = DECLARATION.exec(block.text);
    if (!match) continue;
    const line = source.slice(0, block.start + 1 + match.index).split('\n').length;
    const tokens = match[1].trim().split(/[\s,]+/).filter(Boolean);
    return { tokens, line };
  }
  return null;
}

/**
 * Why a declaration cannot be measured, or `[]` when it can. An empty list and
 * an unknown token are both errors: either would otherwise measure nothing.
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
      errors.push(`\`${token}\` does not resolve to a colour in the token files`);
    }
  }
  return errors;
}
