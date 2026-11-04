import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, TextField } from '@/components';
import { ModeCompare, Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import { expect } from 'storybook/test';
import { applyColorModes } from '@/storybook-docs/lib/color-modes.js';
import { emulateColorPreferences } from '@/storybook-docs/lib/test-viewport.js';
import { BRIDGE_TRIPLETS } from '../../../scripts/lib/color/emit.mjs';
import figmaSpec from '../tokens/color/figma-spec.json';
import { contrast as contrastOf, parseColor } from '../lib/tokens.mjs';

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
        sample = <i className="fa-solid fa-calendar-days" aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', color: `var(${token})` }} />;
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
    borderRadius: 'var(--radius-h32)',
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
            <div style={{ outline: 'var(--border-focused) solid var(--ds-border-focused)', outlineOffset: 'var(--border-focused)', borderRadius: 'var(--radius-h32)' }}>
                <TextField id="color-focus-do" label="Student name" isLabelHidden placeholder="Search students" />
            </div>
        </Do>
        <Dont caption="Focus shown by tinting the field. A fill reads as selected or hovered, and keyboard users lose their place.">
            <div style={{ borderRadius: 'var(--radius-h32)', background: 'var(--ds-background-selected)' }}>
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
 * `applyColorModes`, plus Bootstrap's `data-bs-theme`.
 *
 * WHAT THE PLAY FUNCTIONS HOLD.
 *   - Modes: every color role resolves to the Plan A primitive the generated
 *     Figma spec names for it, in light, dark, light and dark at more
 *     contrast; each role changes where the plan says it does; no attribute
 *     is light; and, inside the test runner, `auto` lands on the right mode
 *     under each OS preference Playwright emulates.
 *   - FromToolbar: the toolbar globals, through the real decorator, put the
 *     right three attributes on <html>, and `applyColorModes` resolves
 *     `data-bs-theme` from the OS under auto.
 *   - BootstrapBridge: Bootstrap's modal, dropdown and form
 *     markup paints the `--ds-*` roles in light and dark, and every `*-rgb`
 *     triplet the bridge writes is its role's color in all four modes.
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
    minHeight: 'var(--size-spacing-large-space-800)',
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
        style: { color: 'var(--ds-text)', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)' },
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
        style: { color: 'var(--ds-text)', background: 'var(--ds-surface)', outline: '2px solid var(--ds-border-focused)', outlineOffset: '2px' },
    },
];

