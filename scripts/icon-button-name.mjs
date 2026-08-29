/**
 * The pure half of `check:icon-button-name`.
 *
 * WHAT IT LOOKS FOR. A button whose only content is an icon, and which carries
 * no accessible name — no `aria-label`, no `aria-labelledby`, no `title`, no
 * text. A screen reader announces it as "button", which is the whole of what
 * its user is told about a control that deletes a session or expands a row.
 * axe calls this `button-name`; WCAG calls it 4.1.2 Name, Role, Value.
 *
 * WHY A STATIC CHECK WHEN axe ALREADY REPORTS IT. Because axe only sees what a
 * story renders. `check:storybook` found 23 of these across 417 story files —
 * every one of them in a page that happened to have a story, and every one
 * discovered only because someone wrote that story. The same nameless button in
 * a component nobody storied is invisible to the browser suite forever. This
 * reads the source, so a new one fails on the pull request that writes it,
 * before it needs a story to be caught.
 *
 * The two disagree in the other direction too, and that is worth keeping: axe
 * sees a button whose name comes from something this scanner cannot resolve —
 * an `aria-labelledby` pointing at a heading, a `title` computed at runtime.
 * Neither is a superset of the other.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. ANY BODY IT CANNOT READ. `<button>{label}</button>` might hold a word or
 *     an icon; the scanner does not evaluate JavaScript, so an expression body
 *     is treated as text and never flagged. Same for `{...props}` and
 *     `{...args}` on the element: a spread can carry `aria-label`, so an
 *     element with one is skipped. Both are deliberate — a checker that guessed
 *     would produce findings nobody could act on, and this one has to be
 *     believed on every hit.
 *  2. `role="button"` ON A DIV. A real defect and a different one; this reads
 *     `<button>` elements and `<Button>` components.
 *  3. WHETHER THE NAME IS ANY GOOD. `aria-label="button"` passes here and helps
 *     nobody. Naming a control well is a writing problem.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

export const CORPUS = 'design-system/src';

/** Elements that are an icon and nothing else. */
export const ICON_ONLY = /^(i|svg|Icon|FontAwesomeIcon)$/;

/** Attributes that can give a control a name. */
export const NAMING = /(^|\s)(aria-label|aria-labelledby|title|text)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{))/g;

/**
 * Does this attribute list actually NAME the control?
 *
 * An EMPTY name is not a name, and this is not a corner case: the lesson
 * overview's view toggles are written `text=""` beside a `leadingVisual`, which
 * renders `plus-btn--icon-only` with nothing to announce. A scanner that only
 * asked whether the attribute was PRESENT called four of them named. An
 * expression value is treated as a name, since evaluating it is blind spot 1.
 */
export function hasName(attributes) {
  NAMING.lastIndex = 0;
  let match = NAMING.exec(attributes);
  while (match) {
    // Groups: 1 boundary, 2 attribute name, 3 double-quoted, 4 single-quoted,
    // 5 an expression. Counting from the value and forgetting the NAME group is
    // how the first draft read `text=""` as the name "text".
    const expression = match[5];
    const value = match[3] ?? match[4] ?? '';
    if (expression || value.trim()) return true;
    match = NAMING.exec(attributes);
  }
  return false;
}

