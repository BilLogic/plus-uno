import React from 'react';
import { expect, within } from 'storybook/test';

import { withForcedMedia } from '@/storybook-docs/lib/force-media.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Count from '../Count';
import Status from '../Status';
import Tag from '../Tag';
import TagGroup from '../TagGroup';
import Skeleton, { SKELETON_PRESETS, SKELETON_RADII, SKELETON_SHAPES } from './Skeleton';

/**
 * `Skeleton` — a grey placeholder shape while content loads.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is something a person could observe —
 * computed size, corners and color, the accessibility tree, focus — and never
 * a class name. A preset is measured against the real label rendered beside it
 * in the same story, which is what keeps the two from drifting.
 */

export default {
    title: 'Components/Status and loading/Skeleton',
    component: Skeleton,
    parameters: {
        docs: {
            description: {
                component:
                    'A grey placeholder shape while content loads, with presets sized to Status, '
                    + 'Count and Tag. Hidden from assistive tech; the loading region carries aria-busy.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const pair = { display: 'inline-flex', gap: '8px', alignItems: 'center' };

/* ------------------------------------------------------------------ helpers */

const box = (el) => el.getBoundingClientRect();
const radius = (el) => px(getComputedStyle(el).borderTopLeftRadius);

/**
 * The box a label draws, found from its text: the nearest ancestor with
 * corners, so the measurement is the label and not its text line.
 */
const labelOf = (textEl) => {
    let el = textEl;
    while (el.parentElement && radius(el) === 0) el = el.parentElement;
    return el;
};

/** Hidden from assistive tech, never focusable, and not a pointer target. */
const expectInert = async (el, name) => {
    await expect(el.closest('[aria-hidden="true"]'), `${name} is aria-hidden`).not.toBeNull();
    await expect(el.getAttribute('role'), `${name} has no role`).toBeNull();
    await expect(el.hasAttribute('tabindex'), `${name} has no tabindex`).toBe(false);
    el.focus();
    await expect(document.activeElement, `${name} does not take focus`).not.toBe(el);
    await expect(getComputedStyle(el).pointerEvents, `${name} ignores the pointer`).toBe('none');
};

/* ----------------------------------------------------------------- stories */

/**
 * Each label preset beside the label it stands in for. The preset takes the
 * label's height and corners; the width is a stand-in for the text.
 */
export const LabelPresets = () => (
    <div style={row}>
        <span style={pair}>
            <Skeleton preset="status" data-testid="status" />
            <Status>Completed</Status>
        </span>
        <span style={pair}>
            <Skeleton preset="status-spacious" data-testid="status-spacious" />
            <Status size="large">Completed</Status>
        </span>
        <span style={pair}>
            <Skeleton preset="count" data-testid="count" />
            <Count value={12} />
        </span>
        <span style={pair}>
            <Skeleton preset="tag" data-testid="tag" />
            <Tag text="Algebra" />
        </span>
        <span style={pair}>
            <Skeleton preset="tag-person" data-testid="tag-person" />
            <Tag text="Geometry" />
        </span>
    </div>
);
LabelPresets.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [status, statusLarge] = canvas.getAllByText('Completed').map(labelOf);
    const tag = labelOf(canvas.getByText('Algebra'));

    const pairs = [
        ['status', status],
        ['status-spacious', statusLarge],
        ['count', labelOf(canvas.getByText('12'))],
        ['tag', tag],
    ];

    for (const [preset, label] of pairs) {
        const skeleton = canvas.getByTestId(preset);
        await expect(box(skeleton).height, `${preset} is the label's height`).toBe(box(label).height);
        await expect(radius(skeleton), `${preset} has the label's corners`).toBe(radius(label));
        await expectInert(skeleton, preset);
    }

    // The spec's numbers, so a label that changes by mistake is caught too.
    await expect(box(canvas.getByTestId('status')).height).toBe(20);
    await expect(radius(canvas.getByTestId('status'))).toBe(4);
    await expect(box(canvas.getByTestId('status-spacious')).height).toBe(32);
    await expect(radius(canvas.getByTestId('status-spacious'))).toBe(6);
    const count = canvas.getByTestId('count');
    await expect(box(count).width, 'count is a circle').toBe(box(count).height);
    await expect(box(canvas.getByTestId('tag')).height).toBe(22);

    // The person Tag is not in code yet, so the person preset is held to the
    // Tag's height and to being fully round.
    const person = canvas.getByTestId('tag-person');
    await expect(box(person).height, 'tag-person is the Tag height').toBe(box(tag).height);
    await expect(radius(person), 'tag-person is fully round').toBeGreaterThanOrEqual(box(person).height / 2);
    await expectInert(person, 'tag-person');
};

/** A loading TagGroup: three tag shapes at the group's gap. */
export const TagGroupPreset = () => (
    <div style={{ display: 'grid', gap: '16px' }}>
        <Skeleton preset="tag-group" data-testid="group" />
        <TagGroup>
            <Tag text="Algebra" />
            <Tag text="Geometry" />
            <Tag text="Fractions" />
        </TagGroup>
    </div>
);
TagGroupPreset.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByTestId('group');
    const shapes = [...group.children];
    await expect(shapes, 'three tag shapes').toHaveLength(3);

    const realTags = ['Algebra', 'Geometry'].map((text) => labelOf(canvas.getByText(text)));
    const tagBox = realTags[0];

    for (const shape of shapes) {
        await expect(box(shape).height, 'each is a Tag tall').toBe(box(tagBox).height);
        await expect(radius(shape), 'each has the Tag corners').toBe(radius(tagBox));
        await expectInert(shape, 'tag-group shape');
    }
    await expect(box(shapes[1]).left - box(shapes[0]).right, 'the TagGroup gap').toBe(
        box(realTags[1]).left - box(realTags[0]).right,
    );
    await expect(group.getAttribute('aria-hidden')).toBe('true');
};

/** Rectangle (default), circle and text bar; each resizes freely. */
export const Shapes = () => (
    <div style={row}>
        <Skeleton data-testid="rect" width={160} height={64} />
        <Skeleton shape="circle" data-testid="circle" />
        <Skeleton shape="text" width={160} data-testid="text" />
        <Skeleton width={96} height={96} radius="card-radius-sm" data-testid="thumb" />
    </div>
);
Shapes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const rect = canvas.getByTestId('rect');
    await expect(box(rect).width).toBe(160);
    await expect(box(rect).height).toBe(64);
    await expect(radius(rect), 'rect defaults to the Element md radius').toBe(4);

    const circle = canvas.getByTestId('circle');
    await expect(box(circle).width, 'circle is 32 by default').toBe(32);
    await expect(box(circle).height).toBe(32);
    await expect(radius(circle)).toBeGreaterThanOrEqual(16);

    const text = canvas.getByTestId('text');
    await expect(box(text).height, 'a text bar is 16 tall').toBe(16);
    await expect(radius(text)).toBe(4);
    await expect(box(text).width).toBe(160);

    const thumb = canvas.getByTestId('thumb');
    await expect(radius(thumb), 'radius takes a token name').toBe(12);

    // The look: surface-container, with the shimmer toward the lowest surface.
    for (const el of [rect, circle, text, thumb]) {
        const s = getComputedStyle(el);
        await expect(s.backgroundColor, 'fill is surface-container').toBe(tokenColor(canvasElement, '--color-surface-container'));
        await expect(s.backgroundImage, 'the shimmer is a gradient').toContain('linear-gradient');
        await expect(s.backgroundImage, 'toward surface-container-lowest').toContain(
            tokenColor(canvasElement, '--color-surface-container-lowest'),
        );
        await expect(s.animationName, 'shimmering by default').not.toBe('none');
        await expectInert(el, 'shape');
    }
};

/** `lines` repeats the text bar; the last line is shorter so it reads as text. */
export const Paragraph = () => (
    <div style={{ display: 'grid', gap: '24px', width: '240px' }}>
        <Skeleton shape="text" lines={3} data-testid="lines" />
        <Skeleton preset="paragraph" data-testid="paragraph" />
    </div>
);
Paragraph.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const id of ['lines', 'paragraph']) {
        const group = canvas.getByTestId(id);
        const bars = [...group.children];
        await expect(bars, `${id} renders three bars`).toHaveLength(3);
        for (const bar of bars) {
            await expect(box(bar).height, 'each bar is 16 tall').toBe(16);
            await expectInert(bar, `${id} bar`);
        }
        await expect(box(bars[0]).width).toBe(box(bars[1]).width);
        await expect(box(bars[2]).width, 'the last bar is narrower').toBeLessThan(box(bars[1]).width);
        await expect(box(bars[1]).top - box(bars[0]).bottom, 'lines sit 8 apart').toBe(8);
    }
};

