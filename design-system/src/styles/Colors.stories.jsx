import React, { useLayoutEffect, useRef, useState } from 'react';
import { Button, Input } from '@/components';
import { ModeCompare, Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';

/**
 * Specimens for Foundations/Color. Every swatch paints a `--ds-*` token, and
 * the light and dark panes set their own color mode, so the page shows both
 * at once and follows the toolbar's Contrast switch.
 */
export default {
    title: 'Foundations/Color',
    tags: ['!dev', '!autodocs'],
};

const name = { font: 'var(--code)', color: 'var(--ds-text-subtle)', wordBreak: 'break-word' };
const label = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

const grid = () => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 'var(--element-stack-lg)',
});

/** One token drawn as what it paints: a fill, a line, a glyph or a word. */
const Swatch = ({ token, kind = 'background', on }) => {
    const box = {
        height: 'var(--row-height-md)',
        borderRadius: 'var(--element-radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ds-surface)',
        boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)',
    };
    let sample = null;
    if (kind === 'background' || kind === 'surface') {
        box.background = `var(${token})`;
        if (kind === 'surface') box.boxShadow = token.includes('raised') || token.includes('overlay')
            ? `var(${token.replace('surface', 'shadow').replace(/-(hovered|pressed)$/, '')})`
            : box.boxShadow;
        if (on) sample = <span style={{ font: 'var(--body-default)', color: `var(${on})` }}>Aa</span>;
    } else if (kind === 'text') {
        sample = <span style={{ font: 'var(--heading-small)', color: `var(${token})` }}>Aa</span>;
    } else if (kind === 'icon') {
        sample = <i className="fa-solid fa-calendar-days" aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', color: `var(${token})` }} />;
    } else if (kind === 'border') {
        box.boxShadow = `inset 0 0 0 var(--border-selected) var(${token})`;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)', minWidth: 0 }}>
            <div style={box}>{sample}</div>
            <span style={name}>{token}</span>
        </div>
    );
};

const Swatches = ({ tokens, kind, on }) => (
    <ModeCompare>
        <div style={grid()}>
            {tokens.map((t) => <Swatch key={t} token={t} kind={kind} on={on} />)}
        </div>
    </ModeCompare>
);

const action = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 'var(--item-height-md)',
    padding: '0 var(--element-pad-x-md)',
    borderRadius: 'var(--element-radius-item-md)',
    font: 'var(--body-default)',
    fontWeight: 'var(--type-weight-medium)',
};

/** The interface a tutor sees, drawn in both modes from the same tokens. */
export const Overview = () => (
    <ModeCompare>
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--card-stack-md)',
                padding: 'var(--card-pad-md)',
                borderRadius: 'var(--card-radius)',
                background: 'var(--ds-surface-raised)',
                boxShadow: 'var(--ds-shadow-raised)',
            }}
        >
            <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>Session with Maya</span>
            <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Tuesday, June 3 · 11:00 am</span>
            <span style={{ display: 'inline-flex', gap: 'var(--element-inline-md)', flexWrap: 'wrap' }}>
                <span style={{ font: 'var(--body-small)', padding: '0 var(--element-pad-x-xs)', borderRadius: 'var(--element-radius-md)', background: 'var(--ds-background-success)', color: 'var(--ds-text-success)' }}>Confirmed</span>
                <span style={{ font: 'var(--body-small)', padding: '0 var(--element-pad-x-xs)', borderRadius: 'var(--element-radius-md)', background: 'var(--ds-background-warning)', color: 'var(--ds-text-warning)' }}>Reflection due</span>
            </span>
            <span style={{ font: 'var(--body-default)', color: 'var(--ds-link)', textDecoration: 'underline' }}>View the lesson plan</span>
            <span style={{ display: 'inline-flex', gap: 'var(--element-inline-md)' }}>
                <span style={{ ...action, background: 'var(--ds-background-brand-bold)', color: 'var(--ds-text-inverse)' }}>Join session</span>
                <span style={{ ...action, background: 'var(--ds-background-neutral)', color: 'var(--ds-text)' }}>Reschedule</span>
            </span>
        </div>
    </ModeCompare>
);

export const TextRoles = () => (
    <Swatches kind="text" tokens={['--ds-text', '--ds-text-subtle', '--ds-text-subtlest', '--ds-text-brand', '--ds-link', '--ds-text-selected', '--ds-text-disabled', '--ds-text-danger', '--ds-text-warning', '--ds-text-success', '--ds-text-information', '--ds-text-discovery']} />
);

// The disabled sample sits under 4.5:1 by design: disabled text is exempt.
TextRoles.parameters = { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } };

export const IconRoles = () => (
    <Swatches kind="icon" tokens={['--ds-icon', '--ds-icon-subtle', '--ds-icon-subtlest', '--ds-icon-brand', '--ds-icon-selected', '--ds-icon-disabled', '--ds-icon-danger', '--ds-icon-warning', '--ds-icon-success', '--ds-icon-information', '--ds-icon-discovery']} />
);

