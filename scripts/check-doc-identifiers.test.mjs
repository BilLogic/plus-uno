/**
 * Tests for the docs-identifier guard.
 *
 * Two jobs. The first is #191's rule: a guard nobody has watched fail is a
 * guard nobody knows works, so the centrepiece here is the real defect —
 * `elevation.md` exactly as it stood before `0c454cce`, written into the real
 * corpus, with the real check run against it as a subprocess. If that stops
 * exiting 1, this file goes red.
 *
 * The second is the other half of the same rule, and the one that decides
 * whether the gate survives contact with authors: every shape below marked
 * "not a claim" is a line that today's corpus really contains, and a check that
 * argued with any of them would be switched off within a week.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DOM_EVENTS,
  definedTokens,
  jsxElements,
  namedEnumValues,
  parsePropTypes,
  parseSubComponents,
  proseAttrClaims,
  proseNameClaims,
  splitFences,
  tokenClaims,
} from './doc-identifiers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CHECK = path.join(__dirname, 'check-doc-identifiers.mjs');

/**
 * `design-system/guidelines/foundations/elevation.md` at `0c454cce^` — the
 * document that shipped. Four token names, none of which exist in
 * `_elevation.scss`, in the three positions the page used: a table of code
 * spans, a css fence declaring values, and `var()` calls in usage examples.
 * Verbatim; do not tidy it.
 */
const ELEVATION_MD_BEFORE_0C454CCE = `---
summary: Elevation creates visual hierarchy through shadows
---

<!-- Tier: 2 -->

# Elevation Tokens

Elevation creates visual hierarchy through shadows.

## Elevation Levels

| Token | Usage |
|-------|-------|
| \`--elevation-none\` | No shadow - flat elements |
| \`--elevation-sm\` | Subtle lift - cards, dropdowns |
| \`--elevation-md\` | Moderate lift - modals, popovers |
| \`--elevation-lg\` | High lift - overlay dialogs |

## Shadow Values

\`\`\`css
--elevation-none: none;
--elevation-sm: 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06);
--elevation-md: 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06);
--elevation-lg: 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.06);
\`\`\`

## Usage

\`\`\`css
.my-card {
  box-shadow: var(--elevation-sm);
}

.my-modal {
  box-shadow: var(--elevation-md);
}
\`\`\`
`;

const FABRICATED = ['--elevation-none', '--elevation-sm', '--elevation-md', '--elevation-lg'];

/* ------------------------------------------------- the defect that shipped */

test('0c454cce: the four fabricated elevation tokens are absent from _elevation.scss', () => {
  const scss = fs.readFileSync(
    path.join(REPO_ROOT, 'design-system/src/tokens/_elevation.scss'),
    'utf8',
  );
  const defined = new Set(definedTokens(scss));
  assert.ok(defined.has('--elevation-light-1'), 'the real names must still be there');
  assert.ok(defined.has('--elevation-light-5'));
  for (const name of FABRICATED) {
    assert.equal(defined.has(name), false, `${name} must not exist — that was the defect`);
  }
});

test('0c454cce: every fabricated token is read as a claim, in all three positions', () => {
  const claims = tokenClaims(ELEVATION_MD_BEFORE_0C454CCE);
  const names = new Set(claims.map((c) => c.name));
  for (const name of FABRICATED) assert.ok(names.has(name), `${name} was not extracted`);

  // the table row, the css declaration and the var() call are three separate claims
  const sm = claims.filter((c) => c.name === '--elevation-sm').map((c) => c.line);
  assert.equal(sm.length, 3, `expected --elevation-sm on three lines, got ${sm.join(', ')}`);
  assert.deepEqual([...sm].sort((a, b) => a - b), sm, 'lines should be in document order');
});

test('0c454cce: reintroducing the page fails the check, naming the page and the token', () => {
  const fixture = path.join(REPO_ROOT, 'design-system/guidelines/__regression-0c454cce.md');
  try {
    fs.writeFileSync(fixture, ELEVATION_MD_BEFORE_0C454CCE);
    const r = spawnSync(process.execPath, [CHECK], { cwd: REPO_ROOT, encoding: 'utf8' });
    const output = `${r.stdout}${r.stderr}`;

    assert.equal(r.status, 1, `expected exit 1, got ${r.status}:\n${output}`);
    assert.match(output, /design-system\/guidelines\/__regression-0c454cce\.md/);
    for (const name of FABRICATED) {
      assert.ok(output.includes(name), `the failure must name ${name}`);
    }
  } finally {
    fs.rmSync(fixture, { force: true });
  }
});

