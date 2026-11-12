import React, { useState } from 'react';
import { Button } from '@/components';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { computedShadow, probe, px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import Tag, { AVATAR_TAG_TYPES, TAG_COLORS, TagContext } from './Tag';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import { expectFocusRing as expectRing } from '@/storybook-docs/lib/button-states.js';
import { iconClass } from '../../../lib/icon';

/**
 * `Tag` — a category, outlined: color on the border, neutral text, one size
 * (22), selectable, removable and link. A color swatch and a leading icon are
 * opt-in.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. A good assertion here is one a person could make by using
 * the component or by measuring it: a role, a name, focus order, a computed
 * height, width or color. Never a class name.
 *
 * Hover and press are forced through `withForcedPseudo`, because a synthetic
 * event never sets `:hover` or `:active`; the browser's own cascade still
 * decides what the forced state looks like.
 *
 * Contrast is not re-asserted: the a11y ratchet tracks `color-contrast` over
 * every story rendered.
 */

export default {
    title: 'Components/Labels/Tag',
    component: Tag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Is it a number? Count. Is it the condition something is in, and can that '
                    + 'condition change? Status. Otherwise, Tag: a subject, a focus area, a person, '
                    + 'a category. Outlined, with neutral text and the color on the border.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' };

/* ------------------------------------------------------------------ helpers */

/** A computed style property of `measured` while `target` is forced into `pseudo`. */
const whileForced = (target, pseudo, property, measured = target) =>
    withForcedPseudo(target, pseudo, () => getComputedStyle(measured)[property]);

const CLEAR = 'rgba(0, 0, 0, 0)';

/* ----------------------------------------------------------------- stories */

/** Every color. The hue is on the border; the words stay neutral and nothing leads the text. */
export const Colors = () => (
    <div style={row}>
        {TAG_COLORS.map((color) => (
            <Tag key={color} color={color} data-testid={color}>{color}</Tag>
        ))}
    </div>
);

/**
 * A color name paints the accent it names, on the border and on nothing else:
 * a plain tag has no swatch. The border is the accent's subtle border, and the
 * text is the same neutral on every color.
 */
Colors.play = async ({ canvasElement }) => {
    await inEveryColorMode(async () => {
        const canvas = within(canvasElement);
        const ink = tokenColor(canvasElement, '--ds-text');

        for (const color of TAG_COLORS) {
            const tag = canvas.getByTestId(color);
            const s = getComputedStyle(tag);

            await expect(px(s.height), `${color} is 22 tall`).toBe(22);
            await expect(px(s.borderTopWidth), `${color} has a 1px border`).toBe(1);
            await expect(s.color, `${color} text is neutral`).toBe(ink);

            await expect(s.borderTopColor, `${color} border`)
                .toBe(tokenColor(canvasElement, `--ds-border-accent-${color}-subtle`));

            await expect(tag.querySelector('[aria-hidden="true"]'), `${color} has no swatch by default`).toBeNull();
        }

        // Gray is the one name that is not a hue: a default that drifted into a
        // color would have every uncolored tag claiming a category nobody gave it.
        const [r, g, b] = getComputedStyle(canvas.getByTestId('gray')).borderTopColor.match(/\d+/g).map(Number);
        await expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(12);
    });
};

/**
 * The two opt-in leads. A plain tag leads with nothing. `swatchBefore` adds the
 * 10 color square for wayfinding: `true` is the tag's own color, a background
 * color token another. `elemBefore` adds an icon that carries meaning, and sits
 * after a swatch when both are set.
 */
export const LeadingSwatchAndIcon = () => (
    <div style={row}>
        <Tag color="blue" data-testid="default">Default</Tag>
        <Tag color="blue" swatchBefore data-testid="swatch">Swatch</Tag>
        <Tag color="blue" swatchBefore="background-accent-orange-bolder" data-testid="token">Token</Tag>
        <Tag color="blue" elemBefore={<i className={iconClass('star')} />} data-testid="icon">Icon</Tag>
        <Tag color="blue" swatchBefore elemBefore={<i className={iconClass('star')} />} data-testid="both">Both</Tag>
    </div>
);

LeadingSwatchAndIcon.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await inEveryColorMode(async () => {
            const swatchOf = (id) => canvas.getByTestId(id).querySelector('.plus-tag__swatch');

            await expect(canvas.getByTestId('default').querySelector('[aria-hidden="true"]'), 'no swatch by default').toBeNull();
            await expect(canvas.getByTestId('default').querySelector('i'), 'no icon by default').toBeNull();

            const swatch = swatchOf('swatch');
            await expect(getComputedStyle(swatch).backgroundColor, 'true takes the tag color')
                .toBe(tokenColor(canvasElement, '--ds-icon-accent-blue'));
            await expect(px(getComputedStyle(swatch).width)).toBe(10);
            await expect(px(getComputedStyle(swatch).borderTopLeftRadius)).toBe(2);
            await expect(swatch).toHaveAttribute('aria-hidden', 'true');

            await expect(getComputedStyle(swatchOf('token')).backgroundColor, 'a token names another color')
                .toBe(tokenColor(canvasElement, '--ds-background-accent-orange-bolder'));

            await expect(canvas.getByTestId('icon').querySelector('.fa-star'), 'the icon slot').not.toBeNull();
            await expect(swatchOf('icon'), 'an icon does not add a swatch').toBeNull();

            const both = canvas.getByTestId('both');
            await expect(
                swatchOf('both').compareDocumentPosition(both.querySelector('.fa-star')) & Node.DOCUMENT_POSITION_FOLLOWING,
                'the swatch comes first',
            ).toBeTruthy();
    });
};

/**
 * A raw CSS color is not a color token: `swatchBefore` refuses it with a
 * warning in development, and the swatch keeps the tag's own color.
 */
export const SwatchRefusesRawColor = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <Button onClick={() => setMounted(true)}>Mount the tag</Button>
                {mounted && <Tag color="green" swatchBefore="#ff0000" data-testid="raw">Legend</Tag>}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount the tag' }));
            const swatch = canvas.getByTestId('raw').querySelector('.plus-tag__swatch');
            await expect(swatch, 'the swatch still draws').not.toBeNull();
            await expect(getComputedStyle(swatch).backgroundColor, 'in the tag color, not red')
                .toBe(tokenColor(canvasElement, '--ds-icon-accent-green'));
            await expect(warn.mock.calls.some(([m]) => String(m).includes('not a raw color'))).toBe(true);
        } finally {
            warn.mockRestore();
        }
    },
};

/** The three colors added to the palette: plain, selected, and as an agent with initials. */
const NEW_COLORS = ['orange', 'lime', 'brown'];

export const NewColorsContrast = () => (
    <div style={row}>
        {NEW_COLORS.map((color) => (
            <React.Fragment key={color}>
                <Tag isSelected={false} color={color} data-testid={`${color}-tag`}>{color}</Tag>
                <Tag color={color} isSelected data-testid={`${color}-selected`}>{`${color} selected`}</Tag>
                <Tag type="agent" color={color} data-testid={`${color}-agent`}>{`${color} agent`}</Tag>
            </React.Fragment>
        ))}
    </div>
);

/**
 * Orange, lime and brown keep each text and background pair at 4.5:1 or above
 * in all four modes: the neutral words on the hovered, pressed and selected
 * fills, and the accent's initials on its avatar fill.
 */
NewColorsContrast.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await inEveryColorMode(async (mode) => {
        for (const color of NEW_COLORS) {
            const tag = canvas.getByTestId(`${color}-tag`);
            const ink = getComputedStyle(tag).color;
            for (const pseudo of [':hover', ':active']) {
                const ground = whileForced(tag, pseudo, 'backgroundColor');
                await expect(contrastRatio(ink, ground), `${mode}: ${color} words ${pseudo}`)
                    .toBeGreaterThanOrEqual(4.5);
            }
            const selected = getComputedStyle(canvas.getByTestId(`${color}-selected`));
            await expect(contrastRatio(selected.color, selected.backgroundColor), `${mode}: ${color} selected words`)
                .toBeGreaterThanOrEqual(4.5);
            const avatar = avatarOf(canvas.getByTestId(`${color}-agent`));
            const initials = getComputedStyle(avatar.firstElementChild).color;
            await expect(contrastRatio(initials, getComputedStyle(avatar).backgroundColor), `${mode}: ${color} initials`)
                .toBeGreaterThanOrEqual(4.5);
        }
    });
};

/** The four behaviors, and the states that change a tag's contents. */
export const Behaviors = () => (
    <div style={row}>
        <Tag color="blue" data-testid="read-only">Read only</Tag>
        <Tag isRemovable color="blue" onAfterRemoveAction={() => {}} data-testid="removable">Removable</Tag>
        <Tag isSelected={false} color="blue" data-testid="selectable">Selectable</Tag>
        <Tag color="blue" isSelected trailingMetric={12} data-testid="selected">Selected</Tag>
        <Tag color="blue" href="#tag" data-testid="link">Link</Tag>
        <Tag color="blue" href="#tag" isRemovable onAfterRemoveAction={() => {}} data-testid="split">Link with remove</Tag>
        <Tag isRemovable color="blue" onAfterRemoveAction={() => {}} isLoading data-testid="saving">Lincoln Middle</Tag>
    </div>
);

