import React from 'react';
import { Button } from '@/components';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for Foundations/Typography. Each specimen sets `font` to its text
 * style token, so a change to a size, line height, family or weight shows here
 * without touching this file. Specimens are spans, not headings, so the docs
 * page keeps one heading outline.
 */
export default {
    title: 'Foundations/Typography',
    tags: ['!dev', '!autodocs'],
};

const SCALE = [
    ['Heading', 'xxlarge', '32/36', 'Tutors plan the week from here'],
    ['Heading', 'xlarge', '28/32', 'Tutors plan the week from here'],
    ['Heading', 'large', '24/28', 'Tutors plan the week from here'],
    ['Heading', 'medium', '20/24', 'Tutors plan the week from here'],
    ['Heading', 'small', '16/20', 'Tutors plan the week from here'],
    ['Heading', 'xsmall', '14/20', 'Tutors plan the week from here'],
    ['Heading', 'xxsmall', '12/16', 'Tutors plan the week from here'],
    ['Body', 'large', '16/24', 'Tutors plan the week from here'],
    ['Body', 'default', '14/20', 'Tutors plan the week from here'],
    ['Body', 'small', '12/16', 'Tutors plan the week from here'],
    ['Metric', 'large', '28/32', '1,284 sessions'],
    ['Metric', 'medium', '24/28', '1,284 sessions'],
    ['Metric', 'small', '16/20', '1,284 sessions'],
];

const meta = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const code = { font: 'var(--code)', color: 'var(--ds-text-subtle)' };

/** The live scale: seven Heading, three Body and three Metric styles. */
export const TypeScale = () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        {SCALE.map(([family, size, metrics, sample]) => {
            const token = `--${family.toLowerCase()}-${size}`;
            return (
                <div key={token} style={{ display: 'grid', gridTemplateColumns: 'minmax(var(--field-width-md), 1fr) 3fr', gap: 'var(--layout-gutter)', alignItems: 'baseline', padding: 'var(--element-stack-lg) 0', borderBottom: 'var(--border-default) solid var(--ds-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
                        <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{family}/{size} · {metrics}</span>
                        <span style={code}>var({token})</span>
                    </div>
                    <span style={{ font: `var(${token})`, color: 'var(--ds-text)' }}>{sample}</span>
                </div>
            );
        })}
    </div>
);

const LEVELS = [
    ['Page title', '--heading-large', 'Heading/large · 24 · the page’s one h1'],
    ['Section title', '--heading-medium', 'Heading/medium · 20 · h2'],
    ['Subsection title', '--heading-small', 'Heading/small · 16 · h3'],
    ['Modal title', '--heading-medium', 'Heading/medium · 20 · the dialog’s h1, named by aria-labelledby'],
    ['Card, popup and flag title', '--heading-xsmall', 'Heading/xsmall · 14 · one level below its section'],
    ['Group label', '--heading-xxsmall', 'Heading/xxsmall · 12 · a menu group or a head cell, never a heading'],
];

/** Which style each kind of title takes. */
export const HeadingLevels = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-lg)' }}>
        {LEVELS.map(([name, token, note]) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
                <span style={{ font: `var(${token})`, color: 'var(--ds-text)' }}>{name}</span>
                <span style={meta}>{note}</span>
            </div>
        ))}
    </div>
);

/** Code/default sets code, token names and values. */
export const CodeStyle = () => (
    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
        Pad a card with <C>--card-pad-md</C>: the code span takes 0.875em of the text around it, in Source Code Pro.
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
            <Outline sizes={['--heading-large', '--heading-medium', '--heading-small']} />
        </Do>
        <Dont caption="Sizes picked by feel: a hero size for the page, and a section smaller than its subsection.">
            <Outline sizes={['--heading-xxlarge', '--heading-xsmall', '--heading-medium']} />
        </Dont>
    </DoDont>
);

/** Button and tab labels are Body/default at the medium weight. */
export const LabelStyle = () => (
    <DoDont>
        <Do caption="Body/default with the medium weight on a button label, as every Button draws it.">
            <span><Button text="Save changes" style="primary" fill="filled" /></span>
        </Do>
        <Dont caption="A heading style on a button label. It changes the Item’s height and reads as a title.">
            <span><Button style="primary" fill="filled"><span style={{ font: 'var(--heading-medium)' }}>Save changes</span></Button></span>
        </Dont>
    </DoDont>
);
