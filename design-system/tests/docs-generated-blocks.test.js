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

const BUTTONS = ['Button', 'ButtonGroup', 'CloseButton', 'FilterButton', 'IconButton', 'LinkButton', 'LinkIconButton', 'SplitButton', 'VerticalButton'].map(
  (name) => `design-system/src/components/forms-and-inputs/${name}/${name}.mdx`,
);

const FORMS_PART_1 = [
  'Calendar/Calendar',
  'Checkbox/Checkbox',
  'Comment/Comment',
  'DateTimePicker/DateTimePicker',
  'DatePicker/DatePicker',
  'TimePicker/TimePicker',
  'DropdownMenu/DropdownMenu',
  'Fieldset',
  'FileUpload/FileUpload',
  'LabelAndCaption',
].map((name) => `design-system/src/components/forms-and-inputs/${name}.mdx`);

const FORMS_PART_2 = [
  'Radio/Radio',
  'RadioGroup/RadioGroup',
  'ChoiceGrid/ChoiceGrid',
  'Range/Range',
  'Rating/Rating',
  'RichTextEditor/RichTextEditor',
].map((name) => `design-system/src/components/forms-and-inputs/${name}.mdx`);

const FORMS_PART_3 = [
  'Select/Select',
  'Cascader/Cascader',
  'TreeSelect/TreeSelect',
  'TagInput/TagInput',
  'TextArea/TextArea',
  'TextField/TextField',
  'Toggle/Toggle',
].map((name) => `design-system/src/components/forms-and-inputs/${name}.mdx`);

const LABELS = [
  'AiLabel',
  'CountTag',
  'DateTag',
  'SmartTag',
  'StatusTag',
  'Suggestion',
  'Tag',
  'TagGroup',
].map((name) => `design-system/src/components/labels/${name}/${name}.mdx`);

const MESSAGING = ['Banner', 'EmptyState', 'Flag', 'InlineMessage', 'Modal', 'SectionMessage', 'Spotlight'].map(
  (name) => `design-system/src/components/messaging/${name}/${name}.mdx`,
);

describe('generated docs blocks', () => {
  it('the shared layout exports DocsProperties, DocsSource and DocsStories', () => {
    const layout = read('design-system/src/storybook-docs/ds-docs-layout.jsx');
    for (const name of ['DocsProperties', 'DocsSource', 'DocsStories']) {
      expect(layout).toMatch(new RegExp(`export function ${name}\\b`));
    }
  });

  it.each(BUTTONS)('%s takes its props table from the Code tab, so the page authors none', (file) => {
    const mdx = read(file);
    expect(mdx).not.toMatch(/^## Properties/m);
    expect(mdx).not.toMatch(/<th>(Prop|Property|Default)<\/th>/);
  });

  it.each([...FORMS_PART_1, ...FORMS_PART_2, ...FORMS_PART_3, ...LABELS, ...MESSAGING])('%s authors no props table and carries the template headings', (file) => {
    const mdx = read(file);
    expect(mdx).not.toMatch(/^## Properties/m);
    expect(mdx).not.toMatch(/<th>(Prop|Property|Default)<\/th>/);
    expect(mdx).toMatch(/^## Best practices/m);
    expect(mdx).toMatch(/^## Content guidelines/m);
  });

  it('canvases default to code behind a Show code button', () => {
    const preview = read('.storybook/preview.jsx');
    expect(preview).toMatch(/canvas:\s*\{\s*(?:\/\/[^\n]*\n\s*)*sourceState:\s*'hidden'/);
  });
});