/** One size: every behavior and state is 22 tall, the count and the × included. */
Behaviors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const id of ['read-only', 'removable', 'selectable', 'selected', 'link', 'split', 'saving']) {
        await expect(px(getComputedStyle(canvas.getByTestId(id)).height), `${id} is 22 tall`).toBe(22);
    }
};

/* ------------------------------------------------------------------- types */

/*
 * Avatars for the type stories: inline SVG, so no story depends on a network
 * image, and a `broken` source that never loads, to exercise the fallback.
 */
const svgAvatar = (fill) => `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="${fill}"/></svg>`,
)}`;
const PHOTO = svgAvatar('#8659a9');
const BROKEN = 'data:image/png;base64,broken';

/** The avatar box: the one `aria-hidden` element at the front of the tag. */
const avatarOf = (tag) => tag.querySelector('[aria-hidden="true"]');

/**
 * The four types. A person, an agent or a team carries a 16 avatar in place of
 * the swatch: round for a person (and the whole tag is round), a hexagon for an
 * agent, a square with radius-2 corners for a team. With no `avatar`, initials stand in.
 */
export const Types = () => (
    <div style={row}>
        <Tag color="blue" data-testid="plain">Lincoln Middle</Tag>
        <Tag type="person" isRemovable onAfterRemoveAction={() => {}} data-testid="person">Rosa Chen</Tag>
        <Tag type="agent" color="purple" isRemovable onAfterRemoveAction={() => {}} data-testid="agent">Grading bot</Tag>
        <Tag type="team" isRemovable onAfterRemoveAction={() => {}} data-testid="team">Math team</Tag>
        <Tag type="person" avatar={PHOTO} data-testid="person-photo">Kai Brooks</Tag>
        <Tag type="agent" avatar={PHOTO} data-testid="agent-photo">Tutor bot</Tag>
        <Tag type="team" avatar={PHOTO} data-testid="team-photo">Science team</Tag>
    </div>
);

/**
 * Every type is 22 tall with a 16 avatar. A person is fully round, and so is
 * its ×; an agent's avatar is a hexagon; a team's is a square with radius-2 corners.
 * The border is neutral on every avatar type, and the color goes to the
 * avatar's fill.
 */
Types.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const neutral = tokenColor(canvasElement, '--ds-border-accent-gray-subtle');

    for (const id of ['plain', 'person', 'agent', 'team', 'person-photo', 'agent-photo', 'team-photo']) {
        const tag = canvas.getByTestId(id);
        await expect(px(getComputedStyle(tag).height), `${id} is 22 tall`).toBe(22);
        if (id === 'plain') continue;
        const avatar = avatarOf(tag);
        await expect(px(getComputedStyle(avatar).width), `${id} avatar is 16 wide`).toBe(16);
        await expect(px(getComputedStyle(avatar).height), `${id} avatar is 16 tall`).toBe(16);
        await expect(getComputedStyle(tag).borderTopColor, `${id} border is neutral`).toBe(neutral);
    }

    // A person is fully round: the corner is at least half the height.
    const person = canvas.getByTestId('person');
    await expect(px(getComputedStyle(person).borderTopLeftRadius), 'a person tag is round')
        .toBeGreaterThanOrEqual(11);
    await expect(px(getComputedStyle(avatarOf(person)).borderTopLeftRadius), 'with a round avatar')
        .toBeGreaterThanOrEqual(8);
    const personX = canvas.getByRole('button', { name: 'Remove Rosa Chen' });
    await expect(px(getComputedStyle(personX).borderTopLeftRadius), 'and a round ×')
        .toBeGreaterThanOrEqual(8);

    // The other types keep the plain tag's corners.
    for (const id of ['plain', 'agent', 'team']) {
        await expect(px(getComputedStyle(canvas.getByTestId(id)).borderTopLeftRadius), `${id} corners`).toBe(4);
    }
    await expect(px(getComputedStyle(canvas.getByRole('button', { name: 'Remove Math team' })).borderTopLeftRadius))
        .toBe(2);

    // An agent is a hexagon: six points, pointed top and bottom.
    for (const id of ['agent', 'agent-photo']) {
        const clip = getComputedStyle(avatarOf(canvas.getByTestId(id))).clipPath;
        await expect(clip, `${id} is clipped to a polygon`).toMatch(/^polygon\(/);
        await expect(clip.split(',').length, `${id} has six corners`).toBe(6);
        await expect(clip, 'pointed at the top').toContain('50% 0%');
    }

    // A team is a square with radius-2 corners; a person photo is round.
    await expect(px(getComputedStyle(avatarOf(canvas.getByTestId('team'))).borderTopLeftRadius)).toBe(2);
    await expect(px(getComputedStyle(avatarOf(canvas.getByTestId('team-photo'))).borderTopLeftRadius)).toBe(2);
    await expect(px(getComputedStyle(avatarOf(canvas.getByTestId('person-photo'))).borderTopLeftRadius))
        .toBeGreaterThanOrEqual(8);

    // The color fills the avatar: an agent sits on its accent's subtler step.
    await expect(getComputedStyle(avatarOf(canvas.getByTestId('agent'))).backgroundColor)
        .toBe(tokenColor(canvasElement, '--ds-background-accent-purple-subtler'));
    await expect(getComputedStyle(avatarOf(canvas.getByTestId('person'))).backgroundColor)
        .toBe(tokenColor(canvasElement, '--ds-background-accent-gray-subtler'));

    // The avatar is decoration: the words name the tag, and the initials do not.
    await expect(within(person).getByText('RC')).toBeInTheDocument();
    await expect(avatarOf(person)).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByTestId('person-photo').querySelector('img')).toHaveAttribute('alt', '');
};

/**
 * A missing or broken avatar falls back to initials in the same 16 box, so a
 * tag is the same width whether its photo loaded, failed, or was never given.
 */
export const AvatarFallback = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
        {AVATAR_TAG_TYPES.map((type) => (
            <div key={type} style={row}>
                <Tag type={type} avatar={PHOTO} data-testid={`${type}-loaded`}>Rosa Chen</Tag>
                <Tag type={type} avatar={BROKEN} data-testid={`${type}-broken`}>Rosa Chen</Tag>
                <Tag type={type} data-testid={`${type}-none`}>Rosa Chen</Tag>
            </div>
        ))}
    </div>
);

AvatarFallback.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const initials = { person: 'RC', agent: 'R', team: 'R' };

    for (const type of AVATAR_TAG_TYPES) {
        const loaded = canvas.getByTestId(`${type}-loaded`);
        const broken = canvas.getByTestId(`${type}-broken`);
        const none = canvas.getByTestId(`${type}-none`);

        // The broken image gives up and shows initials, like the tag with none.
        await waitFor(() => expect(broken.querySelector('img'), `${type} drops a broken image`).toBeNull());
        await expect(within(broken).getByText(initials[type])).toBeInTheDocument();
        await expect(within(none).getByText(initials[type])).toBeInTheDocument();

        const width = loaded.getBoundingClientRect().width;
        await expect(broken.getBoundingClientRect().width, `${type}: no layout shift`).toBe(width);
        await expect(none.getBoundingClientRect().width, `${type}: no layout shift`).toBe(width);
        await expect(px(getComputedStyle(none).height)).toBe(22);
    }
};

/**
 * Every behavior works on every type: the × removes and is named after the
 * label, a selectable tag toggles, a link follows, saving swaps the avatar for
 * a spinner without moving the tag, and a disabled field takes the × away.
 */
export const TypeBehaviors = {
    args: { onRemoveSpy: fn(), onFollowSpy: fn() },
    render: ({ onRemoveSpy, onFollowSpy }) => {
        const Row = ({ type, label }) => {
            const [on, setOn] = useState(false);
            const [saving, setSaving] = useState(false);
            return (
                <div style={row} data-testid={`${type}-row`}>
                    <Tag type={type} isRemovable onAfterRemoveAction={() => onRemoveSpy(type)} isLoading={saving} data-testid={`${type}-removable`}>{label}</Tag>
                    <Tag type={type}  isSelected={on} onClick={() => setOn((v) => !v)} data-testid={`${type}-selectable`}>{`${label} filter`}</Tag>
                    <Tag
                        type={type}
                        href={`#${type}`}
                        onClick={(e) => {
                            e.preventDefault();
                            onFollowSpy(type);
                        }}
                        isRemovable onAfterRemoveAction={() => {}}
                        data-testid={`${type}-link`}
                    >
                        {`${label} page`}
                    </Tag>
                    <Button onClick={() => setSaving((v) => !v)}>{`Save ${type}`}</Button>
                    <TagContext.Provider value={{ isDisabled: true }}>
                        <Tag type={type} isRemovable onAfterRemoveAction={() => {}} data-testid={`${type}-disabled`}>{`${label} locked`}</Tag>
                    </TagContext.Provider>
                </div>
            );
        };
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Row type="person" label="Rosa Chen" />
                <Row type="agent" label="Tutor bot" />
                <Row type="team" label="Math team" />
            </div>
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const labels = { person: 'Rosa Chen', agent: 'Tutor bot', team: 'Math team' };

        for (const [type, label] of Object.entries(labels)) {
            for (const kind of ['removable', 'selectable', 'link', 'disabled']) {
                await expect(px(getComputedStyle(canvas.getByTestId(`${type}-${kind}`)).height), `${type} ${kind} is 22 tall`)
                    .toBe(22);
            }

            // Removable: the × is named after the words, never the initials.
            await userEvent.click(canvas.getByRole('button', { name: `Remove ${label}` }));
            await expect(args.onRemoveSpy).toHaveBeenLastCalledWith(type);

            // Selectable: a toggle named by its label alone.
            const toggle = canvas.getByRole('button', { name: `${label} filter`, pressed: false });
            await userEvent.click(toggle);
            await expect(canvas.getByRole('button', { name: `${label} filter`, pressed: true })).toBeInTheDocument();

            // Link, with its separate ×: two targets, link first.
            const link = canvas.getByRole('link', { name: `${label} page` });
            await userEvent.click(link);
            await expect(args.onFollowSpy).toHaveBeenLastCalledWith(type);
            await expect(link.contains(canvas.getByRole('button', { name: `Remove ${label} page` }))).toBe(false);

            // Disabled: no ×, nothing to focus.
            await expect(canvas.queryByRole('button', { name: `Remove ${label} locked` })).toBeNull();

            // Saving: the spinner takes the avatar's place and the tag keeps its width.
            const tag = canvas.getByTestId(`${type}-removable`);
            const before = tag.getBoundingClientRect().width;
            await expect(within(tag).queryByText(/^[A-Z]{1,2}$/), 'initials at rest').not.toBeNull();
            await userEvent.click(canvas.getByRole('button', { name: `Save ${type}` }));
            await expect(tag.getBoundingClientRect().width, `${type}: saving keeps the width`).toBe(before);
            await expect(within(tag).queryByText(/^[A-Z]{1,2}$/), 'the avatar gives way to the spinner').toBeNull();
            await expect(px(getComputedStyle(avatarOf(tag)).width), 'in the same 16 box').toBe(16);

            // The avatar spinner is Figma's: a 3/4 arc in the subtle icon
            // color, 12 across, whatever the tag's color.
            const spinner = avatarOf(tag).firstElementChild;
            const ring = spinner.querySelector('circle');
            const ink = tokenColor(canvasElement, '--ds-icon-subtle');
            await expect(px(getComputedStyle(spinner).width), 'a 12 spinner').toBe(12);
            await expect(getComputedStyle(ring).stroke, 'in the subtle icon color').toBe(ink);
            await expect(px(getComputedStyle(ring).strokeWidth), 'a 1.8 ring').toBeCloseTo(1.8, 5);
            const [arc, round] = getComputedStyle(ring).strokeDasharray.split(',').map(px);
            await expect(arc / round, 'three quarters of the ring').toBeCloseTo(0.75, 2);
            await expect(tag.nextElementSibling, 'announced beside the tag').toHaveAttribute('role', 'status');
            await expect(tag.nextElementSibling).toHaveTextContent('Saving');
            await userEvent.click(canvas.getByRole('button', { name: `Save ${type}` }));
        }
    },
};

