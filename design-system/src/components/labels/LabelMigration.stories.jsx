import React from 'react';
import { expect, fn, spyOn, userEvent, within } from 'storybook/test';

import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import CompetencyBadge from '@/components/_internal/CompetencyBadge';
import StaticBadgeSmart, { SMART_TAG_COLORS } from '@/components/_internal/StaticBadgeSmart';
import TagInput from '@/components/forms-and-inputs/TagInput';

import Tag from './Tag';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';

/**
 * The labels that moved onto Tag: `StaticBadgeSmart`, `CompetencyBadge` and
 * `TagInput`'s chips. Each now renders a Tag, so a SMART area, a competency and
 * a picked topic look like every other category in the product.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is a role, a name or a computed style,
 * never a class name. Colors are compared against the token they resolve to,
 * read through a probe element.
 *
 * The console is watched for the whole file, so the deprecation warnings the
 * old props give are asserted where they are the subject and kept out of the
 * test output everywhere else.
 */

export default {
    title: 'Components/Labels/Label migration',
    tags: ['!dev', '!autodocs'],
    beforeEach: () => {
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        return () => warn.mockRestore();
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' };

/**
 * Each SMART area, its label, and the SMART subject its colors come from. The
 * Tag beside it is `SMART_TAG_COLORS`' accent, the one the subject's tokens
 * alias, for comparison.
 */
const SMART = [
    ['socio-emotional', 'Social-Emotional Learning', 'social-emotional'],
    ['mastering-content', 'Mastering Content', 'mastering-content'],
    ['advocacy', 'Advocacy', 'advocacy'],
    ['relationships', 'Relationships', 'relationship'],
    ['technology-tools', 'Technology Tools', 'technology-tools'],
];

const PROPS = ['height', 'backgroundColor', 'color', 'borderTopColor', 'borderTopLeftRadius', 'fontSize', 'paddingLeft'];
const look = (el) => {
    const cs = getComputedStyle(el);
    return Object.fromEntries(PROPS.map((p) => [p, cs[p]]));
};

/** The decorative swatch inside a tag: the one hidden part with a fill. */
const swatchOf = (tag) => [...tag.querySelectorAll('[aria-hidden="true"]')]
    .find((el) => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)');

/* --------------------------------------------------------------- SMART */

export const SmartAreas = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'max-content max-content', gap: '8px 24px' }}>
        {SMART.map(([type, text]) => (
            <React.Fragment key={type}>
                <StaticBadgeSmart type={type} data-testid={`smart-${type}`} />
                <Tag color={SMART_TAG_COLORS[type]} data-testid={`tag-${type}`}>{text}</Tag>
            </React.Fragment>
        ))}
    </div>
);

/**
 * A SMART area is a read-only Tag filled in its subject's SMART colors: 22
 * tall, the tag's shape and type, `background.smart.{subject}` for the ground,
 * `text.smart.{subject}` for the words, `icon.smart.{subject}` on the swatch,
 * a clear border, and nothing to press.
 */
SmartAreas.play = async ({ canvasElement }) => {
    await inEveryColorMode(async () => {
        const canvas = within(canvasElement);
        for (const [type, text, token] of SMART) {
            const smart = canvas.getByTestId(`smart-${type}`);
            await expect(smart.textContent, `${type} says its area`).toBe(text);
            const s = getComputedStyle(smart);
            const tag = getComputedStyle(canvas.getByTestId(`tag-${type}`));
            for (const p of ['height', 'borderTopLeftRadius', 'fontSize', 'paddingLeft']) {
                await expect(s[p], `${type} has a tag's ${p}`).toBe(tag[p]);
            }
            await expect(px(s.height), `${type} is 22 tall`).toBe(22);
            await expect(s.backgroundColor, `${type} is filled in its subject's ground`)
                .toBe(tokenColor(canvasElement, `--ds-background-smart-${token}`));
            await expect(s.color, `${type} words are its subject's ink`)
                .toBe(tokenColor(canvasElement, `--ds-text-smart-${token}`));
            await expect(s.borderTopColor, `${type} has a clear border`).toBe('rgba(0, 0, 0, 0)');
            await expect(getComputedStyle(swatchOf(smart)).backgroundColor, `${type} carries its subject on the swatch`)
                .toBe(tokenColor(canvasElement, `--ds-icon-smart-${token}`));
        }
        await expect(canvas.queryByRole('button')).toBeNull();
    });
};