export const Modes = () => {
    const { values, modes } = useResolvedTokens();
    return (
        <div
            style={{
                background: 'var(--ds-surface)',
                color: 'var(--ds-text)',
                padding: 'var(--size-spacing-medium-space-300)',
                display: 'grid',
                gap: 'var(--size-spacing-medium-space-300)',
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
                    gap: 'var(--size-spacing-medium-space-300)',
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
    const attributes = [...MODE_ATTRIBUTES, 'data-bs-theme'];
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
    return ['data-color-mode', 'data-contrast-mode', 'data-bs-theme'].map((a) => root.getAttribute(a));
};

FromToolbar.play = async () => {
    // Set by the decorator from this story's globals, before render.
    await expect(attributesOnRoot(), 'the toolbar globals reach <html>').toEqual(['dark', 'more', 'dark']);
    await expect(readToken('--ds-text'), 'and the tokens follow').toBe(specValue('--ds-text', 'Dark IC'));

    await keepingModes(async () => {
        applyColorModes('light', 'no-preference');
        await expect(attributesOnRoot(), 'light').toEqual(['light', 'no-preference', 'light']);
        await withEmulation(async () => {
            await emulateColorPreferences('dark', null);
            applyColorModes('auto', 'auto');
            await expect(attributesOnRoot(), 'auto under OS dark').toEqual(['auto', 'auto', 'dark']);
            await emulateColorPreferences('light', null);
            applyColorModes('auto', 'auto');
            await expect(attributesOnRoot(), 'auto under OS light').toEqual(['auto', 'auto', 'light']);
        });
    });
};

/* --------------------------------------------------------- bootstrap bridge */

/**
 * Bootstrap's own markup, with no PLUS styling: the generated
 * bridge points Bootstrap's root `--bs-*` variables at the `--ds-*` roles, so
 * these follow the color and contrast modes from the toolbar.
 */
export const BootstrapBridge = () => (
    <div
        data-testid="bootstrap-bridge"
        style={{
            background: 'var(--ds-surface)',
            color: 'var(--ds-text)',
            padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
            gap: 'var(--size-card-gap-md)',
            alignItems: 'start',
        }}
    >
        <div className="modal position-static d-block" style={{ height: 'auto' }}>
            <div className="modal-dialog m-0">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title fs-5">Modal</h2>
                    </div>
                    <div className="modal-body">The dialog surface, body text and border.</div>
                </div>
            </div>
        </div>
        <div className="dropdown-menu show position-static">
            <span className="dropdown-item-text">Dropdown</span>
            <a className="dropdown-item" href="#">An item</a>
            <a className="dropdown-item active" href="#" aria-current="true">The active item</a>
            <hr className="dropdown-divider" />
            <a className="dropdown-item" href="#">Another item</a>
        </div>
        <form>
            <div className="mb-3">
                <label className="form-label" htmlFor="bridge-text">Text input</label>
                <input className="form-control" id="bridge-text" placeholder="Placeholder" />
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="bridge-select">Select</label>
                <select className="form-select" id="bridge-select" defaultValue="one">
                    <option value="one">One</option>
                    <option value="two">Two</option>
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="bridge-invalid">Invalid input</label>
                <input className="form-control is-invalid" id="bridge-invalid" defaultValue="Wrong" />
                <div className="invalid-feedback">The danger text role.</div>
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="bridge-disabled">Disabled input</label>
                <input className="form-control" id="bridge-disabled" disabled defaultValue="Disabled" />
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" id="bridge-check" defaultChecked />
                <label className="form-check-label" htmlFor="bridge-check">Checkbox</label>
            </div>
            <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" role="switch" id="bridge-switch" defaultChecked />
                <label className="form-check-label" htmlFor="bridge-switch">Switch</label>
            </div>
        </form>
    </div>
);

BootstrapBridge.play = async ({ canvasElement }) => keepingModes(async () => {
    const root = canvasElement.querySelector('[data-testid="bootstrap-bridge"]');
    const probe = document.createElement('span');
    root.append(probe);
    /** A CSS color as the browser computes it, so values compare as `rgb(…)` strings. */
    const resolve = (value) => {
        probe.style.color = value;
        return getComputedStyle(probe).color;
    };
    const style = (selector) => getComputedStyle(root.querySelector(selector));
    // Bootstrap transitions controls' colors, so a read right after a mode
    // switch would land mid-fade.
    root.querySelectorAll('.form-control, .form-select, .form-check-input, .dropdown-item').forEach((el) => { el.style.transition = 'none'; });
    const painted = {};
    try {
        for (const [mode, [color, contrast]] of Object.entries(SPEC_MODES)) {
            applyColorModes(color, contrast);
            for (const [triplet, role] of Object.entries(BRIDGE_TRIPLETS)) {
                await expect(resolve(`rgb(var(${triplet}))`), `${triplet} in ${mode}`).toBe(resolve(`var(${role})`));
            }
        }
        for (const mode of ['light', 'dark']) {
            applyColorModes(mode, 'no-preference');
            const surface = resolve('var(--ds-surface)');
            const text = resolve('var(--ds-text)');
            await expect(style('.modal-content').backgroundColor, `Modal surface, ${mode}`).toBe(surface);
            await expect(style('.modal-body').color, `Modal text, ${mode}`).toBe(text);
            await expect(style('.dropdown-menu').backgroundColor, `Dropdown surface, ${mode}`).toBe(surface);
            await expect(style('.dropdown-item:not(.active)').color, `Dropdown item, ${mode}`).toBe(text);
            await expect(style('#bridge-text').backgroundColor, `input fill, ${mode}`).toBe(surface);
            await expect(style('#bridge-text').color, `input text, ${mode}`).toBe(text);
            await expect(style('#bridge-text').borderTopColor, `input border, ${mode}`).toBe(resolve('var(--ds-border)'));
            await expect(style('#bridge-disabled').backgroundColor, `disabled input, ${mode}`).toBe(resolve('var(--ds-surface-hovered)'));
            await expect(style('.invalid-feedback').color, `invalid feedback, ${mode}`).toBe(resolve('var(--ds-text-danger)'));
            const selectedBold = resolve('var(--ds-background-selected-bold)');
            await expect(style('#bridge-check').backgroundColor, `checked checkbox fill, ${mode}`).toBe(selectedBold);
            await expect(style('#bridge-check').borderTopColor, `checked checkbox border, ${mode}`).toBe(selectedBold);
            await expect(style('#bridge-switch').backgroundColor, `checked switch fill, ${mode}`).toBe(selectedBold);
            await expect(style('.dropdown-item.active').backgroundColor, `active dropdown item, ${mode}`).toBe(resolve('var(--ds-background-selected)'));
            await expect(style('.dropdown-item.active').color, `active dropdown text, ${mode}`).toBe(resolve('var(--ds-text-selected)'));
            const input = root.querySelector('#bridge-text');
            input.focus();
            const focused = getComputedStyle(input);
            await expect(focused.outlineColor, `focus ring, ${mode}`).toBe(resolve('var(--ds-border-focused)'));
            await expect([focused.outlineStyle, focused.outlineWidth, focused.outlineOffset], `focus ring shape, ${mode}`).toEqual(['solid', '2px', '2px']);
            await expect(focused.boxShadow, `no glow, ${mode}`).toBe('none');
            await expect(focused.borderTopColor, `focused border, ${mode}`).toBe(resolve('var(--ds-border)'));
            input.blur();
            await expect(document.documentElement.getAttribute('data-bs-theme'), `data-bs-theme, ${mode}`).toBe(mode);
            painted[mode] = style('.modal-content').backgroundColor;
        }
        await expect(painted.dark, 'the modal changes surface between light and dark').not.toBe(painted.light);
    } finally {
        probe.remove();
    }
});

/**
 * What each intent color is FOR — the role layer, and the measurement it came
 * from.
 *
 * WHAT THIS PAGE IS. The evidence behind
 * `design-system/src/tokens/_color_roles.scss`, laid out so the argument can be
 * checked rather than taken. Every ratio below is computed from the tokens as
 * this page renders them, so it cannot describe a palette that has moved on.
 *
 * THE FINDING. All seven intents carry the same nine tokens — a base, a
 * container, a `-text`, six state overlays — which names two roles and uses
 * three. There is no `--color-warning-border` and no `--color-warning-icon`, so
 * an intent-colored stroke or glyph reaches for the BASE, which is also the
 * ground. `_colors.scss` says as much in a comment beside the value ("for
 * borders/backgrounds"); a comment cannot enforce anything, and 108
 * declarations in this repository set a foreground from an intent base.
 *
 * WHY IT MATTERS MORE THAN #312 SUGGESTED. #312 found one failure, warning
 * filled at 3.70:1. Measured across the five surface steps this system actually
 * ships, the base is worse than that: `--color-warning` fails 4.5:1 on every
 * ground including white, `--color-tertiary` and `--color-info` fail on four of
 * five, and `--color-primary` fails on the two darkest. Every `--color-*-text`
 * token clears 4.5:1 on all five.
 *
 * THE ROLE LAYER: `color.text` 49 tokens, `color.icon` 23 and
 * `color.border` 39 — three namespaces, because an icon and a
 * border are held to 3:1 under WCAG 1.4.11 where text is held to 4.5:1. Naming
 * the role is what lets a value be chosen against the right bar.
 *
 * AND 3:1 IS A FLOOR, NOT A VALUE. The first version of the role layer gave
 * every `-icon` the base, since the base already clears 3:1. Binding the tokens
 * to the real Alert component set in Figma showed what that would do: four of
 * its six variants already draw their icon from the `-text` color, and the
 * base-valued token would have LIGHTENED them — danger 6.7:1 down to 5.0:1,
 * warning 8.7:1 down to 5.0:1. Clearing the icon bar is not a reason to stop
 * clearing the text one, so `-icon` resolves to `-text` and exists as its own
 * name so an icon can be lightened DELIBERATELY later, against a written bar.
 * `-border` keeps the base, where 3:1 is the right bar: a border as dark as its
 * own label reads as a heavier component than it is.
 *
 * THE BORDERS ARE REPOINTED NOW. 111 of the 137 border declarations moved onto
 * `-border` on 2026-08-29, and `npm run check:intent-roles` keeps them there;
 * the warning edges followed on 2026-10-24, when warning's icon and border were
 * settled on #715c00, and what remains is recorded with a reason in
 * `scripts/baselines/intent-role-adoption.json`. Six of the seven roles alias their
 * base, so those 111 changed no pixel — what changed is that an edge now says
 * it is an edge, and the value can move for edges alone. The `-icon` roles
 * still have no users: an icon color is usually set by `color:` on a glyph,
 * which `check:text-contrast` already measures against the 4.5:1 bar.
 *
 * The sweep also found the role that was missing rather than unused. 25 focus
 * rings were left behind because a focus indicator is not a border, and
 * measuring them found 29 rules whose ring could not be seen at all — see
 * Foundations/Border, and `--color-focus-ring` beside these tokens.
 */

/* -------------------------------------------------------------- measuring */

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * The SAME contrast the checks fail the build on — `check:text-contrast`,
 * `check:button-contrast` and `check:focus-ring` all call this function, from
 * `design-system/src/lib/tokens.mjs` (#507). This story used to carry its own
 * copy of WCAG luminance, so the number a designer read here was computed by
 * different code from the number that gated the PR. One import, one answer.
 *
 * The adapter is only about SHAPE: everything below speaks in `#rrggbb`, the
 * module in `{r, g, b, a}`.
 */
const contrast = (a, b) => contrastOf(parseColor(a), parseColor(b));

/** Read a token as it renders, following aliases the way the browser does. */
const readIntentToken = (name) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return null;
    if (raw.startsWith('#')) {
        return raw.length === 4
            ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
            : raw;
    }
    const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(raw);
    if (!rgb) return null;
    return `#${rgb.slice(1, 4).map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}`;
};

/** WCAG: text 4.5:1 (1.4.3); icons, borders and other non-text 3:1 (1.4.11). */
const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

const INTENTS = ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'info'];

/** The surface ladder every one of these colors has to survive. */
const GROUNDS = [
    ['lowest', '--color-surface-container-lowest'],
    ['low', '--color-surface-container-low'],
    ['container', '--color-surface-container'],
    ['high', '--color-surface-container-high'],
    ['highest', '--color-surface-container-highest'],
];

const grounds = () => GROUNDS.map(([label, token]) => [label, readIntentToken(token)]).filter(([, hex]) => hex);

/** `{intent, role, hex, ratios: [{ground, ratio, passes}]}` for one token. */
const measure = (intent, role, bar) => {
    const hex = readIntentToken(role === 'base' ? `--color-${intent}` : `--color-${intent}-${role}`);
    if (!hex) return null;
    return {
        intent,
        role,
        hex,
        bar,
        ratios: grounds().map(([ground, bg]) => {
            const ratio = contrast(hex, bg);
            return { ground, ratio, passes: ratio >= bar };
        }),
    };
};

/* ---------------------------------------------------------------- drawing */

const Cell = ({ ratio, passes }) => (
    <td
        style={{
            padding: '6px 10px',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            color: passes ? 'var(--ds-text)' : 'var(--color-danger-text)',
            fontWeight: passes ? 400 : 700,
        }}
    >
        {ratio.toFixed(2)}
        {passes ? '' : ' ✗'}
    </td>
);

const Matrix = ({ rows, bar, caption }) => (
    <table style={{ borderCollapse: 'collapse', margin: '0 0 28px' }}>
        <caption className="body2-txt" style={{ textAlign: 'left', padding: '0 0 8px' }}>
            {caption} — the bar is {bar}:1.
        </caption>
        <thead>
            <tr>
                <th className="body2-txt" style={{ textAlign: 'left', padding: '6px 10px' }}>
                    token
                </th>
                {GROUNDS.map(([label]) => (
                    <th key={label} className="body2-txt" style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {label}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row) => (
                <tr key={`${row.intent}-${row.role}`} style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                    <th
                        className="body2-txt"
                        style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 400 }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                marginRight: '8px',
                                borderRadius: '2px',
                                background: row.hex,
                            }}
                        />
                        <code>
                            --color-{row.intent}
                            {row.role === 'base' ? '' : `-${row.role}`}
                        </code>
                    </th>
                    {row.ratios.map((r) => (
                        <Cell key={r.ground} {...r} />
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

/* ----------------------------------------------------------------- story */

export const RolesAndBars = () => {
    const base = INTENTS.map((i) => measure(i, 'base', AA_TEXT)).filter(Boolean);
    const text = INTENTS.map((i) => measure(i, 'text', AA_TEXT)).filter(Boolean);
    const icon = INTENTS.map((i) => measure(i, 'icon', AA_NON_TEXT)).filter(Boolean);
    const border = INTENTS.map((i) => measure(i, 'border', AA_NON_TEXT)).filter(Boolean);

    return (
        <div style={{ maxWidth: '1000px', padding: '24px' }} data-testid="intent-roles">
            <h2 className="h4">What each intent color is for</h2>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                Every ratio is computed from the tokens as this page renders them, against the five
                surface steps the system ships. Nothing here has been repointed — the role tokens
                have no users yet.
            </p>

            <h3 className="h5" style={{ marginTop: '28px' }}>
                The base, used as text
            </h3>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                108 declarations in this repository set a foreground from a base token today.
                <code> --color-warning</code> fails on every ground including white;
                <code> --color-tertiary</code> and <code>--color-info</code> fail on four of five;
                <code> --color-primary</code> fails on the two darkest.
            </p>
            <Matrix rows={base} bar={AA_TEXT} caption="Base token as a foreground" />

            <h3 className="h5">The `-text` role</h3>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                Already in the system, and already correct: every one clears 4.5:1 on all five.
            </p>
            <Matrix rows={text} bar={AA_TEXT} caption="`-text` as a foreground" />

            <h3 className="h5">The new `-icon` and `-border` roles</h3>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                Held to 3:1 rather than 4.5:1 — WCAG 1.4.11, non-text contrast — but 3:1 is the
                floor an icon must reach, not the value it should take. Every <code>-icon</code>
                resolves to its <code>-text</code> color, which clears both bars on all five
                grounds; it exists as its own name so an icon can be lightened deliberately later,
                against a bar that is written down. Every <code>-border</code> keeps the base, where
                3:1 is the right bar.
                <strong> Warning is the exception</strong>: its base falls to 2.87:1 on the darkest
                ground, under even the border bar, so its <em>border</em> and its <em>icon</em> take
                <code> #715c00</code> — the value Figma records as <code>Warning/Warning Border</code>,
                which <code>Warning/Warning Icon</code> aliases. It measures 6.50:1 on white and
                5.02:1 on the darkest ground.
            </p>
            <Matrix rows={icon} bar={AA_NON_TEXT} caption="`-icon`" />
            <Matrix rows={border} bar={AA_NON_TEXT} caption="`-border`" />
        </div>
    );
};

RolesAndBars.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-testid="intent-roles"]')).not.toBe(null);

    /*
     * The page must be reading the real tokens. A page that fell back to
     * literals would keep rendering a palette that had moved on, which is the
     * failure mode this whole file exists to avoid.
     */
    for (const intent of INTENTS) {
        await expect(readIntentToken(`--color-${intent}`), `--color-${intent} is not defined`).not.toBe(null);
        await expect(readIntentToken(`--color-${intent}-icon`), `--color-${intent}-icon is not defined`).not.toBe(null);
        await expect(readIntentToken(`--color-${intent}-border`), `--color-${intent}-border is not defined`).not.toBe(null);
    }
    await expect(grounds().length, 'the surface ladder must resolve').toBe(GROUNDS.length);

    /*
     * The bars the role layer claims. These are the assertions that make the
     * file a promise rather than a description: an `-icon` or `-border` that
     * drops below 3:1 on ANY ground, or a `-text` below 4.5:1, fails here.
     */
    for (const intent of INTENTS) {
        for (const [role, bar] of [['icon', AA_NON_TEXT], ['border', AA_NON_TEXT], ['text', AA_TEXT]]) {
            const row = measure(intent, role, bar);
            for (const { ground, ratio } of row.ratios) {
                await expect(
                    ratio,
                    `--color-${intent}-${role} on surface-container-${ground} (${row.hex})`,
                ).toBeGreaterThanOrEqual(bar);
            }
        }
    }

    /*
     * And the marks on the base table have to be honest. Not "warning fails" —
     * that would go red on the day somebody fixes it, and a page that fails when
     * its subject is fixed is a page nobody keeps. This asserts only that what
     * is drawn as a failure IS one, in both directions.
     */
    for (const intent of INTENTS) {
        for (const { ground, ratio, passes } of measure(intent, 'base', AA_TEXT).ratios) {
            await expect(
                passes,
                `--color-${intent} on surface-container-${ground} is ${ratio.toFixed(2)} but marked ${passes ? 'passing' : 'failing'}`,
            ).toBe(ratio >= AA_TEXT);
        }
    }
};