/**
 * A person tag's focus ring follows its round shape: the outline is drawn
 * around the tag's own full radius, and a focused × on it is round too.
 */
export const PersonFocusRing = () => (
    <div style={row}>
        <Tag type="person" isSelected={false} color="teal">Rosa Chen</Tag>
        <Tag type="person" isRemovable onAfterRemoveAction={() => {}}>Kai Brooks</Tag>
    </div>
);

PersonFocusRing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--ds-border-focused');

    await userEvent.tab();
    const tag = canvas.getByRole('button', { name: 'Rosa Chen' });
    await expect(tag).toHaveFocus();
    const s = getComputedStyle(tag);
    await expect(s.outlineStyle).toBe('solid');
    await expect(px(s.outlineWidth)).toBe(2);
    await expect(px(s.outlineOffset)).toBe(2);
    await expect(s.outlineColor).toBe(ring);
    await expect(px(s.borderTopLeftRadius), 'the ring follows a round tag').toBeGreaterThanOrEqual(11);

    await userEvent.tab();
    const x = canvas.getByRole('button', { name: 'Remove Kai Brooks' });
    await expect(x).toHaveFocus();
    await expect(getComputedStyle(x).outlineColor).toBe(ring);
    await expect(px(getComputedStyle(x).borderTopLeftRadius), 'and a round ×').toBeGreaterThanOrEqual(8);
};

/**
 * The × on an agent or team tag keeps the plain 2 corners, and its focus ring
 * lands on Figma's radius-150: the ring's outer corner is the ×'s 2, plus the
 * 2 offset, plus the 2 stroke.
 */
export const RemoveFocusRingOnTypes = () => (
    <div style={row}>
        <Tag type="agent" isRemovable onAfterRemoveAction={() => {}}>Tutor bot</Tag>
        <Tag type="team" isRemovable onAfterRemoveAction={() => {}}>Math team</Tag>
    </div>
);

RemoveFocusRingOnTypes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Remove Tutor bot', 'Remove Math team']) {
        await userEvent.tab();
        const x = canvas.getByRole('button', { name });
        await expect(x).toHaveFocus();
        const s = getComputedStyle(x);
        await expect(s.outlineStyle, name).toBe('solid');
        const outer = px(s.borderTopLeftRadius) + px(s.outlineOffset) + px(s.outlineWidth);
        await expect(outer, `${name}: the ring's outer corner is radius-150`).toBe(6);
    }
};

/**
 * The edges of the fallback. Initials are whole characters, so an emoji or an
 * accented letter is never split, and never more than two, even when a letter
 * upper-cases to two (ß is SS). A label that is not text has no initials, and
 * development says so unless an avatar is given. Leading content meant for a
 * plain tag is ignored on an avatar type, with a warning. A disabled tag that
 * is saving shows its spinner on a clear ground, not a gray disc, and a broken
 * avatar is still on initials once a save ends.
 */
export const AvatarEdgeCases = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        const [saving, setSaving] = useState(false);
        return (
            <div style={row}>
                <Button onClick={() => setMounted(true)}>Mount the edge cases</Button>
                <Button onClick={() => setSaving((v) => !v)}>Toggle saving</Button>
                {mounted && (
                    <>
                        <Tag type="agent" data-testid="emoji">😀 Helper</Tag>
                        <Tag type="person" data-testid="eszett">ßen Öztürk</Tag>
                        <Tag type="person" data-testid="node"><em>Rosa Chen</em></Tag>
                        <Tag type="person" avatar={PHOTO} data-testid="node-with-avatar"><em>Kai Brooks</em></Tag>
                        <Tag type="team" elemBefore={<i className={iconClass('star')} />} data-testid="elem">Math team</Tag>
                        <Tag type="team" swatchBefore data-testid="swatch">Science team</Tag>
                        <TagContext.Provider value={{ isDisabled: true }}>
                            <Tag type="person" isLoading data-testid="disabled-saving">Rosa Chen</Tag>
                        </TagContext.Provider>
                        <Tag type="person" avatar={BROKEN} isLoading={saving} data-testid="broken-saved">Rosa Chen</Tag>
                    </>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount the edge cases' }));

            await expect(avatarOf(canvas.getByTestId('emoji')).textContent, 'an emoji stays whole').toBe('😀');
            const eszett = avatarOf(canvas.getByTestId('eszett')).textContent;
            await expect(Array.from(eszett).length, 'never more than two').toBeLessThanOrEqual(2);
            await expect(eszett).toBe('SS');
            await expect(avatarOf(canvas.getByTestId('node')).textContent, 'a node has no initials').toBe('');

            const messages = warn.mock.calls.map(([m]) => String(m));
            await expect(messages.some((m) => m.includes('no initials')), 'a node label with no avatar warns')
                .toBe(true);
            await expect(messages.some((m) => m.includes('`elemBefore`'))).toBe(true);
            await expect(messages.some((m) => m.includes('`swatchBefore`'))).toBe(true);

            // The team keeps its avatar, not the star or the swatch.
            await expect(canvas.getByTestId('elem').querySelector('.fa-star')).toBeNull();
            await expect(px(getComputedStyle(avatarOf(canvas.getByTestId('swatch'))).width)).toBe(16);

            const saving = avatarOf(canvas.getByTestId('disabled-saving'));
            await expect(getComputedStyle(saving).backgroundColor, 'no gray disc behind the spinner').toBe(CLEAR);

            // A broken avatar stays broken through a save: once the save ends,
            // the tag is back on initials and does not retry the image.
            const brokenSaved = canvas.getByTestId('broken-saved');
            await waitFor(() => expect(brokenSaved.querySelector('img'), 'the broken image gives up').toBeNull());
            const toggle = canvas.getByRole('button', { name: 'Toggle saving' });
            await userEvent.click(toggle);
            await expect(brokenSaved.querySelector('svg'), 'saving shows the spinner').not.toBeNull();
            // A retried image could fail again within a frame, so watch for any
            // image being added at all, not only for one still there.
            let retried = 0;
            const watch = new MutationObserver((records) => {
                for (const r of records) {
                    for (const n of r.addedNodes) {
                        if (n.nodeName === 'IMG' || n.querySelector?.('img')) retried += 1;
                    }
                }
            });
            watch.observe(brokenSaved, { childList: true, subtree: true });
            await userEvent.click(toggle);
            await waitFor(() => expect(within(brokenSaved).getByText('RC'), 'back on initials after the save')
                .toBeInTheDocument());
            watch.disconnect();
            await expect(retried, 'no image is retried').toBe(0);
            await expect(brokenSaved.querySelector('img')).toBeNull();
        } finally {
            warn.mockRestore();
        }
    },
};

/**
 * The avatar's fill. A hued person or team sits on its accent's subtler step, a
 * gray team on the lightest blue, and a disabled tag's photo stays whole: the
 * image covers the box at full opacity and in full color.
 */
