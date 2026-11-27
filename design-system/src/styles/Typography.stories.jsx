import React from 'react';
import { expect } from 'storybook/test';
import { Button, Heading, StatusTag } from '@/components';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';
import { typeStyle } from '@/storybook-docs/lib/type-style.js';

/**
 * Specimens for Foundations/Typography. Each specimen takes its text style
 * through `typeStyle` (the `font` token and its `-tracking` companion), so a
 * change to a size, line height, family, weight or tracking shows here without
 * touching this file. Specimens are spans, not headings, so the docs
 * page keeps one heading outline.
 */
export default {
    title: 'Foundations/Visual/Typography',
    tags: ['!dev', '!autodocs'],
};

const meta = { ...typeStyle('body-sm'), color: 'var(--ds-text-subtle)' };

const LEVELS = [
    ['Page title', '--heading-xxl', 'Heading/xxlarge · 32 · the page’s one h1'],
    ['Section title', '--heading-md', 'Heading/medium · 20 · h2'],
    ['Subsection title', '--heading-sm', 'Heading/small · 16 · h3'],
    ['Modal title', '--heading-md', 'Heading/medium · 20 · the modal’s h1, named by aria-labelledby'],
    ['Card, popup and flag title', '--heading-xs', 'Heading/xsmall · 14 · one level below its section'],
    ['Table head', '--heading-xxs', 'Heading/xxsmall · 12 · a head cell, never a heading'],
    ['Group label', '--label-eyebrow', 'Label/eyebrow · 12 · a menu group, a select-list group, a Sidebar section or a stat label, never a heading'],
];

/** Which style each kind of title takes. */
export const HeadingLevels = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
        {LEVELS.map(([name, token, note]) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <span style={{ font: `var(${token})`, letterSpacing: `var(${token}-tracking)`, textTransform: token === '--label-eyebrow' ? 'uppercase' : undefined, color: 'var(--ds-text)' }}>{name}</span>
                <span style={meta}>{note}</span>
            </div>
        ))}
    </div>
);

/** Code/default sets code, token names and values. */
export const CodeStyle = () => (
    <p style={{ margin: 0, ...typeStyle('body-default'), color: 'var(--ds-text)' }}>
        Pad a card with <C>--card-pad</C>: the code span takes 0.875em of the text around it, in Google Sans Code.
    </p>
);

/** Code/small sets a position or range in a recording and a version. */
export const CodeSmallStyle = () => (
    <p style={{ margin: 0, ...typeStyle('body-default'), color: 'var(--ds-text)' }}>
        Flag at <span className="code-sm">22:48</span>, range <span className="code-sm">0:30 – 5:10</span>, model <span className="code-sm">gemini-2.5-pro</span>.
    </p>
);

const Outline = ({ sizes }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <span style={{ ...typeStyle(sizes[0].slice(2)), color: 'var(--ds-text)' }}>Sessions</span>
        <span style={{ ...typeStyle(sizes[1].slice(2)), color: 'var(--ds-text)' }}>This week</span>
        <span style={{ ...typeStyle(sizes[2].slice(2)), color: 'var(--ds-text)' }}>Upcoming</span>
        <span style={{ ...typeStyle('body-default'), color: 'var(--ds-text-subtle)' }}>Three sessions are scheduled before Friday.</span>
    </div>
);

/** Step one size per nesting level. */
export const OneStepPerLevel = () => (
    <DoDont>
        <Do caption="Page 32, section 20, subsection 16: one step per level.">
            <Outline sizes={['--heading-xxl', '--heading-md', '--heading-sm']} />
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
            <Dont caption="Regular or bold weight, or a heading style, on a button or tab label."><RegularOrBoldDontFigure /></Dont>
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
            <Do caption="One line with an ellipsis; the StatusTag keeps its place."><OneLineWithDoFigure /></Do>
            <Dont caption="The name wraps onto extra lines and makes the row taller than its neighbors."><TheNameWrapsDontFigure /></Dont>
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
                <Heading as="h3" size="sm">Next session</Heading>
            </Do>
            <Dont caption="Bold body text looks like a heading but carries no structure."><BoldBodyTextDontFigure /></Dont>
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
            <Do caption="h1, then h2, then h3."><H1ThenH2DoFigure /></Do>
            <Dont caption="An h3 straight after the h1 skips the h2."><AnH3StraightDontFigure /></Dont>
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
            <Do caption="Metric/large for the figure."><MetricLargeForDoFigure /></Do>
            <Dont caption="Heading/medium for a number."><HeadingMediumForDontFigure /></Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByText('1,284')).toHaveLength(2);
    },
};

const RegularOrBoldDontFigure = () => (
    <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--inline-md)' }}>
            <Button appearance="primary">
                <span style={{ ...typeStyle('body-default'), fontWeight: 'var(--type-weight-regular)' }}>Save changes</span>
            </Button>
            <Button appearance="primary">
                <span style={{ ...typeStyle('heading-sm') }}>Save changes</span>
            </Button>
        </div>
    </>
);

const OneLineWithDoFigure = () => (
    <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', maxWidth: 'var(--card-min-width-md)' }}>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...typeStyle('body-default'), fontWeight: 'var(--type-weight-medium)' }}>
                Alexandria Montgomery-Hernandez, Lincoln Middle
            </span>
            <StatusTag appearance="success">Active</StatusTag>
        </div>
    </>
);

const TheNameWrapsDontFigure = () => (
    <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', maxWidth: 'var(--card-min-width-md)' }}>
            <span style={{ flex: 1, minWidth: 0, ...typeStyle('body-default'), fontWeight: 'var(--type-weight-medium)' }}>
                Alexandria Montgomery-Hernandez, Lincoln Middle
            </span>
            <StatusTag appearance="success">Active</StatusTag>
        </div>
    </>
);

const BoldBodyTextDontFigure = () => (
    <>
        <span style={{ ...typeStyle('body-default'), fontWeight: 'var(--type-weight-semibold)' }}>Next session</span>
    </>
);

const H1ThenH2DoFigure = () => (
    <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                <C>h1</C> <Heading as="span" size="xxl">Tutor dashboard</Heading>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                <C>h2</C> <Heading as="span" size="md">Upcoming sessions</Heading>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                <C>h3</C> <Heading as="span" size="sm">Grade 6 math</Heading>
            </span>
        </div>
    </>
);

const AnH3StraightDontFigure = () => (
    <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                <C>h1</C> <Heading as="span" size="xxl">Tutor dashboard</Heading>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--inline-md)' }}>
                <C>h3</C> <Heading as="span" size="sm">Grade 6 math</Heading>
            </span>
        </div>
    </>
);

const MetricLargeForDoFigure = () => (
    <>
        <div>
            <span style={{ ...typeStyle('metric-lg'), color: 'var(--ds-text)' }}>1,284</span>
            <div style={{ ...typeStyle('body-sm'), color: 'var(--ds-text-subtle)' }}>Sessions this month</div>
        </div>
    </>
);

const HeadingMediumForDontFigure = () => (
    <>
        <div>
            <Heading as="span" size="md">1,284</Heading>
            <div style={{ ...typeStyle('body-sm'), color: 'var(--ds-text-subtle)' }}>Sessions this month</div>
        </div>
    </>
);
