import React, { useState } from 'react';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { computedShadow, px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Tag, { AVATAR_TAG_TYPES, TAG_BEHAVIORS, TAG_COLORS, TagContext } from './Tag';

/**
 * `Tag` — a category, outlined: color on the border and swatch, neutral text,
 * one size (22), four behaviors.
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
    title: 'Components/Status and loading/Tag',
    component: Tag,
    parameters: {
        docs: {
            description: {
                component:
                    'Is it a number? Count. Is it the condition something is in, and can that '
                    + 'condition change? Status. Otherwise, Tag: a subject, a focus area, a person, '
                    + 'a category. Outlined, with neutral text and the color on the border and swatch.',
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

const HUE_TOKEN = {
    blue: 'technology-tools',
    green: 'advocacy',
    purple: 'mastering-content',
    magenta: 'relationship',
    yellow: 'social-emotional',
    teal: 'tertiary',
};

/** Every color. The hue is on the border and the swatch; the words stay neutral. */
export const Colors = () => (
    <div style={row}>
        {TAG_COLORS.map((color) => (
            <Tag key={color} color={color} data-testid={color}>{color}</Tag>
        ))}
    </div>
);

/**
 * A color name paints the hue it names, on the border and the swatch, and on
 * nothing else. The border is the hue's Border Subtle token (grey's is Outline
 * Variant), the swatch is the hue itself, and the text is the same neutral on
 * every color.
 */
Colors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ink = tokenColor(canvasElement, '--color-on-surface');

    for (const color of TAG_COLORS) {
        const tag = canvas.getByTestId(color);
        const swatch = tag.querySelector('[aria-hidden="true"]');
        const s = getComputedStyle(tag);

        await expect(px(s.height), `${color} is 22 tall`).toBe(22);
        await expect(px(s.borderTopWidth), `${color} has a 1px border`).toBe(1);
        await expect(s.color, `${color} text is neutral`).toBe(ink);

        const border = color === 'grey'
            ? tokenColor(canvasElement, '--color-outline-variant')
            : tokenColor(canvasElement, `--color-${HUE_TOKEN[color]}-border-subtle`);
        await expect(s.borderTopColor, `${color} border`).toBe(border);

        const hue = color === 'grey'
            ? tokenColor(canvasElement, '--color-outline')
            : tokenColor(canvasElement, `--color-${HUE_TOKEN[color]}`);
        await expect(getComputedStyle(swatch).backgroundColor, `${color} swatch`).toBe(hue);
        await expect(px(getComputedStyle(swatch).width)).toBe(10);
        await expect(px(getComputedStyle(swatch).borderTopLeftRadius)).toBe(2);
    }

    // Grey is the one name that is not a hue: a default that drifted into a
    // color would have every uncolored tag claiming a category nobody gave it.
    const greySwatch = canvas.getByTestId('grey').querySelector('[aria-hidden="true"]');
    const [r, g, b] = getComputedStyle(greySwatch).backgroundColor.match(/\d+/g).map(Number);
    await expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(12);
};

/** The four behaviors, and the states that change a tag's contents. */
export const Behaviors = () => (
    <div style={row}>
        <Tag color="blue" data-testid="read-only">Read only</Tag>
        <Tag behavior="removable" color="blue" onRemove={() => {}} data-testid="removable">Removable</Tag>
        <Tag behavior="selectable" color="blue" data-testid="selectable">Selectable</Tag>
        <Tag behavior="selectable" color="blue" isSelected count={12} data-testid="selected">Selected</Tag>
        <Tag behavior="link" color="blue" href="#tag" data-testid="link">Link</Tag>
        <Tag behavior="link" color="blue" href="#tag" onRemove={() => {}} data-testid="split">Link with remove</Tag>
        <Tag behavior="removable" color="blue" onRemove={() => {}} isLoading data-testid="saving">Algebra</Tag>
    </div>
);

