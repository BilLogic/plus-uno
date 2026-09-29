import React, { useState } from 'react';
import { expect, fn, spyOn, userEvent, within } from 'storybook/test';

import Tag, { TAG_BEHAVIORS, TAG_COLORS, TagContext } from './Tag';

/**
 * `Tag` — a category, outlined: color on the border and swatch, neutral text,
 * one size (22), four behaviors.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. A good assertion here is one a person could make by using
 * the component or by measuring it: a role, a name, focus order, a computed
 * height, width or color. Never a class name.
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

const px = (v) => parseFloat(v);

/** What a CSS color expression resolves to, read through a probe inside `host`. */
const resolveColor = (host, expression) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = expression;
    host.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
};

const tokenColor = (host, token) => resolveColor(host, `var(${token})`);

/*
 * The background a pseudo-class would give `el`, read from the stylesheet the
 * component really ships.
 *
 * WHY NOT HOVER FOR REAL. `userEvent` in a play function dispatches synthetic
 * events, and a synthetic `mouseover` never sets `:hover` — only a real pointer
 * does. So this finds every rule whose selector names the pseudo-class, drops
 * the pseudo-class, and asks whether the element matches what is left. The
 * last match in document order wins, as it would in the cascade for these
 * equal-specificity rules. The color is then resolved on the element, so a
 * `var(--plus-tag-08)` comes back as the token it points at.
 */
const pseudoBackground = (el, pseudo) => {
    let found = null;
    const visit = (rules) => {
        for (const rule of rules) {
            if (rule.cssRules && !rule.selectorText) {
                visit(rule.cssRules);
                continue;
            }
            if (!rule.selectorText || !rule.style?.backgroundColor) continue;
            for (const selector of rule.selectorText.split(/,(?![^(]*\))/)) {
                if (!selector.includes(pseudo)) continue;
                const stripped = selector.split(pseudo).join('').trim();
                try {
                    if (stripped && el.matches(stripped)) found = rule.style.backgroundColor;
                } catch {
                    // A selector this browser cannot parse cannot apply either.
                }
            }
        }
    };
    for (const sheet of document.styleSheets) {
        try {
            visit(sheet.cssRules);
        } catch {
            // Cross-origin sheets are not ours.
        }
    }
    return found === null ? null : resolveColor(el, found);
};

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
            <Tag key={color} color={color}>{color}</Tag>
        ))}
    </div>
);

/**
 * A color name paints the hue it names, on the border and the swatch, and on
 * nothing else. The border is the hue's Border Subtle token (grey's is
 * on-surface-variant at 16), the swatch is the hue itself, and the text is the
 * same neutral on every color.
 */
Colors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ink = tokenColor(canvasElement, '--color-on-surface');

    for (const color of TAG_COLORS) {
        const tag = canvas.getByText(color).parentElement;
        const swatch = tag.querySelector('[aria-hidden="true"]');
        const s = getComputedStyle(tag);

        await expect(px(s.height), `${color} is 22 tall`).toBe(22);
        await expect(px(s.borderTopWidth), `${color} has a 1px border`).toBe(1);
        await expect(s.color, `${color} text is neutral`).toBe(ink);

        const border = color === 'grey'
            ? tokenColor(canvasElement, '--color-on-surface-variant-state-16')
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
    const greySwatch = canvas.getByText('grey').parentElement.querySelector('[aria-hidden="true"]');
    const [r, g, b] = getComputedStyle(greySwatch).backgroundColor.match(/\d+/g).map(Number);
    await expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(12);
};

/** The four behaviors, and the states that change a tag's contents. */
export const Behaviors = () => (
    <div style={row}>
        <Tag color="blue">Read only</Tag>
        <Tag behavior="removable" color="blue" onRemove={() => {}}>Removable</Tag>
        <Tag behavior="selectable" color="blue">Selectable</Tag>
        <Tag behavior="selectable" color="blue" isSelected count={12}>Selected</Tag>
        <Tag behavior="link" color="blue" href="#tag">Link</Tag>
        <Tag behavior="link" color="blue" href="#tag" onRemove={() => {}}>Link with remove</Tag>
        <Tag behavior="removable" color="blue" onRemove={() => {}} isLoading>Algebra</Tag>
    </div>
);