export const AvatarFills = () => (
    <div style={row}>
        <Tag type="team" color="blue" data-testid="team-blue">Math team</Tag>
        <Tag type="person" color="teal" data-testid="person-teal">Rosa Chen</Tag>
        <Tag type="team" data-testid="team-gray">Science team</Tag>
        <TagContext.Provider value={{ isDisabled: true }}>
            <Tag type="person" avatar={PHOTO} data-testid="disabled-photo">Kai Brooks</Tag>
        </TagContext.Provider>
    </div>
);

AvatarFills.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fill = (id) => getComputedStyle(avatarOf(canvas.getByTestId(id))).backgroundColor;

    await expect(fill('team-blue'), 'a blue team fills the blue subtler step')
        .toBe(tokenColor(canvasElement, '--ds-background-accent-blue-subtler'));
    await expect(fill('person-teal'), 'a teal person fills the teal subtler step')
        .toBe(tokenColor(canvasElement, '--ds-background-accent-teal-subtler'));
    await expect(fill('team-gray'), 'a gray team fills the lightest blue')
        .toBe(tokenColor(canvasElement, '--ds-background-accent-blue-subtlest'));

    // Disabled grays the tag, never the person: the photo shows as it is.
    const img = canvas.getByTestId('disabled-photo').querySelector('img');
    await expect(img, 'the photo is shown').not.toBeNull();
    await expect(px(getComputedStyle(img).width), 'covering the 16 box').toBe(16);
    let node = img;
    while (node && node !== canvasElement) {
        const s = getComputedStyle(node);
        await expect(Number(s.opacity), 'at full opacity').toBe(1);
        await expect(s.filter, 'not desaturated').toBe('none');
        node = node.parentElement;
    }
};

/* -------------------------------------------------------------- selectable */

/** A selectable tag is a toggle, and says so through `aria-pressed`. */
export const Selecting = () => {
    const [picked, setPicked] = useState(['Science']);
    const toggle = (s) => setPicked((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    return (
        <div style={row}>
            {['Science', 'Mathematics'].map((s) => (
                <Tag
                    key={s}
                    
                    color="magenta"
                    isSelected={picked.includes(s)}
                    onClick={() => toggle(s)}
                >
                    {s}
                </Tag>
            ))}
        </div>
    );
};

Selecting.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const science = canvas.getByRole('button', { name: 'Science', pressed: true });
    const maths = canvas.getByRole('button', { name: 'Mathematics', pressed: false });

    await userEvent.click(maths);
    await expect(canvas.getByRole('button', { name: 'Mathematics', pressed: true })).toBeInTheDocument();

    await userEvent.click(science);
    await expect(canvas.getByRole('button', { name: 'Science', pressed: false })).toBeInTheDocument();
};

/** The accent's own steps, in place of a brightness filter. */
export const StateLayers = () => (
    <div style={row}>
        <Tag isSelected={false} color="blue">Unselected</Tag>
        <Tag color="blue" isSelected>Selected</Tag>
        <Tag color="gray" isSelected>Gray selected</Tag>
        <Tag color="green" href="#tag">Link</Tag>
        <Tag color="green" href="#tag" isRemovable onAfterRemoveAction={() => {}} data-testid="split">Split link</Tag>
        <Tag isRemovable color="purple" onAfterRemoveAction={() => {}} data-testid="removable">Removable</Tag>
    </div>
);

/**
 * Selectable: hover is the accent's subtlest step, pressed subtlest pressed;
 * selected is the subtler step with a full-hue border, held on hover or press.
 * A link takes the same hover and pressed steps, and its text underlines on
 * hover and press only. On a removable tag only the × reacts, on the neutral
 * subtle steps, and the tag's own ground never moves.
 */
StateLayers.play = async ({ canvasElement }) => {
    await inEveryColorMode(async () => {
        const canvas = within(canvasElement);
        const t = (token) => tokenColor(canvasElement, token);
        const bg = 'backgroundColor';

        const unselected = canvas.getByRole('button', { name: 'Unselected' });
        await expect(getComputedStyle(unselected)[bg], 'rest is outlined only').toBe(CLEAR);
        await expect(whileForced(unselected, ':hover', bg)).toBe(t('--ds-background-accent-blue-subtlest'));
        await expect(whileForced(unselected, ':active', bg)).toBe(t('--ds-background-accent-blue-subtlest-pressed'));

        const selected = canvas.getByRole('button', { name: 'Selected' });
        await expect(getComputedStyle(selected).borderTopColor, 'selected border is the full hue')
            .toBe(t('--ds-border-accent-blue'));
        await expect(getComputedStyle(selected)[bg]).toBe(t('--ds-background-accent-blue-subtler'));
        await expect(whileForced(selected, ':hover', bg)).toBe(t('--ds-background-accent-blue-subtler'));
        await expect(whileForced(selected, ':active', bg)).toBe(t('--ds-background-accent-blue-subtler'));

        const gray = canvas.getByRole('button', { name: 'Gray selected' });
        await expect(getComputedStyle(gray).borderTopColor).toBe(t('--ds-border-accent-gray'));
        await expect(getComputedStyle(gray)[bg]).toBe(t('--ds-background-accent-gray-subtler'));

        // A plain link: the tag is the link.
        const link = canvas.getByRole('link', { name: 'Link' });
        const linkText = within(link).getByText('Link');
        await expect(whileForced(link, ':hover', bg)).toBe(t('--ds-background-accent-green-subtlest'));
        await expect(whileForced(link, ':active', bg)).toBe(t('--ds-background-accent-green-subtlest-pressed'));
        await expect(getComputedStyle(linkText).textDecorationLine, 'no underline at rest').toBe('none');
        await expect(whileForced(link, ':hover', 'textDecorationLine', linkText)).toBe('underline');
        await expect(whileForced(link, ':active', 'textDecorationLine', linkText)).toBe('underline');

        // A split link: the tag lights up for its link half, and the text underlines.
        const split = canvas.getByTestId('split');
        const splitLink = canvas.getByRole('link', { name: 'Split link' });
        const splitText = within(splitLink).getByText('Split link');
        await expect(whileForced(splitLink, ':hover', bg, split)).toBe(t('--ds-background-accent-green-subtlest'));
        await expect(whileForced(splitLink, ':active', bg, split)).toBe(t('--ds-background-accent-green-subtlest-pressed'));
        await expect(getComputedStyle(splitText).textDecorationLine).toBe('none');
        await expect(whileForced(splitLink, ':hover', 'textDecorationLine', splitText)).toBe('underline');
        await expect(whileForced(splitLink, ':active', 'textDecorationLine', splitText)).toBe('underline');
        const splitX = canvas.getByRole('button', { name: 'Remove Split link' });
        await expect(whileForced(splitX, ':hover', bg, split), 'hovering the × does not light the link')
            .toBe(CLEAR);

        const removable = canvas.getByTestId('removable');
        await expect(whileForced(removable, ':hover', bg), 'a removable tag itself never reacts').toBe(CLEAR);
        const x = canvas.getByRole('button', { name: 'Remove Removable' });
        await expect(whileForced(x, ':hover', bg)).toBe(t('--ds-background-neutral-subtle-hovered'));
        await expect(whileForced(x, ':active', bg)).toBe(t('--ds-background-neutral-subtle-pressed'));
    });
};

/* ---------------------------------------------------------------- removing */

/**
 * The × removes the value, and says which value. A row of tags whose × are all
 * called "Remove" gives a screen-reader user identical controls and no way to
 * tell which one drops Science.
 */
export const Removing = {
    args: { onRemoveSpy: fn() },
    render: ({ onRemoveSpy }) => {
        const Row = () => {
            const [subjects, setSubjects] = useState(['Science', 'Mathematics', 'History']);
            return (
                <div style={row}>
                    {subjects.map((s) => (
                        <Tag
                            key={s}
                            isRemovable
                            color="blue"
                            onAfterRemoveAction={() => {
                                onRemoveSpy(s);
                                setSubjects((prev) => prev.filter((x) => x !== s));
                            }}
                        >
                            {s}
                        </Tag>
                    ))}
                    <Tag isRemovable color="blue" onAfterRemoveAction={() => {}} removeButtonLabel="Drop the maths filter">Maths</Tag>
                </div>
            );
        };
        return <Row />;
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const remove = canvas.getByRole('button', { name: 'Remove Science' });
        await expect(px(getComputedStyle(remove).width), 'the × is the small Remove button').toBe(16);
        await expect(px(getComputedStyle(remove).height)).toBe(16);

        await userEvent.click(remove);
        await expect(args.onRemoveSpy).toHaveBeenCalledWith('Science');
        await expect(canvas.queryByText('Science')).toBeNull();
        await expect(canvas.getByText('Mathematics')).toBeInTheDocument();

        // `removeButtonLabel` replaces the generated name.
        await expect(canvas.getByRole('button', { name: 'Drop the maths filter' })).toBeInTheDocument();

        // A removable tag is not itself a control: exactly one button per tag.
        await expect(canvas.getAllByRole('button')).toHaveLength(3);
    },
};

/**
 * A label that is not text gives the × nothing to be named after, so a row of
 * them would all be "Remove". Development says so unless `removeButtonLabel` is set.
 */
export const RemoveNeedsANameForNodeLabels = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <Button onClick={() => setMounted(true)}>Mount</Button>
                {mounted && (
                    <>
                        <Tag isRemovable onAfterRemoveAction={() => {}}><em>Unnamed</em></Tag>
                        <Tag isRemovable onAfterRemoveAction={() => {}} removeButtonLabel="Remove Named"><em>Named</em></Tag>
                    </>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount' }));
            await expect(canvas.getByRole('button', { name: 'Remove Named' })).toBeInTheDocument();
            const calls = warn.mock.calls.filter(([m]) => String(m).includes('Pass `removeButtonLabel`'));
            await expect(calls.length, 'only the unnamed one warns').toBeGreaterThan(0);
            await expect(calls.every(([m]) => !String(m).includes('Named'))).toBe(true);
        } finally {
            warn.mockRestore();
        }
    },
};

