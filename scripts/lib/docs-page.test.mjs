/**
 * The page model: one docs page in, one fixed shape out. Fixture pages stand
 * in for the two page shapes the design system has (component pages with
 * `##` sections, foundation pages built from foundation section components)
 * and for the pages that broke folder guessing.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createPageFinder, exportedValue, importedConstants, literalValue, pagesUnder, pageText, readDocsPage, sectionText, topLevelEntries } from './docs-page.mjs';

const COMPONENT_PAGE = `import { DocsTabs, DocsTab } from '@/storybook-docs/docs-tabs.jsx';
import * as ModalStories from './Modal.stories.jsx';

export const figmaMeta = {
  "fileKey": "abc",
  "sets": [{ "id": "modal", "name": "Modal {x}", "componentSetNodeId": "1:2" }]
};

export const narrow = { width: '100%' };

<Meta of={ModalStories} />

<Title />
A dialog over the page.

<DocsTabs of={ModalStories}>

<DocsTab tab="examples">

<div className="sb-ds-doc-section">

## Size and layout

<ComponentExample of={ModalStories.Width6Col} title="Width 6-col" description="Six columns." />

</div>

</DocsTab>

<DocsTab tab="usage">

<div className="sb-ds-doc-section">

## Usage

Use \`Modal\` when the next step has to happen first.

### Width guidance

<DocsTable>
<thead>
<tr><th>Width</th><th>When to use</th></tr>
</thead>
<tbody>
<tr><td>6-col</td><td>A confirmation, with <code>width</code> set.</td></tr>
<tr><td>8-col</td><td>A short form.</td></tr>
</tbody>
</DocsTable>

</div>

<div className="sb-ds-doc-section">

## Alternatives

- For a message the user only has to read, use \`SectionMessage\`.
- For a short notice, use \`Flag\` instead.

## Best practices

### Size the dialog to its content.

A short confirmation takes the narrowest width.

<DoDontPair
    doExample={<div style={narrow}><Modal show title="Remove?" onClose={() => {}} /></div>}
    doCaption="Six columns for a short question."
    dontExample={<Modal show width="10-col" title="Remove?" />}
    dontCaption={'Ten columns around one sentence.'}
/>

### Confirm a follow-up in place, not in a new dialog.

\`\`\`jsx
<Modal title={confirming ? 'Discard?' : 'Settings'} />
\`\`\`

{/* a comment for maintainers */}

## Related

- For a menu or a picker, use \`DropdownMenu\` or \`Select\`.
- For long content, use a page rather than a dialog.

</div>

</DocsTab>

</DocsTabs>
`;

test('a component page reads into its sections, in page order', () => {
  const page = readDocsPage(COMPONENT_PAGE);
  assert.deepEqual(
    page.sections.map((s) => s.title),
    ['Size and layout', 'Usage', 'Alternatives', 'Best practices', 'Related'],
  );
  assert.equal(page.intro, 'A dialog over the page.');
});

test('no raw JSX reaches the output, and code fences survive as written', () => {
  const page = readDocsPage(COMPONENT_PAGE);
  const all = page.sections.map((s) => s.text).join('\n');
  assert.doesNotMatch(all, /<\/?(div|DocsTable|DoDontPair|ComponentExample|tr|td|code)\b/);
  assert.doesNotMatch(all, /a comment for maintainers/);
  assert.match(sectionText(page, 'Best practices'), /```jsx\n<Modal title=\{confirming \? 'Discard\?' : 'Settings'\} \/>\n```/);
});