test('a deliberately fabricated token fails the check', () => {
  const fixture = path.join(REPO_ROOT, 'design-system/guidelines/__regression-fabricated.md');
  // #98's real invention, plus one that never existed anywhere.
  const page = [
    '# Fixture',
    '',
    'Pad the container with `--size-surface-container-pad-x-sm`.',
    '',
    '```css',
    '.thing { gap: var(--totally-invented-token); }',
    '```',
    '',
  ].join('\n');
  try {
    fs.writeFileSync(fixture, page);
    const r = spawnSync(process.execPath, [CHECK], { cwd: REPO_ROOT, encoding: 'utf8' });
    const output = `${r.stdout}${r.stderr}`;
    assert.equal(r.status, 1, `expected exit 1, got ${r.status}:\n${output}`);
    assert.ok(output.includes('--size-surface-container-pad-x-sm'));
    assert.ok(output.includes('--totally-invented-token'));
  } finally {
    fs.rmSync(fixture, { force: true });
  }
});

test('a fabricated prop and a fabricated variant both fail the check', () => {
  const fixture = path.join(REPO_ROOT, 'design-system/guidelines/__regression-props.md');
  const page = [
    '# Fixture',
    '',
    '```jsx',
    '<Button text="Save" emphasis="loud" />',
    '<Badge text="New" size="h9" />',
    '```',
    '',
    'Written inline, `fill="translucent"` is the same claim.',
    '',
  ].join('\n');
  try {
    fs.writeFileSync(fixture, page);
    const r = spawnSync(process.execPath, [CHECK], { cwd: REPO_ROOT, encoding: 'utf8' });
    const output = `${r.stdout}${r.stderr}`;
    assert.equal(r.status, 1, `expected exit 1, got ${r.status}:\n${output}`);
    assert.match(output, /emphasis is not a prop of Button/);
    assert.match(output, /Badge size="h9"/);
    assert.match(output, /fill="translucent"/);
  } finally {
    fs.rmSync(fixture, { force: true });
  }
});

