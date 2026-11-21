#!/usr/bin/env node
/**
 * `npm run check:dodont-figures` — every Do and Don't in the docs looks and
 * reads the same.
 *
 * WHY IT EXISTS. `Do`, `Dont`, `DoDont` and `DoDontPair` already put every
 * pair in one card (`DoDontCard`, in `storybook-docs/ds-docs-layout.jsx`): the
 * card owns the ground, border, radius, padding, height and centering. What
 * still drifted was what sat inside it: inline `style` wrappers that arranged
 * or boxed a figure, hand-drawn `<svg>`, an `<img>`, a hex color, and a pair
 * with no caption under it. A page now passes the card a figure and a
 * caption, and arranges several parts with `FigureRow` or `FigureStack`.
 *
 * WHAT IT FAILS ON, in any `.mdx` or `.jsx` under `design-system/src`:
 *   1. a figure with an inline `style`;
 *   2. a figure with an `<svg>` literal, an `<img>`, or a hex color: a figure
 *      is a live PLUS component or an illustration-kit drawing;
 *   3. a missing, empty or run-on caption: one sentence under the figure;
 *   4. `stacked` without a reason: a pair is side by side at docs width and
 *      stacks on its own when narrow, so `stacked="why"` says why a figure
 *      needs the full width.
 *
 * HELPER FIGURES. A figure that is a `<XFigure />` child (a helper component
 * named `*Figure`, defined in the same file) is followed to its definition and
 * scanned with the same rules, so a figure cannot hide its inline style, svg,
 * img or hex color inside a helper. Layout helpers (`FigureRow`, `FigureStack`,
 * ...) do not end in `Figure` and are not followed.
 *
 * FOUNDATIONS EXEMPTION. On a Foundations page the styling is the subject: a
 * Dont that shows a literal radius or a gray fill has to carry that style. Files
 * under `design-system/src/styles/` and the foundation figure helpers
 * (`storybook-docs/elevation-*.jsx`, `storybook-docs/foundation-*.jsx`) may put
 * an inline `style` inside a named `*Figure` helper. Only that: the Do and Don't
 * itself still takes the helper, never a styled wrapper, and svg, img, hex and
 * captions are checked everywhere. Pattern and component pages have no exemption.
 *
 * PRINTED EXAMPLES. A page prints its `*Examples.jsx` as the code a consumer
 * writes, so that code teaches. Its inline `style` may set layout on tokens
 * (flex, grid, gap, alignment, size, margin, padding) and must not set color,
 * type, radius or elevation: text takes a type utility class (`.body-default`,
 * `.heading-sm`, `.metric-md`), which brings the letter spacing with it. The
 * file is parsed, so both branches of a conditional, a spread, and a style
 * named, called or picked off an object in the same file are all followed.
 * `borderSpacing` and `borderCollapse` arrange a table's cells, so they are
 * layout; a border key set to `0` or `none` clears a side and passes.
 *
 * The parser is the TypeScript compiler agents/uno-bot installs, loaded from
 * that package so the check needs nothing the harness job does not already
 * install. Without it the check fails and says so; it never passes unread.
 *
 * WHAT IT CANNOT SEE. Whether the two halves of a pair show the same
 * component, and whether a live figure is the right one: those are a reader's
 * judgment, so they live in the docs review, not in an exit code. A helper
 * defined in another file is not followed.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { attrsOf, readElement } from './lib/docs-page.mjs';
import { main } from './lib/findings.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';
const SRC = 'design-system/src';

/** The files that define the Do and Don't blocks, not pages that use them. */
const DEFINITIONS = new Set([
  'design-system/src/storybook-docs/ds-docs-layout.jsx',
  'design-system/src/storybook-docs/foundation-blocks.jsx',
]);

const BLOCKS = /<(DoDontPair|DoDontCard|Dont|Do)(?=[\s>/])/g;