/** Keyboard focus: a 2px Focus Ring 2px outside the tag, the link, or the ×. */
export const FocusRing = () => (
    <div style={row}>
        <Tag isSelected={false} color="teal">Filter</Tag>
        <Tag isRemovable color="teal" onAfterRemoveAction={() => {}}>Chosen</Tag>
        <Tag color="teal" href="#tag">Go</Tag>
        <Tag color="teal" href="#tag" isRemovable onAfterRemoveAction={() => {}} data-testid="split">Split</Tag>
    </div>
);

FocusRing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--ds-border-focused');
    const expectRing = async (el, what) => {
        const s = getComputedStyle(el);
        await expect(s.outlineStyle, what).toBe('solid');
        await expect(px(s.outlineWidth), what).toBe(2);
        await expect(px(s.outlineOffset), `${what} sits 2px outside`).toBe(2);
        await expect(s.outlineColor, what).toBe(ring);
    };

    await userEvent.tab();
    const tag = canvas.getByRole('button', { name: 'Filter' });
    await expect(tag).toHaveFocus();
    await expectRing(tag, 'selectable');

    await userEvent.tab();
    const x = canvas.getByRole('button', { name: 'Remove Chosen' });
    await expect(x).toHaveFocus();
    await expectRing(x, 'the ×');
    await expect(getComputedStyle(x).backgroundColor, 'with no fill under it').toBe(CLEAR);

    await userEvent.tab();
    const go = canvas.getByRole('link', { name: 'Go' });
    await expect(go).toHaveFocus();
    await expectRing(go, 'a link');

    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Split' })).toHaveFocus();
    await expectRing(canvas.getByTestId('split'), 'a split link rings the whole tag');
};

/* -------------------------------------------------------------------- link */

/**
 * A link that can also be removed is two targets, never one inside the other:
 * the text is the link and the × is its sibling, in that tab order, so
 * removing it can never follow it.
 */
export const LinkWithRemove = {
    args: { onRemoveSpy: fn(), onFollowSpy: fn() },
    render: ({ onRemoveSpy, onFollowSpy }) => (
        <div style={row}>
            <Button>Before</Button>
            <Tag
                color="purple"
                href="#algebra"
                onClick={(e) => {
                    e.preventDefault();
                    onFollowSpy();
                }}
                isRemovable onAfterRemoveAction={onRemoveSpy}
            >
                Lincoln Middle
            </Tag>
        </div>
    ),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link', { name: 'Lincoln Middle' });
        const x = canvas.getByRole('button', { name: 'Remove Lincoln Middle' });

        await expect(link.contains(x), 'the × is not nested in the link').toBe(false);
        await expect(x.closest('a'), 'nor inside any link').toBeNull();

        canvas.getByRole('button', { name: 'Before' }).focus();
        await userEvent.tab();
        await expect(link).toHaveFocus();
        await userEvent.tab();
        await expect(x).toHaveFocus();

        await userEvent.click(x);
        await expect(args.onRemoveSpy).toHaveBeenCalledTimes(1);
        await expect(args.onFollowSpy, 'removing never follows the link').not.toHaveBeenCalled();
    },
};

/* ---------------------------------------------------------------- disabled */

/**
 * Disabled comes from the field, through `TagContext`: background.disabled
 * with text.disabled words, no ×, nothing to focus, and no hover. A tag that
 * is a span carries `aria-disabled`, so it reads as an inactive component; a
 * selectable one is a disabled button.
 */
export const DisabledInField = () => (
    <div style={row}>
        <Button>Before</Button>
        <TagContext.Provider value={{ isDisabled: true }}>
            <Tag color="blue" data-testid="read-only">Read only</Tag>
            <Tag isRemovable color="blue" onAfterRemoveAction={() => {}} data-testid="removable">Removable</Tag>
            <Tag isSelected={false} color="blue" data-testid="selectable">Selectable</Tag>
            <Tag color="blue" isSelected data-testid="selected">Selected</Tag>
            <Tag color="blue" href="#tag" data-testid="link">Link</Tag>
        </TagContext.Provider>
        <Button>After</Button>
    </div>
);

DisabledInField.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('button', { name: /^Remove/ }), 'no ×').toBeNull();
    await expect(canvas.queryByRole('link'), 'a disabled link is not a link').toBeNull();

    canvas.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After' }), 'no tag takes focus').toHaveFocus();

    const fill = tokenColor(canvasElement, '--ds-background-disabled');
    const text = tokenColor(canvasElement, '--ds-text-disabled');
    for (const id of ['read-only', 'removable', 'selectable', 'selected', 'link']) {
        const tag = canvas.getByTestId(id);
        await expect(getComputedStyle(tag).backgroundColor, `${id} fill`).toBe(fill);
        await expect(getComputedStyle(tag).color, `${id} text`).toBe(text);
        await expect(px(getComputedStyle(tag).height)).toBe(22);
    }

    // A span tag says it is inactive; a selectable one is a disabled button.
    for (const id of ['read-only', 'removable', 'link']) {
        await expect(canvas.getByTestId(id), `${id} is aria-disabled`).toHaveAttribute('aria-disabled', 'true');
    }
    await expect(canvas.getByTestId('selectable')).toBeDisabled();

    // Selected stays visible when disabled, as a border.bold edge.
    await expect(getComputedStyle(canvas.getByTestId('selected')).borderTopColor)
        .toBe(tokenColor(canvasElement, '--ds-border-bold'));
    await expect(getComputedStyle(canvas.getByTestId('read-only')).borderTopColor).toBe(CLEAR);

    // A disabled link does not answer a pointer: no state layer, no underline.
    const link = canvas.getByTestId('link');
    const linkText = within(link).getByText('Link');
    await expect(whileForced(link, ':hover', 'backgroundColor')).toBe(fill);
    await expect(whileForced(link, ':active', 'backgroundColor')).toBe(fill);
    await expect(whileForced(link, ':hover', 'textDecorationLine', linkText)).toBe('none');
    await expect(whileForced(link, ':active', 'textDecorationLine', linkText)).toBe('none');
};

/* ------------------------------------------------------------------- count */

/**
 * A trailing metric belongs to a selectable tag, such as a filter's result count. On any
 * other behavior it is ignored, and development says so.
 */
export const CountOnSelectable = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <Tag isSelected={false} color="green" trailingMetric={12}>Science</Tag>
                <Button onClick={() => setMounted(true)}>Mount a removable with a count</Button>
                {mounted && (
                    <Tag isRemovable color="green" trailingMetric={34} onAfterRemoveAction={() => {}}>History</Tag>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const count = canvas.getByText('12');
        await expect(px(getComputedStyle(count.parentElement).height), 'a small Count, 16').toBe(16);
        await expect(canvas.getByRole('button', { name: 'Science 12' })).toBeInTheDocument();

        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount a removable with a count' }));
            await expect(canvas.getByText('History')).toBeInTheDocument();
            await expect(canvas.queryByText('34'), 'ignored off selectable').toBeNull();
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('`trailingMetric` is only shown on a selectable tag'));
        } finally {
            warn.mockRestore();
        }
    },
};

/* ------------------------------------------------------------------ saving */

/**
 * Saving swaps a leading swatch for a spinner of the same size, so the tag does
 * not move (a tag with no lead gains the spinner's own box), and says so once,
 * through a status beside the tag rather than inside its name. The × and a link
 * stay in place but do nothing until the save lands.
 */