/** One size: every behavior and state is 22 tall, the count and the × included. */
Behaviors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const id of ['read-only', 'removable', 'selectable', 'selected', 'link', 'split', 'saving']) {
        await expect(px(getComputedStyle(canvas.getByTestId(id)).height), `${id} is 22 tall`).toBe(22);
    }
    await expect(TAG_BEHAVIORS).toEqual(['read-only', 'removable', 'selectable', 'link']);
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
        <Tag color="blue" data-testid="plain">Algebra</Tag>
        <Tag type="person" behavior="removable" onRemove={() => {}} data-testid="person">Rosa Chen</Tag>
        <Tag type="agent" color="purple" behavior="removable" onRemove={() => {}} data-testid="agent">PLUS AI</Tag>
        <Tag type="team" behavior="removable" onRemove={() => {}} data-testid="team">Math team</Tag>
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
    const neutral = tokenColor(canvasElement, '--color-outline-variant');

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

    // The color fills the avatar: an agent sits on its hue's Container.
    await expect(getComputedStyle(avatarOf(canvas.getByTestId('agent'))).backgroundColor)
        .toBe(tokenColor(canvasElement, '--color-mastering-content-container'));
    await expect(getComputedStyle(avatarOf(canvas.getByTestId('person'))).backgroundColor)
        .toBe(tokenColor(canvasElement, '--color-surface-container-high'));

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
                    <Tag type={type} behavior="removable" onRemove={() => onRemoveSpy(type)} isLoading={saving} data-testid={`${type}-removable`}>{label}</Tag>
                    <Tag type={type} behavior="selectable" isSelected={on} onClick={() => setOn((v) => !v)} data-testid={`${type}-selectable`}>{`${label} filter`}</Tag>
                    <Tag
                        type={type}
                        behavior="link"
                        href={`#${type}`}
                        onClick={(e) => {
                            e.preventDefault();
                            onFollowSpy(type);
                        }}
                        onRemove={() => {}}
                        data-testid={`${type}-link`}
                    >
                        {`${label} page`}
                    </Tag>
                    <button type="button" onClick={() => setSaving((v) => !v)}>{`Save ${type}`}</button>
                    <TagContext.Provider value={{ isDisabled: true }}>
                        <Tag type={type} behavior="removable" onRemove={() => {}} data-testid={`${type}-disabled`}>{`${label} locked`}</Tag>
                    </TagContext.Provider>
                </div>
            );
        };
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Row type="person" label="Rosa Chen" />
                <Row type="agent" label="PLUS AI" />
                <Row type="team" label="Math team" />
            </div>
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const labels = { person: 'Rosa Chen', agent: 'PLUS AI', team: 'Math team' };

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

            // The avatar spinner is Figma's: a 3/4 arc in on-surface-variant,
            // 12 across, whatever the tag's color.
            const spinner = avatarOf(tag).firstElementChild;
            const ring = spinner.querySelector('circle');
            const ink = tokenColor(canvasElement, '--color-on-surface-variant');
            await expect(px(getComputedStyle(spinner).width), 'a 12 spinner').toBe(12);
            await expect(getComputedStyle(ring).stroke, 'in on-surface-variant').toBe(ink);
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
        <Tag type="person" behavior="selectable" color="teal">Rosa Chen</Tag>
        <Tag type="person" behavior="removable" onRemove={() => {}}>Kai Brooks</Tag>
    </div>
);

PersonFocusRing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--color-focus-ring');

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
        <Tag type="agent" behavior="removable" onRemove={() => {}}>PLUS AI</Tag>
        <Tag type="team" behavior="removable" onRemove={() => {}}>Math team</Tag>
    </div>
);

RemoveFocusRingOnTypes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Remove PLUS AI', 'Remove Math team']) {
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
 * is saving shows its spinner on a clear ground, not a grey disc, and a broken
 * avatar is still on initials once a save ends.
 */