export const BorderRoles = () => (
    <Swatches kind="border" tokens={['--ds-border', '--ds-border-bold', '--ds-border-input', '--ds-border-focused', '--ds-border-selected', '--ds-border-brand', '--ds-border-disabled', '--ds-border-danger', '--ds-border-warning', '--ds-border-success', '--ds-border-information', '--ds-border-discovery']} />
);

export const BackgroundRoles = () => (
    <Swatches kind="background" tokens={['--ds-background-neutral-subtle', '--ds-background-neutral', '--ds-background-neutral-bold', '--ds-background-brand-subtlest', '--ds-background-brand-bold', '--ds-background-selected', '--ds-background-selected-bold', '--ds-background-input', '--ds-background-disabled', '--ds-blanket']} />
);

export const SurfaceRoles = () => (
    <Swatches kind="surface" tokens={['--ds-surface-sunken', '--ds-surface', '--ds-surface-raised', '--ds-surface-overlay', '--ds-surface-container']} />
);

const STATUSES = ['danger', 'warning', 'success', 'information', 'discovery'];

/** Each status role at its four emphasis levels, each with its partner text. */
export const StatusRoles = () => (
    <ModeCompare>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-lg)' }}>
            {STATUSES.map((role) => (
                <div key={role} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--element-inline-md)' }}>
                    {[
                        [`--ds-background-${role}`, `--ds-text-${role}`, 'default'],
                        [`--ds-background-${role}-subtler`, `--ds-text-${role}-bolder`, 'subtler'],
                        [`--ds-background-${role}-subtle`, `--ds-text-${role}-bolder`, 'subtle'],
                        [`--ds-background-${role}-bold`, role === 'warning' ? '--ds-text-warning-inverse' : '--ds-text-inverse', 'bold'],
                    ].map(([bg, fg, step]) => (
                        <div key={bg} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)', minWidth: 0 }}>
                            <div style={{ height: 'var(--row-height-md)', display: 'flex', alignItems: 'center', padding: '0 var(--element-pad-x-sm)', borderRadius: 'var(--element-radius-lg)', background: `var(${bg})`, color: `var(${fg})`, font: 'var(--body-default)' }}>
                                {role}
                            </div>
                            <span style={label}>{step}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    </ModeCompare>
);

const SMART = [
    ['social-emotional', 'Social-emotional'],
    ['mastering-content', 'Mastering content'],
    ['advocacy', 'Advocacy'],
    ['relationship', 'Relationship'],
    ['technology-tools', 'Technology tools'],
];

/** The five SMART subjects: chip fill, illustration body, bold fill, text and edge. */
export const SmartSubjects = () => (
    <ModeCompare>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-lg)' }}>
            {SMART.map(([key, title]) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--element-inline-md)', alignItems: 'center' }}>
                    <span style={{ font: 'var(--body-default)', padding: '0 var(--element-pad-x-xs)', borderRadius: 'var(--element-radius-md)', background: `var(--ds-background-smart-${key})`, color: `var(--ds-text-smart-${key})`, boxShadow: `inset 0 0 0 var(--border-default) var(--ds-border-smart-${key})`, justifySelf: 'start' }}>
                        {title}
                    </span>
                    <div aria-hidden="true" style={{ height: 'var(--row-height-sm)', borderRadius: 'var(--element-radius-full)', background: `var(--ds-background-smart-${key}-subtle)` }} />
                    <div aria-hidden="true" style={{ height: 'var(--row-height-sm)', borderRadius: 'var(--element-radius-lg)', background: `var(--ds-background-smart-${key}-bold)` }} />
                </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--element-inline-md)' }}>
                <span style={label}>chip: background, text, border</span>
                <span style={label}>illustration body: subtle</span>
                <span style={label}>bold fill</span>
            </div>
        </div>
    </ModeCompare>
);

const PAIRS = [
    { fg: '--ds-text', bg: '--ds-surface', bar: 4.5 },
    { fg: '--ds-text-subtle', bg: '--ds-surface-sunken', bar: 4.5 },
    { fg: '--ds-text-subtlest', bg: '--ds-surface-raised', bar: 4.5 },
    { fg: '--ds-text-inverse', bg: '--ds-background-brand-bold', bar: 4.5 },
    { fg: '--ds-text-danger', bg: '--ds-background-danger', bar: 4.5 },
    { fg: '--ds-text-warning-inverse', bg: '--ds-background-warning-bold', bar: 4.5 },
    { fg: '--ds-border-input', bg: '--ds-background-input', bar: 3 },
    { fg: '--ds-border-focused', bg: '--ds-surface', bar: 3 },
];

/** A pair, measured where it paints: the ratio is read from the rendered colors. */
const MeasuredPair = ({ fg, bg, bar }) => {
    const isLine = bar < 4.5;
    const ref = useRef(null);
    const [ratio, setRatio] = useState(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const measure = () => {
            const ground = getComputedStyle(el.parentElement).backgroundColor;
            setRatio(contrastRatio(getComputedStyle(el).backgroundColor, ground));
        };
        measure();
        const observer = new MutationObserver(measure);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-contrast-mode'] });
        return () => observer.disconnect();
    }, []);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)', minWidth: 0 }}>
            <div style={{ height: 'var(--row-height-lg)', display: 'flex', alignItems: 'center', gap: 'var(--element-inline-md)', padding: '0 var(--element-pad-x-md)', borderRadius: 'var(--element-radius-lg)', background: `var(${bg})`, color: isLine ? 'var(--ds-text)' : `var(${fg})`, boxShadow: isLine ? `inset 0 0 0 var(--border-selected) var(${fg})` : 'none', font: 'var(--body-default)' }}>
                <span ref={ref} aria-hidden="true" style={{ display: 'inline-flex', width: 'var(--icon-md)', height: 'var(--icon-md)', borderRadius: 'var(--element-radius-full)', background: `var(${fg})` }} />
                <span>{ratio ? `${ratio.toFixed(2)}:1` : ' '}</span>
            </div>
            <span style={name}>{fg}</span>
            <span style={label}>on <C>{bg}</C> · needs {bar}:1</span>
        </div>
    );
};