export const Saving = {
    args: { onRemoveSpy: fn(), onFollowSpy: fn(), onToggleSpy: fn() },
    render: ({ onRemoveSpy, onFollowSpy, onToggleSpy }) => {
        const Row = () => {
            const [saving, setSaving] = useState(false);
            return (
                <div style={row}>
                    <span data-testid="removable-wrap">
                        <Tag isRemovable color="yellow" swatchBefore isLoading={saving} onAfterRemoveAction={onRemoveSpy} data-testid="removable">Roosevelt K-8</Tag>
                    </span>
                    <Tag isSelected={false} color="yellow" isLoading={saving} onClick={onToggleSpy}>Statistics</Tag>
                    <Tag
                        color="yellow"
                        href="#calculus"
                        isLoading={saving}
                        onClick={(e) => {
                            e.preventDefault();
                            onFollowSpy();
                        }}
                    >
                        Riverside Academy
                    </Tag>
                    <Button onClick={() => setSaving((v) => !v)}>
                        {saving ? 'Done' : 'Save'}
                    </Button>
                </div>
            );
        };
        return <Row />;
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const tag = canvas.getByTestId('removable');
        const status = within(canvas.getByTestId('removable-wrap')).getByRole('status');
        const before = tag.getBoundingClientRect().width;

        await expect(status, 'the live region is there before anything is said').toHaveTextContent('');
        await expect(tag.contains(status), 'and sits outside the tag').toBe(false);

        await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
        await expect(tag.getBoundingClientRect().width, 'saving keeps the width').toBe(before);
        await expect(status).toHaveTextContent('Saving');
        await expect(within(canvas.getByTestId('removable-wrap')).getAllByRole('status'), 'announced once')
            .toHaveLength(1);

        // The control's name is its label, not "Saving".
        const toggle = canvas.getByRole('button', { name: 'Statistics' });
        await expect(toggle).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(toggle);
        await expect(args.onToggleSpy).not.toHaveBeenCalled();

        const link = canvas.getByRole('link', { name: 'Riverside Academy' });
        await expect(link).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(link);
        await expect(args.onFollowSpy, 'a saving link does not follow').not.toHaveBeenCalled();

        await userEvent.click(canvas.getByRole('button', { name: 'Remove Roosevelt K-8' }));
        await expect(args.onRemoveSpy, 'the × waits for the save').not.toHaveBeenCalled();

        const spinner = tag.querySelector('[aria-hidden="true"]');
        const hue = tokenColor(canvasElement, '--ds-icon-accent-yellow');
        await expect(getComputedStyle(spinner).borderTopColor, 'the spinner is in the tag hue').toBe(hue);
        await expect(getComputedStyle(spinner).borderBottomColor, 'a 270° arc').toBe(hue);
        await expect(getComputedStyle(spinner).borderLeftColor).toBe(CLEAR);

        await userEvent.click(canvas.getByRole('button', { name: 'Done' }));
        await expect(status, 'and it goes quiet when the save lands').toHaveTextContent('');
        await userEvent.click(canvas.getByRole('button', { name: 'Remove Roosevelt K-8' }));
        await expect(args.onRemoveSpy).toHaveBeenCalledTimes(1);
    },
};

/* -------------------------------------------------------------- truncation */

/**
 * Every tag caps at 180 wide. A clipped label ellipsizes and its full text is a
 * tooltip a keyboard can reach: on a span tag the label takes focus while it is
 * clipped; on a control, the control carries the tooltip. A label that fits
 * gets no tooltip and no extra tab stop.
 */
export const Truncation = () => (
    <div style={row}>
        <Tag color="blue">Social-Emotional Learning and Advocacy for Every Student</Tag>
        <Tag isSelected={false} color="blue">Mastering Content Across Every Grade Band</Tag>
        <Tag color="blue">Short</Tag>
    </div>
);

Truncation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const long = canvas.getByText('Social-Emotional Learning and Advocacy for Every Student');

    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
    await expect(getComputedStyle(long).textOverflow).toBe('ellipsis');
    await expect(long.parentElement.getBoundingClientRect().width).toBeLessThanOrEqual(180);

    await userEvent.tab();
    await expect(long, 'a clipped label is reachable by keyboard').toHaveFocus();
    const tip = await page.findByRole('tooltip', {}, { timeout: 2000 });
    await expect(tip).toHaveTextContent('Social-Emotional Learning and Advocacy for Every Student');

    await userEvent.tab();
    const control = canvas.getByRole('button', { name: 'Mastering Content Across Every Grade Band' });
    await expect(control, 'a control carries its own tooltip, with no second stop').toHaveFocus();
    await waitFor(() => expect(page.getByRole('tooltip')).toHaveTextContent('Mastering Content Across Every Grade Band'));

    await userEvent.tab();
    await expect(canvas.getByText('Short'), 'a label that fits takes no focus').not.toHaveFocus();
    await expect(canvas.getByText('Short')).not.toHaveAttribute('tabindex');
};

/* --------------------------------------------------------------- on images */

/*
 * A stand-in for a lesson thumbnail: a gradient from a warm hue to the dark
 * inverse surface, drawn from tokens so no story depends on a network image,
 * and dark enough at one end that an outlined tag would sink into it.
 */
const thumbnail = {
    position: 'relative',
    width: '480px',
    maxWidth: '100%',
    height: '160px',
    borderRadius: 'var(--radius-lg, 8px)',
    overflow: 'hidden',
};
const picture = {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(135deg, var(--ds-background-accent-orange-subtler), '
        + 'var(--ds-background-accent-teal-bolder) 45%, var(--ds-background-neutral-bold))',
};
/* Placed 8 from the corner, as the Figma docs place it. */
const onPicture = {
    ...row,
    position: 'absolute',
    top: 'var(--space-050)',
    left: 'var(--space-050)',
    right: 'var(--space-050)',
};

/** A state layer over the elevated fill, as it computes: a one-color gradient. */
const stateLayer = (host, token) => {
    const color = tokenColor(host, token);
    return `linear-gradient(${color}, ${color})`;
};

/** The 2px surface gap as a computed shadow: under a ×, or stacked on the overlay shadow under a tag. */
const surfaceGap = (host, { onElevation = true } = {}) => computedShadow(
    host,
    `0 0 0 var(--stroke-2) var(--ds-surface-overlay)${onElevation ? ', var(--ds-shadow-overlay)' : ''}`,
);

/**
 * The focus ring on `measured`: 2px solid Focus Ring, 2px outside, and the
 * computed `box-shadow` under it, which is the surface gap on an elevated tag
 * (the default) and `none` on a × off the image.
 */
const expectFocusRing = async (host, measured, what, shadow = surfaceGap(host)) => {
    const s = getComputedStyle(measured);
    await expect(s.outlineStyle, what).toBe('solid');
    await expect(px(s.outlineWidth), what).toBe(2);
    await expect(px(s.outlineOffset), `${what} sits 2px outside`).toBe(2);
    await expect(s.outlineColor, what).toBe(tokenColor(host, '--ds-border-focused'));
    await expect(s.boxShadow, `${what}: the shadow under the ring`).toBe(shadow);
};

/**
 * Tags on a thumbnail: `isElevated` lifts a read-only or link tag onto the
 * picture. A person, agent or team tag takes the same ground.
 */
export const OnImages = () => (
    <div style={thumbnail}>
        <div style={picture} aria-hidden="true" />
        <div style={onPicture}>
            <Tag color="blue" swatchBefore isElevated data-testid="read-only">Lincoln Middle</Tag>
            <Tag color="green" isElevated>Advocacy</Tag>
            <Tag color="gray" href="#video" isElevated>Video</Tag>
            <Tag type="person" color="blue" isElevated data-testid="person">Rosa Chen</Tag>
            <Tag color="magenta" href="#lesson" isElevated>Open lesson</Tag>
            <Tag color="teal" href="#unit" isElevated isRemovable onAfterRemoveAction={() => {}} data-testid="split">
                Unit 3
            </Tag>
            <TagContext.Provider value={{ isDisabled: true }}>
                <Tag color="yellow" isElevated data-testid="disabled">Archived</Tag>
            </TagContext.Provider>
        </div>
    </div>
);

/**
 * Elevated: the overlay pair (a solid overlay surface and the overlay shadow),
 * no border and neutral text, with the hue kept on the swatch, still 22 tall.
 * A link's hover and press lay the neutral subtle hovered and pressed steps
 * over the solid fill rather than replacing it, and its focus ring has a 2px
 * surface gap inside it, so the ring reads on a dark picture.
 */
OnImages.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const ground = t('--ds-surface-overlay');
    const shadow = computedShadow(canvasElement, 'var(--ds-shadow-overlay)');

    const tags = [
        canvas.getByTestId('read-only'),
        canvas.getByText('Advocacy').parentElement,
        canvas.getByRole('link', { name: 'Video' }),
        canvas.getByTestId('person'),
        canvas.getByRole('link', { name: 'Open lesson' }),
        canvas.getByTestId('split'),
    ];
    for (const tag of tags) {
        const s = getComputedStyle(tag);
        const name = tag.textContent;
        await expect(px(s.height), `${name} is 22 tall`).toBe(22);
        await expect(s.backgroundColor, `${name} has a solid fill`).toBe(ground);
        await expect(s.borderTopColor, `${name} has no border`).toBe(CLEAR);
        await expect(s.boxShadow, `${name} has the overlay shadow`).toBe(shadow);
        await expect(s.color, `${name} text is neutral`).toBe(t('--ds-text'));
    }
    const swatch = canvas.getByTestId('read-only').querySelector('[aria-hidden="true"]');
    await expect(getComputedStyle(swatch).backgroundColor, 'the hue stays on the swatch')
        .toBe(t('--ds-icon-accent-blue'));
    const avatar = canvas.getByTestId('person').querySelector('[aria-hidden="true"]');
    await expect(getComputedStyle(avatar).backgroundColor, 'the color stays on the avatar')
        .toBe(t('--ds-background-accent-blue-subtler'));

    // Disabled from the field: the solid ground and shadow stay, since the
    // translucent disabled fill would sink into the picture; the words go
    // to the disabled color, and hovering changes nothing.
    const disabled = canvas.getByTestId('disabled');
    await expect(getComputedStyle(disabled).backgroundColor).toBe(ground);
    await expect(getComputedStyle(disabled).boxShadow).toBe(shadow);
    await expect(getComputedStyle(disabled).color).toBe(t('--ds-text-disabled'));
    await expect(whileForced(disabled, ':hover', 'backgroundColor')).toBe(ground);

    // Hover and press: the state layer sits over the solid fill, which stays.
    const layer = (token) => stateLayer(canvasElement, token);
    const link = canvas.getByRole('link', { name: 'Open lesson' });
    for (const [pseudo, token] of [[':hover', '--ds-background-neutral-subtle-hovered'], [':active', '--ds-background-neutral-subtle-pressed']]) {
        await expect(whileForced(link, pseudo, 'backgroundColor'), `${pseudo} keeps the fill`).toBe(ground);
        await expect(whileForced(link, pseudo, 'backgroundImage'), `${pseudo} layer`).toBe(layer(token));
        await expect(whileForced(link, pseudo, 'boxShadow'), `${pseudo} keeps the shadow`).toBe(shadow);
    }
    const split = canvas.getByTestId('split');
    const splitLink = canvas.getByRole('link', { name: 'Unit 3' });
    await expect(whileForced(splitLink, ':hover', 'backgroundColor', split)).toBe(ground);
    await expect(whileForced(splitLink, ':hover', 'backgroundImage', split)).toBe(layer('--ds-background-neutral-subtle-hovered'));
    await expect(whileForced(splitLink, ':active', 'backgroundImage', split)).toBe(layer('--ds-background-neutral-subtle-pressed'));

    // Focus: the standard ring, 2px outside, with the 2px between it and the
    // tag filled in the surface color.
    const video = canvas.getByRole('link', { name: 'Video' });
    await userEvent.tab();
    await expect(video).toHaveFocus();
    await expectFocusRing(canvasElement, video, 'an elevated gray link');

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expectFocusRing(canvasElement, link, 'an elevated link');
    await userEvent.tab();
    await expect(splitLink).toHaveFocus();
    await expectFocusRing(canvasElement, split, 'an elevated split link');
};