export function sources(root = REPO_ROOT, dir = CORPUS, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(root, rel, out);
    else if (/\.(jsx|tsx)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

/**
 * The index of the `>` that closes an opening tag starting at `start`.
 *
 * Brace-aware, because JSX attributes hold JavaScript and that JavaScript holds
 * `>`: `onClick={(e) => toggle(e)}` ends an attribute list three characters too
 * early for a scanner that stops at the first angle bracket. That is not a
 * hypothetical — it is why the first sweep of this defect missed the very
 * button that started it, the lessons-table chevron.
 */
export function endOfOpenTag(source, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') { depth += 1; continue; }
    if (ch === '}') { depth -= 1; continue; }
    if (ch === '>' && depth === 0) return i;
  }
  return -1;
}

/** The body of `<tag …>…</tag>`, counting nested `<tag>` of the same name. */
export function bodyOf(source, tag, afterOpen) {
  const open = new RegExp(`<${tag}[\\s/>]`, 'g');
  const close = new RegExp(`</${tag}\\s*>`, 'g');
  let depth = 1;
  let cursor = afterOpen;
  while (depth > 0) {
    close.lastIndex = cursor;
    const nextClose = close.exec(source);
    if (!nextClose) return null;
    open.lastIndex = cursor;
    let nextOpen = open.exec(source);
    while (nextOpen && nextOpen.index < nextClose.index) {
      const end = endOfOpenTag(source, nextOpen.index);
      // A self-closing `<button …/>` inside opens nothing.
      if (end > 0 && source[end - 1] !== '/') depth += 1;
      open.lastIndex = nextOpen.index + 1;
      nextOpen = open.exec(source);
    }
    depth -= 1;
    cursor = nextClose.index + nextClose[0].length;
    if (depth === 0) return { body: source.slice(afterOpen, nextClose.index), end: cursor };
  }
  return null;
}

/**
 * Is this body an icon and nothing else?
 *
 * The tags are stripped BRACE-AWARE rather than with a `<[^>]*>` sweep, and the
 * difference is the whole check: `<i className={`fas fa-chevron-${open}`} />`
 * holds a `{` inside an ATTRIBUTE, and a scanner that looks for `{` in the raw
 * body reads that as an expression it cannot evaluate and skips the button. The
 * lessons-table chevron — 21 of the 23 axe findings — is written exactly that
 * way, so the first draft of this scanner reported everything except the button
 * that prompted it.
 */
export function iconOnly(body) {
  const source = body.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
  const elements = [];
  let text = '';
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '<') {
      const name = /^<\s*\/?\s*([A-Za-z][\w.]*)/.exec(source.slice(i));
      const end = endOfOpenTag(source, i);
      if (end < 0) break;
      if (name) elements.push(name[1]);
      i = end;
      continue;
    }
    text += source[i];
  }
  // An expression in the BODY could be anything, including a word. Blind spot 1.
  if (/\{/.test(text)) return false;
  if (!elements.length) return false;
  if (text.trim()) return false;
  return elements.every((name) => ICON_ONLY.test(name));
}

/**
 * Nameless icon buttons, as `{file, line, tag, source}`.
 *
 * `<Button>` is included because the design system's own component produces
 * `plus-btn--icon-only` whenever it is given neither text nor children, and six
 * of the 23 axe findings were exactly that: the system's button, used as
 * designed, with no name.
 */
export function nameless(files, root = REPO_ROOT) {
  const found = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const tag of ['button', 'Button']) {
      const opens = new RegExp(`<${tag}[\\s/>]`, 'g');
      let match = opens.exec(source);
      while (match) {
        const end = endOfOpenTag(source, match.index);
        if (end < 0) break;
        const attributes = source.slice(match.index + tag.length + 1, end);
        const selfClosing = source[end - 1] === '/';
        // A spread can carry the name. Blind spot 1.
        const spread = /\{\s*\.\.\./.test(attributes);
        let named = hasName(attributes) || spread;
        let empty = selfClosing;
        if (!selfClosing) {
          const body = bodyOf(source, tag, end + 1);
          empty = body ? iconOnly(body.body) : false;
        }
        if (!named && empty) {
          found.push({
            file,
            line: source.slice(0, match.index).split('\n').length,
            tag,
            source: source.slice(match.index, Math.min(end + 1, match.index + 120)).replace(/\s+/g, ' '),
          });
        }
        opens.lastIndex = match.index + 1;
        match = opens.exec(source);
      }
    }
  }
  return found;
}

export function failures(found, baseline) {
  const problems = [];
  const keys = new Set(found.map((f) => `${f.file}:${f.line}`));
  for (const hit of found) {
    const key = `${hit.file}:${hit.line}`;
    if (baseline[key]) continue;
    problems.push(`${key} — <${hit.tag}> has an icon and no name: ${hit.source}`);
  }
  for (const key of Object.keys(baseline)) {
    if (!keys.has(key)) problems.push(`${key} is recorded as a nameless icon button and is not one. Delete the entry.`);
  }
  return problems;
}
