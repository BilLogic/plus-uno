/**
 * The page model: one design-system docs page (`.mdx`) read into one fixed
 * shape, so every reader of a page reads it the same way and a heading rename
 * is a one-place change.
 *
 *   readDocsPage(source, {kind?})   the page model:
 *     { kind, title, intro, sections, alternatives, rules, related, aliases, figmaMeta }
 *       title         a foundation page's FoundationHero title, or the page's `#` heading, or null
 *       sections      [{title, level, text, subsections: [{title, level, text}]}]
 *       alternatives  [{text, routesTo}]  the lines under Alternatives, each with the component it names
 *       rules         [{id, sentence, text}]  one per `###` under Best practices, id from the slug
 *       related       the lines under Related
 *       aliases       the page's `export const aliases = [...]`, or []
 *       figmaMeta     the page's `export const figmaMeta = {...}`, parsed, or null
 *   sectionText(page, title)        one section's text, or null
 *   pageText(page)                  the whole page as markdown: `#` title, intro, `##` sections
 *   createPageFinder(root, registry?)  ({name, source}) → the page's repo path, or null
 *
 * TWO ADAPTERS. A component page is markdown under `##` headings (a page with
 * none reads its `###` headings as its sections). A foundation page has no
 * markdown headings: its sections are `<FoundationSection title>` and
 * `<FoundationSubsection title>`, its facts `<TokenTable>` and `<RefTable>`
 * props. `kind` says which; left out, a page with a FoundationSection is a
 * foundation page.
 *
 * JSX TO TEXT. No raw JSX reaches the model's text. A docs table (`DocsTable`,
 * `table`, `RefTable`) becomes one markdown row per line; a `TokenTable` one
 * line per token. A do/don't pair (`DoDontPair`, `DoDont` with `Do`/`Dont`)
 * keeps its captions as `Do:` and `Don't:` lines and drops the examples.
 * Layout wrappers (`DocsTabs`, `DocsTab`, `div`, fragments) give up their
 * children; a `Banner` keeps its text, since foundation pages state rules in
 * one; inline tags become markdown (`code` and `C` to backticks, `strong` to
 * bold). Every other element, and every `{expression}`, is dropped. Code
 * fences and code spans are kept as written. ESM (`import`, `export`) is read
 * for figmaMeta and aliases and never reaches the text.
 *
 * FINDING A PAGE. A component's page is the page whose `<Meta of>` stories
 * file names it as `component`, matched by the source file the stories import
 * it from (or by name, when they import it from a barrel); failing that, the
 * component registry's `mdxPath`, when the registry entry's source is the
 * component's. Never by guessing from the folder: a folder can hold another
 * component's page, and a name can belong to three files.
 *
 * No MDX parser: line and character scanning, which never throws on a page it
 * cannot follow (a bad figmaMeta literal is the one error, as the registry
 * generator has always reported it).
 */

import fs from 'node:fs';
import path from 'node:path';

// ── scanning ────────────────────────────────────────────────────────────────

const isTagStart = (s, i) => s[i] === '<' && /[A-Za-z>]/.test(s[i + 1] ?? '');
const atLineStart = (s, i) => i === 0 || s[i - 1] === '\n';

/** The index after a quoted string starting at `i`. */
function skipString(s, i) {
  const q = s[i];
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === '\\') j++;
    else if (s[j] === q) return j + 1;
  }
  return s.length;
}

/** The index after the balanced `{`, `[` or `(` group starting at `i`: strings, comments and JSX inside are skipped whole. */
function skipGroup(s, i) {
  const close = { '{': '}', '[': ']', '(': ')' };
  const stack = [close[s[i]]];
  let j = i + 1;
  while (j < s.length && stack.length) {
    const ch = s[j];
    if (ch === '"' || ch === "'" || ch === '`') j = skipString(s, j);
    else if (ch === '/' && s[j + 1] === '*') {
      const end = s.indexOf('*/', j + 2);
      j = end === -1 ? s.length : end + 2;
    } else if (ch === '/' && s[j + 1] === '/') {
      const end = s.indexOf('\n', j);
      j = end === -1 ? s.length : end;
    } else if (isTagStart(s, j)) j = readElement(s, j).end;
    else if (close[ch]) {
      stack.push(close[ch]);
      j++;
    } else {
      if (ch === stack[stack.length - 1]) stack.pop();
      j++;
    }
  }
  return j;
}

