import React from 'react';
import { expect, fn, spyOn, userEvent, within } from 'storybook/test';

import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import CompetencyBadge from '@/components/_internal/CompetencyBadge';
import StaticBadgeSmart from '@/components/_internal/StaticBadgeSmart';
import TagInput from '@/components/forms-and-inputs/TagInput';

import Tag from './Tag';

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
    title: 'Components/Status and loading/Label migration',
    tags: ['!dev', '!autodocs'],
    beforeEach: () => {
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        return () => warn.mockRestore();
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' };

/** Each SMART area, the Tag color it takes, and the curriculum token behind that color. */
const SMART = [
    ['socio-emotional', 'Social-Emotional Learning', 'yellow', 'social-emotional'],
    ['mastering-content', 'Mastering Content', 'purple', 'mastering-content'],
    ['advocacy', 'Advocacy', 'green', 'advocacy'],
    ['relationships', 'Relationships', 'magenta', 'relationship'],
    ['technology-tools', 'Technology Tools', 'blue', 'technology-tools'],
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
        {SMART.map(([type, text, color]) => (
            <React.Fragment key={type}>
                <StaticBadgeSmart type={type} data-testid={`smart-${type}`} />
                <Tag color={color} data-testid={`tag-${type}`}>{text}</Tag>
            </React.Fragment>
        ))}
    </div>
);

/**
 * A SMART area is a read-only Tag in its curriculum color: 22 tall, outlined
 * in the hue's subtle border, the hue on the swatch, neutral text, and nothing
 * to press.
 */
SmartAreas.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [type, text, , token] of SMART) {
        const smart = canvas.getByTestId(`smart-${type}`);
        await expect(smart.textContent, `${type} says its area`).toBe(text);
        await expect(look(smart), `${type} looks like a ${token} tag`).toEqual(look(canvas.getByTestId(`tag-${type}`)));
        await expect(px(getComputedStyle(smart).height), `${type} is 22 tall`).toBe(22);
        await expect(getComputedStyle(smart).borderTopColor, `${type} is outlined in its hue`)
            .toBe(tokenColor(canvasElement, `--color-${token}-border-subtle`));
        await expect(getComputedStyle(swatchOf(smart)).backgroundColor, `${type} carries its hue on the swatch`)
            .toBe(tokenColor(canvasElement, `--color-${token}`));
    }
    await expect(canvas.queryByRole('button')).toBeNull();
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
            tags={['Algebra', { text: 'Geometry', color: 'success' }, { text: 'Fractions', color: 'purple' }]}
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
        const group = canvas.getByRole('group', { name: 'Topics' });
        const items = within(group).getAllByRole('listitem');
        await expect(items).toHaveLength(3);

        const tagOf = (text) => within(group).getByText(text).parentElement;
        await expect(px(getComputedStyle(tagOf('Algebra')).height), 'a chip is a 22 tag').toBe(22);
        await expect(getComputedStyle(tagOf('Geometry')).borderTopColor, 'success is green')
            .toBe(tokenColor(canvasElement, '--color-advocacy-border-subtle'));
        await expect(getComputedStyle(tagOf('Fractions')).borderTopColor, 'a Tag color is taken as given')
            .toBe(tokenColor(canvasElement, '--color-mastering-content-border-subtle'));
        await expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[TagInput] color "success" is deprecated; use "green"'));

        await userEvent.click(within(group).getByRole('button', { name: 'Remove Geometry' }));
        await expect(onRemove).toHaveBeenCalledWith(1, { text: 'Geometry', color: 'success' });
    },
};

export const TagInputUncontrolled = {
    render: () => <TagInput label="Subjects" defaultTags={['Algebra', 'Geometry']} />,
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
        <TagInput label="Controlled" tags={['Algebra']} />
        <TagInput label="Disabled" defaultTags={['Geometry']} disabled onRemove={() => {}} />
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
    const disabled = canvas.getByRole('group', { name: 'Disabled' });
    await expect(within(disabled).getByRole('listitem')).toHaveTextContent('Geometry, disabled');
};