/** `isShimmering={false}` is the flat fill, the same look reduced motion gets. */
export const Shimmer = () => (
    <div style={row}>
        <Skeleton preset="tag" data-testid="on" />
        <Skeleton preset="tag" isShimmering={false} data-testid="off" />
    </div>
);
Shimmer.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const on = getComputedStyle(canvas.getByTestId('on'));
    const off = getComputedStyle(canvas.getByTestId('off'));
    await expect(on.animationName).not.toBe('none');
    await expect(off.animationName, 'no animation when off').toBe('none');
    await expect(off.backgroundImage, 'a flat fill when off').toBe('none');
    await expect(off.backgroundColor).toBe(tokenColor(canvasElement, '--color-surface-container'));
};

/**
 * Under `prefers-reduced-motion: reduce` the shimmer stops and the fill is
 * flat. The play function forces the media query through the cascade, since a
 * story cannot set the browser's own motion preference.
 */
export const ReducedMotion = () => (
    <div style={row}>
        <Skeleton preset="status" data-testid="status" />
        <Skeleton shape="text" lines={2} width={160} data-testid="lines" />
    </div>
);
ReducedMotion.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shapes = [canvas.getByTestId('status'), ...canvas.getByTestId('lines').children];

    for (const el of shapes) {
        await expect(getComputedStyle(el).animationName, 'shimmers with motion allowed').not.toBe('none');
    }
    const reduced = withForcedMedia('(prefers-reduced-motion: reduce)', () => shapes.map((el) => {
        const s = getComputedStyle(el);
        return { animation: s.animationName, image: s.backgroundImage, fill: s.backgroundColor };
    }));
    for (const s of reduced) {
        await expect(s.animation, 'no animation under reduced motion').toBe('none');
        await expect(s.image, 'a flat fill under reduced motion').toBe('none');
        await expect(s.fill).toBe(tokenColor(canvasElement, '--color-surface-container'));
    }
    // And the page is restored afterwards.
    await expect(getComputedStyle(shapes[0]).animationName).not.toBe('none');
};