export const AvatarEdgeCases = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        const [saving, setSaving] = useState(false);
        return (
            <div style={row}>
                <button type="button" onClick={() => setMounted(true)}>Mount the edge cases</button>
                <button type="button" onClick={() => setSaving((v) => !v)}>Toggle saving</button>
                {mounted && (
                    <>
                        <Tag type="agent" data-testid="emoji">😀 Helper</Tag>
                        <Tag type="person" data-testid="eszett">ßen Öztürk</Tag>
                        <Tag type="person" data-testid="node"><em>Rosa Chen</em></Tag>
                        <Tag type="person" avatar={PHOTO} data-testid="node-with-avatar"><em>Kai Brooks</em></Tag>
                        <Tag type="team" elemBefore={<i className="fa-solid fa-star" />} data-testid="elem">Math team</Tag>
                        <Tag type="team" swatchBefore="#ff0000" data-testid="swatch">Science team</Tag>
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

            // The team keeps its avatar, not the star or the red swatch.
            await expect(canvas.getByTestId('elem').querySelector('.fa-star')).toBeNull();
            await expect(px(getComputedStyle(avatarOf(canvas.getByTestId('swatch'))).width)).toBe(16);

            const saving = avatarOf(canvas.getByTestId('disabled-saving'));
            await expect(getComputedStyle(saving).backgroundColor, 'no grey disc behind the spinner').toBe(CLEAR);

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
 * The avatar's fill. A hued person or team sits on its hue's Container, a grey
 * team on the Technology Tools 08 wash, and a disabled tag's photo stays whole:
 * the image covers the box at full opacity and in full color.
 */
export const AvatarFills = () => (
    <div style={row}>
        <Tag type="team" color="blue" data-testid="team-blue">Math team</Tag>
        <Tag type="person" color="teal" data-testid="person-teal">Rosa Chen</Tag>
        <Tag type="team" data-testid="team-grey">Science team</Tag>
        <TagContext.Provider value={{ isDisabled: true }}>
            <Tag type="person" avatar={PHOTO} data-testid="disabled-photo">Kai Brooks</Tag>
        </TagContext.Provider>
    </div>
);

AvatarFills.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fill = (id) => getComputedStyle(avatarOf(canvas.getByTestId(id))).backgroundColor;

    await expect(fill('team-blue'), 'a blue team fills Technology Tools Container')
        .toBe(tokenColor(canvasElement, '--color-technology-tools-container'));
    await expect(fill('person-teal'), 'a teal person fills Tertiary Container')
        .toBe(tokenColor(canvasElement, '--color-tertiary-container'));
    await expect(fill('team-grey'), 'a grey team fills the Technology Tools 08 wash')
        .toBe(tokenColor(canvasElement, '--color-technology-tools-state-08'));

    // Disabled greys the tag, never the person: the photo shows as it is.
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
                    behavior="selectable"
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

/** The hue's own state layers, in place of a brightness filter. */
export const StateLayers = () => (
    <div style={row}>
        <Tag behavior="selectable" color="blue">Unselected</Tag>
        <Tag behavior="selectable" color="blue" isSelected>Selected</Tag>
        <Tag behavior="selectable" color="grey" isSelected>Grey selected</Tag>
        <Tag behavior="link" color="green" href="#tag">Link</Tag>
        <Tag behavior="link" color="green" href="#tag" onRemove={() => {}} data-testid="split">Split link</Tag>
        <Tag behavior="removable" color="purple" onRemove={() => {}} data-testid="removable">Removable</Tag>
    </div>
);

/**
 * Selectable: hover 08, pressed 12; selected is 12 with a full-hue border, and
 * 16 on hover or press. A link is 08 and 12, and its text underlines on hover
 * and press only. On a removable tag only the × reacts: 08 on hover, 16
 * pressed, and the tag's own ground never moves.
 */
StateLayers.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const bg = 'backgroundColor';

    const unselected = canvas.getByRole('button', { name: 'Unselected' });
    await expect(getComputedStyle(unselected)[bg], 'rest is outlined only').toBe(CLEAR);
    await expect(whileForced(unselected, ':hover', bg)).toBe(t('--color-technology-tools-state-08'));
    await expect(whileForced(unselected, ':active', bg)).toBe(t('--color-technology-tools-state-12'));

    const selected = canvas.getByRole('button', { name: 'Selected' });
    await expect(getComputedStyle(selected).borderTopColor, 'selected border is the full hue')
        .toBe(t('--color-technology-tools'));
    await expect(getComputedStyle(selected)[bg]).toBe(t('--color-technology-tools-state-12'));
    await expect(whileForced(selected, ':hover', bg)).toBe(t('--color-technology-tools-state-16'));
    await expect(whileForced(selected, ':active', bg)).toBe(t('--color-technology-tools-state-16'));

    const grey = canvas.getByRole('button', { name: 'Grey selected' });
    await expect(getComputedStyle(grey).borderTopColor).toBe(t('--color-outline'));
    await expect(getComputedStyle(grey)[bg]).toBe(t('--color-on-surface-variant-state-12'));

    // A plain link: the tag is the link.
    const link = canvas.getByRole('link', { name: 'Link' });
    const linkText = within(link).getByText('Link');
    await expect(whileForced(link, ':hover', bg)).toBe(t('--color-advocacy-state-08'));
    await expect(whileForced(link, ':active', bg)).toBe(t('--color-advocacy-state-12'));
    await expect(getComputedStyle(linkText).textDecorationLine, 'no underline at rest').toBe('none');
    await expect(whileForced(link, ':hover', 'textDecorationLine', linkText)).toBe('underline');
    await expect(whileForced(link, ':active', 'textDecorationLine', linkText)).toBe('underline');

    // A split link: the tag lights up for its link half, and the text underlines.
    const split = canvas.getByTestId('split');
    const splitLink = canvas.getByRole('link', { name: 'Split link' });
    const splitText = within(splitLink).getByText('Split link');
    await expect(whileForced(splitLink, ':hover', bg, split)).toBe(t('--color-advocacy-state-08'));
    await expect(whileForced(splitLink, ':active', bg, split)).toBe(t('--color-advocacy-state-12'));
    await expect(getComputedStyle(splitText).textDecorationLine).toBe('none');
    await expect(whileForced(splitLink, ':hover', 'textDecorationLine', splitText)).toBe('underline');
    await expect(whileForced(splitLink, ':active', 'textDecorationLine', splitText)).toBe('underline');
    const splitX = canvas.getByRole('button', { name: 'Remove Split link' });
    await expect(whileForced(splitX, ':hover', bg, split), 'hovering the × does not light the link')
        .toBe(CLEAR);

    const removable = canvas.getByTestId('removable');
    await expect(whileForced(removable, ':hover', bg), 'a removable tag itself never reacts').toBe(CLEAR);
    const x = canvas.getByRole('button', { name: 'Remove Removable' });
    await expect(whileForced(x, ':hover', bg)).toBe(t('--color-on-surface-variant-state-08'));
    await expect(whileForced(x, ':active', bg)).toBe(t('--color-on-surface-variant-state-16'));
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
                            behavior="removable"
                            color="blue"
                            onRemove={() => {
                                onRemoveSpy(s);
                                setSubjects((prev) => prev.filter((x) => x !== s));
                            }}
                        >
                            {s}
                        </Tag>
                    ))}
                    <Tag behavior="removable" color="blue" onRemove={() => {}} removeLabel="Drop the maths filter">Maths</Tag>
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

        // `removeLabel` replaces the generated name.
        await expect(canvas.getByRole('button', { name: 'Drop the maths filter' })).toBeInTheDocument();

        // A removable tag is not itself a control: exactly one button per tag.
        await expect(canvas.getAllByRole('button')).toHaveLength(3);
    },
};

