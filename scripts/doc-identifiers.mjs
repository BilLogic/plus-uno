/**
 * The reader half of `check:doc-identifiers` — pure string functions, no `fs`.
 *
 * WHY IT IS SEPARATE. Two callers need the same reading of a page. The Node
 * check (`scripts/check-doc-identifiers.mjs`) reads the corpus off disk at PR
 * time; the browser story test (`design-system/src/storybook-docs/
 * DocumentedContract.stories.jsx`) reads the same pages through Vite's
 * `import.meta.glob(..., '?raw')` and renders what they claim. If the two
 * disagreed about what a page says, the render test would be asserting against
 * a different document than the gate — so they share this module and there is
 * only one answer. Nothing here may import a Node built-in.
 *
 * WHAT A "CLAIM" IS. Not every backticked word in a docs page is a claim about
 * the source. `Use it for navigation too` names nothing. This module extracts
 * only the four shapes whose *position* makes them a claim:
 *
 *   1. A CSS custom property — `--elevation-sm`, `var(--x)`, or `--x:` inside a
 *      css/scss fence. This is the #78 / #79 / #98 defect class verbatim.
 *   2. A JSX attribute in a fenced example — `<Button leadingVisual="trash" />`
 *      claims `leadingVisual` is a prop and `"trash"` a legal value.
 *   3. A prose code span of the form `prop="value"` — `size="h1"`, `mode="multi"`.
 *      The `=` is what makes it a claim rather than a mention.
 *   4. A prose code span holding a bare identifier — `primaryButton`, `Dropdown`,
 *      `plus-btn--icon-only`. Checked only in the shapes a fabricated name
 *      actually takes; see IDENTIFIER_SHAPES.
 *
 * Everything else — English words, quoted UI strings, paths, expressions with
 * spaces or parentheses — is left alone deliberately. A gate that argues with
 * prose gets switched off.
 */

/* ------------------------------------------------------------ vocabularies */

/**
 * Attributes that land on a DOM element whatever the component does with them,
 * because every component in this system spreads its rest props. Naming one in
 * an example is not a claim about that component's propTypes.
 */
export const STANDARD_ATTRIBUTES = new Set([
  // React-specific spellings
  'className', 'htmlFor', 'key', 'ref', 'style', 'children', 'dangerouslySetInnerHTML',
  'defaultValue', 'defaultChecked', 'suppressHydrationWarning',
  // global HTML
  'id', 'title', 'role', 'lang', 'dir', 'hidden', 'draggable', 'tabIndex', 'slot',
  'contentEditable', 'spellCheck', 'translate', 'inputMode', 'enterKeyHint', 'part',
  // form + media attributes any input-ish element takes
  'name', 'value', 'type', 'placeholder', 'disabled', 'required', 'readOnly', 'checked',
  'autoFocus', 'autoComplete', 'multiple', 'min', 'max', 'step', 'minLength', 'maxLength',
  'pattern', 'rows', 'cols', 'wrap', 'form', 'accept', 'capture', 'list',
  'src', 'alt', 'width', 'height', 'loading', 'srcSet', 'sizes', 'poster', 'controls',
  'href', 'target', 'rel', 'download', 'action', 'method', 'encType', 'noValidate',
  'colSpan', 'rowSpan', 'scope', 'headers', 'span', 'start', 'reversed',
  'open', 'selected', 'defaultOpen', 'content', 'property', 'charSet', 'httpEquiv',
]);

/**
 * React's DOM event props. These really do pass through to the element, so
 * naming one is not a claim about a component's propTypes.
 *
 * The list is closed on purpose. A blanket `/^on[A-Z]/` allowance let
 * `onConfirm` — documented in a props table for a component whose callback is
 * `onDelete` — through the gate, and that is precisely the defect class.
 */