export const PartnerPairs = () => (
    <ModeCompare>
        <div style={grid()}>
            {PAIRS.map((p) => <MeasuredPair key={p.fg + p.bg} {...p} />)}
        </div>
    </ModeCompare>
);

const sample = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--card-stack-md)',
    padding: 'var(--card-pad-sm)',
    borderRadius: 'var(--card-radius-sm)',
    background: 'var(--ds-surface-raised)',
    boxShadow: 'var(--ds-shadow-raised)',
};

/** Accent colors belong to components; the words around them stay neutral. */
export const AccentOnComponents = () => (
    <DoDont>
        <Do caption={<>Body text in <C>--ds-text</C> and <C>--ds-text-subtle</C>. The brand color marks the button and the link only.</>}>
            <div style={sample}>
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text)' }}>Your next session starts in 10 minutes.</span>
                <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>Maya joined the waiting room.</span>
                <span><Button text="Join session" style="primary" fill="filled" /></span>
            </div>
        </Do>
        <Dont caption="Running text in the brand color. Nothing reads as the action any more, and links look like plain text.">
            <div style={sample}>
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-brand)' }}>Your next session starts in 10 minutes.</span>
                <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-brand)' }}>Maya joined the waiting room.</span>
                <span><Button text="Join session" style="primary" fill="filled" /></span>
            </div>
        </Dont>
    </DoDont>
);

/** Words take the role's text token, never its fill. */
export const TextTokenForWords = () => (
    <DoDont>
        <Do caption={<>A warning written in <C>--ds-text-warning</C> on <C>--ds-background-warning</C>.</>}>
            <div style={{ ...sample, boxShadow: 'none', background: 'var(--ds-background-warning)' }}>
                <span style={{ display: 'inline-flex', gap: 'var(--element-inline-md)', alignItems: 'center', font: 'var(--body-default)', color: 'var(--ds-text-warning)' }}>
                    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" style={{ color: 'var(--ds-icon-warning)', fontSize: 'var(--icon-md)' }} />
                    Two reflections are due today.
                </span>
            </div>
        </Do>
        <Dont caption={<>The same words in the bold warning fill, <C>--ds-background-warning-bold</C>. A fill is a ground, and as text it falls well under 4.5:1.</>}>
            <div style={sample}>
                <span aria-hidden="true" style={{ font: 'var(--body-default)', color: 'var(--ds-background-warning-bold)' }}>
                    Two reflections are due today.
                </span>
            </div>
        </Dont>
    </DoDont>
);

// The Don't draws text below 4.5:1 to show the failure.
TextTokenForWords.parameters = { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } };

/** Focus is a ring in `--ds-border-focused`, never a fill. */
export const FocusIsARing = () => (
    <DoDont>
        <Do caption={<>A 2px ring in <C>--ds-border-focused</C>, 2px outside the field. The fill stays as it was.</>}>
            <div style={{ outline: 'var(--border-focused) solid var(--ds-border-focused)', outlineOffset: 'var(--border-focused)', borderRadius: 'var(--element-radius-item-md)' }}>
                <Input id="color-focus-do" label="Student name" showLabel={false} placeholder="Search students" />
            </div>
        </Do>
        <Dont caption="Focus shown by tinting the field. A fill reads as selected or hovered, and keyboard users lose their place.">
            <div style={{ borderRadius: 'var(--element-radius-item-md)', background: 'var(--ds-background-selected)' }}>
                <Input id="color-focus-dont" label="Student name" showLabel={false} placeholder="Search students" />
            </div>
        </Dont>
    </DoDont>
);
