import React from 'react';
import { expect } from 'storybook/test';
import { Button, Heading, StatusTag } from '@/components';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for Foundations/Typography. Each specimen sets `font` to its text
 * style token, so a change to a size, line height, family or weight shows here
 * without touching this file. Specimens are spans, not headings, so the docs
 * page keeps one heading outline.
 */
export default {
    title: 'Foundations/Visual/Typography',
    tags: ['!dev', '!autodocs'],
};

const meta = { font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' };

const LEVELS = [
    ['Page title', '--heading-lg', 'Heading/large · 24 · the page’s one h1'],
    ['Section title', '--heading-md', 'Heading/medium · 20 · h2'],
    ['Subsection title', '--heading-sm', 'Heading/small · 16 · h3'],
    ['Modal title', '--heading-md', 'Heading/medium · 20 · the modal’s h1, named by aria-labelledby'],
    ['Card, popup and flag title', '--heading-xs', 'Heading/xsmall · 14 · one level below its section'],
    ['Group label', '--heading-xxs', 'Heading/xxsmall · 12 · a menu group or a head cell, never a heading'],
];

/** Which style each kind of title takes. */
export const HeadingLevels = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
        {LEVELS.map(([name, token, note]) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <span style={{ font: `var(${token})`, color: 'var(--ds-text)' }}>{name}</span>
                <span style={meta}>{note}</span>
            </div>
        ))}
    </div>
);

/** Code/default sets code, token names and values. */
export const CodeStyle = () => (
    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
        Pad a card with <C>--card-pad-default</C>: the code span takes 0.875em of the text around it, in Noto Sans Mono.
    </p>
);

const Outline = ({ sizes }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-sm)' }}>
        <span style={{ font: `var(${sizes[0]})`, color: 'var(--ds-text)' }}>Sessions</span>
        <span style={{ font: `var(${sizes[1]})`, color: 'var(--ds-text)' }}>This week</span>
        <span style={{ font: `var(${sizes[2]})`, color: 'var(--ds-text)' }}>Upcoming</span>
        <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Three sessions are scheduled before Friday.</span>
    </div>
);

/** Step one size per nesting level. */
export const OneStepPerLevel = () => (
    <DoDont>
        <Do caption="Page 24, section 20, subsection 16: one step per level.">
            <Outline sizes={['--heading-lg', '--heading-md', '--heading-sm']} />
        </Do>
        <Dont caption="Sizes picked by feel: a hero size for the page, and a section smaller than its subsection.">
            <Outline sizes={['--heading-xxl', '--heading-xs', '--heading-md']} />
        </Dont>
    </DoDont>
);

/** Button and tab labels are Body/default at the medium weight. */
export const LabelStyle = {
    render: () => (
        <DoDont>
            <Do caption="Body/default/medium on a button or tab label.">
                <span><Button text="Save changes" appearance="primary" /></span>
            </Do>
            <Dont caption="Regular or bold weight, or a heading style, on a button or tab label.">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--inline-md)' }}>
                    <Button appearance="primary">
                        <span style={{ font: 'var(--body-default)', fontWeight: 'var(--type-weight-regular)' }}>Save changes</span>
                    </Button>
                    <Button appearance="primary">
                        <span style={{ font: 'var(--heading-sm)' }}>Save changes</span>
                    </Button>
                </div>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('button', { name: 'Save changes' })).toHaveLength(3);
    },
};

/** Names and titles truncate to one line while StatusTag keeps its place. */
export const TruncateName = {
    render: () => (
        <DoDont>
            <Do caption="One line with an ellipsis. The StatusTag keeps its place.">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', maxWidth: 'var(--card-min-width-md)' }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: 'var(--body-default)', fontWeight: 'var(--type-weight-medium)' }}>
                        Alexandria Montgomery-Hernandez, Lincoln Middle
                    </span>
                    <StatusTag appearance="success">Active</StatusTag>
                </div>
            </Do>
            <Dont caption="The name wraps onto extra lines and makes the row taller than its neighbors.">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', maxWidth: 'var(--card-min-width-md)' }}>
                    <span style={{ flex: 1, minWidth: 0, font: 'var(--body-default)', fontWeight: 'var(--type-weight-medium)' }}>
                        Alexandria Montgomery-Hernandez, Lincoln Middle
                    </span>
                    <StatusTag appearance="success">Active</StatusTag>
                </div>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByText('Active')).toHaveLength(2);
    },
};

/** Introduce a section with Heading rather than bold body text. */
export const HeadingStyleOverBold = {
    render: () => (
        <DoDont>
            <Do caption="Heading/small, tagged as the section's heading.">
                <Heading as="h3" size="small">Next session</Heading>
            </Do>
            <Dont caption="Bold body text looks like a heading but carries no structure.">
                <span style={{ font: 'var(--body-default)', fontWeight: 'var(--type-weight-semibold)' }}>Next session</span>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('heading', { level: 3, name: 'Next session' })).toBeInTheDocument();
        await expect(canvas.getAllByText('Next session')).toHaveLength(2);
    },
};

/** Step down one heading level at a time. */
export const StepHeadingLevels = {
    render: () => (
        <DoDont>
            <Do caption="h1, then h2, then h3.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                        <C>h1</C> <Heading as="span" size="large">Tutor dashboard</Heading>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                        <C>h2</C> <Heading as="span" size="medium">Upcoming sessions</Heading>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                        <C>h3</C> <Heading as="span" size="small">Grade 6 math</Heading>
                    </span>
                </div>
            </Do>
            <Dont caption="An h3 straight after the h1 skips the h2.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                        <C>h1</C> <Heading as="span" size="large">Tutor dashboard</Heading>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                        <C>h3</C> <Heading as="span" size="small">Grade 6 math</Heading>
                    </span>
                </div>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByText('Tutor dashboard')).toHaveLength(2);
    },
};

/** Metric styles use tabular figures; headings do not. */
export const MetricNumbers = {
    render: () => (
        <DoDont>
            <Do caption="Metric/large for the figure.">
                <div>
                    <span style={{ font: 'var(--metric-lg)', fontVariantNumeric: 'tabular-nums', color: 'var(--ds-text)' }}>1,284</span>
                    <div style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>Sessions this month</div>
                </div>
            </Do>
            <Dont caption="Heading/medium for a number.">
                <div>
                    <Heading as="span" size="medium">1,284</Heading>
                    <div style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>Sessions this month</div>
                </div>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByText('1,284')).toHaveLength(2);
    },
};