/** The index after a fenced code block whose opening line starts at `i`. */
function skipFence(s, i) {
  const open = s.slice(i).match(/^[ \t]*(`{3,}|~{3,})/)[1];
  let j = s.indexOf('\n', i);
  while (j !== -1) {
    const lineEnd = s.indexOf('\n', j + 1);
    const line = s.slice(j + 1, lineEnd === -1 ? undefined : lineEnd);
    if (line.trim().startsWith(open)) return lineEnd === -1 ? s.length : lineEnd;
    j = lineEnd;
  }
  return s.length;
}

const fenceAt = (s, i) => atLineStart(s, i) && /^[ \t]*(`{3}|~{3})/.test(s.slice(i, i + 12));

/** The index after the code span starting at `i`, or -1 when the backticks never close. */
function skipCodeSpan(s, i) {
  const ticks = s.slice(i).match(/^`+/)[0];
  const end = s.indexOf(ticks, i + ticks.length);
  return end === -1 || s.slice(i, end).includes('\n\n') ? -1 : end + ticks.length;
}

/**
 * One JSX element starting at `i` (`<Name …>…</Name>`, `<Name … />` or a
 * fragment): `{name, attrs, children, end}`. An element that never closes runs
 * to the end of the text.
 */
function readElement(s, i) {
  const name = s[i + 1] === '>' ? '' : s.slice(i + 1).match(/^[A-Za-z][\w.:-]*/)[0];
  let j = i + 1 + name.length;
  const attrsStart = j;
  while (j < s.length && s[j] !== '>') {
    if (s[j] === '"' || s[j] === "'") j = skipString(s, j);
    else if (s[j] === '{') j = skipGroup(s, j);
    else j++;
  }
  const selfClosing = s[j - 1] === '/';
  const attrs = s.slice(attrsStart, selfClosing ? j - 1 : j);
  j++;
  if (selfClosing || /^(br|hr|img|input|col|meta)$/i.test(name)) return { name, attrs, children: '', end: j };
  const childrenStart = j;
  while (j < s.length) {
    if (fenceAt(s, j)) j = skipFence(s, j);
    else if (s[j] === '`') {
      const end = skipCodeSpan(s, j);
      j = end === -1 ? j + 1 : end;
    } else if (s.startsWith('<!--', j)) {
      const end = s.indexOf('-->', j);
      j = end === -1 ? s.length : end + 3;
    } else if (s[j] === '{') j = skipGroup(s, j);
    else if (s[j] === '<' && s[j + 1] === '/') {
      const close = s.indexOf('>', j);
      return { name, attrs, children: s.slice(childrenStart, j), end: close === -1 ? s.length : close + 1 };
    } else if (isTagStart(s, j)) j = readElement(s, j).end;
    else j++;
  }
  return { name, attrs, children: s.slice(childrenStart), end: s.length };
}

/** The index after the ESM block (`import` / `export` statements and the comment lines among them) starting at `i`: it ends at a blank line. */
function skipEsm(s, i) {
  let j = i;
  while (j < s.length) {
    const ch = s[j];
    if (ch === '"' || ch === "'" || ch === '`') j = skipString(s, j);
    else if (ch === '{' || ch === '[' || ch === '(') j = skipGroup(s, j);
    else if (ch === '/' && s[j + 1] === '/') {
      const end = s.indexOf('\n', j);
      j = end === -1 ? s.length : end;
    } else if (ch === '\n' && /^\n[ \t]*(\n|$)/.test(s.slice(j))) return j;
    else j++;
  }
  return s.length;
}

// ── attribute and literal values ────────────────────────────────────────────

/** A JS string literal's value. */
function unquote(lit) {
  return lit.slice(1, -1).replace(/\\(.)/g, '$1');
}
const isStringLiteral = (t) => /^(["'`])[\s\S]*\1$/.test(t) && skipString(t, 0) === t.length;

/** Split `text` at top-level commas: strings, groups and JSX stay whole. */
function splitTop(text) {
  const parts = [];
  let start = 0;
  let j = 0;
  while (j < text.length) {
    const ch = text[j];
    if (ch === '"' || ch === "'" || ch === '`') j = skipString(text, j);
    else if (ch === '{' || ch === '[' || ch === '(') j = skipGroup(text, j);
    else if (isTagStart(text, j)) j = readElement(text, j).end;
    else if (ch === ',') {
      parts.push(text.slice(start, j));
      start = ++j;
    } else j++;
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** An element's attributes: name → raw value (`"…"`, `'…'`, `{…}`, or true). */
function attrsOf(raw) {
  const out = {};
  let j = 0;
  while (j < raw.length) {
    const m = raw.slice(j).match(/^\s*([A-Za-z_][\w.:-]*)/);
    if (!m) {
      j++;
      continue;
    }
    j += m[0].length;
    if (raw[j] !== '=') {
      out[m[1]] = true;
      continue;
    }
    j++;
    const start = j;
    if (raw[j] === '"' || raw[j] === "'") j = skipString(raw, j);
    else if (raw[j] === '{') j = skipGroup(raw, j);
    out[m[1]] = raw.slice(start, j);
  }
  return out;
}

/** A value as text: a string literal unquoted, JSX as inline markdown, anything else as written. */
function valueText(raw) {
  if (raw === undefined || raw === true) return '';
  let t = String(raw).trim();
  if (/^["']/.test(t)) return unquote(t);
  if (t.startsWith('{') && t.endsWith('}')) t = t.slice(1, -1).trim();
  if (isStringLiteral(t)) return unquote(t);
  if (isTagStart(t, 0)) return inline(convert(t));
  return t;
}

/** The items of an array literal (`[a, b]`, or `{[a, b]}`). */
function arrayItems(raw) {
  let t = String(raw ?? '').trim();
  if (t.startsWith('{') && t.endsWith('}')) t = t.slice(1, -1).trim();
  if (!t.startsWith('[') || !t.endsWith(']')) return [];
  return splitTop(t.slice(1, -1));
}

/** An object literal's fields: key → raw value. */
function objectFields(raw) {
  const t = raw.trim();
  if (!t.startsWith('{') || !t.endsWith('}')) return {};
  const out = {};
  for (const part of splitTop(t.slice(1, -1))) {
    const m = part.match(/^["']?([\w-]+)["']?\s*:\s*([\s\S]*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

// ── JSX to text ─────────────────────────────────────────────────────────────

const inline = (md) => md.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
const block = (md) => `\n\n${md.trim()}\n\n`;
const tableRow = (cells) => `| ${cells.join(' | ')} |`;

/** The child elements of `children`, in order. */
function elementsIn(children) {
  const out = [];
  let j = 0;
  while (j < children.length) {
    if (fenceAt(children, j)) j = skipFence(children, j);
    else if (children[j] === '{') j = skipGroup(children, j);
    else if (isTagStart(children, j)) {
      const el = readElement(children, j);
      out.push(el);
      j = el.end;
    } else j++;
  }
  return out;
}

/** Every `<tr>` under an element, however deep (thead, tbody). */
function rowsIn(children) {
  const rows = [];
  for (const el of elementsIn(children)) {
    if (el.name === 'tr') rows.push(el);
    else rows.push(...rowsIn(el.children));
  }
  return rows;
}

function htmlTable(children) {
  const lines = [];
  for (const tr of rowsIn(children)) {
    const cells = elementsIn(tr.children).filter((c) => c.name === 'th' || c.name === 'td');
    lines.push(tableRow(cells.map((c) => inline(convert(c.children)))));
    if (cells.length && cells.every((c) => c.name === 'th')) lines.push(tableRow(cells.map(() => '---')));
  }
  return block(lines.join('\n'));
}

function refTable(attrs) {
  const head = arrayItems(attrs.head).map(valueText);
  const lines = head.length ? [tableRow(head), tableRow(head.map(() => '---'))] : [];
  for (const row of arrayItems(attrs.rows)) lines.push(tableRow(arrayItems(row).map(valueText)));
  return block(lines.join('\n'));
}

function tokenTable(attrs) {
  const lines = arrayItems(attrs.rows).map((row) => {
    const f = objectFields(row);
    const figma = f.figma ? ` (${valueText(f.figma)})` : '';
    const use = f.use ?? f.description;
    return `- \`${valueText(f.token)}\`${figma}${use ? `: ${valueText(use)}` : ''}`;
  });
  return block(lines.join('\n'));
}

const doLine = (label, caption) => `${label}: ${caption}`.trim();

/** One element as markdown text, by the JSX-to-text policy above. */
function elementText(el) {
  const attrs = attrsOf(el.attrs);
  const kids = () => convert(el.children);
  switch (el.name) {
    case 'FoundationSection':
      return `\n\n## ${valueText(attrs.title)}\n\n${kids()}\n\n`;
    case 'FoundationSubsection':
      return `\n\n### ${valueText(attrs.title)}\n\n${kids()}\n\n`;
    case 'FoundationHero':
      return attrs.summary ? block(valueText(attrs.summary)) : '';
    case 'TokenTable':
      return tokenTable(attrs);
    case 'RefTable':
      return refTable(attrs);
    case 'DocsTable':
    case 'table':
      return htmlTable(el.children);
    case 'DoDontPair':
      return block([attrs.doExample || attrs.doCaption ? doLine('Do', valueText(attrs.doCaption)) : null, attrs.dontExample || attrs.dontCaption ? doLine("Don't", valueText(attrs.dontCaption)) : null].filter(Boolean).join('\n'));
    case 'DoDont':
      return block(elementsIn(el.children).map(elementText).map((t) => t.trim()).filter(Boolean).join('\n'));
    case 'Do':
      return block(doLine('Do', valueText(attrs.caption)));
    case 'Dont':
      return block(doLine("Don't", valueText(attrs.caption)));
    case 'C':
    case 'code':
      return `\`${inline(kids())}\``;
    case 'strong':
    case 'b':
      return `**${inline(kids())}**`;
    case 'em':
      return `*${inline(kids())}*`;
    case 'br':
      return '\n';
    case 'li':
      return `\n- ${inline(kids())}`;
    case 'p':
    case 'ul':
    case 'ol':
    case 'Banner':
    case 'Description':
    case 'FoundationProse':
    case 'DocsTabs':
    case 'DocsTab':
    case 'div':
    case '':
      return block(kids());
    default:
      // Any other lowercase tag gives up its text; any component is an example or a widget, and is dropped.
      return /^[a-z]/.test(el.name) ? kids() : '';
  }
}

/** MDX body text to markdown: elements by `elementText`, expressions and ESM dropped, code kept. */
function convert(s) {
  let out = '';
  let j = 0;
  let text = 0;
  const flush = (to) => {
    out += s.slice(text, to);
  };
  while (j < s.length) {
    if (fenceAt(s, j)) {
      j = skipFence(s, j);
    } else if (s[j] === '`') {
      const end = skipCodeSpan(s, j);
      j = end === -1 ? j + 1 : end;
    } else if (atLineStart(s, j) && /^(import|export)\s/.test(s.slice(j, j + 7))) {
      flush(j);
      j = text = skipEsm(s, j);
    } else if (s.startsWith('<!--', j)) {
      flush(j);
      const end = s.indexOf('-->', j);
      j = text = end === -1 ? s.length : end + 3;
    } else if (s[j] === '{') {
      flush(j);
      j = text = skipGroup(s, j);
    } else if (isTagStart(s, j)) {
      flush(j);
      const el = readElement(s, j);
      out += elementText(el);
      j = text = el.end;
    } else j++;
  }
  flush(s.length);
  return out;
}

/** Tidy converted text: no trailing spaces, at most one blank line, outside code fences. */
function tidy(md) {
  const lines = md.split('\n');
  const out = [];
  let inFence = false;
  for (const raw of lines) {
    if (/^[ \t]*(`{3}|~{3})/.test(raw)) inFence = !inFence;
    const line = inFence || /^[ \t]*(`{3}|~{3})/.test(raw) ? raw.replace(/\s+$/, '') : raw.replace(/^[ \t]+(?=[|#]|Do:|Don't:)/, '').replace(/\s+$/, '');
    if (!inFence && line === '' && out[out.length - 1] === '') continue;
    out.push(line);
  }
  return out.join('\n').trim();
}

// ── sections ────────────────────────────────────────────────────────────────

/** The markdown headings of a text, outside code fences: `[{level, title, line}]`. */
function headingsOf(lines) {
  const out = [];
  let inFence = false;
  lines.forEach((l, line) => {
    if (/^[ \t]*(`{3}|~{3})/.test(l)) inFence = !inFence;
    const m = !inFence && l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (m) out.push({ level: m[1].length, title: m[2], line });
  });
  return out;
}

/** Split text at headings of `level`: the text before the first one, and one part per heading. */
function splitAt(text, level) {
  const lines = text.split('\n');
  const heads = headingsOf(lines).filter((h) => h.level === level);
  const bound = (k) => {
    const next = headingsOf(lines).find((h) => h.line > heads[k].line && h.level <= level);
    return next ? next.line : lines.length;
  };
  return {
    before: lines.slice(0, heads.length ? heads[0].line : lines.length).join('\n').trim(),
    parts: heads.map((h, k) => ({ title: h.title, level, text: lines.slice(h.line + 1, bound(k)).join('\n').trim() })),
  };
}

/** The items of a list section: its bullets, each with its continuation lines; a section with no bullets reads as its paragraphs. */
function linesOf(text) {
  if (!text) return [];
  const items = [];
  for (const line of text.split('\n')) {
    const bullet = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/);
    if (bullet) items.push(bullet[1].trim());
    else if (line.trim() && items.length && /^\s/.test(line)) items[items.length - 1] += ` ${line.trim()}`;
  }
  if (items.length) return items;
  return text.split(/\n\s*\n/).map(inline).filter((p) => p && !/^(#|\|)/.test(p));
}

/** A heading's slug: lowercase words joined by hyphens. */
export const slugOf = (title) =>
  title
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** The first component name a line names in backticks (`Flag`, not `width`). */
const routeOf = (line) => line.match(/`([A-Z][A-Za-z0-9]*)`/)?.[1] ?? null;

/** The `export const figmaMeta = {...}` literal, JSON-parsed; null when the page has none. */
function figmaMetaOf(source) {
  const m = source.search(/export\s+const\s+figmaMeta\s*=/);
  if (m === -1) return null;
  const braceStart = source.indexOf('{', m);
  if (braceStart === -1) return null;
  let depth = 0;
  let inStr = false;
  let end = -1;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    return JSON.parse(source.slice(braceStart, end + 1));
  } catch (err) {
    throw new Error(`Failed to parse figmaMeta object: ${err.message}`);
  }
}

function aliasesOf(source) {
  const m = source.match(/export\s+const\s+aliases\s*=\s*(\[[\s\S]*?\])/);
  return m ? arrayItems(m[1]).filter(isStringLiteral).map(unquote) : [];
}

const sectionNamed = (sections, title) => sections.find((s) => s.title.toLowerCase() === title.toLowerCase()) ?? null;

/** One docs page as the page model (see the header). */
export function readDocsPage(source, { kind } = {}) {
  const src = String(source ?? '');
  const pageKind = kind ?? (/<FoundationSection\b/.test(src) ? 'foundation' : 'component');
  const md = tidy(convert(src));
  const heads = headingsOf(md.split('\n'));
  const top = heads.some((h) => h.level === 2) ? 2 : heads.some((h) => h.level === 3) ? 3 : 2;
  const { before, parts } = splitAt(md, top);
  const sections = parts.map((p) => ({ ...p, subsections: splitAt(p.text, top + 1).parts }));
  const best = sectionNamed(sections, 'Best practices');
  return {
    kind: pageKind,
    title: src.match(/<FoundationHero\b[^>]*?\btitle=["']([^"']*)["']/)?.[1] ?? heads.find((h) => h.level === 1)?.title ?? null,
    intro: before.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#')).join('\n\n'),
    sections,
    alternatives: linesOf(sectionNamed(sections, 'Alternatives')?.text).map((text) => ({ text, routesTo: routeOf(text) })),
    rules: (best?.subsections ?? []).map((r) => ({ id: slugOf(r.title), sentence: r.title, text: r.text })),
    related: linesOf(sectionNamed(sections, 'Related')?.text),
    aliases: aliasesOf(src),
    figmaMeta: figmaMetaOf(src),
  };
}

/** The whole page as markdown, by the model: its title, its intro, then each section under its `##` heading. */
export function pageText(page) {
  const parts = [page.title ? `# ${page.title}` : null, page.intro || null, ...page.sections.map((s) => `${'#'.repeat(s.level)} ${s.title}\n\n${s.text}`.trim())];
  return parts.filter(Boolean).join('\n\n');
}

/** A section's text by title (any case), or null. */
export function sectionText(page, title) {
  return sectionNamed(page.sections, title)?.text ?? null;
}

// ── finding a component's page ──────────────────────────────────────────────

const DS_SRC = 'design-system/src';
const toPosix = (p) => p.split(path.sep).join('/');

/** Every authored `.mdx` under the design-system source, repo-relative. A ` 2.mdx` name is a Finder copy, not a page. */
function pagesUnder(root) {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.mdx') && !/ \d+\.mdx$/.test(e.name)) out.push(toPosix(path.relative(root, full)));
    }
  };
  const base = path.join(root, DS_SRC);
  if (fs.existsSync(base)) walk(base);
  return out.sort();
}

/** A module specifier from `fromFile` to a file on disk, repo-relative, or null. `@/` is the design-system source. */
function resolveSpec(root, fromFile, spec) {
  let base;
  if (spec.startsWith('.')) base = path.resolve(root, path.dirname(fromFile), spec);
  else if (spec.startsWith('@/')) base = path.join(root, DS_SRC, spec.slice(2));
  else return null;
  const tries = [base, ...['.jsx', '.js', '.tsx', '.ts'].map((x) => base + x), ...['index.jsx', 'index.js'].map((x) => path.join(base, x))];
  const file = tries.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  return file ? toPosix(path.relative(root, file)) : null;
}

/** What a stories file's meta names as its `component`: `{source}` when the import resolves to one file, else `{name}`. */
function storiesComponent(root, storiesFile) {
  const text = fs.readFileSync(path.join(root, storiesFile), 'utf8');
  const ident = text.match(/(?:^|[{,\s])component:\s*([A-Z]\w*)\s*(?:,|\}|$)/m)?.[1];
  if (!ident) return null;
  for (const m of text.matchAll(/import\s+([^;]+?)\s+from\s+['"]([^'"]+)['"]/g)) {
    const [clause, spec] = [m[1], m[2]];
    const def = clause.match(/^\s*([A-Za-z_$][\w$]*)/)?.[1];
    const named = [...(clause.match(/\{([^}]*)\}/)?.[1] ?? '').split(',')].map((p) => p.trim().split(/\s+as\s+/)).find(([orig, local]) => (local ?? orig) === ident);
    if (def !== ident && !named) continue;
    let file = resolveSpec(root, storiesFile, spec);
    let exported = def === ident ? 'default' : named[0];
    // A folder index: follow its re-export of the name, a few hops at most; still an index, it is a barrel.
    for (let hop = 0; hop < 4 && file && /\/index\.jsx?$/.test(file); hop++) {
      const pattern =
        exported === 'default'
          ? String.raw`\{\s*default\b[^}]*\}`
          : String.raw`\{[^}]*\b(?:default\s+as\s+${exported}|${exported})\b[^}]*\}`;
      const reexport = fs.readFileSync(path.join(root, file), 'utf8').match(new RegExp(String.raw`export\s*${pattern}\s*from\s*['"]([^'"]+)['"]`));
      if (reexport && exported !== 'default' && new RegExp(String.raw`\bdefault\s+as\s+${exported}\b`).test(reexport[0])) exported = 'default';
      file = reexport ? resolveSpec(root, file, reexport[1]) : null;
    }
    if (file && /\/index\.jsx?$/.test(file)) file = null;
    return file ? { source: file } : { name: named ? named[0] : ident };
  }
  return null;
}

/**
 * The page finder for one tree: `({name, source}) → page path | null`. The
 * index of pages is built on the first call. `registry` is the component
 * registry (`design-system/figma/component-registry.json`), the fallback.
 */
export function createPageFinder(root, registry = null) {
  let index;
  const build = () => {
    const bySource = new Map();
    const byName = new Map();
    const add = (map, key, page) => map.set(key, [...(map.get(key) ?? []), page]);
    for (const page of pagesUnder(root)) {
      const text = fs.readFileSync(path.join(root, page), 'utf8');
      const of = text.match(/<Meta\s[^>]*\bof=\{(\w+)\}/)?.[1];
      const spec = of && text.match(new RegExp(`import\\s+\\*\\s+as\\s+${of}\\s+from\\s+['"]([^'"]+)['"]`))?.[1];
      const stories = spec && resolveSpec(root, page, spec);
      const component = stories && storiesComponent(root, stories);
      if (component?.source) add(bySource, component.source, page);
      else if (component?.name) add(byName, component.name, page);
    }
    return { bySource, byName };
  };
  /** Several pages for one component: the one beside its source, else the first. */
  const pick = (pages, source) => (pages ? (pages.find((p) => source && path.posix.dirname(p) === path.posix.dirname(source)) ?? pages[0]) : null);
  return function pageFor({ name, source }) {
    index ??= build();
    const found = pick(index.bySource.get(source), source) ?? pick(index.byName.get(name), source);
    if (found) return found;
    const entry = registry?.components?.[name]?.code;
    if (entry?.mdxPath && source && entry.source === source && fs.existsSync(path.join(root, entry.mdxPath))) return entry.mdxPath;
    return null;
  };
}
