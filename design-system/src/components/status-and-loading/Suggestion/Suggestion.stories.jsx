import React, { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Tag from '../Tag';
import TagGroup from '../TagGroup';
import Suggestion, { SUGGESTION_TYPES } from './Suggestion';

/**
 * `Suggestion` — a value the system proposes, as a button that sits in a tag
 * row: the same height, padding and radius as Tag, a dashed border and
 * discovery-purple words.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is one a person could make by using the
 * component or by measuring it: a role, a name, a callback's argument, a
 * computed height, color or outline. Never a class name.
 *
 * Hover and press are forced through `withForcedPseudo`, because a synthetic
 * event never sets `:hover` or `:active`; the browser's own cascade still
 * decides what the forced state looks like.
 *
 * Contrast is not re-asserted: the a11y ratchet tracks `color-contrast` over
 * every story rendered.
 */

export default {
    title: 'Components/Status and loading/Suggestion',
    component: Suggestion,
    parameters: {
        docs: {
            description: {
                component:
                    'A value the system proposes that a person can accept, such as an AI-suggested '
                    + 'focus area. A button, not a label: the same height, padding and radius as Tag, '
                    + 'so it sits in the tag row where the value will land.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' };

const CLEAR = 'rgba(0, 0, 0, 0)';

/** A computed style property of `el` while it is forced into `pseudo`. */
const whileForced = (el, pseudo, property) =>
    withForcedPseudo(el, pseudo, () => getComputedStyle(el)[property]);

/* ----------------------------------------------------------------- stories */

/** The two types: insert adds a value to the field; prompt sends or fills text. */
export const Types = () => (
    <div style={row}>
        <Suggestion label="Relationships" onAccept={() => {}} />
        <Suggestion type="prompt" label="Summarize this session" onAccept={() => {}} />
    </div>
);

/**
 * Each type is a button, named for what pressing it does. An insert reads
 * "Add {label}, suggested"; a prompt is not added to anything, so it reads
 * "{label}, suggested". The glyph is decorative: a plus for insert, a sparkle
 * wand for prompt.
 */
Types.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const insert = canvas.getByRole('button', { name: 'Add Relationships, suggested' });
    const prompt = canvas.getByRole('button', { name: 'Summarize this session, suggested' });

    for (const [el, glyph] of [[insert, 'fa-plus'], [prompt, 'fa-wand-magic-sparkles']]) {
        const icon = el.querySelector('i');
        await expect(icon.getAttribute('aria-hidden')).toBe('true');
        await expect(icon.classList.contains(glyph), `${glyph} glyph`).toBe(true);
        await expect(el.getAttribute('type')).toBe('button');
    }
    await expect(SUGGESTION_TYPES).toEqual(['insert', 'prompt']);
};

/** Beside a Tag, in the row where an accepted value lands. */
export const InATagRow = () => (
    <div style={row} data-testid="row">
        <Tag color="blue" data-testid="tag">Algebra</Tag>
        <Suggestion label="Relationships" onAccept={() => {}} />
    </div>
);

/**
 * The same box as Tag: 22 tall with a 1px border, padding 4, radius 4, gap 4,
 * and the words on the same baseline, so the row reads as one line. The
 * border is dashed in Mastering Content's Border Subtle, and the words and
 * glyph are Mastering Content (Text).
 */
InATagRow.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByTestId('tag');
    const suggestion = canvas.getByRole('button', { name: 'Add Relationships, suggested' });
    const t = getComputedStyle(tag);
    const s = getComputedStyle(suggestion);

    await expect(px(s.height), 'is 22 tall').toBe(22);
    await expect(px(s.height), 'as tall as the Tag').toBe(px(t.height));
    for (const prop of ['paddingLeft', 'paddingRight', 'borderTopWidth', 'borderTopLeftRadius', 'columnGap']) {
        await expect(s[prop], `${prop} matches Tag`).toBe(t[prop]);
    }
    await expect(s.fontSize, 'same type size as Tag').toBe(t.fontSize);

    // Matching baseline: the two boxes line up, and so do the words in them.
    const tagBox = tag.getBoundingClientRect();
    const box = suggestion.getBoundingClientRect();
    await expect(box.top).toBeCloseTo(tagBox.top, 1);
    const tagWords = within(tag).getByText('Algebra').getBoundingClientRect();
    const words = within(suggestion).getByText('Relationships').getBoundingClientRect();
    await expect(words.bottom, 'the words share a baseline').toBeCloseTo(tagWords.bottom, 1);
    await expect(words.height).toBeCloseTo(tagWords.height, 1);

    await expect(s.borderTopStyle, 'dashed').toBe('dashed');
    await expect(s.borderTopColor)
        .toBe(tokenColor(canvasElement, '--color-mastering-content-border-subtle'));
    const ink = tokenColor(canvasElement, '--color-mastering-content-text');
    await expect(s.color, 'discovery-purple words').toBe(ink);
    await expect(getComputedStyle(suggestion.querySelector('i')).color, 'and glyph').toBe(ink);
    await expect(px(getComputedStyle(suggestion.querySelector('i')).fontSize), '12px glyph').toBe(12);
};

/** What each type hands back when it is pressed. */
export const Callbacks = {
    args: { onInsert: fn(), onPrompt: fn() },
    render: ({ onInsert, onPrompt }) => (
        <div style={row}>
            <Suggestion label="Relationships" value="focus-relationships" onAccept={onInsert} />
            <Suggestion label="Fractions" onAccept={onInsert} />
            <Suggestion
                type="prompt"
                label="Summarize"
                text="Summarize this session in three bullet points"
                onAccept={onPrompt}
            />
        </div>
    ),
};

/**
 * Insert calls back with the value, which defaults to the label; prompt calls
 * back with the text, which also defaults to the label. The keyboard presses
 * it like any button.
 */
Callbacks.play = async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Add Relationships, suggested' }));
    await expect(args.onInsert).toHaveBeenLastCalledWith('focus-relationships', expect.anything());

    await userEvent.click(canvas.getByRole('button', { name: 'Add Fractions, suggested' }));
    await expect(args.onInsert).toHaveBeenLastCalledWith('Fractions', expect.anything());

    const prompt = canvas.getByRole('button', { name: 'Summarize, suggested' });
    prompt.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPrompt).toHaveBeenLastCalledWith(
        'Summarize this session in three bullet points',
        expect.anything(),
    );
    await expect(args.onInsert).toHaveBeenCalledTimes(2);
    await expect(args.onPrompt).toHaveBeenCalledTimes(1);
};