export const DOM_EVENTS = new Set([
  'onAbort', 'onAnimationEnd', 'onAnimationIteration', 'onAnimationStart', 'onBeforeInput',
  'onBlur', 'onCanPlay', 'onCanPlayThrough', 'onChange', 'onClick', 'onCompositionEnd',
  'onCompositionStart', 'onCompositionUpdate', 'onContextMenu', 'onCopy', 'onCut',
  'onDoubleClick', 'onDrag', 'onDragEnd', 'onDragEnter', 'onDragExit', 'onDragLeave',
  'onDragOver', 'onDragStart', 'onDrop', 'onDurationChange', 'onEmptied', 'onEncrypted',
  'onEnded', 'onError', 'onFocus', 'onGotPointerCapture', 'onInput', 'onInvalid',
  'onKeyDown', 'onKeyPress', 'onKeyUp', 'onLoad', 'onLoadStart', 'onLoadedData',
  'onLoadedMetadata', 'onLostPointerCapture', 'onMouseDown', 'onMouseEnter', 'onMouseLeave',
  'onMouseMove', 'onMouseOut', 'onMouseOver', 'onMouseUp', 'onPaste', 'onPause', 'onPlay',
  'onPlaying', 'onPointerCancel', 'onPointerDown', 'onPointerEnter', 'onPointerLeave',
  'onPointerMove', 'onPointerOut', 'onPointerOver', 'onPointerUp', 'onProgress',
  'onRateChange', 'onReset', 'onScroll', 'onSeeked', 'onSeeking', 'onSelect', 'onStalled',
  'onSubmit', 'onSuspend', 'onTimeUpdate', 'onToggle', 'onTouchCancel', 'onTouchEnd',
  'onTouchMove', 'onTouchStart', 'onTransitionEnd', 'onVolumeChange', 'onWaiting', 'onWheel',
]);

/**
 * Names that belong to React or the language rather than to this design system.
 * A docs page may reference them without any source in `design-system/` holding
 * them.
 */
export const PLATFORM_NAMES = new Set([
  'propTypes', 'defaultProps', 'displayName', 'PropTypes', 'React', 'Fragment',
  'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useId',
  'createPortal', 'forwardRef', 'memo', 'Boolean', 'Object', 'Array', 'String', 'Number',
  'Math', 'JSON', 'Promise', 'Set', 'Map', 'Date', 'Intl', 'Element', 'HTMLElement',
  'Storybook', 'Figma', 'MDX', 'JSX', 'CSS', 'SCSS', 'HTML', 'DOM', 'API', 'URL', 'ARIA',
  'WCAG', 'SMART', 'PLUS', 'UNO', 'ID', 'UI', 'UX', 'Tailwind', 'Vite', 'Vitest',
]);

/** Element names that are HTML, not components, even though a span holds them bare. */
export const HTML_ELEMENTS = new Set([
  'a', 'abbr', 'article', 'aside', 'b', 'body', 'br', 'button', 'canvas', 'caption',
  'code', 'col', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'em', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'i', 'iframe', 'img', 'input', 'kbd', 'label', 'legend', 'li',
  'main', 'mark', 'nav', 'ol', 'optgroup', 'option', 'p', 'pre', 'progress', 'q',
  's', 'section', 'select', 'small', 'span', 'strong', 'sub', 'summary', 'sup',
  'svg', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr',
  'u', 'ul', 'video',
]);

/* ------------------------------------------------------------------ slicing */

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

/** Frontmatter is metadata, not prose. Kept as blank lines so line numbers hold. */
export function stripFrontmatter(text) {
  const m = text.match(/^---\n[\s\S]*?\n---\n/);
  if (!m) return text;
  return '\n'.repeat(m[0].split('\n').length - 1) + text.slice(m[0].length);
}

/**
 * Split a page into fenced code blocks and everything else, preserving line
 * numbers. Prose comes back with fences blanked rather than removed, so a span
 * found at prose line 172 really is on line 172 of the file.
 */
export function splitFences(text) {
  const fences = [];
  const re = /^([ \t]*)(`{3,}|~{3,})([^\n`]*)\n([\s\S]*?)^[ \t]*\2[ \t]*$/gm;
  let prose = '';
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    prose += text.slice(last, m.index);
    fences.push({
      lang: (m[3] || '').trim().split(/\s+/)[0].toLowerCase(),
      code: m[4],
      startLine: lineAt(text, m.index) + 1, // the line after the opening fence
    });
    prose += '\n'.repeat(m[0].split('\n').length - 1);
    last = m.index + m[0].length;
  }
  prose += text.slice(last);
  return { fences, prose };
}

/* ------------------------------------------------------- 1. token claims */

/**
 * A whole token name and nothing else. The trailing-hyphen exclusion is what
 * separates a name from a family: `--color-` and `--size-card-pad-` are how
 * these docs write "every token under this prefix", and
 * `design-system/guidelines/figma/token-mapping.md` writes
 * `--size-card-pad-{sm|md|lg}` — a pattern, already expanded and validated by
 * `check:token-registry`. Neither is a claim that a token by that literal name
 * exists.
 */