/**
 * A label that is not text gives the × nothing to be named after, so a row of
 * them would all be "Remove". Development says so unless `removeLabel` is set.
 */
export const RemoveNeedsANameForNodeLabels = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <button type="button" onClick={() => setMounted(true)}>Mount</button>
                {mounted && (
                    <>
                        <Tag behavior="removable" onRemove={() => {}}><em>Unnamed</em></Tag>
                        <Tag behavior="removable" onRemove={() => {}} removeLabel="Remove Named"><em>Named</em></Tag>
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
            const calls = warn.mock.calls.filter(([m]) => String(m).includes('Pass `removeLabel`'));
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
        <Tag behavior="selectable" color="teal">Filter</Tag>
        <Tag behavior="removable" color="teal" onRemove={() => {}}>Chosen</Tag>
        <Tag behavior="link" color="teal" href="#tag">Go</Tag>
        <Tag behavior="link" color="teal" href="#tag" onRemove={() => {}} data-testid="split">Split</Tag>
    </div>
);

FocusRing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--color-focus-ring');
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
    await expect(getComputedStyle(x).backgroundColor, 'with the 12 fill under it')
        .toBe(tokenColor(canvasElement, '--color-on-surface-variant-state-12'));

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
            <button type="button">Before</button>
            <Tag
                behavior="link"
                color="purple"
                href="#algebra"
                onClick={(e) => {
                    e.preventDefault();
                    onFollowSpy();
                }}
                onRemove={onRemoveSpy}
            >
                Algebra
            </Tag>
        </div>
    ),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link', { name: 'Algebra' });
        const x = canvas.getByRole('button', { name: 'Remove Algebra' });

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
 * Disabled comes from the field, through `TagContext`: a neutral fill,
 * Secondary (Text), no ×, nothing to focus, and no hover.
 */
