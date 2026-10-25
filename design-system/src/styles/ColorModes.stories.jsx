import React, { useEffect, useState } from 'react';
import { Dropdown, Form, Modal, Toast } from 'react-bootstrap';
import { expect } from 'storybook/test';

import { applyColorModes } from '@/storybook-docs/lib/color-modes.js';
import { emulateColorPreferences } from '@/storybook-docs/lib/test-viewport.js';
import figmaSpec from '../tokens/color/figma-spec.json';

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
 *   - BootstrapBridge: react-bootstrap's Modal, Dropdown, Toast and form
 *     controls paint the `--ds-*` roles in light and dark, and every `*-rgb`
 *     triplet the bridge writes is its role's color in all four modes.
 * Each restores the attributes and the emulation when it is done, so the a11y
 * check and later story files see the page as the toolbar left it.
 */

export default {
    title: 'Foundations/Color modes',
    tags: ['!dev', '!autodocs'],
};

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
    borderRadius: 'var(--size-element-radius-lg)',
    padding: 'var(--size-element-pad-x-md)',
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
                    <figure key={label} style={{ margin: 0, display: 'grid', gap: 'var(--size-element-gap-sm)' }}>
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
 * react-bootstrap as Bootstrap ships it, with no PLUS styling: the generated
 * bridge points Bootstrap's root `--bs-*` variables at the `--ds-*` roles, so
 * these follow the color and contrast modes from the toolbar.
 */
export const BootstrapBridge = () => (
    <div
        data-testid="bootstrap-bridge"
        style={{
            background: 'var(--ds-surface)',
            color: 'var(--ds-text)',
            padding: 'var(--size-spacing-medium-space-300)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
            gap: 'var(--size-spacing-medium-space-300)',
            alignItems: 'start',
        }}
    >
        <div className="modal position-static d-block" style={{ height: 'auto' }}>
            <Modal.Dialog className="m-0">
                <Modal.Header closeButton>
                    <Modal.Title as="h2" className="fs-5">Modal</Modal.Title>
                </Modal.Header>
                <Modal.Body>The dialog surface, body text and border.</Modal.Body>
            </Modal.Dialog>
        </div>
        <Dropdown.Menu show className="position-static">
            <Dropdown.ItemText>Dropdown</Dropdown.ItemText>
            <Dropdown.Item href="#">An item</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item href="#">Another item</Dropdown.Item>
        </Dropdown.Menu>
        <Toast>
            <Toast.Header closeButton={false}>
                <strong className="me-auto">Toast</strong>
            </Toast.Header>
            <Toast.Body>Over the body background at 85%.</Toast.Body>
        </Toast>
        <Form>
            <Form.Group className="mb-3" controlId="bridge-text">
                <Form.Label>Text input</Form.Label>
                <Form.Control placeholder="Placeholder" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="bridge-select">
                <Form.Label>Select</Form.Label>
                <Form.Select defaultValue="one">
                    <option value="one">One</option>
                    <option value="two">Two</option>
                </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="bridge-invalid">
                <Form.Label>Invalid input</Form.Label>
                <Form.Control isInvalid defaultValue="Wrong" />
                <Form.Control.Feedback type="invalid">The danger text role.</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="bridge-disabled">
                <Form.Label>Disabled input</Form.Label>
                <Form.Control disabled defaultValue="Disabled" />
            </Form.Group>
            <Form.Check id="bridge-check" label="Checkbox" defaultChecked />
        </Form>
    </div>
);

/** Each `*-rgb` triplet the bridge writes, and the role it must match. */
const BRIDGE_TRIPLETS = {
    '--bs-body-bg-rgb': '--ds-surface',
    '--bs-body-color-rgb': '--ds-text',
    '--bs-link-color-rgb': '--ds-link',
    '--bs-link-hover-color-rgb': '--ds-link-pressed',
    '--bs-primary-rgb': '--ds-background-brand-bold',
    '--bs-danger-rgb': '--ds-background-danger-bold',
    '--bs-success-rgb': '--ds-background-success-bold',
    '--bs-warning-rgb': '--ds-background-warning-bold',
    '--bs-info-rgb': '--ds-background-information-bold',
    '--bs-light-rgb': '--ds-surface-sunken',
    '--bs-dark-rgb': '--ds-background-neutral-bold',
};

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
    // Bootstrap transitions a control's border color, so a read right after a
    // mode switch would land mid-fade.
    root.querySelectorAll('.form-control, .form-select').forEach((el) => { el.style.transition = 'none'; });
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
            await expect(style('.dropdown-item').color, `Dropdown item, ${mode}`).toBe(text);
            await expect(style('.toast').backgroundColor, `Toast, ${mode}`)
                .toBe(surface.replace('rgb(', 'rgba(').replace(')', ', 0.85)'));
            await expect(style('#bridge-text').backgroundColor, `input fill, ${mode}`).toBe(surface);
            await expect(style('#bridge-text').color, `input text, ${mode}`).toBe(text);
            await expect(style('#bridge-text').borderTopColor, `input border, ${mode}`).toBe(resolve('var(--ds-border)'));
            await expect(style('#bridge-disabled').backgroundColor, `disabled input, ${mode}`).toBe(resolve('var(--ds-background-neutral)'));
            await expect(style('.invalid-feedback').color, `invalid feedback, ${mode}`).toBe(resolve('var(--ds-text-danger)'));
            await expect(document.documentElement.getAttribute('data-bs-theme'), `data-bs-theme, ${mode}`).toBe(mode);
            painted[mode] = style('.modal-content').backgroundColor;
        }
        await expect(painted.dark, 'the modal changes surface between light and dark').not.toBe(painted.light);
    } finally {
        probe.remove();
    }
});