/** One size: every behavior and state is 22 tall, the count and the × included. */
Behaviors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tags = ['Read only', 'Removable', 'Selectable', 'Selected', 'Link', 'Link with remove', 'Algebra']
        .map((text) => canvas.getByText(text).closest('.plus-tag'));
    for (const tag of tags) {
        await expect(px(getComputedStyle(tag).height), `${tag.textContent} is 22 tall`).toBe(22);
    }
    await expect(TAG_BEHAVIORS).toEqual(['read-only', 'removable', 'selectable', 'link']);
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
        <Tag behavior="link" color="green" href="#tag" onRemove={() => {}}>Split link</Tag>
        <Tag behavior="removable" color="purple" onRemove={() => {}}>Removable</Tag>
    </div>
);

/**
 * Selectable: hover 08, pressed 12; selected is 12 with a full-hue border, and
 * 16 on hover or press. A link is 08 and 12. On a removable tag only the ×
 * reacts: 08 on hover, 16 pressed, and the tag's own ground never moves.
 */
StateLayers.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const clear = 'rgba(0, 0, 0, 0)';

    const unselected = canvas.getByRole('button', { name: 'Unselected' });
    await expect(getComputedStyle(unselected).backgroundColor, 'rest is outlined only').toBe(clear);
    await expect(pseudoBackground(unselected, ':hover')).toBe(t('--color-technology-tools-state-08'));
    await expect(pseudoBackground(unselected, ':active')).toBe(t('--color-technology-tools-state-12'));

    const selected = canvas.getByRole('button', { name: 'Selected' });
    await expect(getComputedStyle(selected).borderTopColor, 'selected border is the full hue')
        .toBe(t('--color-technology-tools'));
    await expect(getComputedStyle(selected).backgroundColor).toBe(t('--color-technology-tools-state-12'));
    await expect(pseudoBackground(selected, ':hover')).toBe(t('--color-technology-tools-state-16'));
    await expect(pseudoBackground(selected, ':active')).toBe(t('--color-technology-tools-state-16'));

    const grey = canvas.getByRole('button', { name: 'Grey selected' });
    await expect(getComputedStyle(grey).borderTopColor).toBe(t('--color-outline'));
    await expect(getComputedStyle(grey).backgroundColor).toBe(t('--color-on-surface-variant-state-12'));

    const link = canvas.getByRole('link', { name: 'Link' });
    await expect(pseudoBackground(link, ':hover')).toBe(t('--color-advocacy-state-08'));
    await expect(pseudoBackground(link, ':active')).toBe(t('--color-advocacy-state-12'));

    const split = canvas.getByRole('link', { name: 'Split link' }).parentElement;
    await expect(pseudoBackground(split, ':hover'), 'the split tag lights up for its link')
        .toBe(t('--color-advocacy-state-08'));

    const removable = canvas.getByText('Removable').parentElement;
    await expect(pseudoBackground(removable, ':hover'), 'a removable tag itself never reacts').toBeNull();
    const x = canvas.getByRole('button', { name: 'Remove Removable' });
    await expect(pseudoBackground(x, ':hover')).toBe(t('--color-on-surface-variant-state-08'));
    await expect(pseudoBackground(x, ':active')).toBe(t('--color-on-surface-variant-state-16'));
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

/** Keyboard focus: a 2px Focus Ring 2px outside the tag, or outside the ×. */
export const FocusRing = () => (
    <div style={row}>
        <Tag behavior="selectable" color="teal">Filter</Tag>
        <Tag behavior="removable" color="teal" onRemove={() => {}}>Chosen</Tag>
    </div>
);

FocusRing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--color-focus-ring');

    await userEvent.tab();
    const tag = canvas.getByRole('button', { name: 'Filter' });
    await expect(tag).toHaveFocus();
    let s = getComputedStyle(tag);
    await expect(s.outlineStyle).toBe('solid');
    await expect(px(s.outlineWidth)).toBe(2);
    await expect(px(s.outlineOffset)).toBe(2);
    await expect(s.outlineColor).toBe(ring);

    await userEvent.tab();
    const x = canvas.getByRole('button', { name: 'Remove Chosen' });
    await expect(x).toHaveFocus();
    s = getComputedStyle(x);
    await expect(px(s.outlineWidth)).toBe(2);
    await expect(px(s.outlineOffset), 'the ring sits outside the ×').toBe(2);
    await expect(s.outlineColor).toBe(ring);
    await expect(s.backgroundColor, 'with the 12 fill under it')
        .toBe(tokenColor(canvasElement, '--color-on-surface-variant-state-12'));
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

        // The link underlines on hover and press only, never at rest.
        const label = within(link).getByText('Algebra');
        await expect(getComputedStyle(label).textDecorationLine).toBe('none');
    },
};

