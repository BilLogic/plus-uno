import React, { useState } from 'react';
import { Button, Heading } from '@/components';
import { expect, spyOn, userEvent, within } from 'storybook/test';

import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';

import CompetencyTag, { COMPETENCY_TAG_SPACINGS, COMPETENCY_TAG_SUBJECTS } from './CompetencyTag';
import { expectGroundUnder, expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';

/**
 * `CompetencyTag` — a competency area, as a thin wrapper on Tag.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Colors are compared against the token they should
 * resolve to, read through a probe element.
 */

export default {
    title: 'Components/Labels/Tag/Competency tag',
    component: CompetencyTag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'A competency area. The subject fixes the Tag color and the leading icon.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--grid-gutter)', alignItems: 'center' };

const iconIn = (el) => el.querySelector('i');

/** The glyph a Font Awesome solid class draws, read through a probe icon. */
const glyphOf = (host, iconClass) => {
    const probe = document.createElement('i');
    probe.className = `fa-solid ${iconClass}`;
    host.appendChild(probe);
    const glyph = getComputedStyle(probe, '::before').content;
    probe.remove();
    return glyph;
};

/** Each subject's fixed icon, for the assertion below. */
const SUBJECT_ICON = {
    'social-emotional': 'fa-heart',
    'mastering-content': 'fa-book',
    advocacy: 'fa-bullhorn',
    relationship: 'fa-handshake',
    'technology-tools': 'fa-laptop-code',
};

/** Each subject's fixed accent color, mirroring `TAG_COLOR_OF_CURRICULUM`. */
const SUBJECT_COLOR = {
    'social-emotional': 'orange',
    'mastering-content': 'teal',
    advocacy: 'lime',
    relationship: 'magenta',
    'technology-tools': 'brown',
};

/** One of each subject, with its fixed color and icon. */
export const Overview = () => (
    <div style={row}>
        {COMPETENCY_TAG_SUBJECTS.map((subject) => (
            <CompetencyTag key={subject} subject={subject} data-testid={subject} />
        ))}
    </div>
);
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);

    for (const subject of COMPETENCY_TAG_SUBJECTS) {
        const el = canvas.getByTestId(subject);
        const color = SUBJECT_COLOR[subject];
        await expect(px(getComputedStyle(el).height), `${subject} is 20 tall`).toBe(20);
        await expect(getComputedStyle(el).borderColor, `${subject} border`).toBe(token(`--ds-border-accent-${color}-subtle`));

        const glyph = iconIn(el);
        await expect(glyph, `${subject} has an icon`).not.toBeNull();
        await expect(getComputedStyle(glyph, '::before').content, `${subject} icon`)
            .toBe(glyphOf(canvasElement, SUBJECT_ICON[subject]));
        await expect(glyph).toHaveAttribute('aria-hidden', 'true');
    }
};

/** `children` or `text` overrides the subject's default label. */
export const CustomLabel = () => (
    <div style={row}>
        <CompetencyTag subject="mastering-content" data-testid="default" />
        <CompetencyTag subject="mastering-content" text="Mastering fractions" data-testid="text" />
        <CompetencyTag subject="advocacy" data-testid="children">Self-advocacy</CompetencyTag>
    </div>
);
CustomLabel.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('default')).toHaveTextContent('Mastering content');
    await expect(canvas.getByTestId('text')).toHaveTextContent('Mastering fractions');
    await expect(canvas.getByTestId('children')).toHaveTextContent('Self-advocacy');
};

/** Tag's own props pass straight through: here, `isSelected` and `isRemovable`. */
export const PassesThroughTagProps = () => {
    const [selected, setSelected] = useState(false);
    const [removed, setRemoved] = useState(false);
    return (
        <div style={row}>
            <CompetencyTag
                subject="technology-tools"
                isSelected={selected}
                onClick={() => setSelected((v) => !v)}
                data-testid="selectable"
            />
            {!removed && (
                <CompetencyTag
                    subject="advocacy"
                    isRemovable
                    onAfterRemoveAction={() => setRemoved(true)}
                    data-testid="removable"
                />
            )}
        </div>
    );
};
PassesThroughTagProps.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByTestId('selectable');
    await expect(tag.tagName, 'isSelected makes it a button').toBe('BUTTON');
    await expect(tag).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(tag);
    await expect(tag).toHaveAttribute('aria-pressed', 'true');

    const removable = canvas.getByTestId('removable');
    const remove = within(removable).getByRole('button', { name: /remove/i });
    await userEvent.click(remove);
    await expect(canvas.queryByTestId('removable')).toBeNull();
};

