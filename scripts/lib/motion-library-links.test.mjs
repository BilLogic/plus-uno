import './tokens/motion-docs.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { deriveMotionLibraryLinks, deriveMotionLibraryLinksFromPages } from './motion-library-links.mjs';

const REGISTRY = [
  { name: 'Panel', tier: 'template', events: { enter: { transition: 'Dock and undock a panel', spatial: 'spatial.slow' } } },
  { name: 'Carousel', tier: 'component', events: { change: { transition: 'Swap content in place', appearance: 'appearance.fast' } } },
  { name: 'Blanket', tier: 'template', events: { enter: { transition: 'Open and close an overlay', appearance: 'appearance.default' } } },
  { name: 'Modal', tier: 'template', events: { enter: { transition: 'Open and close an overlay', spatial: 'spatial.default' } } },
  { name: 'Filtering', tier: 'pattern', events: { change: { transition: 'Swap content in place', appearance: 'appearance.fast' } } },
  { name: 'Button', tier: 'component', events: { change: { transition: 'Update a value or state', appearance: 'appearance.fast' } } },
  { name: 'Unpaged', tier: 'component', events: { change: { transition: 'Update a value or state', appearance: 'appearance.fast' } } },
];

test('derives Storybook docs links and section anchors from MDX pages and MotionSection tags', () => {
  const pages = [
    {
      file: 'design-system/src/templates/Panel/Panel.mdx',
      docsId: 'templates-panel--docs',
      source: ['<Meta title="Templates/Panel" />', '', '## Motion', '', '<MotionSection component="Panel" tier="template" />', ''].join('\n'),
    },
    {
      file: 'design-system/src/components/layout-and-structure/Carousel/Carousel.mdx',
      docsId: 'components-layout-and-structure-carousel--docs',
      source: [
        '<Meta of={CarouselStories} />',
        '',
        '## Motion',
        '',
        '```jsx',
        '<MotionSection component="Unpaged" />',
        '```',
        '',
        '<MotionSection component="Carousel" />',
        '',
      ].join('\n'),
    },
    {
      file: 'design-system/src/templates/Modal/Modal.mdx',
      docsId: 'templates-modal--docs',
      source: [
        '<Meta title="Templates/Modal" />',
        '## Motion',
        '<MotionSection component="Modal" tier="template" />',
        '### Blanket motion',
        '<MotionSection component="Blanket" tier="template" />',
      ].join('\n'),
    },
    {
      file: 'design-system/src/storybook-docs/patterns/Filtering/Filtering.mdx',
      docsId: 'patterns-filtering--docs',
      source: ['<Meta title="Patterns/Filtering" />', '', '## Motion {#custom-motion}', '', '<MotionSection component="Filtering" />', ''].join('\n'),
    },
  ];

  const links = deriveMotionLibraryLinksFromPages(pages, REGISTRY);
  assert.deepEqual(links, {
    'component:Carousel': '?path=/docs/components-layout-and-structure-carousel--docs#motion',
    'pattern:Filtering': '?path=/docs/patterns-filtering--docs#custom-motion',
    'template:Blanket': '?path=/docs/templates-modal--docs#blanket-motion',
    'template:Panel': '?path=/docs/templates-panel--docs#motion',
    'template:Modal': '?path=/docs/templates-modal--docs#motion',
  });
  assert.equal(links['component:Unpaged'], undefined);
});

test('deriveMotionLibraryLinks resolves <Meta of={...}> and <Meta title="..."> from a repo tree', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-links-'));
  const btnDir = path.join(root, 'design-system/src/components/forms-and-inputs/Button');
  fs.mkdirSync(btnDir, { recursive: true });
  fs.writeFileSync(
    path.join(btnDir, 'Button.stories.jsx'),
    "export default { title: 'Components/Forms and inputs/Button/Button' };\n",
  );
  fs.writeFileSync(
    path.join(btnDir, 'Button.mdx'),
    [
      "import * as ButtonStories from './Button.stories';",
      '<Meta of={ButtonStories} />',
      '',
      '## Motion',
      '',
      '<MotionSection component="Button" />',
      '',
    ].join('\n'),
  );

  assert.deepEqual(deriveMotionLibraryLinks(root, REGISTRY), {
    'component:Button': '?path=/docs/components-forms-and-inputs-button-button--docs#motion',
  });
});

test('live repo links match all 86 MotionSection tags across the 85 docs pages', () => {
  const links = deriveMotionLibraryLinks();
  assert.equal(Object.keys(links).length, 86);
  assert.equal(links['template:Blanket'], '?path=/docs/templates-modal--docs#blanket-motion');
  assert.equal(links['template:Modal'], '?path=/docs/templates-modal--docs#motion');
});