/**
 * A loading table: the region carries `aria-busy`, and every label inside it
 * is a plain text bar. No label shapes inside a loading container.
 */
export const LoadingTable = () => (
    <section aria-labelledby="skeleton-students" aria-busy="true" data-testid="region">
        <h3 id="skeleton-students" className="h6">Students</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
            {[140, 110, 160].map((width) => (
                <div key={width} style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
                    <Skeleton shape="text" width={width} />
                    <Skeleton shape="text" width={64} />
                    <Skeleton shape="text" width={64} />
                </div>
            ))}
        </div>
    </section>
);
LoadingTable.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Students' });
    await expect(region, 'the region is busy').toHaveAttribute('aria-busy', 'true');
    const bars = [...region.querySelectorAll('[aria-hidden="true"]')];
    await expect(bars, 'nine text bars').toHaveLength(9);
    for (const bar of bars) {
        await expect(box(bar).height, 'every bar is a text bar').toBe(16);
    }
};

/** A loading card: the card's skeleton owns everything inside, its tags included. */
export const LoadingCard = () => (
    <div
        aria-busy="true"
        aria-label="Session summary"
        role="group"
        style={{
            display: 'grid',
            gap: '10px',
            width: '294px',
            padding: '16px',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--size-card-radius-sm)',
        }}
    >
        <Skeleton shape="text" width={180} />
        <Skeleton shape="text" lines={2} />
        <span style={{ display: 'flex', gap: '8px' }}>
            <Skeleton shape="text" width={56} />
            <Skeleton shape="text" width={56} />
        </span>
    </div>
);
LoadingCard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Session summary' })).toHaveAttribute('aria-busy', 'true');
};

/* -------------------------------------------------------------- playground */

/** Interactive playground. */
export const Interactive = {
    args: {
        shape: 'rect',
        preset: undefined,
        width: 160,
        height: 64,
        radius: 'element-radius-md',
        lines: 1,
        isShimmering: true,
    },
    argTypes: {
        shape: { control: 'inline-radio', options: SKELETON_SHAPES },
        preset: { control: 'select', options: [undefined, ...SKELETON_PRESETS] },
        radius: { control: 'select', options: Object.keys(SKELETON_RADII) },
    },
    render: (args) => <Skeleton {...args} />,
};