/** A caption as plain text: JSX tags and `{' '}` spacers dropped. */
export function captionText(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/^\{|\}$/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\{\s*(['"`])(.*?)\1\s*\}/g, '$2')
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when the text holds more than one sentence. */
export const isRunOn = (text) => /[.!?][”’")]?\s+[A-Z“‘"(]/.test(text.replace(/\b(e\.g|i\.e|vs)\./g, '$1'));

/** Foundations files, where a named `*Figure` helper may carry an inline style. */
export const isFoundationFile = (file) =>
  /^design-system\/src\/styles\//.test(file) || /^design-system\/src\/storybook-docs\/(elevation|foundation)-[^/]*\.jsx$/.test(file);

const HELPER = /<([A-Z]\w*Figure)(?=[\s>/])/g;

/** The source of `function Name` or `const Name =` in this file, or '' when it is not defined here. */
export function helperBody(source, name) {
  const m = new RegExp(`(?:function\\s+${name}\\b|(?:const|let)\\s+${name}\\s*=)`).exec(source);
  if (!m) return '';
  let i = m.index + m[0].length;
  const open = { '(': ')', '{': '}', '[': ']' };
  let depth = 0;
  let quote = null;
  let started = false;
  let braces = 0;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (open[ch]) { depth++; if (ch === '{') braces++; started = true; continue; }
    if (ch === ')' || ch === '}' || ch === ']') {
      depth--;
      if (depth < 0) break;
      continue;
    }
    // A body ends at the `;` or blank-line break after its outermost group closes.
    if (started && depth === 0 && (ch === ';' || (ch === '\n' && /\n\s*\n/.test(source.slice(i, i + 3)) && braces > 0))) break;
  }
  return source.slice(m.index, i);
}

/** The helper figures a figure uses, followed through nested helpers, as { name, body }. */
function followHelpers(source, figure, seen = new Set()) {
  const out = [];
  HELPER.lastIndex = 0;
  for (const m of figure.matchAll(HELPER)) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);
    const body = helperBody(source, name);
    if (!body) continue;
    out.push({ name, body });
    out.push(...followHelpers(source, body, seen));
  }
  return out;
}

/** The problems with one figure's source. */
function figureProblems(figure, { source = '', foundation = false } = {}) {
  const found = figureOwnProblems(figure, false);
  for (const { name, body } of followHelpers(source, figure)) {
    figureOwnProblems(body, foundation).forEach((p) => found.push(`helper ${name} ${p}`));
  }
  return found;
}

function figureOwnProblems(figure, allowStyle) {
  const found = [];
  if (!allowStyle && /\bstyle\s*=/.test(figure)) found.push('has an inline style; arrange parts with FigureRow or FigureStack, and let the card own the frame');
  if (/<svg[\s>]/.test(figure)) found.push('draws an <svg>; use a PLUS component or an illustration-kit drawing');
  if (/<img[\s/>]/.test(figure)) found.push('uses an <img>; use a PLUS component or an illustration-kit drawing');
  if (/#[0-9a-fA-F]{3,8}\b/.test(figure.replace(/&#\d+;/g, ''))) found.push('carries a hex color; use a PLUS component, which brings its own tokens');
  return found;
}

function captionProblems(label, raw) {
  const text = captionText(raw);
  if (!text) return [`${label} has no caption; put one sentence under the figure`];
  if (isRunOn(text)) return [`${label} caption runs past one sentence: "${text.slice(0, 60)}"`];
  return [];
}

/**
 * Every problem in one source file.
 *
 * @returns {{ line: number, message: string }[]}
 */
export function checkSource(source, { file = '' } = {}) {
  const foundation = isFoundationFile(file);
  const problems = [];
  BLOCKS.lastIndex = 0;
  let m;
  while ((m = BLOCKS.exec(source))) {
    const el = readElement(source, m.index);
    const attrs = attrsOf(el.attrs);
    const line = source.slice(0, m.index).split('\n').length;
    const add = (message) => problems.push({ line, message: `<${el.name}> ${message}` });
    if (el.name === 'DoDontPair') {
      for (const [label, figure, caption] of [['Do', attrs.doExample, attrs.doCaption], ['Don’t', attrs.dontExample, attrs.dontCaption]]) {
        if (typeof figure === 'string') figureProblems(figure, { source, foundation }).forEach((p) => add(`${label} figure ${p}`));
        else add(`${label} figure is missing`);
        captionProblems(`${label}`, caption).forEach(add);
      }
      if (attrs.stacked !== undefined && !(typeof attrs.stacked === 'string' && /^(["'])\S[\s\S]*\1$/.test(attrs.stacked))) {
        add('uses stacked with no reason; write stacked="why the figure needs the full width"');
      }
    } else {
      figureProblems(el.children, { source, foundation }).forEach((p) => add(`figure ${p}`));
      captionProblems(el.name, attrs.caption).forEach(add);
    }
    BLOCKS.lastIndex = m.index + 1;
  }
  return problems;
}

/** Style keys a printed example may not set: color, type, radius, elevation. */
const NOT_LAYOUT = /^(color|background\w*|fill|stroke|opacity|font\w*|letterSpacing|lineHeight|text(?:Transform|Decoration\w*|Shadow|Indent|Emphasis\w*)|border\w*Radius|border\w*Radius\w*|boxShadow|filter|backdropFilter|outline\w*|border\w*)$/;
/** Border keys that arrange a table's cells rather than draw a line. */
const TABLE_LAYOUT = new Set(['borderSpacing', 'borderCollapse']);
const NOT_LAYOUT_KEY = (key, value) => {
  if (TABLE_LAYOUT.has(key)) return false;
  if (key === 'border' || /^border(Block|Inline|Top|Bottom|Left|Right)?(Start|End)?$/.test(key)) return !/^\s*(0|none|['"]none['"]|['"]0['"])\s*$/.test(value);
  return NOT_LAYOUT.test(key);
};

/** The `agents/uno-bot` manifest whose installed TypeScript parses printed examples. */
const TS_ANCHOR = path.join(REPO_ROOT, 'agents/uno-bot/package.json');

let tsCache;
/**
 * The TypeScript compiler resolved from `anchor`, or a thrown error that names
 * the fix: the check fails rather than pass a tree it could not read.
 */
export function loadTypeScript(anchor = TS_ANCHOR) {
  if (anchor === TS_ANCHOR && tsCache) return tsCache;
  let ts;
  try {
    ts = createRequire(anchor)('typescript');
  } catch (error) {
    throw new Error(`check:dodont-figures cannot load TypeScript from ${path.relative(REPO_ROOT, anchor) || anchor}: run \`npm ci\` in agents/uno-bot. (${error.message.split('\n')[0]})`);
  }
  if (anchor === TS_ANCHOR) tsCache = ts;
  return ts;
}

/** Every node under `node`, depth first. */
function* walk(ts, node) {
  if (!node) return;
  yield node;
  const children = [];
  ts.forEachChild(node, (child) => { children.push(child); });
  for (const child of children) yield* walk(ts, child);
}

/** Every `const|let|var name = init` and `function name` in the file, by name. */
function bindingsOf(ts, sf) {
  const out = new Map();
  const add = (name, node) => out.set(name, [...(out.get(name) ?? []), node]);
  for (const node of walk(ts, sf)) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) add(node.name.text, node.initializer);
    if (ts.isFunctionDeclaration(node) && node.name) add(node.name.text, node);
  }
  return out;
}

/** The expressions a function can return. */
function returnsOf(ts, fn) {
  if (!fn.body) return [];
  if (!ts.isBlock(fn.body)) return [fn.body];
  const out = [];
  for (const node of walk(ts, fn.body)) if (ts.isReturnStatement(node) && node.expression) out.push(node.expression);
  return out;
}

/** A fixed string a key or index names (`color`, `'color'`, `` `color` ``), or null. */
const fixedText = (ts, node) => (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null);

/** A style key's name; a computed key counts when it is a fixed string (`['color']`). */
const keyName = (ts, name) => {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isComputedPropertyName(name)) return fixedText(ts, name.expression);
  return fixedText(ts, name);
};

/**
 * The `[key, value source]` pairs a style expression can set: both branches of
 * a conditional, spreads, `&&` / `||` / `??`, and names, members and calls
 * bound in the same file are followed.
 */
function styleEntries(ctx, node, seen = new Set()) {
  const { ts, sf } = ctx;
  if (!node || seen.has(node)) return [];
  seen.add(node);
  const next = (n) => styleEntries(ctx, n, seen);
  const K = ts.SyntaxKind;
  switch (node.kind) {
    case K.ObjectLiteralExpression:
      return node.properties.flatMap((prop) => {
        if (ts.isSpreadAssignment(prop)) return next(prop.expression);
        if (ts.isShorthandPropertyAssignment(prop)) return [[prop.name.text, prop.name.text]];
        if (!ts.isPropertyAssignment(prop)) return [];
        const key = keyName(ts, prop.name);
        return key ? [[key, prop.initializer.getText(sf)]] : [];
      });
    case K.ConditionalExpression:
      return [...next(node.whenTrue), ...next(node.whenFalse)];
    case K.BinaryExpression: {
      const op = node.operatorToken.kind;
      if (op === K.AmpersandAmpersandToken) return next(node.right);
      if (op === K.BarBarToken || op === K.QuestionQuestionToken) return [...next(node.left), ...next(node.right)];
      return [];
    }
    case K.ParenthesizedExpression:
    case K.AsExpression:
    case K.SatisfiesExpression:
    case K.NonNullExpression:
      return next(node.expression);
    case K.Identifier:
      return (ctx.bindings.get(node.text) ?? []).flatMap(next);
    case K.ArrowFunction:
    case K.FunctionExpression:
    case K.FunctionDeclaration:
      return returnsOf(ts, node).flatMap(next);
    case K.CallExpression:
      return ts.isIdentifier(node.expression) ? next(node.expression) : [];
    case K.PropertyAccessExpression:
    case K.ElementAccessExpression: {
      const name = ts.isPropertyAccessExpression(node) ? node.name.text : fixedText(ts, node.argumentExpression);
      if (name === null) return [];
      const objects = ts.isIdentifier(node.expression) ? ctx.bindings.get(node.expression.text) ?? [] : [node.expression];
      return objects.flatMap((obj) => (ts.isObjectLiteralExpression(obj) ? obj.properties : [])
        .filter((prop) => ts.isPropertyAssignment(prop) && keyName(ts, prop.name) === name)
        .flatMap((prop) => next(prop.initializer)));
    }
    default:
      return [];
  }
}

/**
 * Every problem in one printed `*Examples.jsx`: an inline style that sets color, type, radius or elevation.
 *
 * @returns {{ line: number, message: string }[]}
 */
export function checkExamplesSource(source) {
  const ts = loadTypeScript();
  const sf = ts.createSourceFile('example.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const problems = (sf.parseDiagnostics ?? []).map((d) => ({
    line: lineOf(d.start ?? 0),
    message: `printed example does not parse: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`,
  }));
  const ctx = { ts, sf, bindings: bindingsOf(ts, sf) };
  for (const node of walk(ts, sf)) {
    if (!ts.isJsxAttribute(node) || !ts.isIdentifier(node.name) || node.name.text !== 'style') continue;
    if (!node.initializer || !ts.isJsxExpression(node.initializer)) continue;
    const line = lineOf(node.getStart(sf));
    for (const [key, value] of styleEntries(ctx, node.initializer.expression)) {
      if (NOT_LAYOUT_KEY(key, value)) problems.push({ line, message: `printed example style sets \`${key}\`; style may set layout on tokens only, so text takes a type class such as .body-default and color, radius and elevation come from the component` });
    }
  }
  return problems;
}

/** Every docs page and story source under the design-system source, tracked and still on disk. */
const sources = (repoRoot) => trackedSources(repoRoot, [SRC], /\.(mdx|jsx)$/).filter(({ path: file }) => !/\.test\.jsx$/.test(file));

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const findings = [];
  for (const { path: file, text: source } of sources(repoRoot)) {
    if (/Examples\.jsx$/.test(file)) for (const { line, message } of checkExamplesSource(source)) findings.push({ file, line, message });
    if (DEFINITIONS.has(file)) continue;
    if (!/\bDo(Dont)?\b|DoDontPair|DoDontCard|<Dont\b/.test(source)) continue;
    for (const { line, message } of checkSource(source, { file })) findings.push({ file, line, message });
  }
  return findings;
}

export const REMEDY =
  '  -> A Do or Don\'t figure is a live PLUS component or an illustration-kit drawing,\n'
  + '     with no inline style: arrange several parts with <FigureRow> or <FigureStack>\n'
  + '     (storybook-docs/ds-docs-layout.jsx). Put one sentence under it as the caption.\n'
  + '     A printed *Examples.jsx style sets layout on tokens only: text takes a type class\n'
  + '     (.body-default), never color, font, radius or shadow.';

export function summary({ repoRoot = REPO_ROOT } = {}) {
  let blocks = 0;
  for (const { text: source } of sources(repoRoot)) {
    blocks += (source.match(BLOCKS) ?? []).length;
  }
  return `${blocks} Do and Don't block(s) hold one figure rule.`;
}

main(import.meta.url, 'check:dodont-figures', { run, summary, remedy: REMEDY });