/* ---------------------------------------------------------------- disabled */

/**
 * Disabled comes from the field, through `TagContext`: a neutral fill,
 * Secondary (Text), no ×, and nothing to focus.
 */
export const DisabledInField = () => (
    <div style={row}>
        <button type="button">Before</button>
        <TagContext.Provider value={{ isDisabled: true }}>
            <Tag color="blue">Read only</Tag>
            <Tag behavior="removable" color="blue" onRemove={() => {}}>Removable</Tag>
            <Tag behavior="selectable" color="blue">Selectable</Tag>
            <Tag behavior="link" color="blue" href="#tag">Link</Tag>
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
    for (const name of ['Read only', 'Removable', 'Selectable', 'Link']) {
        const tag = canvas.getByText(name).closest('.plus-tag');
        await expect(getComputedStyle(tag).backgroundColor, `${name} fill`).toBe(fill);
        await expect(getComputedStyle(tag).color, `${name} text`).toBe(text);
        await expect(px(getComputedStyle(tag).height)).toBe(22);
    }
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
 * move, and says so once. The × stays in place but does nothing until the
 * save lands.
 */
export const Saving = {
    args: { onRemoveSpy: fn() },
    render: ({ onRemoveSpy }) => {
        const Row = () => {
            const [saving, setSaving] = useState(false);
            return (
                <div style={row}>
                    <Tag behavior="removable" color="yellow" isLoading={saving} onRemove={onRemoveSpy}>Geometry</Tag>
                    <Tag behavior="selectable" color="yellow" isLoading>Selectable saving</Tag>
                    <button type="button" onClick={() => setSaving(true)}>Save</button>
                </div>
            );
        };
        return <Row />;
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const tag = canvas.getByText('Geometry').parentElement;
        const before = tag.getBoundingClientRect().width;

        await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
        await expect(tag.getBoundingClientRect().width, 'saving keeps the width').toBe(before);

        const statuses = within(tag).getAllByRole('status');
        await expect(statuses, 'announced once').toHaveLength(1);
        await expect(statuses[0]).toHaveTextContent('Saving');

        const x = canvas.getByRole('button', { name: 'Remove Geometry' });
        await userEvent.click(x);
        await expect(args.onRemoveSpy, 'the × waits for the save').not.toHaveBeenCalled();

        const spinner = tag.querySelector('[aria-hidden="true"]');
        await expect(getComputedStyle(spinner).borderTopColor, 'the spinner is in the tag hue')
            .toBe(tokenColor(canvasElement, '--color-social-emotional'));
        await expect(canvas.getByRole('button', { name: /Selectable saving/ })).toHaveAttribute('aria-disabled', 'true');
    },
};

/* -------------------------------------------------------------- truncation */

/**
 * Every tag caps at 180 wide. A clipped label ellipsizes and keeps its full
 * text as a tooltip; a label that fits gets no tooltip repeating it.
 */
export const Truncation = () => (
    <div style={row}>
        <Tag color="blue">Social-Emotional Learning and Advocacy for Every Student</Tag>
        <Tag color="blue">Short</Tag>
    </div>
);

Truncation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const long = canvas.getByTitle('Social-Emotional Learning and Advocacy for Every Student');
    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
    await expect(getComputedStyle(long).textOverflow).toBe('ellipsis');
    await expect(long.parentElement.getBoundingClientRect().width).toBeLessThanOrEqual(180);
    await expect(canvas.getByText('Short')).not.toHaveAttribute('title');
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
                        <Tag color="orange">Orange</Tag>
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
            await expect(getComputedStyle(canvas.getByText('Orange').parentElement).borderTopColor)
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
    href: '#mathematics',
    isSelected: false,
    isLoading: false,
};