export const SmartSizeIsIgnored = () => (
    <div style={row}>
        <StaticBadgeSmart type="advocacy" data-testid="plain" />
        <StaticBadgeSmart type="advocacy" size="h2" data-testid="sized" />
    </div>
);

/**
 * A Tag has one size, so `size` no longer changes anything. Old calls that
 * pass it keep working, and development says it is ignored.
 */
SmartSizeIsIgnored.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(look(canvas.getByTestId('sized'))).toEqual(look(canvas.getByTestId('plain')));
    await expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[StaticBadgeSmart] `size` is deprecated and ignored'));
};

export const Competency = () => (
    <div style={row}>
        <CompetencyBadge competencyArea="Mastering Content" data-testid="competency" />
        <StaticBadgeSmart type="mastering-content" data-testid="smart" />
    </div>
);

/**
 * A competency is the same SMART Tag. `CompetencyBadge` takes the area as
 * people write it ("Mastering Content") and renders exactly what
 * `StaticBadgeSmart` does for it.
 */
Competency.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const competency = canvas.getByTestId('competency');
    await expect(competency.textContent).toBe('Mastering Content');
    await expect(look(competency)).toEqual(look(canvas.getByTestId('smart')));
};

/* ------------------------------------------------------------ TagInput */

const onRemove = fn();

export const TagInputChips = {
    render: () => (
        <TagInput
            label="Topics"
            options={[]}
            tags={['Algebra', { text: 'Geometry', color: 'success' }, { text: 'Fractions', color: 'purple' }, { text: 'Ratios', color: 'red' }]}
            onRemove={onRemove}
        />
    ),
    /**
     * TagInput's chips are Tags in a list: 22 tall, each color a Tag color
     * (the old status names are deprecated aliases), and each removable
     * through its own × named for what it removes.
     */
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = canvas.getByRole('list', { name: 'Selected: Topics' });
        const items = within(group).getAllByRole('listitem');
        await expect(items).toHaveLength(4);

        const tagOf = (text) => within(group).getByText(text).parentElement;
        await expect(px(getComputedStyle(tagOf('Algebra')).height), 'a chip is a 22 tag').toBe(22);
        await expect(getComputedStyle(tagOf('Geometry')).borderTopColor, 'success is green')
            .toBe(tokenColor(canvasElement, '--ds-border-accent-green-subtle'));
        await expect(getComputedStyle(tagOf('Fractions')).borderTopColor, 'a Tag color is taken as given')
            .toBe(tokenColor(canvasElement, '--ds-border-accent-purple-subtle'));
        await expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[TagInput] color "success" is deprecated; use "green"'));
        await expect(getComputedStyle(tagOf('Ratios')).borderTopColor, 'an unknown color is gray')
            .toBe(getComputedStyle(tagOf('Algebra')).borderTopColor);
        await expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[TagInput] color "red" is not a Tag color; it falls back to gray.'));

        await userEvent.click(within(group).getByRole('button', { name: 'Remove Geometry' }));
        await expect(onRemove).toHaveBeenCalledWith(1, { text: 'Geometry', color: 'success' });
    },
};

export const TagInputUncontrolled = {
    render: () => <TagInput label="Subjects" options={[]} defaultTags={['Algebra', 'Geometry']} />,
    /** With no `tags`, TagInput keeps its own list: `defaultTags` seeds it and the × removes from it. */
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Algebra')).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', { name: 'Remove Algebra' }));
        await expect(canvas.queryByText('Algebra')).toBeNull();
        await expect(canvas.getByText('Geometry')).toBeInTheDocument();
    },
};

export const TagInputReadOnlyAndDisabled = () => (
    <div style={{ display: 'grid', gap: '16px' }}>
        <TagInput label="Controlled" options={[]} tags={['Algebra']} />
        <TagInput label="Disabled" options={[]} defaultTags={['Geometry']} disabled onRemove={() => {}} />
    </div>
);

/**
 * A × is only offered when pressing it can remove something: a controlled
 * list with no handler has none. A disabled field shows its tags disabled,
 * with no × and no tab stop, as TagGroup's `disabled` does for every field.
 */
TagInputReadOnlyAndDisabled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    const disabled = canvas.getByRole('list', { name: 'Selected: Disabled' });
    await expect(within(disabled).getByRole('listitem')).toHaveTextContent('Geometry, disabled');
};