test('a docs table becomes one text line per row', () => {
  const usage = sectionText(readDocsPage(COMPONENT_PAGE), 'Usage');
  assert.match(usage, /^\| Width \| When to use \|$/m);
  assert.match(usage, /^\| 6-col \| A confirmation, with `width` set\. \|$/m);
  assert.match(usage, /^\| 8-col \| A short form\. \|$/m);
  assert.match(usage, /^### Width guidance$/m);
});

test('a do/don\'t pair keeps its captions and drops its examples', () => {
  const [size] = readDocsPage(COMPONENT_PAGE).rules;
  assert.match(size.text, /^Do: Six columns for a short question\.$/m);
  assert.match(size.text, /^Don't: Ten columns around one sentence\.$/m);
  assert.doesNotMatch(size.text, /onClose|10-col/);
});

test('each ### under Best practices is one rule, its id the slug', () => {
  const { rules } = readDocsPage(COMPONENT_PAGE);
  assert.deepEqual(
    rules.map(({ id, sentence }) => ({ id, sentence })),
    [
      { id: 'size-the-dialog-to-its-content', sentence: 'Size the dialog to its content.' },
      { id: 'confirm-a-follow-up-in-place-not-in-a-new-dialog', sentence: 'Confirm a follow-up in place, not in a new dialog.' },
    ],
  );
});

test('a rule carries the RuleTag under its heading, or null', () => {
  const { rules } = readDocsPage('## Best practices\n\n### Keep it short.\n\n<RuleTag kind="automatic" />\n\nOne line.\n\n### Say why.\n\nOne reason.\n');
  assert.deepEqual(rules.map(({ id, tag }) => ({ id, tag })), [
    { id: 'keep-it-short', tag: 'automatic' },
    { id: 'say-why', tag: null },
  ]);
});

test('Alternatives routes name the component each one sends to', () => {
  assert.deepEqual(readDocsPage(COMPONENT_PAGE).alternatives, [
    { text: 'For a message the user only has to read, use `SectionMessage`.', routesTo: 'SectionMessage' },
    { text: 'For a short notice, use `Flag` instead.', routesTo: 'Flag' },
  ]);
});

test('a page with no Alternatives section has no routes', () => {
  assert.deepEqual(readDocsPage('## Usage\n\nUse it.\n').alternatives, []);
});

test('Related reads as its lines', () => {
  assert.deepEqual(readDocsPage(COMPONENT_PAGE).related, [
    'For a menu or a picker, use `DropdownMenu` or `Select`.',
    'For long content, use a page rather than a dialog.',
  ]);
});

test('the Figma metadata is the page\'s figmaMeta export, parsed', () => {
  assert.deepEqual(readDocsPage(COMPONENT_PAGE).figmaMeta, {
    fileKey: 'abc',
    sets: [{ id: 'modal', name: 'Modal {x}', componentSetNodeId: '1:2' }],
  });
  assert.equal(readDocsPage('## Usage\n').figmaMeta, null);
});

test('aliases come from the page\'s aliases export, and are empty without one', () => {
  assert.deepEqual(readDocsPage("export const aliases = ['dialog', \"popup\"];\n\n## Usage\n").aliases, ['dialog', 'popup']);
  assert.deepEqual(readDocsPage(COMPONENT_PAGE).aliases, []);
});

test('a page with only ### headings reads them as its sections', () => {
  const page = readDocsPage('<div>\n### Overview\n\n<LogoStories.Overview />\n</div>\n\n<div>\n### Construction\n\nThe keyline grid.\n</div>\n');
  assert.deepEqual(page.sections.map((s) => [s.title, s.text]), [['Overview', ''], ['Construction', 'The keyline grid.']]);
});

const FOUNDATION_PAGE = `import { Meta } from '@storybook/addon-docs/blocks';

export const field = (extra = {}) => ({ display: 'flex', ...extra });

<Meta title="Foundations/Visual/Border" tags={['!dev']} />

<FoundationHero
    title="Border"
    summary="A border is a width token paired with a color token."
/>

<FoundationContents />

<FoundationSection title="Overview">

Borders mark a boundary.

<Banner appearance="announcement">
<strong>Border rules</strong><br />
A card has no border.
</Banner>

</FoundationSection>

<FoundationSection title="Width tokens">

<TokenTable
    rows={[
        { token: '--border-default', figma: 'Border/default', use: 'Every standard border, divider and rule.' },
        { token: '--border-focused', figma: 'Border/focused', use: 'The focus ring.' },
    ]}
    valueHeader="Value"
/>

</FoundationSection>

<FoundationSection title="Focus ring">

<FoundationSubsection title="Facts">

<RefTable
    head={['Fact', 'Rule']}
    rows={[
        ['Width', <>2, <C>--border-focused</C></>],
        ['Color', <><C>color/border/focused</C> on light; inverse on dark</>],
    ]}
/>

</FoundationSubsection>

<FoundationExample caption="A ring.">
<div style={{ display: 'flex' }}><span style={field()}>Value</span></div>
</FoundationExample>

<DoDont>
<Do caption="The field keeps its fill and gains the ring.">
<span style={field({ outline: 'x' })}>Algebra</span>
</Do>
<Dont caption="A filled field reads as selected.">
<span style={field()}>Algebra</span>
</Dont>
</DoDont>

</FoundationSection>
`;

test('a page opening with DocsLanding reads its title and purpose like a FoundationHero page', () => {
  const landing = FOUNDATION_PAGE.replace(/<FoundationHero[\s\S]*?\/>\n\n<FoundationContents \/>/, '<DocsLanding\n    page="foundations-visual-border"\n    eyebrow="Foundation"\n    title="Border"\n    purpose="A border is a width token paired with a color token."\n    links={{ label: \'Tokens\', items: [] }}\n/>');
  assert.ok(landing.includes('<DocsLanding'), 'the fixture swap applied');
  const page = readDocsPage(landing);
  assert.equal(page.title, 'Border');
  assert.equal(page.intro, 'A border is a width token paired with a color token.');
  assert.equal(pageText(page).startsWith('# Border\n\nA border is a width token'), true);
});

test('a foundation page reads its foundation sections as sections', () => {
  const page = readDocsPage(FOUNDATION_PAGE, { kind: 'foundation' });
  assert.deepEqual(page.sections.map((s) => s.title), ['Overview', 'Width tokens', 'Focus ring']);
  assert.equal(page.intro, 'A border is a width token paired with a color token.');
  assert.match(sectionText(page, 'Overview'), /Borders mark a boundary\.\n\n\*\*Border rules\*\*\n+A card has no border\./);
});

test('a foundation page is recognized without being told its kind', () => {
  assert.deepEqual(readDocsPage(FOUNDATION_PAGE).sections.map((s) => s.title), ['Overview', 'Width tokens', 'Focus ring']);
});

test('token and reference tables become text lines; examples are dropped', () => {
  const page = readDocsPage(FOUNDATION_PAGE);
  assert.match(sectionText(page, 'Width tokens'), /^- `--border-default` \(Border\/default\): Every standard border, divider and rule\.$/m);
  const focus = sectionText(page, 'Focus ring');
  assert.match(focus, /^### Facts$/m);
  assert.match(focus, /^\| Fact \| Rule \|$/m);
  assert.match(focus, /^\| Width \| 2, `--border-focused` \|$/m);
  assert.match(focus, /^\| Color \| `color\/border\/focused` on light; inverse on dark \|$/m);
  assert.match(focus, /^Do: The field keeps its fill and gains the ring\.$/m);
  assert.match(focus, /^Don't: A filled field reads as selected\.$/m);
  assert.doesNotMatch(focus, /Algebra|A ring\.|style=/);
});

// ── finding a component's page ─────────────────────────────────────────────

function tree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-page-'));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

const page = (stories) => `import * as S from './${stories}';\n\n<Meta of={S} />\n\n## Usage\n\nUse it.\n`;
const src = 'design-system/src';

test('a flat-file component is found through its page\'s Storybook meta', () => {
  const root = tree({
    [`${src}/components/forms/Fieldset.jsx`]: 'export default function Fieldset() {}',
    [`${src}/components/forms/Fieldset.stories.jsx`]: "import Fieldset from './Fieldset';\nexport default {\n    title: 'Forms/Fieldset',\n    component: Fieldset,\n};\n",
    [`${src}/components/forms/Fieldset.mdx`]: page('Fieldset.stories.jsx'),
    [`${src}/components/forms/Checkbox.jsx`]: 'export default function Checkbox() {}',
  });
  const find = createPageFinder(root);
  assert.equal(find({ name: 'Fieldset', source: `${src}/components/forms/Fieldset.jsx` }), `${src}/components/forms/Fieldset.mdx`);
  assert.equal(find({ name: 'Checkbox', source: `${src}/components/forms/Checkbox.jsx` }), null);
});

test('two components with one name each get their own page, and a page-less one gets none', () => {
  const root = tree({
    [`${src}/patterns/Sidebar/Sidebar.jsx`]: 'export default function Sidebar() {}',
    [`${src}/patterns/Sidebar/Sidebar.stories.jsx`]: "import { Sidebar as RoleSidebar } from '@/components';\nimport PatternSidebar from './Sidebar';\nexport default {\n    component: PatternSidebar,\n};\n",
    [`${src}/patterns/Sidebar/Sidebar.mdx`]: page('Sidebar.stories.jsx'),
    [`${src}/specs/Sections/Sidebar/Sidebar.jsx`]: 'export default function Sidebar() {}',
    [`${src}/specs/Sections/Sidebar/Sidebar.stories.jsx`]: "import Sidebar from './Sidebar';\nexport default { component: Sidebar };\n",
    [`${src}/specs/Sections/Sidebar/Sidebar.mdx`]: page('Sidebar.stories.jsx'),
    [`${src}/components/navigation/Sidebar/Sidebar.jsx`]: 'export default function Sidebar() {}',
  });
  const find = createPageFinder(root);
  assert.equal(find({ name: 'PatternSidebar', source: `${src}/patterns/Sidebar/Sidebar.jsx` }), `${src}/patterns/Sidebar/Sidebar.mdx`);
  assert.equal(find({ name: 'Sidebar', source: `${src}/components/navigation/Sidebar/Sidebar.jsx` }), null);
});

test('a component the stories import from a barrel is found by its name', () => {
  const root = tree({
    [`${src}/components/Tag/Tag.jsx`]: 'export default function Tag() {}',
    [`${src}/components/Tag/Tag.stories.jsx`]: "import { Tag } from '@/components';\nexport default { component: Tag };\n",
    [`${src}/components/Tag/Tag.mdx`]: page('Tag.stories.jsx'),
  });
  assert.equal(createPageFinder(root)({ name: 'Tag', source: `${src}/components/Tag/Tag.jsx` }), `${src}/components/Tag/Tag.mdx`);
});

test('the registry names a page when the meta does not, but only for the same source', () => {
  const root = tree({
    [`${src}/components/A/A.jsx`]: '',
    [`${src}/components/A/Docs.mdx`]: '## Usage\n',
  });
  const registry = { components: { A: { code: { source: `${src}/components/A/A.jsx`, mdxPath: `${src}/components/A/Docs.mdx` } } } };
  const find = createPageFinder(root, registry);
  assert.equal(find({ name: 'A', source: `${src}/components/A/A.jsx` }), `${src}/components/A/Docs.mdx`);
  assert.equal(find({ name: 'A', source: `${src}/components/B/A.jsx` }), null);
});

test('a component with no page at all is null, not an error', () => {
  const root = tree({ [`${src}/components/InlineEditableTextfield/InlineEditableTextfield.jsx`]: '' });
  const find = createPageFinder(root);
  assert.equal(find({ name: 'InlineEditableTextfield', source: `${src}/components/InlineEditableTextfield/InlineEditableTextfield.jsx` }), null);
  assert.equal(find({ name: 'Nothing', source: null }), null);
});

// ── expressions ─────────────────────────────────────────────────────────────

test("an expression of a string literal is its text: {' '} is a space", () => {
  const page = readDocsPage(`## Usage\n\nUse the label and{' '}\ncaption convention{" "}here.\n`);
  assert.equal(sectionText(page, 'Usage'), 'Use the label and\ncaption convention here.');
});

test('literalValue reads literals and refuses anything computed', () => {
  assert.deepEqual(literalValue(`{ '6-col': [384, 512], b: "x", c: true }`), { '6-col': [384, 512], b: 'x', c: true });
  assert.equal(literalValue('2'), 2);
  assert.equal(literalValue('[...A, 1]'), undefined);
  assert.equal(literalValue('makeWidths()'), undefined);
  assert.equal(literalValue('`a${b}`'), undefined);
});

function constantsRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-page-constants-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  write('design-system/src/lib/overlay.js', 'export const MAX_STACKED = 2;\nexport const COMPUTED = [1, 2].map((n) => n);\n');
  write('design-system/src/components/x/Widget/Widget.jsx', "export const WIDTHS = ['6-col', '8-col'];\nexport const PX = { '6-col': [384, 512] };\n");
  write('design-system/src/components/x/Widget/index.js', "export * from './Widget';\n");
  write('design-system/src/components/index.js', "export { default as Widget, WIDTHS, PX } from '@/components/x/Widget';\n");
  return root;
}

const CONSTANT_PAGE = `import { Widget, WIDTHS, PX } from '@/components';
import { MAX_STACKED, COMPUTED } from '@/lib/overlay';

## Usage

At most \`MAX_STACKED\`{\` (\${MAX_STACKED})\`} stack; \`WIDTHS\`{\` (\${WIDTHS.join(' · ')})\`}.

| Step | Pixels |
| --- | --- |
| 6-col | {PX['6-col'].join(' · ')} |

Dropped: {COMPUTED}{Widget}{fn()}{\`(\${MISSING})\`}.
`;

test('importedConstants follows the barrel to each literal constant a page imports, and skips a computed one', () => {
  const root = constantsRepo();
  const file = 'design-system/src/components/x/Widget/Widget.mdx';
  const constants = importedConstants(root, file, CONSTANT_PAGE);
  assert.deepEqual(Object.fromEntries(constants), { WIDTHS: ['6-col', '8-col'], PX: { '6-col': [384, 512] }, MAX_STACKED: 2 });
  assert.equal(exportedValue(root, 'design-system/src/lib/overlay.js', 'MAX_STACKED'), 2);
});

test('an imported constant renders its value beside its name; anything else is dropped; without a root, every reference is dropped', () => {
  const root = constantsRepo();
  const file = 'design-system/src/components/x/Widget/Widget.mdx';
  const usage = sectionText(readDocsPage(CONSTANT_PAGE, { root, file }), 'Usage');
  assert.match(usage, /At most `MAX_STACKED` \(2\) stack; `WIDTHS` \(6-col · 8-col\)\./);
  assert.match(usage, /\| 6-col \| 384 · 512 \|/);
  assert.match(usage, /Dropped: \./);
  const bare = sectionText(readDocsPage(CONSTANT_PAGE), 'Usage');
  assert.match(bare, /At most `MAX_STACKED` stack; `WIDTHS`\./);
});

test('topLevelEntries splits a literal group at its top-level commas, keeping strings, comments and nested groups whole', () => {
  const src = `const meta = { argTypes: {\n  // a comment, with a comma and an apostrophe: don't\n  size: { options: ['sm', 'md'] },\n  "label": { control: 'text' }, /* one, more */ tone: {} } };`;
  assert.deepEqual(topLevelEntries(src, src.indexOf('{', src.indexOf('argTypes'))), [
    "// a comment, with a comma and an apostrophe: don't\n  size: { options: ['sm', 'md'] }",
    '"label": { control: \'text\' }',
    '/* one, more */ tone: {}',
  ]);
});

test('pagesUnder lists the authored pages under one folder, Finder copies left out', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-under-'));
  for (const f of ['a/One.mdx', 'a/One 2.mdx', 'a/b/Two.mdx', 'c/Three.mdx']) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), '');
  }
  assert.deepEqual(pagesUnder(root, 'a'), ['a/One.mdx', 'a/b/Two.mdx']);
  assert.deepEqual(pagesUnder(root, 'missing'), []);
});
