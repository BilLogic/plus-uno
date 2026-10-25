import React, { useEffect, useState } from 'react';
import { expect } from 'storybook/test';

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
 * `.storybook/preview.jsx` sets them from the toolbar, plus Bootstrap's
 * `data-bs-theme`.
 *
 * WHAT THE PLAY FUNCTION HOLDS. That dark and increased contrast each resolve
 * different values from light, that no attribute is light, and, inside the
 * test runner, that `auto` lands on light or dark and on standard or more
 * contrast with the OS preference Playwright emulates. It restores the
 * attributes and the emulation when it is done, so the a11y check and later
 * story files see the page as the toolbar left it.
 */

export default {
    title: 'Foundations/Color modes',
    tags: ['!dev', '!autodocs'],
};

/** The roles drawn, and the ones the play function compares across modes. */
const TOKENS = [
    '--ds-text',
    '--ds-surface',
    '--ds-surface-raised',
    '--ds-shadow-raised',
    '--ds-surface-overlay',
    '--ds-shadow-overlay',
    '--ds-background-brand-bold',
    '--ds-border-focused',
];

const MODE_ATTRIBUTES = ['data-color-mode', 'data-contrast-mode'];

const readToken = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const readAll = () => Object.fromEntries(TOKENS.map((name) => [name, readToken(name)]));

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
            <p style={{ margin: 0, color: 'var(--ds-text-subtle)' }} data-testid="modes">
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

/** True only inside the Vitest browser runner, where Playwright can set OS preferences. */
const inTestRunner = () => import.meta.env.MODE === 'test' && window.__vitest_browser__ === true;

/** Sets the emulated OS color scheme and contrast; `null` restores each. */
const emulate = async (colorScheme, contrast) => {
    const commands = window.__vitest_browser_runner__?.commands;
    if (!commands) {
        throw new Error(
            'emulateColorPreferences: the Vitest runner handle (window.__vitest_browser_runner__.commands) '
            + 'is missing. Check it against the installed Vitest version.',
        );
    }
    await commands.triggerCommand('emulateColorPreferences', [colorScheme, contrast]);
};

const valuesIn = (colorMode, contrastMode) => {
    setModes(colorMode, contrastMode);
    return readAll();
};

/** Every token resolves to something, in every mode. */
const expectResolved = async (values, mode) => {
    for (const [name, value] of Object.entries(values)) {
        await expect(value, `${name} resolves in ${mode}`).not.toBe('');
    }
};

/** Names the tokens whose value differs between two readings. */
const changed = (a, b) => TOKENS.filter((name) => a[name] !== b[name]);

Modes.play = async () => {
    const root = document.documentElement;
    const saved = MODE_ATTRIBUTES.map((a) => root.getAttribute(a));
    try {
        const none = valuesIn(null, null);
        const light = valuesIn('light', 'no-preference');
        const lightMore = valuesIn('light', 'more');
        const dark = valuesIn('dark', 'no-preference');
        const darkMore = valuesIn('dark', 'more');

        await expectResolved(light, 'light');
        await expectResolved(dark, 'dark');
        await expectResolved(lightMore, 'light, more contrast');
        await expectResolved(darkMore, 'dark, more contrast');

        await expect(none, 'no attribute is light at standard contrast').toEqual(light);

        // Dark moves every role drawn here.
        for (const name of ['--ds-text', '--ds-surface', '--ds-surface-raised', '--ds-shadow-raised',
            '--ds-shadow-overlay', '--ds-background-brand-bold', '--ds-border-focused']) {
            await expect(dark[name], `${name} differs between light and dark`).not.toBe(light[name]);
        }

        // More contrast deepens ink, brand, focus and the raised edge.
        for (const name of ['--ds-text', '--ds-shadow-raised', '--ds-background-brand-bold', '--ds-border-focused']) {
            await expect(lightMore[name], `${name} differs between light and light with more contrast`).not.toBe(light[name]);
        }
        await expect(changed(dark, darkMore).length, 'dark with more contrast differs from dark').toBeGreaterThan(0);

        if (inTestRunner()) {
            try {
                await emulate('dark', 'no-preference');
                await expect(valuesIn('auto', 'no-preference'), 'auto under an OS dark preference is dark').toEqual(dark);
                await expect(valuesIn('auto', 'auto'), 'auto/auto under OS dark, standard contrast is dark').toEqual(dark);
                await emulate('light', 'no-preference');
                await expect(valuesIn('auto', 'no-preference'), 'auto under an OS light preference is light').toEqual(light);
                await emulate('light', 'more');
                await expect(valuesIn('light', 'auto'), 'contrast auto under an OS more preference is more').toEqual(lightMore);
                await expect(valuesIn('auto', 'auto'), 'auto/auto under OS light, more contrast is light more').toEqual(lightMore);
                await emulate('dark', 'more');
                await expect(valuesIn('auto', 'auto'), 'auto/auto under OS dark, more contrast is dark more').toEqual(darkMore);
            } finally {
                await emulate(null, null);
            }
        }
    } finally {
        MODE_ATTRIBUTES.forEach((a, i) => {
            if (saved[i] === null) root.removeAttribute(a);
            else root.setAttribute(a, saved[i]);
        });
    }
};