test('the corpus as it stands is clean — the check exits 0 on main', () => {
  const r = spawnSync(process.execPath, [CHECK], { cwd: REPO_ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
});

/* ------------------------------------------------------ what is not a claim */

test('a `--` that is not a token is not read as one', () => {
  for (const line of [
    'Run `git log --follow -- design-system/src/components/` and read that.',
    'The class is `plus-btn--icon-only`, which sets a square box.',
    'Every token under `--color-` is a role, not a value.',
    'Spacing is `--size-card-pad-{sm|md|lg}` in the mapping table.',
  ]) {
    assert.deepEqual(tokenClaims(line), [], `false claim from: ${line}`);
  }
});

test('a real token reference is read as a claim wherever it sits', () => {
  assert.equal(tokenClaims('Use `--elevation-light-2` for cards.')[0].name, '--elevation-light-2');
  assert.equal(
    tokenClaims('```css\n.a { box-shadow: var(--elevation-light-2); }\n```')[0].name,
    '--elevation-light-2',
  );
  assert.equal(
    tokenClaims('```scss\n--elevation-light-2: 0 1px 2px black;\n```')[0].name,
    '--elevation-light-2',
  );
});

test('a comment inside a tag is prose, not four more props', () => {
  const [el] = jsxElements('<Modal\n  show={open}\n  width={800} // Set explicit width if needed\n>');
  assert.equal(el.tag, 'Modal');
  assert.deepEqual(el.attrs.map((a) => a.name), ['show', 'width']);
});

test('an attribute whose value spans braces and newlines does not truncate the element', () => {
  const [el] = jsxElements(
    '<Select\n  options={grades}\n  onChange={(next) => { setGrade(next); setErr(!next); }}\n  mode="multi"\n/>',
  );
  assert.deepEqual(el.attrs.map((a) => a.name), ['options', 'onChange', 'mode']);
  assert.equal(el.attrs.at(-1).value, 'multi');
});

test('an example captioned as the mistake is exempt, its correct twin is not', () => {
  const code = [
    '// Incorrect — `radiusSize` on Card accepts only `sm` and `md`. (Modal and',
    '// Jumbotron accept `lg`; Card does not.)',
    '<Card radiusSize="lg" title="Weekly summary" />',
    '',
    '// Correct.',
    '<Card radiusSize="md" title="Weekly summary" />',
  ].join('\n');
  const [bad, good] = jsxElements(code);
  assert.equal(bad.markedIncorrect, true, 'the whole caption block must be read, not its last line');
  assert.equal(good.markedIncorrect, false);
});

test('a bare English word in a span is not read as an identifier', () => {
  const names = proseNameClaims('`active` only adds a CSS class, and `size` is not physical size.');
  assert.deepEqual(names, []);
});

test('the three identifier shapes are read, and nothing else is', () => {
  const names = proseNameClaims(
    'Use `primaryButton` on `Modal`; the class is `plus-btn--icon-only`. ' +
      'Compare `Close modal`, `clamp(...)` and `design-system/guidelines/x.md`.',
  ).map((c) => c.name);
  assert.deepEqual(names, ['primaryButton', 'Modal', 'plus-btn--icon-only']);
});

test('`prop="value"` in prose is a claim; a bare mention of the prop is not', () => {
  assert.deepEqual(
    proseAttrClaims('so `size="h1"` produces heading-sized text, unlike `size`').map((c) => [c.prop, c.value]),
    [['size', 'h1']],
  );
});

test('onConfirm is not a DOM event, onChange is', () => {
  assert.equal(DOM_EVENTS.has('onChange'), true);
  assert.equal(DOM_EVENTS.has('onFocus'), true);
  assert.equal(DOM_EVENTS.has('onConfirm'), false, 'a blanket on[A-Z] rule let this defect through');
  assert.equal(DOM_EVENTS.has('onDismiss'), false);
});

/* -------------------------------------------------------- source reading */

test('propTypes enums are read off the real Button', () => {
  const source = fs.readFileSync(
    path.join(REPO_ROOT, 'design-system/src/components/actions/Button/Button.jsx'),
    'utf8',
  );
  const props = new Map(parsePropTypes(source, 'Button').map((p) => [p.name, p.enumValues]));
  assert.deepEqual(props.get('size'), ['small', 'medium', 'large']);
  assert.ok(props.get('style').includes('social-emotional'));
  assert.equal(props.get('text'), null, 'a non-enum prop has no legal-value list');
});

test('an enum named by a constant is read, not skipped — the #276 blind spot', () => {
  const source = fs.readFileSync(
    path.join(REPO_ROOT, 'design-system/src/components/status-and-loading/Tag/Tag.jsx'),
    'utf8',
  );
  const props = new Map(parsePropTypes(source, 'Tag').map((p) => [p.name, p.enumValues]));
  // Before this was taught to resolve `PropTypes.oneOf(TAG_VARIANTS)`, both of
  // these were null, which the check reads as "no enum" — so every
  // `variant="…"` on the Tag page resolved to nothing at all, silently.
  assert.deepEqual(props.get('variant'), ['read-only', 'dismissible', 'selectable', 'operational']);
  assert.ok(props.get('color').includes('magenta'));
});

test('a constant declared in another module stays unresolved rather than empty', () => {
  // `null` means "not checked", which is what it was before. An empty array
  // would mean "no legal value", and would fail every correct page on the four
  // other components that declare their enums this way.
  const source = 'import { SIZES } from "./sizes";\nX.propTypes = { size: PropTypes.oneOf(SIZES) };\n';
  assert.equal(parsePropTypes(source, 'X')[0].enumValues, null);
  assert.equal(namedEnumValues(source, 'SIZES'), null);
});

test('an array this cannot read comes back null, never an empty list', () => {
  // `[]` would mean "no legal value" and fail every correct page on the five
  // props that name their enum. Both ways of failing to read one end at `null`.
  assert.equal(namedEnumValues("const X = ['a]b'];", 'X'), null, 'a value holding a `]`');
  assert.equal(namedEnumValues('const X = [];', 'X'), null, 'an array with nothing in it');
  assert.deepEqual(namedEnumValues("const $X = ['a'];", '$X'), ['a'], '`$` is escaped, not an anchor');
});

test('a sub-component assignment is read with the symbol it points at', () => {
  const subs = parseSubComponents('ListGroup.Item = ListGroupItem;\n', 'ListGroup');
  assert.deepEqual(subs, [{ name: 'Item', impl: 'ListGroupItem' }]);
});

test('fences are lifted out but the prose keeps its line numbers', () => {
  const text = 'one\n```css\n--x: 1;\n```\nfive `--elevation-light-1` here\n';
  const { fences, prose } = splitFences(text);
  assert.equal(fences.length, 1);
  assert.equal(fences[0].lang, 'css');
  assert.equal(fences[0].startLine, 3);
  assert.equal(tokenClaims(text).find((c) => c.name === '--elevation-light-1').line, 5);
  assert.ok(!prose.includes('--x'), 'fence content must not leak into prose');
});