const WHOLE_TOKEN = /^--[a-zA-Z][a-zA-Z0-9_]*(?:-[a-zA-Z0-9_]+)*$/;
const VAR_REF = /(?<![\w-])var\(\s*(--[a-zA-Z][a-zA-Z0-9_-]*)\s*[),]/g;
const DECLARATION = /^\s*(--[a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*\S/;

/**
 * Every CSS custom property the page claims exists. Three positions count, and
 * they are exactly the three `elevation.md` used before `0c454cce`: a table
 * cell holding `` `--elevation-sm` ``, a `var(--elevation-sm)` reference, and a
 * `--elevation-sm: ...` declaration in a css fence.
 *
 * A `--` that is not one of those three is not read as a token. `git log
 * --follow -- <path>` inside a code span is a command line, and
 * `plus-btn--icon-only` is a BEM class whose `--` belongs to the class.
 */
export function tokenClaims(text) {
  const { fences, prose } = splitFences(stripFrontmatter(text));
  const out = [];
  const push = (name, line) => {
    if (WHOLE_TOKEN.test(name)) out.push({ name, line });
  };

  for (const span of codeSpans(prose)) {
    const s = span.text.trim();
    if (s.startsWith('--')) {
      const decl = s.match(DECLARATION);
      push(decl ? decl[1] : s, span.line);
    }
    for (const m of s.matchAll(VAR_REF)) push(m[1], span.line);
  }

  for (const f of fences) {
    const isStyle = ['css', 'scss', 'sass', 'less'].includes(f.lang);
    for (const [i, raw] of f.code.split('\n').entries()) {
      const at = f.startLine + i;
      for (const m of raw.matchAll(VAR_REF)) push(m[1], at);
      const decl = isStyle && raw.match(DECLARATION);
      if (decl) push(decl[1], at);
    }
  }
  return dedupe(out, (c) => `${c.name}@${c.line}`);
}

/* --------------------------------------------------------- 2. JSX claims */

const JSX_FENCE_LANGS = new Set(['jsx', 'tsx', 'js', 'javascript', 'ts', 'typescript', 'react']);

/**
 * JSX elements written in fenced examples, with their attributes.
 *
 * Hand-walked rather than regexed: an attribute value is routinely
 * `onChange={(next) => { setGrade(next); }}`, and a regex that stops at the
 * first `>` truncates the element and loses every attribute after it.
 */
export function jsxClaims(text) {
  const { fences } = splitFences(stripFrontmatter(text));
  const out = [];
  for (const f of fences) {
    if (!JSX_FENCE_LANGS.has(f.lang)) continue;
    for (const el of jsxElements(f.code)) {
      out.push({ ...el, line: f.startLine + el.lineOffset });
    }
  }
  return out;
}

/**
 * A comment marking the example below it as the thing NOT to do. These pages
 * are written in correct/incorrect pairs, and the incorrect half sometimes
 * demonstrates a name that genuinely does not exist — `<Alert show={...}>`,
 * `<Card radiusSize="lg">`, `<Table columns={...} data={...}>` are all captioned
 * "this prop is not real". Failing on those would make the gate demand that
 * docs stop showing the mistake they are warning about.
 */
const INCORRECT = /\b(incorrect|wrong|do not|don't|avoid|never|instead of|bad)\b|✗|❌|🚫/i;

/** `<Tag ...>` occurrences in a code string. Exported for the tests. */
export function jsxElements(code) {
  const out = [];
  const open = /<([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)*)(?=[\s/>])/g;
  let m;
  while ((m = open.exec(code)) !== null) {
    const end = endOfTag(code, open.lastIndex);
    if (end === -1) continue;
    out.push({
      tag: m[1],
      attrs: parseAttributes(code.slice(open.lastIndex, end), code, open.lastIndex),
      lineOffset: code.slice(0, m.index).split('\n').length - 1,
      markedIncorrect: precededByIncorrectComment(code, m.index),
    });
    open.lastIndex = end;
  }
  return out;
}

/**
 * Is the comment block directly above this element an anti-example caption?
 *
 * The whole contiguous block, not the last line of it. These captions wrap:
 * "// Incorrect — `radiusSize` on Card accepts only `sm` and `md`. (Modal and"
 * / "// Jumbotron accept `lg`; Card does not.)" — and reading only the second
 * line finds no marker at all.
 */
function precededByIncorrectComment(code, elementStart) {
  let before = code.slice(0, elementStart);
  if (before.slice(before.trimEnd().length).split('\n').length > 2) return false;
  before = before.trimEnd();

  let block = '';
  for (;;) {
    const comments = [...before.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g)];
    const last = comments[comments.length - 1];
    if (!last || before.slice(last.index + last[0].length).trim() !== '') break;
    block = `${last[0]}\n${block}`;
    before = before.slice(0, last.index).trimEnd();
  }
  return INCORRECT.test(block);
}

/** Index of the `>` closing the tag that starts at `from`, honouring {} and quotes. */
function endOfTag(code, from) {
  let depth = 0;
  let quote = null;
  for (let i = from; i < code.length; i += 1) {
    const ch = code[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === '>' && depth === 0) return i;
  }
  return -1;
}

/** `name="v"` / `name={expr}` / bare `name` inside one tag's attribute region. */
function parseAttributes(region, code, regionStart) {
  const attrs = [];
  let i = 0;
  while (i < region.length) {
    const rest = region.slice(i);
    // `width={800} // Set explicit width if needed` — the comment is prose, and
    // reading it as attributes invented four props on Modal.
    const comment = rest.match(/^\s*(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/);
    if (comment) {
      i += comment[0].length;
      continue;
    }
    const nameMatch = rest.match(/^\s*([A-Za-z_$][\w$]*(?:-[\w$]+)*)/);
    if (!nameMatch) {
      // `{...rest}` spreads, stray `/`, or anything else — skip a character
      i += 1;
      continue;
    }
    const name = nameMatch[1];
    const nameEnd = i + nameMatch[0].length;
    const after = region.slice(nameEnd).match(/^\s*=/);
    let value = null;
    let next = nameEnd;
    if (after) {
      const valueStart = nameEnd + after[0].length;
      const v = region.slice(valueStart).match(/^\s*/)[0].length + valueStart;
      if (region[v] === '"' || region[v] === "'") {
        const close = region.indexOf(region[v], v + 1);
        value = close === -1 ? null : region.slice(v + 1, close);
        next = close === -1 ? region.length : close + 1;
      } else if (region[v] === '{') {
        let depth = 0;
        let j = v;
        for (; j < region.length; j += 1) {
          if (region[j] === '{') depth += 1;
          else if (region[j] === '}') { depth -= 1; if (depth === 0) break; }
        }
        value = null; // an expression, not a literal we can check
        next = j + 1;
      } else {
        const end = region.slice(v).search(/[\s/>]|$/);
        value = region.slice(v, v + end);
        next = v + end;
      }
    }
    attrs.push({
      name,
      value,
      lineOffset: code.slice(0, regionStart + i).split('\n').length - 1,
    });
    i = next;
  }
  return attrs;
}

/* ------------------------------------------------- 3 + 4. prose spans */

/** Backticked spans outside fences, with line numbers. */
export function codeSpans(prose) {
  const out = [];
  for (const m of prose.matchAll(/`([^`\n]+)`/g)) {
    out.push({ text: m[1], line: lineAt(prose, m.index) });
  }
  return out;
}

/**
 * `prop="value"` written inline in prose — `size="h1"`, `mode="multi"`,
 * `renderAs="inline"`. The `=` is the whole signal: the author is asserting a
 * legal pairing, not mentioning a word.
 */
export function proseAttrClaims(text) {
  const { prose } = splitFences(stripFrontmatter(text));
  const out = [];
  for (const span of codeSpans(prose)) {
    const m = span.text.match(/^([a-zA-Z_$][\w$]*(?:-[\w$]+)*)\s*=\s*(?:"([^"]*)"|'([^']*)')$/);
    if (m) out.push({ prop: m[1], value: m[2] ?? m[3], line: span.line });
  }
  return out;
}

/**
 * The shapes a fabricated name actually takes. A bare English word is not one
 * of them — `active`, `size` and `text` are all real props AND ordinary words,
 * and there is no way to tell from the span which was meant. These three are
 * unambiguous, and between them they cover every prop, component and token name
 * this system uses:
 *
 *   camelCase   an internal capital: `primaryButton`, `onDismiss`, `restoreFocus`
 *   PascalCase  a leading capital:   `Dropdown`, `TagInput`, `RadioButtonGroup`
 *   kebab-case  an internal hyphen:  `social-emotional`, `plus-btn--icon-only`
 */
export const IDENTIFIER_SHAPES = [
  { shape: 'camelCase', match: /^[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*$/ },
  { shape: 'PascalCase', match: /^[A-Z][a-zA-Z0-9]+$/ },
  { shape: 'kebab-case', match: /^-{0,2}[a-z][a-z0-9]*(?:-{1,2}[a-z0-9]+)+$/ },
];

/** Bare identifier spans in prose, tagged with the shape that matched. */
export function proseNameClaims(text) {
  const { prose } = splitFences(stripFrontmatter(text));
  const out = [];
  for (const span of codeSpans(prose)) {
    const raw = span.text.trim();
    const found = IDENTIFIER_SHAPES.find((s) => s.match.test(raw));
    if (found) out.push({ name: raw, shape: found.shape, line: span.line });
  }
  return dedupe(out, (c) => `${c.name}@${c.line}`);
}

function dedupe(list, key) {
  const seen = new Set();
  return list.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* -------------------------------------------------------- source reading */

/**
 * `PropTypes.oneOf(TAG_VARIANTS)` — an enum whose values are named by a
 * constant rather than written inline.
 *
 * WHY THIS EXISTS. `parsePropTypes` matched only `oneOf([...])`. Five props
 * across three components declare their values as a module constant instead —
 * `Tag.variant`, `Tag.color`, `BadgeVariants.variant`,
 * `BadgeVariants.appearance`, `Surface.level` — and for all five `enumValues`
 * came back `null`, which this check reads as "no enum to compare against".
 * So the `variant` claim shape, which the header advertises, was never made on
 * those pages: `<Tag variant="removable">` and `<Tag color="chartreuse">` both
 * passed a full green run in #276.
 *
 * SAME FILE ONLY, AND NEVER AN EMPTY LIST. A constant imported from another
 * module is not followed — that needs module resolution. Anything this cannot
 * read returns `null`, meaning "not checked", which is the behaviour that was
 * already there. It must never return `[]`: that reads as "no legal value" and
 * would fail every correct page on the five props below rather than no page.
 * The two ways to get there are an import, and an array whose contents this
 * regex mis-slices — a value containing a `]`, say — so both end at `null`.
 *
 * @param {string} source The component's source text.
 * @param {string} name The constant's identifier.
 * @returns {string[] | null} The string values, or `null` when it cannot be read here.
 */
export function namedEnumValues(source, name) {
  // `name` reaches here from a `[A-Za-z_$][\w$]*` match, so `$` is the one
  // regex metacharacter it can carry — and an unescaped `$` is an anchor, which
  // silently matches nothing.
  const escaped = name.replace(/\$/g, '\\$');
  const decl = new RegExp(`(?:export\\s+)?const\\s+${escaped}\\s*=\\s*\\[([^\\]]*)\\]`).exec(source);
  if (!decl) return null;
  const values = [...decl[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map((v) => v[1] ?? v[2]);
  return values.length ? values : null;
}

/** `<Name>.propTypes = { ... }` → [{ name, enumValues }]. */
export function parsePropTypes(source, symbol) {
  const at = source.indexOf(`${symbol}.propTypes`);
  if (at === -1) return [];
  const open = source.indexOf('{', at);
  const close = matchBrace(source, open);
  if (close === -1) return [];
  const body = source.slice(open + 1, close);

  const props = [];
  let depth = 0;
  let buf = '';
  const flush = () => {
    const cleaned = buf.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').trim();
    buf = '';
    if (!cleaned) return;
    const m = cleaned.match(/^([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/);
    if (!m) return;
    const oneOf = m[2].match(/PropTypes\.oneOf\(\[([\s\S]*?)\]\)/);
    const oneOfNamed = oneOf ? null : m[2].match(/PropTypes\.oneOf\(\s*([A-Za-z_$][\w$]*)\s*\)/);
    props.push({
      name: m[1],
      type: m[2].replace(/\s+/g, ' ').trim(),
      // Only a TOP-LEVEL `.isRequired`. `arrayOf(shape({ value: string.isRequired }))`
      // marks the shape's field, not the prop — reading it as the prop's made
      // `options` look required, and the render test then passed Select a string.
      required: /\.isRequired\s*$/.test(m[2].trim()),
      enumValues: oneOf
        ? [...oneOf[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map((v) => v[1] ?? v[2])
        : oneOfNamed
          ? namedEnumValues(source, oneOfNamed[1])
          : null,
    });
  };
  for (const ch of body) {
    if ('([{'.includes(ch)) depth += 1;
    else if (')]}'.includes(ch)) depth -= 1;
    if (ch === ',' && depth === 0) { flush(); continue; }
    buf += ch;
  }
  flush();
  return props;
}

/**
 * The symbol the component is implemented as. Mirrors
 * `scripts/generate-component-docs.mjs`: the filename is not reliable —
 * `RadioButtonGroup.jsx` implements `Scale`.
 */
export function implSymbol(source, fileName) {
  if (new RegExp(`\\b${fileName}\\.propTypes\\s*=`).test(source)) return fileName;
  const aliased = source.match(new RegExp(`export\\s*\\{\\s*(\\w+)\\s+as\\s+${fileName}\\s*\\}`));
  if (aliased) return aliased[1];
  const def = source.match(/export\s+default\s+(\w+)\s*;/);
  if (def) return def[1];
  return fileName;
}

/** Props named in the destructured signature — some are accepted but not declared. */
export function parseSignatureProps(source, symbol) {
  const sig = source.match(
    new RegExp(`(?:export\\s+)?const\\s+${symbol}\\s*=\\s*(?:\\([^)]*?\\)\\s*=>\\s*)?\\(\\{([\\s\\S]*?)\\}\\s*(?:,\\s*\\w+\\s*)?\\)`, 'm'),
  );
  if (!sig) return [];
  return [...sig[1].matchAll(/(^|[,{\s])([A-Za-z_$][\w$]*)\s*(?=[,=:}])/g)].map((m) => m[2]);
}

/** `Name.Sub = Impl` — a sub-component an example may write as `<Name.Sub>`. */
export function parseSubComponents(source, symbol) {
  return [...source.matchAll(new RegExp(`^${symbol}\\.([A-Z]\\w*)\\s*=\\s*(\\w+)`, 'gm'))]
    .map((m) => ({ name: m[1], impl: m[2] }));
}

/** Every CSS custom property *defined* in a stylesheet. */
export function definedTokens(css) {
  return [...css.matchAll(/(^|[;{\s])(--[a-zA-Z][a-zA-Z0-9_-]*)\s*:/g)].map((m) => m[2]);
}

/**
 * What a docs page claims about one component, resolved against its source.
 *
 * `variants` is every legal enum value the page names, however it names it — as
 * a bare span (`` `social-emotional` `` in a sentence listing the SMART
 * domains), inline as `size="h1"`, or as an attribute in a fenced example.
 * `props` is every prop of the component the page names. Both are what the
 * browser test then has to actually render.
 *
 * Shared with `scripts/check-doc-identifiers.mjs` so the gate and the render
 * test read the same page the same way.
 */
export function documentedSurface(mdx, componentName, props) {
  const spans = new Set(codeSpans(splitFences(stripFrontmatter(mdx)).prose).map((s) => s.text.trim()));
  const variants = new Map();
  const add = (prop, value) => {
    const legal = props.get(prop)?.enumValues;
    if (!legal?.includes(value)) return;
    if (!variants.has(prop)) variants.set(prop, new Set());
    variants.get(prop).add(value);
  };

  for (const el of jsxClaims(mdx)) {
    if (el.tag !== componentName || el.markedIncorrect) continue;
    for (const a of el.attrs) if (a.value !== null) add(a.name, a.value);
  }
  for (const c of proseAttrClaims(mdx)) add(c.prop, c.value);
  for (const [prop, meta] of props) {
    for (const value of meta.enumValues ?? []) if (spans.has(value)) add(prop, value);
  }

  return {
    variants: new Map([...variants].map(([p, v]) => [p, [...v]])),
    props: [...props.keys()].filter((p) => spans.has(p)),
  };
}

/** Relative `./x.jsx` imports of an MDX page — the demo modules it renders. */
export function relativeImports(text) {
  return [...text.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map((m) => m[1]);
}

function matchBrace(src, open) {
  if (src[open] !== '{') return -1;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}