/** Rest is outlined only; hover is the 08 state layer, pressed the 16. */
export const StateLayers = () => (
    <div style={row}>
        <Suggestion label="Relationships" onAccept={() => {}} />
        <Suggestion type="prompt" label="Summarize" onAccept={() => {}} />
    </div>
);

StateLayers.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const bg = 'backgroundColor';

    for (const name of ['Add Relationships, suggested', 'Summarize, suggested']) {
        const el = canvas.getByRole('button', { name });
        await expect(getComputedStyle(el)[bg], `${name}: rest has no fill`).toBe(CLEAR);
        await expect(whileForced(el, ':hover', bg), `${name}: hover 08`)
            .toBe(t('--color-mastering-content-state-08'));
        await expect(whileForced(el, ':active', bg), `${name}: pressed 16`)
            .toBe(t('--color-mastering-content-state-16'));
        // The box never moves between states.
        await expect(px(whileForced(el, ':active', 'height'))).toBe(22);
    }
};

/** Keyboard focus: a 2px Focus Ring 3px outside the dashed edge. */
export const FocusRing = () => (
    <div style={row}>
        <Suggestion label="Relationships" onAccept={() => {}} />
        <Suggestion type="prompt" label="Summarize" onAccept={() => {}} />
    </div>
);

FocusRing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--color-focus-ring');

    for (const name of ['Add Relationships, suggested', 'Summarize, suggested']) {
        await userEvent.tab();
        const el = canvas.getByRole('button', { name });
        await expect(el).toHaveFocus();
        const s = getComputedStyle(el);
        await expect(s.outlineStyle, name).toBe('solid');
        await expect(px(s.outlineWidth), `${name}: 2px ring`).toBe(2);
        await expect(px(s.outlineOffset), `${name}: 3px outside the edge`).toBe(3);
        await expect(s.outlineColor, name).toBe(ring);
        // Focus is a ring, not a fill: the dashed edge and clear ground stay.
        await expect(s.borderTopStyle).toBe('dashed');
        await expect(s.backgroundColor).toBe(CLEAR);
    }
};

/**
 * Accepting an insert suggestion: the field adds a Tag with the value and drops
 * the suggestion, so the value lands in the row where it was offered.
 */
export const AcceptIntoTags = () => {
    const [tags, setTags] = useState(['Algebra', 'Advocacy']);
    const [offered, setOffered] = useState(['Relationships', 'Fractions']);
    const accept = (value) => {
        setTags((prev) => [...prev, value]);
        setOffered((prev) => prev.filter((v) => v !== value));
    };
    return (
        <TagGroup>
            {tags.map((t) => (
                <Tag key={t} color="blue" data-testid={`tag-${t}`}>{t}</Tag>
            ))}
            {offered.map((v) => (
                <Suggestion key={v} label={v} onAccept={accept} />
            ))}
        </TagGroup>
    );
};

AcceptIntoTags.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('tag-Relationships')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Add Relationships, suggested' }));

    await expect(canvas.getByTestId('tag-Relationships')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Add Relationships, suggested' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Add Fractions, suggested' })).toBeInTheDocument();
};

/** Change the props in the docs playground. */
export const Interactive = {
    args: {
        label: 'Relationships',
        type: 'insert',
        onAccept: fn(),
    },
    argTypes: {
        type: { control: 'inline-radio', options: SUGGESTION_TYPES },
        label: { control: 'text' },
        value: { control: 'text' },
        text: { control: 'text' },
    },
};