/**
 * A person, an agent or a team on a picture: the same elevated ground as a
 * plain tag, and the avatar keeps its own fill on it (a person the gray
 * subtler step, an agent discovery's AI purple, a team the lightest blue). A
 * link's hover, press and focus are a plain elevated link's.
 */
export const ElevatedAvatarTypes = () => (
    <div style={thumbnail}>
        <div style={picture} aria-hidden="true" />
        <div style={onPicture}>
            {AVATAR_TAG_TYPES.map((type) => (
                <Tag key={type} type={type} isElevated data-testid={`${type}-read-only`}>
                    {`${type} read`}
                </Tag>
            ))}
            {AVATAR_TAG_TYPES.map((type) => (
                <Tag key={type} type={type} href={`#${type}`} isElevated>
                    {`${type} link`}
                </Tag>
            ))}
        </div>
    </div>
);

ElevatedAvatarTypes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const ground = t('--ds-surface-overlay');
    const shadow = computedShadow(canvasElement, 'var(--ds-shadow-overlay)');
    const avatarFill = {
        person: t('--ds-background-accent-gray-subtler'),
        agent: t('--ds-background-discovery-subtler'),
        team: t('--ds-background-accent-blue-subtlest'),
    };

    for (const type of AVATAR_TAG_TYPES) {
        for (const tag of [
            canvas.getByTestId(`${type}-read-only`),
            canvas.getByRole('link', { name: `${type} link` }),
        ]) {
            const s = getComputedStyle(tag);
            const name = tag.textContent;
            await expect(px(s.height), `${name} is 22 tall`).toBe(22);
            await expect(s.backgroundColor, `${name} has the solid fill`).toBe(ground);
            await expect(s.borderTopColor, `${name} has no border`).toBe(CLEAR);
            await expect(s.boxShadow, `${name} has the overlay shadow`).toBe(shadow);
            await expect(getComputedStyle(avatarOf(tag)).backgroundColor, `${name} keeps its avatar fill`)
                .toBe(avatarFill[type]);
        }
    }

    const layer = (token) => stateLayer(canvasElement, token);
    for (const type of AVATAR_TAG_TYPES) {
        const link = canvas.getByRole('link', { name: `${type} link` });
        await expect(whileForced(link, ':hover', 'backgroundColor'), `${type} hover keeps the fill`).toBe(ground);
        await expect(whileForced(link, ':hover', 'backgroundImage'), `${type} hover layer`)
            .toBe(layer('--ds-background-neutral-subtle-hovered'));
        await expect(whileForced(link, ':active', 'backgroundImage'), `${type} press layer`)
            .toBe(layer('--ds-background-neutral-subtle-pressed'));

        await userEvent.tab();
        await expect(link).toHaveFocus();
        await expectFocusRing(canvasElement, link, `${type} focus`);
    }
};

/**
 * An elevated tag in a disabled field keeps its solid ground and the overlay
 * shadow, since the translucent disabled fill would sink into the picture.
 * Only its content turns disabled: text.disabled for the label, icon.disabled for
 * the swatch, and an avatar drawn as any disabled avatar (background.disabled,
 * text.disabled initials). No
 * hover, no press, nothing to focus. Plain read-only and link on every color,
 * and the three avatar types.
 */
export const ElevatedDisabled = () => (
    <div style={{ ...thumbnail, height: '200px' }}>
        <div style={picture} aria-hidden="true" />
        <div style={onPicture}>
            <TagContext.Provider value={{ isDisabled: true }}>
                {TAG_COLORS.map((color) => (
                    <Tag key={color} color={color} swatchBefore isElevated data-testid={`read-only-${color}`}>
                        {color}
                    </Tag>
                ))}
                {TAG_COLORS.map((color) => (
                    <Tag key={color} color={color} href="#tag" swatchBefore isElevated data-testid={`link-${color}`}>
                        {`${color} link`}
                    </Tag>
                ))}
                {AVATAR_TAG_TYPES.map((type) => (
                    <Tag key={type} type={type} isElevated data-testid={`avatar-${type}`}>
                        {`${type} tag`}
                    </Tag>
                ))}
            </TagContext.Provider>
        </div>
    </div>
);

ElevatedDisabled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const ground = t('--ds-surface-overlay');
    const shadow = computedShadow(canvasElement, 'var(--ds-shadow-overlay)');
    const secondary = t('--ds-text-disabled');
    const disabledMark = t('--ds-icon-disabled');

    await expect(canvas.queryByRole('link'), 'a disabled link is not a link').toBeNull();

    const expectGround = async (tag, what) => {
        const s = getComputedStyle(tag);
        await expect(px(s.height), `${what} is 22 tall`).toBe(22);
        await expect(s.backgroundColor, `${what} keeps the solid fill`).toBe(ground);
        await expect(s.borderTopColor, `${what} has no border`).toBe(CLEAR);
        await expect(s.boxShadow, `${what} keeps the overlay shadow`).toBe(shadow);
        await expect(s.color, `${what} text is disabled`).toBe(secondary);
        for (const pseudo of [':hover', ':active']) {
            await expect(whileForced(tag, pseudo, 'backgroundColor'), `${what} ${pseudo} fill`).toBe(ground);
            await expect(whileForced(tag, pseudo, 'backgroundImage'), `${what} ${pseudo} has no layer`).toBe('none');
            await expect(whileForced(tag, pseudo, 'boxShadow'), `${what} ${pseudo} shadow`).toBe(shadow);
        }
    };

    for (const color of TAG_COLORS) {
        for (const id of [`read-only-${color}`, `link-${color}`]) {
            const tag = canvas.getByTestId(id);
            await expectGround(tag, id);
            await expect(getComputedStyle(avatarOf(tag)).backgroundColor, `${id} swatch is disabled`)
                .toBe(disabledMark);
        }
        const label = within(canvas.getByTestId(`link-${color}`)).getByText(`${color} link`);
        await expect(
            whileForced(canvas.getByTestId(`link-${color}`), ':hover', 'textDecorationLine', label),
            `${color} link has no underline`,
        ).toBe('none');
    }

    for (const type of AVATAR_TAG_TYPES) {
        const tag = canvas.getByTestId(`avatar-${type}`);
        await expectGround(tag, type);
        const avatar = avatarOf(tag);
        await expect(getComputedStyle(avatar).backgroundColor, `${type} avatar takes the disabled fill`)
            .toBe(t('--ds-background-disabled'));
        await expect(getComputedStyle(avatar.firstElementChild).color, `${type} initials are disabled`)
            .toBe(secondary);
    }
};

/**
 * The × of an elevated link has a surface gap inside its focus ring, as the
 * tag's own focus does: a 2px gap in the overlay surface, then the 2px ring.
 * On a plain, agent or team tag the × is radius 2, so the gap's corner is 4
 * and the ring's 6; on a person tag the ×, its gap and its ring are round. A ×
 * off the image keeps the plain ring.
 */
export const ElevatedRemoveFocus = () => (
    <div style={{ ...thumbnail, height: '200px' }}>
        <div style={picture} aria-hidden="true" />
        <div style={onPicture}>
            <Tag color="teal" href="#unit" isElevated isRemovable onAfterRemoveAction={() => {}}>Unit 3</Tag>
            {AVATAR_TAG_TYPES.map((type) => (
                <Tag key={type} type={type} href={`#${type}`} isElevated isRemovable onAfterRemoveAction={() => {}}>
                    {`${type} link`}
                </Tag>
            ))}
            <Tag color="teal" href="#unit" isRemovable onAfterRemoveAction={() => {}}>Unit 4</Tag>
        </div>
    </div>
);

