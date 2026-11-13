import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, TextField } from '@/components';
import { ModeCompare, Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import { expect } from 'storybook/test';
import { applyColorModes, resolveColorScheme } from '@/storybook-docs/lib/color-modes.js';
import { emulateColorPreferences } from '@/storybook-docs/lib/test-viewport.js';
import figmaSpec from '../tokens/color/figma-spec.json';
import { iconClass } from '../lib/icon';

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
    gap: 'var(--stack-lg)',
});

/** One token drawn as what it paints: a fill, a line, a glyph or a word. */
const Swatch = ({ token, kind = 'background', on }) => {
    const box = {
        height: 'var(--row-height-md)',
        borderRadius: 'var(--radius-lg)',
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
        sample = <i className={iconClass('calendar-days')} aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', color: `var(${token})` }} />;
    } else if (kind === 'border') {
        box.boxShadow = `inset 0 0 0 var(--border-selected) var(${token})`;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', minWidth: 0 }}>
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
    padding: '0 var(--pad-x-md)',
    borderRadius: 'var(--radius-control-md)',
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
                padding: 'var(--card-pad-default)',
                borderRadius: 'var(--card-radius)',
                background: 'var(--ds-surface-raised)',
                boxShadow: 'var(--ds-shadow-raised)',
            }}
        >
            <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>Session with Maya</span>
            <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Tuesday, June 3 · 11:00 am</span>
            <span style={{ display: 'inline-flex', gap: 'var(--inline-md)', flexWrap: 'wrap' }}>
                <span style={{ font: 'var(--body-small)', padding: '0 var(--pad-x-xs)', borderRadius: 'var(--radius-md)', background: 'var(--ds-background-success)', color: 'var(--ds-text-success)' }}>Confirmed</span>
                <span style={{ font: 'var(--body-small)', padding: '0 var(--pad-x-xs)', borderRadius: 'var(--radius-md)', background: 'var(--ds-background-warning)', color: 'var(--ds-text-warning)' }}>Reflection due</span>
            </span>
            <span style={{ font: 'var(--body-default)', color: 'var(--ds-link)', textDecoration: 'underline' }}>View the lesson plan</span>
            <span style={{ display: 'inline-flex', gap: 'var(--inline-md)' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {STATUSES.map((role) => (
                <div key={role} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--inline-md)' }}>
                    {[
                        [`--ds-background-${role}`, `--ds-text-${role}`, 'default'],
                        [`--ds-background-${role}-subtler`, `--ds-text-${role}-bolder`, 'subtler'],
                        [`--ds-background-${role}-subtle`, `--ds-text-${role}-bolder`, 'subtle'],
                        [`--ds-background-${role}-bold`, role === 'warning' ? '--ds-text-warning-inverse' : '--ds-text-inverse', 'bold'],
                    ].map(([bg, fg, step]) => (
                        <div key={bg} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', minWidth: 0 }}>
                            <div style={{ height: 'var(--row-height-md)', display: 'flex', alignItems: 'center', padding: '0 var(--pad-x-sm)', borderRadius: 'var(--radius-lg)', background: `var(${bg})`, color: `var(${fg})`, font: 'var(--body-default)' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {SMART.map(([key, title]) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--inline-md)', alignItems: 'center' }}>
                    <span style={{ font: 'var(--body-default)', padding: '0 var(--pad-x-xs)', borderRadius: 'var(--radius-md)', background: `var(--ds-background-smart-${key})`, color: `var(--ds-text-smart-${key})`, boxShadow: `inset 0 0 0 var(--border-default) var(--ds-border-smart-${key})`, justifySelf: 'start' }}>
                        {title}
                    </span>
                    <div aria-hidden="true" style={{ height: 'var(--row-height-sm)', borderRadius: 'var(--radius-full)', background: `var(--ds-background-smart-${key}-subtle)` }} />
                    <div aria-hidden="true" style={{ height: 'var(--row-height-sm)', borderRadius: 'var(--radius-lg)', background: `var(--ds-background-smart-${key}-bold)` }} />
                </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--inline-md)' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', minWidth: 0 }}>
            <div style={{ height: 'var(--row-height-lg)', display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', padding: '0 var(--pad-x-md)', borderRadius: 'var(--radius-lg)', background: `var(${bg})`, color: isLine ? 'var(--ds-text)' : `var(${fg})`, boxShadow: isLine ? `inset 0 0 0 var(--border-selected) var(${fg})` : 'none', font: 'var(--body-default)' }}>
                <span ref={ref} aria-hidden="true" style={{ display: 'inline-flex', width: 'var(--icon-md)', height: 'var(--icon-md)', borderRadius: 'var(--radius-full)', background: `var(${fg})` }} />
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
    padding: 'var(--card-pad-compact)',
    borderRadius: 'var(--card-radius-compact)',
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
                <span><Button text="Join session" appearance="primary" /></span>
            </div>
        </Do>
        <Dont caption="Running text in the brand color. Nothing reads as the action any more, and links look like plain text.">
            <div style={sample}>
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-brand)' }}>Your next session starts in 10 minutes.</span>
                <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-brand)' }}>Maya joined the waiting room.</span>
                <span><Button text="Join session" appearance="primary" /></span>
            </div>
        </Dont>
    </DoDont>
);

/** Words take the role's text token, never its fill. */
export const TextTokenForWords = () => (
    <DoDont>
        <Do caption={<>A warning written in <C>--ds-text-warning</C> on <C>--ds-background-warning</C>.</>}>
            <div style={{ ...sample, boxShadow: 'none', background: 'var(--ds-background-warning)' }}>
                <span style={{ display: 'inline-flex', gap: 'var(--inline-md)', alignItems: 'center', font: 'var(--body-default)', color: 'var(--ds-text-warning)' }}>
                    <i className={iconClass('triangle-exclamation')} aria-hidden="true" style={{ color: 'var(--ds-icon-warning)', fontSize: 'var(--icon-md)' }} />
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
            <div style={{ outline: 'var(--border-focused) solid var(--ds-border-focused)', outlineOffset: 'var(--border-focused)', borderRadius: 'var(--radius-control-md)' }}>
                <TextField id="color-focus-do" label="Student name" isLabelHidden placeholder="Search students" />
            </div>
        </Do>
        <Dont caption="Focus shown by tinting the field. A fill reads as selected or hovered, and keyboard users lose their place.">
            <div style={{ borderRadius: 'var(--radius-control-md)', background: 'var(--ds-background-selected)' }}>
                <TextField id="color-focus-dont" label="Student name" isLabelHidden placeholder="Search students" />
            </div>
        </Dont>
    </DoDont>
);

/**
 * The generated color tokens in every color and contrast mode.
 *
 * WHAT THIS PAGE IS. A handful of `--ds-*` roles drawn as swatches, each with
 * the value the page resolves for it right now, so a mode switched from the
 * toolbar (Color mode, Contrast) shows up here at once. The values are read
 * from the page at render time and again whenever <html> changes mode, never
 * restated.
 *
 * HOW THE MODES ARE SET. Attributes on <html>: `data-color-mode` (light, dark,
 * auto) and `data-contrast-mode` (more, no-preference, auto). No attribute
 * means light at standard contrast. `auto` follows the OS's
 * `prefers-color-scheme` and `prefers-contrast`. The decorator in
 * `.storybook/preview.jsx` sets them from the toolbar through
 * `applyColorModes`.
 *
 * WHAT THE PLAY FUNCTIONS HOLD.
 *   - Modes: every color role resolves to the Plan A primitive the generated
 *     Figma spec names for it, in light, dark, light and dark at more
 *     contrast; each role changes where the plan says it does; no attribute
 *     is light; and, inside the test runner, `auto` lands on the right mode
 *     under each OS preference Playwright emulates.
 *   - FromToolbar: the toolbar globals, through the real decorator, put the
 *     right two attributes on <html>, and the tokens follow them.
 * Each restores the attributes and the emulation when it is done, so the a11y
 * check and later story files see the page as the toolbar left it.
 */


/**
 * The roles drawn and tested — one entry per role. `dark` and `more` say
 * whether the role's value moves from standard light in dark and at more
 * contrast; `spec` says the role is a plain color whose value the generated
 * Figma spec names, so its exact value is checked.
 */
const TOKENS = [
    { name: '--ds-text', dark: true, more: true, spec: true },
    { name: '--ds-surface', dark: true, more: false, spec: true },
    { name: '--ds-surface-raised', dark: true, more: false, spec: true },
    { name: '--ds-shadow-raised', dark: true, more: true, spec: false },
    { name: '--ds-surface-overlay', dark: true, more: false, spec: true },
    { name: '--ds-shadow-overlay', dark: true, more: true, spec: false },
    { name: '--ds-background-brand-bold', dark: true, more: true, spec: true },
    { name: '--ds-border-focused', dark: true, more: true, spec: true },
];
const NAMES = TOKENS.map((t) => t.name);

const MODE_ATTRIBUTES = ['data-color-mode', 'data-contrast-mode'];

const readToken = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const readAll = () => Object.fromEntries(NAMES.map((name) => [name, readToken(name)]));

/** Sets both mode attributes; `null` removes one. */
const setModes = (colorMode, contrastMode) => {
    const root = document.documentElement;
    [colorMode, contrastMode].forEach((value, i) => {
        if (value === null) root.removeAttribute(MODE_ATTRIBUTES[i]);
        else root.setAttribute(MODE_ATTRIBUTES[i], value);
    });
};

/** Re-reads the tokens whenever <html> changes mode or the OS preference moves. */
const useResolvedTokens = () => {
    const [values, setValues] = useState(readAll);
    const [modes, setModesLabel] = useState('');
    useEffect(() => {
        const refresh = () => {
            const root = document.documentElement;
            setValues(readAll());
            setModesLabel(
                MODE_ATTRIBUTES.map((a) => `${a}="${root.getAttribute(a) ?? '(none)'}"`).join(' '),
            );
        };
        refresh();
        const observer = new MutationObserver(refresh);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: MODE_ATTRIBUTES });
        const queries = ['(prefers-color-scheme: dark)', '(prefers-contrast: more)'].map((q) => window.matchMedia(q));
        queries.forEach((q) => q.addEventListener('change', refresh));
        return () => {
            observer.disconnect();
            queries.forEach((q) => q.removeEventListener('change', refresh));
        };
    }, []);
    return { values, modes };
};

const swatchBase = {
    minHeight: 'var(--space-300)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--pad-x-md)',
    display: 'flex',
    alignItems: 'center',
    font: 'var(--body-default)',
};

const SWATCHES = [
    {
        label: 'Text on surface',
        tokens: ['--ds-text', '--ds-surface'],
        style: { color: 'var(--ds-text)', background: 'var(--ds-surface)', border: 'var(--stroke-1) solid var(--ds-border)' },
    },
    {
        label: 'Raised surface',
        tokens: ['--ds-surface-raised', '--ds-shadow-raised'],
        style: { color: 'var(--ds-text)', background: 'var(--ds-surface-raised)', boxShadow: 'var(--ds-shadow-raised)' },
    },
    {
        label: 'Overlay surface',
        tokens: ['--ds-surface-overlay', '--ds-shadow-overlay'],
        style: { color: 'var(--ds-text)', background: 'var(--ds-surface-overlay)', boxShadow: 'var(--ds-shadow-overlay)' },
    },
    {
        label: 'Brand, bold',
        tokens: ['--ds-background-brand-bold'],
        style: { color: 'var(--ds-text-inverse)', background: 'var(--ds-background-brand-bold)' },
    },
    {
        label: 'Focused border',
        tokens: ['--ds-border-focused'],
        style: { color: 'var(--ds-text)', background: 'var(--ds-surface)', outline: 'var(--stroke-2) solid var(--ds-border-focused)', outlineOffset: 'var(--stroke-2)' },
    },
];

export const Modes = () => {
    const { values, modes } = useResolvedTokens();
    return (
        <div
            style={{
                background: 'var(--ds-surface)',
                color: 'var(--ds-text)',
                padding: 'var(--space-100)',
                display: 'grid',
                gap: 'var(--space-100)',
                font: 'var(--body-default)',
            }}
        >
            <p style={{ margin: 0, color: 'var(--ds-text-subtle)' }}>
                <code>{modes}</code>
            </p>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))',
                    gap: 'var(--space-100)',
                }}
            >
                {SWATCHES.map(({ label, tokens, style }) => (
                    <figure key={label} style={{ margin: 0, display: 'grid', gap: 'var(--stack-md)' }}>
                        <div style={{ ...swatchBase, ...style }}>{label}</div>
                        <figcaption style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                            {tokens.map((name) => (
                                <div key={name} style={{ overflowWrap: 'anywhere' }}>
                                    <code>{name}</code>: <span data-token={name}>{values[name]}</span>
                                </div>
                            ))}
                        </figcaption>
                    </figure>
                ))}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------- tests */

/** The four Figma modes, keyed by the attributes that select each. */
const SPEC_MODES = {
    'Light': ['light', 'no-preference'],
    'Dark': ['dark', 'no-preference'],
    'Light IC': ['light', 'more'],
    'Dark IC': ['dark', 'more'],
};

/** `#rrggbb` from the spec's 0–1 channels. */
const toHex = ({ r, g, b }) =>
    `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;

/**
 * The value the generated Figma spec gives a role in a mode: the role's alias
 * in `color / foundations`, resolved through `color / primitives`. Read from
 * the generated file at test time, so a regenerated plan is what is checked.
 */
const specValue = (name, mode) => {
    const [primitives, foundations] = ['color / primitives', 'color / foundations']
        .map((n) => figmaSpec.collections.find((c) => c.name === n));
    const role = foundations.variables.find((v) => v.codeSyntax?.WEB === `var(${name})`);
    if (!role) throw new Error(`figma-spec.json has no role for ${name}`);
    const alias = role.values[mode];
    const primitive = primitives.variables.find((v) => v.name === alias.name);
    if (!primitive) throw new Error(`figma-spec.json has no primitive ${alias.name}`);
    return toHex(primitive.value);
};

const valuesIn = (colorMode, contrastMode) => {
    setModes(colorMode, contrastMode);
    return readAll();
};

/** Restores the mode attributes as they were, whatever `run` did. */
const keepingModes = async (run) => {
    const root = document.documentElement;
    const attributes = MODE_ATTRIBUTES;
    const saved = attributes.map((a) => root.getAttribute(a));
    try {
        await run();
    } finally {
        attributes.forEach((a, i) => {
            if (saved[i] === null) root.removeAttribute(a);
            else root.setAttribute(a, saved[i]);
        });
    }
};

/** Runs `run`, then puts the OS preferences back; skips outside the runner. */
const withEmulation = async (run) => {
    if (!(await emulateColorPreferences(null, null))) return;
    try {
        await run();
    } finally {
        await emulateColorPreferences(null, null);
    }
};

Modes.play = async () => keepingModes(async () => {
    const byMode = Object.fromEntries(
        Object.entries(SPEC_MODES).map(([mode, [color, contrast]]) => [mode, valuesIn(color, contrast)]),
    );
    const light = byMode.Light;

    // Exact values: each color role is the primitive the plan names for it.
    for (const [mode, values] of Object.entries(byMode)) {
        for (const { name, spec } of TOKENS) {
            await expect(values[name], `${name} resolves in ${mode}`).not.toBe('');
            if (spec) await expect(values[name], `${name} in ${mode}`).toBe(specValue(name, mode));
        }
    }

    await expect(valuesIn(null, null), 'no attribute is light at standard contrast').toEqual(light);

    // Where each role moves.
    for (const { name, dark, more } of TOKENS) {
        const darkMoves = byMode.Dark[name] !== light[name];
        const moreMoves = byMode['Light IC'][name] !== light[name];
        await expect(darkMoves, `${name} ${dark ? 'changes' : 'holds'} between light and dark`).toBe(dark);
        await expect(moreMoves, `${name} ${more ? 'changes' : 'holds'} between light and light, more contrast`).toBe(more);
    }

    // `auto` under each OS preference.
    await withEmulation(async () => {
        await emulateColorPreferences('dark', 'no-preference');
        await expect(valuesIn('auto', 'no-preference'), 'auto, OS dark: dark').toEqual(byMode.Dark);
        await expect(valuesIn('auto', 'auto'), 'auto/auto, OS dark standard: dark').toEqual(byMode.Dark);
        await emulateColorPreferences('light', 'no-preference');
        await expect(valuesIn('auto', 'no-preference'), 'auto, OS light: light').toEqual(light);
        await emulateColorPreferences('light', 'more');
        await expect(valuesIn('light', 'auto'), 'contrast auto, OS more: more').toEqual(byMode['Light IC']);
        await expect(valuesIn('auto', 'auto'), 'auto/auto, OS light more: light more').toEqual(byMode['Light IC']);
        await emulateColorPreferences('dark', 'more');
        await expect(valuesIn('auto', 'auto'), 'auto/auto, OS dark more: dark more').toEqual(byMode['Dark IC']);
    });
});

/** The modes as the toolbar sets them: these globals go through the real decorator. */
export const FromToolbar = () => <Modes />;
FromToolbar.globals = { plusColorMode: 'dark', plusContrastMode: 'more' };

const attributesOnRoot = () => {
    const root = document.documentElement;
    return MODE_ATTRIBUTES.map((a) => root.getAttribute(a));
};

FromToolbar.play = async () => {
    // Set by the decorator from this story's globals, before render.
    await expect(attributesOnRoot(), 'the toolbar globals reach <html>').toEqual(['dark', 'more']);
    await expect(readToken('--ds-text'), 'and the tokens follow').toBe(specValue('--ds-text', 'Dark IC'));

    await keepingModes(async () => {
        applyColorModes('light', 'no-preference');
        await expect(attributesOnRoot(), 'light').toEqual(['light', 'no-preference']);
        await withEmulation(async () => {
            await emulateColorPreferences('dark', null);
            applyColorModes('auto', 'auto');
            await expect(attributesOnRoot(), 'auto').toEqual(['auto', 'auto']);
            await expect(resolveColorScheme('auto'), 'auto under OS dark').toBe('dark');
            await emulateColorPreferences('light', null);
            await expect(resolveColorScheme('auto'), 'auto under OS light').toBe('light');
        });
    });
};
