/**
 * The generated agent file of a docs-only page, on a fixture root: the rule
 * slugs and Automatic/Review tags it carries, a page with no file, a file with
 * no page, and the drift verdict.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { agentFilePath, pagesMissingManifestTag, renderDocsAgentFile, ruleTags, syncDocsAgentFiles } from './docs-agent-file.mjs';

const PAGE = `import { Meta } from '@storybook/addon-docs/blocks';
import { RuleTag } from '@/storybook-docs/rule-tag.jsx';

<Meta title="Patterns/Disabled" tags={['!dev', 'manifest']} />

# Disabled

A disabled control tells the person why it is disabled.

## Usage

Use it when an action is unavailable.

## Best practices

### Give every disabled control a reason in visible text.

<RuleTag kind="automatic" />

A tooltip is never the reason: touch and keyboard users do not reach it.

### Keep a disabled control in place.

<RuleTag kind="review" />

The layout does not move.

### Name the missing step.

The reason says what unlocks the control.
`;

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-agent-'));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

const PAGE_PATH = 'design-system/src/storybook-docs/patterns/Disabled.mdx';

test('each rule renders as its slug id with its tag; an untagged rule reads as Review', () => {
  const text = renderDocsAgentFile(PAGE, { file: PAGE_PATH, kind: 'Pattern' });
  assert.match(text, /### Give every disabled control a reason in visible text\. \{#give-every-disabled-control-a-reason-in-visible-text\}\n\n\*\*Checked:\*\* Automatic/);
  assert.match(text, /\{#keep-a-disabled-control-in-place\}\n\n\*\*Checked:\*\* Review/);
  assert.match(text, /\{#name-the-missing-step\}\n\n\*\*Checked:\*\* Review/);
  assert.match(text, /^# Disabled\n\nA disabled control tells the person why/m);
  assert.doesNotMatch(text, /RuleTag/);
});

test('ruleTags reads the marker under its own heading only', () => {
  assert.deepEqual(ruleTags(PAGE), {
    'give-every-disabled-control-a-reason-in-visible-text': 'automatic',
    'keep-a-disabled-control-in-place': 'review',
  });
});

test('a docs-only page gets a file, and the check passes straight after writing', () => {
  const root = fixture({ [PAGE_PATH]: PAGE });
  assert.equal(syncDocsAgentFiles(root, { check: true }).stale.length, 1);
  syncDocsAgentFiles(root);
  const out = agentFilePath(PAGE_PATH, 'Patterns');
  assert.ok(fs.existsSync(path.join(root, out)));
  assert.deepEqual(syncDocsAgentFiles(root, { check: true }).stale, []);
});

test('the check fails when a page changes under its file, and when a file loses its page', () => {
  const root = fixture({ [PAGE_PATH]: PAGE });
  syncDocsAgentFiles(root);
  fs.writeFileSync(path.join(root, PAGE_PATH), PAGE.replace('never the reason', 'never the reason').replace('### Keep a disabled', '### Hold a disabled'));
  assert.deepEqual(syncDocsAgentFiles(root, { check: true }).stale, [agentFilePath(PAGE_PATH, 'Patterns')]);
  syncDocsAgentFiles(root);
  fs.rmSync(path.join(root, PAGE_PATH));
  assert.deepEqual(syncDocsAgentFiles(root, { check: true }).stale, [agentFilePath(PAGE_PATH, 'Patterns')]);
});

test('a page outside Templates and Patterns gets no file', () => {
  const root = fixture({ 'design-system/src/storybook-docs/x/Other.mdx': PAGE.replace('Patterns/Disabled', 'Foundations/Other') });
  assert.equal(syncDocsAgentFiles(root, { check: true }).count, 0);
});

test('a template or pattern page without the manifest tag is named, since the MCP would not serve it', () => {
  const root = fixture({ [PAGE_PATH]: PAGE.replace(", 'manifest'", ''), 'design-system/src/storybook-docs/patterns/Ok.mdx': PAGE });
  assert.deepEqual(pagesMissingManifestTag(root), [PAGE_PATH]);
});

test('a page titled by a <Title> block keeps its name, and the pointer that opens Best practices reaches the file', () => {
  const page = PAGE.replace('# Disabled', '<Title>Disabled</Title>').replace('## Best practices\n', '## Best practices\n\nThe rules live in Patterns, Forms.\n');
  const text = renderDocsAgentFile(page, { file: PAGE_PATH, kind: 'Pattern' });
  assert.match(text, /^# Disabled$/m);
  assert.match(text, /## Best practices\n\nThe rules live in Patterns, Forms\.\n\n### Give every/);
});

// ── Foundations · Motion through get-documentation ──

const MOTION_MDX = (name) => `import { Meta } from '@storybook/addon-docs/blocks';\n\n<Meta title="Foundations/Motion/${name}" tags={['!dev', 'manifest']} />\n\n# ${name}\n`;
const MOTION_STORIES = (name, tags) => `export default {\n    title: 'Foundations/Motion/${name}',\n    tags: [${tags}],\n};\n`;

test('a Foundations · Motion page without the manifest tag is named, whether its Meta or its stories file carries the title', () => {
  const root = fixture({
    'design-system/src/styles/MotionLibrary.mdx': MOTION_MDX('Library').replace(", 'manifest'", ''),
    'design-system/src/styles/MotionPhysics.mdx': `import * as S from './MotionPhysics.stories.jsx';\n\n<Meta of={S} />\n`,
    'design-system/src/styles/MotionPhysics.stories.jsx': MOTION_STORIES('Physics', "'!dev'"),
    'design-system/src/styles/MotionPrinciples.mdx': `import * as S from './MotionPrinciples.stories.jsx';\n\n<Meta of={S} />\n`,
    'design-system/src/styles/MotionPrinciples.stories.jsx': MOTION_STORIES('Principles', "'!dev', 'manifest'"),
  });
  assert.deepEqual(pagesMissingManifestTag(root).sort(), [
    'design-system/src/styles/MotionLibrary.mdx',
    'design-system/src/styles/MotionPhysics.mdx',
  ]);
});

test('on the real repo every Foundations · Motion page is served, and a component with a motion row carries its Motion section', () => {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
  assert.deepEqual(pagesMissingManifestTag(root), []);
  const served = fs.readdirSync(path.join(root, 'design-system/src/styles')).filter((f) => /^Motion[A-Z].*\.mdx$/.test(f));
  assert.ok(served.length >= 6, `expected the six Foundations · Motion pages, found ${served.length}`);
  const popup = fs.readFileSync(path.join(root, 'design-system/src/components/overlays-and-layering/Popup/index.md'), 'utf8');
  assert.match(popup, /^## Motion$/m);
  assert.match(popup, /--ds-motion-spatial-fast/);
});