export const DisabledInField = () => (
    <div style={row}>
        <button type="button">Before</button>
        <TagContext.Provider value={{ isDisabled: true }}>
            <Tag color="blue" data-testid="read-only">Read only</Tag>
            <Tag behavior="removable" color="blue" onRemove={() => {}} data-testid="removable">Removable</Tag>
            <Tag behavior="selectable" color="blue" data-testid="selectable">Selectable</Tag>
            <Tag behavior="selectable" color="blue" isSelected data-testid="selected">Selected</Tag>
            <Tag behavior="link" color="blue" href="#tag" data-testid="link">Link</Tag>
        </TagContext.Provider>
        <button type="button">After</button>
    </div>
);

DisabledInField.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('button', { name: /^Remove/ }), 'no ×').toBeNull();
    await expect(canvas.queryByRole('link'), 'a disabled link is not a link').toBeNull();

    canvas.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After' }), 'no tag takes focus').toHaveFocus();

    const fill = tokenColor(canvasElement, '--color-on-surface-state-12');
    const text = tokenColor(canvasElement, '--color-secondary-text');
    for (const id of ['read-only', 'removable', 'selectable', 'selected', 'link']) {
        const tag = canvas.getByTestId(id);
        await expect(getComputedStyle(tag).backgroundColor, `${id} fill`).toBe(fill);
        await expect(getComputedStyle(tag).color, `${id} text`).toBe(text);
        await expect(px(getComputedStyle(tag).height)).toBe(22);
    }

    // Selected stays visible when disabled, as a Secondary (Text) border.
    await expect(getComputedStyle(canvas.getByTestId('selected')).borderTopColor).toBe(text);
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
 * A count belongs to a selectable tag, such as a filter's result count. On any
 * other behavior it is ignored, and development says so.
 */
export const CountOnSelectable = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <Tag behavior="selectable" color="green" count={12}>Science</Tag>
                <button type="button" onClick={() => setMounted(true)}>Mount a removable with a count</button>
                {mounted && (
                    <Tag behavior="removable" color="green" count={34} onRemove={() => {}}>History</Tag>
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
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('`count` is only shown on behavior="selectable"'));
        } finally {
            warn.mockRestore();
        }
    },
};

/* ------------------------------------------------------------------ saving */

/**
 * Saving swaps the swatch for a spinner of the same size, so the tag does not
 * move, and says so once, through a status beside the tag rather than inside
 * its name. The × and a link stay in place but do nothing until the save lands.
 */