ElevatedRemoveFocus.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gap = surfaceGap(canvasElement, { onElevation: false });
    const spread = px(probe(canvasElement, 'width', 'var(--stroke-2)'));

    // Tab past the link to its ×, and check the ring and what sits under it.
    const focusRemove = async (name, what, shadow) => {
        await userEvent.tab();
        await userEvent.tab();
        const x = canvas.getByRole('button', { name });
        await expect(x).toHaveFocus();
        await expectFocusRing(canvasElement, x, what, shadow);
        return x;
    };
    // The gap is a spread shadow, so its corner is the ×'s radius plus the
    // spread; the ring's is the ×'s radius plus its offset and width.
    const expectSquareCorners = async (x, what) => {
        const s = getComputedStyle(x);
        const radius = px(s.borderTopLeftRadius);
        await expect(radius + spread, `${what}: the gap's corner is 4`).toBe(4);
        await expect(radius + px(s.outlineOffset) + px(s.outlineWidth), `${what}: the ring's corner is 6`).toBe(6);
    };

    await expectSquareCorners(await focusRemove('Remove Unit 3', 'the elevated ×', gap), 'the elevated ×');

    for (const type of AVATAR_TAG_TYPES) {
        const x = await focusRemove(`Remove ${type} link`, `the elevated ${type} ×`, gap);
        if (type === 'person') {
            // A radius of at least half the side is a circle, and the gap and
            // the ring follow the ×'s corner outward, so all three are round.
            const s = getComputedStyle(x);
            await expect(px(s.borderTopLeftRadius), 'the person × is round, so its gap and ring are')
                .toBeGreaterThanOrEqual(px(s.height) / 2);
        } else {
            await expectSquareCorners(x, `the elevated ${type} ×`);
        }
    }

    const plain = await focusRemove('Remove Unit 4', 'the plain ×', 'none');
    await expectSquareCorners(plain, 'the plain ×');
    await expect(getComputedStyle(plain).backgroundColor, 'with no fill under it').toBe(CLEAR);
};

/**
 * Editing happens off the image, so `isElevated` is for read-only and link
 * tags only. On a removable or selectable tag it is ignored, and development
 * says so: the tag keeps its outline and gains no shadow.
 */
export const ElevatedOnlyReadOnlyAndLink = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <Button onClick={() => setMounted(true)}>Mount elevated editable tags</Button>
                {mounted && (
                    <>
                        <Tag isRemovable color="purple" isElevated onAfterRemoveAction={() => {}} data-testid="removable">
                            Roosevelt K-8
                        </Tag>
                        <Tag isSelected={false} color="purple" isElevated>Fractions</Tag>
                    </>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount elevated editable tags' }));
            const border = tokenColor(canvasElement, '--ds-border-accent-purple-subtle');
            const removable = canvas.getByTestId('removable');
            const selectable = canvas.getByRole('button', { name: 'Fractions' });
            for (const [tag, name] of [[removable, 'removable'], [selectable, 'selectable']]) {
                const s = getComputedStyle(tag);
                await expect(s.boxShadow, `${name} gains no shadow`).toBe('none');
                await expect(s.borderTopColor, `${name} keeps its outline`).toBe(border);
                await expect(s.backgroundColor, `${name} keeps its clear ground`).toBe(CLEAR);
            }
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('`isElevated` is only for a read-only tag or a link; it is ignored on "removable"'));
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('`isElevated` is only for a read-only tag or a link; it is ignored on "selectable"'));
        } finally {
            warn.mockRestore();
        }
    },
};

/* ------------------------------------------------------------- answer chips */

/**
 * A row of answer chips: each is a selectable tag, so it toggles with Space or
 * Enter, publishes `aria-pressed`, and shows the selected step. The caller owns
 * which are on. This is the shape a form uses where a person picks from a short
 * list of options.
 */
export const AnswerChips = () => {
    const options = ['Fractions', 'Ratios', 'Roosevelt K-8', 'Statistics'];
    const [chosen, setChosen] = useState(['Ratios']);
    const toggle = (name) => setChosen((now) => (now.includes(name) ? now.filter((n) => n !== name) : [...now, name]));
    return (
        <div style={row} role="group" aria-label="Topics covered">
            {options.map((name) => (
                <Tag key={name} color="blue" isSelected={chosen.includes(name)} onClick={() => toggle(name)}>{name}</Tag>
            ))}
        </div>
    );
};

AnswerChips.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ratios = canvas.getByRole('button', { name: 'Ratios' });
    const fractions = canvas.getByRole('button', { name: 'Fractions' });
    await expect(ratios).toHaveAttribute('aria-pressed', 'true');
    await expect(fractions).toHaveAttribute('aria-pressed', 'false');

    fractions.focus();
    await userEvent.keyboard(' ');
    await expect(fractions, 'Space toggles').toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(fractions, 'Enter toggles back').toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(ratios);
    await expect(ratios, 'a click toggles').toHaveAttribute('aria-pressed', 'false');
};

/* ------------------------------------------------------------- isDisabled */

/** `isDisabled` disables one tag without a field around it. */
export const IsDisabled = () => (
    <div style={row}>
        <Tag isDisabled color="blue" data-testid="plain">Read only</Tag>
        <Tag isDisabled isSelected={false} color="blue" data-testid="toggle">Selectable</Tag>
        <Tag isDisabled isRemovable color="blue" onAfterRemoveAction={() => {}} data-testid="removable">Removable</Tag>
        <Tag color="blue" data-testid="enabled">Enabled</Tag>
    </div>
);

IsDisabled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fill = tokenColor(canvasElement, '--ds-background-disabled');
    for (const id of ['plain', 'toggle', 'removable']) {
        await expect(getComputedStyle(canvas.getByTestId(id)).backgroundColor, `${id} fill`).toBe(fill);
    }
    await expect(canvas.getByTestId('toggle')).toBeDisabled();
    await expect(canvas.queryByRole('button', { name: /^Remove/ }), 'no ×').toBeNull();
    await expect(getComputedStyle(canvas.getByTestId('enabled')).backgroundColor).not.toBe(fill);
};

/* -------------------------------------------------------------- playground */

/**
 * Interactive playground. `onAfterRemoveAction` is supplied here rather than exposed as a
 * control: a docs control cannot author a function, and a removable tag with
 * no handler renders no ×.
 */
export const Interactive = (args) => (
    <Tag {...args} onClick={(e) => e.preventDefault()} onAfterRemoveAction={() => {}} />
);
Interactive.args = {
    text: 'Mathematics',
    color: 'blue',
    type: 'plain',
    isRemovable: false,
    isDisabled: false,
    isLoading: false,
};

/* ------------------------------------------------------------------- states */

/** Rest: a selectable tag is outlined only, its hue on the border. */
export const Rest = {
    render: () => <Tag isSelected={false} color="blue">Science</Tag>,
    play: async ({ canvasElement }) => {
        const tag = within(canvasElement).getByRole('button', { name: 'Science', pressed: false });
        await expect(getComputedStyle(tag).backgroundColor, 'outlined only').toBe(CLEAR);
        await expect(getComputedStyle(tag).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-accent-blue-subtle'));
        await expect(px(getComputedStyle(tag).height)).toBe(22);
    },
};

/** Hovered: the accent's subtlest step. A selected tag holds its ground. */
export const Hovered = {
    render: () => (
        <div style={row}>
            <Tag isSelected={false} color="blue">Science</Tag>
            <Tag isSelected color="blue">Selected</Tag>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectGroundUnder(canvasElement, canvas.getByRole('button', { name: 'Science' }), ':hover', '--ds-background-accent-blue-subtlest', 'selectable');
        await expectGroundUnder(canvasElement, canvas.getByRole('button', { name: 'Selected' }), ':hover', '--ds-background-accent-blue-subtler', 'selected');
    },
};

/** Pressed: the accent's subtlest pressed step. */
export const Pressed = {
    render: () => <Tag isSelected={false} color="blue">Science</Tag>,
    play: async ({ canvasElement }) => {
        const tag = within(canvasElement).getByRole('button', { name: 'Science' });
        await expectGroundUnder(canvasElement, tag, ':active', '--ds-background-accent-blue-subtlest-pressed', 'selectable');
    },
};

/** Focused: the 2px ring 2px off the edge, on the tag and on its ×. */
export const Focused = {
    render: () => (
        <div style={row}>
            <Tag isSelected={false} color="blue">Science</Tag>
            <Tag isRemovable color="green" onAfterRemoveAction={() => {}}>Removable</Tag>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectRing(canvasElement, canvas.getByRole('button', { name: 'Science' }), 'selectable tag');
        await expectRing(canvasElement, canvas.getByRole('button', { name: 'Remove Removable' }), 'remove button');
    },
};

/** Disabled: the disabled ground and words, no ×, out of the tab order, and held under hover and press. */
export const Disabled = {
    render: () => <Tag isSelected={false} isRemovable onAfterRemoveAction={() => {}} color="blue" isDisabled>Science</Tag>,
    play: async ({ canvasElement }) => {
        const tag = within(canvasElement).getByRole('button', { name: 'Science' });
        await expect(tag).toBeDisabled();
        await expect(within(canvasElement).queryByRole('button', { name: /^Remove/ }), 'no ×').toBeNull();
        await expectGroundUnder(canvasElement, tag, undefined, '--ds-background-disabled', 'disabled');
        await expectGroundUnder(canvasElement, tag, ':hover', '--ds-background-disabled', 'disabled');
        await expectGroundUnder(canvasElement, tag, ':active', '--ds-background-disabled', 'disabled');
        await expect(getComputedStyle(tag).color).toBe(tokenColor(canvasElement, '--ds-text-disabled'));
        await userEvent.tab();
        await expect(tag).not.toHaveFocus();
    },
};
