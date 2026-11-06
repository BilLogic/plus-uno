/**
 * Component docs pages take their props table from the story meta.
 *
 * A hand-written `## Properties` table drifts from the component; `DocsProperties`
 * (ArgTypes) cannot. These hold the pages already moved over to it, the shared
 * layout's exports, and the canvas default.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const MOVED = [
  'design-system/src/components/forms-and-inputs/IconButton/IconButton.mdx',
];

describe('generated docs blocks', () => {
  it('the shared layout exports DocsProperties, DocsSource and DocsStories', () => {
    const layout = read('design-system/src/storybook-docs/ds-docs-layout.jsx');
    for (const name of ['DocsProperties', 'DocsSource', 'DocsStories']) {
      expect(layout).toMatch(new RegExp(`export function ${name}\\b`));
    }
  });

  it.each(MOVED)('%s renders Properties from the story meta, not a hand table', (file) => {
    const mdx = read(file);
    const section = mdx.match(/## Properties\n([\s\S]*?)(?=\n## |\n<\/div>)/);
    expect(section, 'has a Properties section').not.toBeNull();
    expect(section[1]).toMatch(/<DocsProperties of=\{\w+Stories\} \/>/);
    expect(section[1]).not.toMatch(/<DocsTable|<tr>/);
  });

  it('Button takes its props table from the Code tab, so the page authors none', () => {
    const mdx = read('design-system/src/components/forms-and-inputs/Button/Button.mdx');
    expect(mdx).not.toMatch(/^## Properties/m);
    expect(mdx).not.toMatch(/<th>(Prop|Property|Default)<\/th>/);
  });

  it('canvases default to code behind a Show code button', () => {
    const preview = read('.storybook/preview.jsx');
    expect(preview).toMatch(/canvas:\s*\{\s*(?:\/\/[^\n]*\n\s*)*sourceState:\s*'hidden'/);
  });
});