/** An unknown subject falls back to social-emotional, with a development warning. */
export const UnknownSubjectFallsBack = () => {
    const [mounted, setMounted] = useState(false);
    return (
        <div style={row}>
            <CompetencyTag subject="social-emotional" data-testid="default" />
            <Button onClick={() => setMounted(true)}>Mount an unknown subject</Button>
            {mounted && <CompetencyTag subject="chemistry" data-testid="unknown" />}
        </div>
    );
};
UnknownSubjectFallsBack.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount an unknown subject' }));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('falls back to social-emotional'));
        const fallback = canvas.getByTestId('unknown');
        const reference = canvas.getByTestId('default');
        await expect(getComputedStyle(fallback).borderColor).toBe(getComputedStyle(reference).borderColor);
        await expect(fallback).toHaveTextContent('Social-emotional');
    } finally {
        warn.mockRestore();
    }
};

/** `spacing="spacious"` draws 32 beside a heading, with 14/20 text and a 16 icon. */
export const BesideHeading = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--inline-md)' }}>
        <Heading size="large">Mastering linear equations</Heading>
        <CompetencyTag subject="mastering-content" spacing="spacious" data-testid="spacious" />
    </div>
);
BesideHeading.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole('heading', { name: 'Mastering linear equations' });
    const el = canvas.getByTestId('spacious');
    const s = getComputedStyle(el);

    await expect(px(s.height), 'spacious CompetencyTag is 32 tall').toBe(32);
    await expect(px(s.borderTopLeftRadius), 'spacious uses control-md radius 8').toBe(8);
    await expect(px(s.fontSize), 'spacious text is 14').toBe(14);
    await expect(px(getComputedStyle(iconIn(el)).fontSize), 'spacious icon is 16').toBe(16);
    await expect(el.getBoundingClientRect().left, 'sits beside the heading').toBeGreaterThanOrEqual(
        heading.getBoundingClientRect().right,
    );
};

/* -------------------------------------------------------------- playground */

/** Interactive playground. */
export const Interactive = {
    args: {
        subject: 'mastering-content',
        spacing: 'default',
        text: '',
    },
    argTypes: {
        subject: { control: 'select', options: COMPETENCY_TAG_SUBJECTS },
        spacing: { control: 'radio', options: COMPETENCY_TAG_SPACINGS },
    },
    render: ({ text, ...args }) => <CompetencyTag {...args} text={text || undefined} />,
};

/* ------------------------------------------------------------------- states */

/** Rest: a competency tag is a Tag, so on its own it is a span with its subject's hue on the border. */
export const Rest = {
    render: () => <CompetencyTag subject="mastering-content" data-testid="competency" />,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByTestId('competency');
        await expect(el.tagName).toBe('SPAN');
        await expect(getComputedStyle(el).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-accent-teal-subtle'));
        await expect(el).not.toHaveAttribute('tabindex');
    },
};

/** Hovered: nothing, until it is selectable; then the subject's subtlest step. */
export const Hovered = {
    render: () => (
        <div style={row}>
            <CompetencyTag subject="mastering-content" data-testid="competency" />
            <CompetencyTag subject="advocacy" isSelected={false} data-testid="selectable" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNoStateChange(canvas.getByTestId('competency'), ':hover', 'CompetencyTag');
        await expectGroundUnder(canvasElement, canvas.getByTestId('selectable'), ':hover', '--ds-background-accent-lime-subtlest', 'selectable');
    },
};

/** Pressed: nothing, until it is selectable; then the subtlest pressed step. */
export const Pressed = {
    render: () => (
        <div style={row}>
            <CompetencyTag subject="mastering-content" data-testid="competency" />
            <CompetencyTag subject="advocacy" isSelected={false} data-testid="selectable" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNoStateChange(canvas.getByTestId('competency'), ':active', 'CompetencyTag');
        await expectGroundUnder(canvasElement, canvas.getByTestId('selectable'), ':active', '--ds-background-accent-lime-subtlest-pressed', 'selectable');
    },
};

/** Focused: the plain tag is skipped; a selectable one takes the 2px ring. */
export const Focused = {
    render: () => (
        <div style={row}>
            <CompetencyTag subject="mastering-content" data-testid="competency" />
            <CompetencyTag subject="advocacy" isSelected={false} data-testid="selectable" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotAControl(canvas.getByTestId('competency'), 'CompetencyTag');
        await expectFocusRing(canvasElement, canvas.getByTestId('selectable'), 'selectable CompetencyTag');
    },
};

/** Disabled: the disabled ground and words, as any Tag. */
export const Disabled = {
    render: () => <CompetencyTag subject="mastering-content" isSelected={false} isDisabled data-testid="competency" />,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByTestId('competency');
        await expect(el).toBeDisabled();
        await expectGroundUnder(canvasElement, el, undefined, '--ds-background-disabled', 'disabled');
        await expect(getComputedStyle(el).color).toBe(tokenColor(canvasElement, '--ds-text-disabled'));
    },
};