export const Saving = {
    args: { onRemoveSpy: fn(), onFollowSpy: fn(), onToggleSpy: fn() },
    render: ({ onRemoveSpy, onFollowSpy, onToggleSpy }) => {
        const Row = () => {
            const [saving, setSaving] = useState(false);
            return (
                <div style={row}>
                    <span data-testid="removable-wrap">
                        <Tag behavior="removable" color="yellow" isLoading={saving} onRemove={onRemoveSpy} data-testid="removable">Geometry</Tag>
                    </span>
                    <Tag behavior="selectable" color="yellow" isLoading={saving} onClick={onToggleSpy}>Statistics</Tag>
                    <Tag
                        behavior="link"
                        color="yellow"
                        href="#calculus"
                        isLoading={saving}
                        onClick={(e) => {
                            e.preventDefault();
                            onFollowSpy();
                        }}
                    >
                        Calculus
                    </Tag>
                    <button type="button" onClick={() => setSaving((v) => !v)}>
                        {saving ? 'Done' : 'Save'}
                    </button>
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

        const link = canvas.getByRole('link', { name: 'Calculus' });
        await expect(link).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(link);
        await expect(args.onFollowSpy, 'a saving link does not follow').not.toHaveBeenCalled();

        await userEvent.click(canvas.getByRole('button', { name: 'Remove Geometry' }));
        await expect(args.onRemoveSpy, 'the × waits for the save').not.toHaveBeenCalled();

        const spinner = tag.querySelector('[aria-hidden="true"]');
        const hue = tokenColor(canvasElement, '--color-social-emotional');
        await expect(getComputedStyle(spinner).borderTopColor, 'the spinner is in the tag hue').toBe(hue);
        await expect(getComputedStyle(spinner).borderBottomColor, 'a 270° arc').toBe(hue);
        await expect(getComputedStyle(spinner).borderLeftColor).toBe(CLEAR);

        await userEvent.click(canvas.getByRole('button', { name: 'Done' }));
        await expect(status, 'and it goes quiet when the save lands').toHaveTextContent('');
        await userEvent.click(canvas.getByRole('button', { name: 'Remove Geometry' }));
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
        <Tag behavior="selectable" color="blue">Mastering Content Across Every Grade Band</Tag>
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
    borderRadius: 'var(--size-element-radius-lg, 8px)',
    overflow: 'hidden',
};
const picture = {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(135deg, var(--color-social-emotional-container, #ffdea0), '
        + 'var(--color-tertiary, #0e8175) 45%, var(--color-inverse-surface, #2e3133))',
};
/* Placed 8 from the corner, as the Figma docs place it. */
const onPicture = {
    ...row,
    position: 'absolute',
    top: 'var(--size-spacing-small-space-100, 8px)',
    left: 'var(--size-spacing-small-space-100, 8px)',
    right: 'var(--size-spacing-small-space-100, 8px)',
};

/**
 * Tags on a thumbnail: `isElevated` lifts a read-only or link tag onto the
 * picture. Figma draws it on plain tags; a person, agent or team tag takes the
 * same ground, since nothing about the avatar changes.
 */
export const OnImages = () => (
    <div style={thumbnail}>
        <div style={picture} aria-hidden="true" />
        <div style={onPicture}>
            <Tag color="blue" isElevated data-testid="read-only">Algebra</Tag>
            <Tag color="green" isElevated>Advocacy</Tag>
            <Tag color="grey" isElevated>Video</Tag>
            <Tag type="person" color="blue" isElevated data-testid="person">Rosa Chen</Tag>
            <Tag behavior="link" color="magenta" href="#lesson" isElevated>Open lesson</Tag>
            <Tag behavior="link" color="teal" href="#unit" isElevated onRemove={() => {}} data-testid="split">
                Unit 3
            </Tag>
            <TagContext.Provider value={{ isDisabled: true }}>
                <Tag color="yellow" isElevated data-testid="disabled">Archived</Tag>
            </TagContext.Provider>
        </div>
    </div>
);

/**
 * Elevated: a solid Surface Container Lowest fill, no border, the Elevation 2
 * shadow and neutral text, with the hue kept on the swatch, still 22 tall. A
 * link's hover and press lay the on-surface 08 and 12 layers over the solid
 * fill rather than replacing it, and its focus ring has a 2px surface gap
 * inside it, so the ring reads on a dark picture.
 */
OnImages.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const ground = t('--color-surface-container-lowest');
    const shadow = computedShadow(canvasElement, 'var(--elevation-light-2)');

    const tags = [
        canvas.getByTestId('read-only'),
        canvas.getByText('Advocacy').parentElement,
        canvas.getByText('Video').parentElement,
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
        await expect(s.boxShadow, `${name} has the Elevation 2 shadow`).toBe(shadow);
        await expect(s.color, `${name} text is neutral`).toBe(t('--color-on-surface'));
    }
    const swatch = canvas.getByTestId('read-only').querySelector('[aria-hidden="true"]');
    await expect(getComputedStyle(swatch).backgroundColor, 'the hue stays on the swatch')
        .toBe(t('--color-technology-tools'));
    const avatar = canvas.getByTestId('person').querySelector('[aria-hidden="true"]');
    await expect(getComputedStyle(avatar).backgroundColor, 'the color stays on the avatar')
        .toBe(t('--color-technology-tools-container'));

    // Disabled from the field: the solid ground and shadow stay, since the
    // translucent disabled fill would sink into the picture; the words go
    // to the disabled color, and hovering changes nothing.
    const disabled = canvas.getByTestId('disabled');
    await expect(getComputedStyle(disabled).backgroundColor).toBe(ground);
    await expect(getComputedStyle(disabled).boxShadow).toBe(shadow);
    await expect(getComputedStyle(disabled).color).toBe(t('--color-secondary-text'));
    await expect(whileForced(disabled, ':hover', 'backgroundColor')).toBe(ground);

    // Hover and press: the state layer sits over the solid fill, which stays.
    const layer = (token) => `linear-gradient(${t(token)}, ${t(token)})`;
    const link = canvas.getByRole('link', { name: 'Open lesson' });
    for (const [pseudo, token] of [[':hover', '--color-on-surface-state-08'], [':active', '--color-on-surface-state-12']]) {
        await expect(whileForced(link, pseudo, 'backgroundColor'), `${pseudo} keeps the fill`).toBe(ground);
        await expect(whileForced(link, pseudo, 'backgroundImage'), `${pseudo} layer`).toBe(layer(token));
        await expect(whileForced(link, pseudo, 'boxShadow'), `${pseudo} keeps the shadow`).toBe(shadow);
    }
    const split = canvas.getByTestId('split');
    const splitLink = canvas.getByRole('link', { name: 'Unit 3' });
    await expect(whileForced(splitLink, ':hover', 'backgroundColor', split)).toBe(ground);
    await expect(whileForced(splitLink, ':hover', 'backgroundImage', split)).toBe(layer('--color-on-surface-state-08'));
    await expect(whileForced(splitLink, ':active', 'backgroundImage', split)).toBe(layer('--color-on-surface-state-12'));

    // Focus: the standard ring, 2px outside, with the 2px between it and the
    // tag filled in the surface color.
    const ring = t('--color-focus-ring');
    const gapped = computedShadow(
        canvasElement,
        '0 0 0 var(--size-element-stroke-lg) var(--color-surface-container-lowest), var(--elevation-light-2)',
    );
    const expectGappedRing = async (el, measured, what) => {
        const s = getComputedStyle(measured);
        await expect(s.outlineStyle, what).toBe('solid');
        await expect(px(s.outlineWidth), what).toBe(2);
        await expect(px(s.outlineOffset), what).toBe(2);
        await expect(s.outlineColor, what).toBe(ring);
        await expect(s.boxShadow, `${what}: a 2px surface gap inside the ring`).toBe(gapped);
    };
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expectGappedRing(link, link, 'an elevated link');
    await userEvent.tab();
    await expect(splitLink).toHaveFocus();
    await expectGappedRing(splitLink, split, 'an elevated split link');
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
                <button type="button" onClick={() => setMounted(true)}>Mount elevated editable tags</button>
                {mounted && (
                    <>
                        <Tag behavior="removable" color="purple" isElevated onRemove={() => {}} data-testid="removable">
                            Geometry
                        </Tag>
                        <Tag behavior="selectable" color="purple" isElevated>Fractions</Tag>
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
            const border = tokenColor(canvasElement, '--color-mastering-content-border-subtle');
            const removable = canvas.getByTestId('removable');
            const selectable = canvas.getByRole('button', { name: 'Fractions' });
            for (const [tag, name] of [[removable, 'removable'], [selectable, 'selectable']]) {
                const s = getComputedStyle(tag);
                await expect(s.boxShadow, `${name} gains no shadow`).toBe('none');
                await expect(s.borderTopColor, `${name} keeps its outline`).toBe(border);
                await expect(s.backgroundColor, `${name} keeps its clear ground`).toBe(CLEAR);
            }
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('`isElevated` is only for behavior="read-only" or "link"; it is ignored on "removable"'));
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('`isElevated` is only for behavior="read-only" or "link"; it is ignored on "selectable"'));
        } finally {
            warn.mockRestore();
        }
    },
};

/* ------------------------------------------------------------- deprecation */

/**
 * The old names keep working. `orange` is `yellow` (the hue is a 44° yellow),
 * and `variant="dismissible"` is `behavior="removable"`; both say so in
 * development.
 */
export const DeprecatedNames = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <button type="button" onClick={() => setMounted(true)}>Mount the old names</button>
                {mounted && (
                    <>
                        <Tag color="orange" data-testid="orange">Orange</Tag>
                        <Tag variant="dismissible" color="yellow" onRemove={() => {}}>Dismissible</Tag>
                    </>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount the old names' }));
            await expect(getComputedStyle(canvas.getByTestId('orange')).borderTopColor)
                .toBe(tokenColor(canvasElement, '--color-social-emotional-border-subtle'));
            await expect(canvas.getByRole('button', { name: 'Remove Dismissible' })).toBeInTheDocument();
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('color="orange" is deprecated'));
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant="dismissible" is deprecated'));
        } finally {
            warn.mockRestore();
        }
    },
};

/* -------------------------------------------------------------- playground */

/**
 * Interactive playground. `onRemove` is supplied here rather than exposed as a
 * control: a docs control cannot author a function, and a removable tag with
 * no handler renders no ×.
 */
export const Interactive = (args) => (
    <Tag {...args} onClick={(e) => e.preventDefault()} onRemove={() => {}} />
);
Interactive.args = {
    text: 'Mathematics',
    behavior: 'read-only',
    color: 'blue',
    type: 'plain',
    href: '#mathematics',
    isSelected: false,
    isLoading: false,
};
