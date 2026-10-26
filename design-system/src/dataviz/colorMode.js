/**
 * Chart colors at runtime: what a token computes to in the current color
 * mode, and a hook that says when the mode changed.
 *
 * Most charts never need this: Highcharts paints `var(--ds-chart-*)` and the
 * browser resolves it in every mode. A color axis interpolates between stops,
 * and a label on a fill picks its ink by contrast, so those two need the real
 * colors, read here, and read again when the mode changes.
 */
import { useEffect, useState } from 'react';
import { composite, contrast, parseColor } from '@/lib/tokens.mjs';

/**
 * The color a token computes to inside `host`, read through a throwaway
 * element so it resolves in the host's own cascade and color mode.
 *
 * @param {string} token  a custom property name (`--ds-…`) or a `var()` of one
 * @param {Element} [host]
 * @returns {string}  the computed color, as the browser serializes it
 */
export const resolveColor = (token, host) => {
    const value = token.startsWith('--') ? `var(${token})` : token;
    if (typeof document === 'undefined') return value;
    const parent = host ?? document.body;
    const probe = document.createElement('span');
    probe.style.color = value;
    parent.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
};

/** WCAG contrast between two `rgb()` colors, a translucent one laid on white. */
export const contrastRatio = (a, b) => {
    const white = { r: 255, g: 255, b: 255, a: 1 };
    const [x, y] = [a, b].map((c) => composite(parseColor(c), white));
    return contrast(x, y);
};

/**
 * Of the inks given, the one that reads best on `fill`. A label inside a
 * heatmap cell takes the text token or its inverse, whichever contrasts more.
 *
 * @param {string} fill  an `rgb()` color
 * @param {string[]} inks  `rgb()` colors
 * @returns {string}
 */
export const inkFor = (fill, inks) => inks.reduce((best, ink) => (contrastRatio(fill, ink) > contrastRatio(fill, best) ? ink : best));

const modeKey = () => {
    if (typeof document === 'undefined') return '';
    const root = document.documentElement;
    const media = (q) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false);
    return [root.getAttribute('data-color-mode'), root.getAttribute('data-contrast-mode'),
        media('(prefers-color-scheme: dark)'), media('(prefers-contrast: more)')].join('|');
};

/**
 * A key that changes whenever the color or contrast mode does, so a chart
 * that resolved tokens (a heatmap's color axis) resolves them again.
 *
 * @returns {string}
 */
export const useColorModeKey = () => {
    const [key, setKey] = useState(modeKey);
    useEffect(() => {
        const update = () => setKey(modeKey());
        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode', 'data-contrast-mode'] });
        const queries = window.matchMedia
            ? ['(prefers-color-scheme: dark)', '(prefers-contrast: more)'].map((q) => window.matchMedia(q))
            : [];
        queries.forEach((q) => q.addEventListener('change', update));
        update();
        return () => {
            observer.disconnect();
            queries.forEach((q) => q.removeEventListener('change', update));
        };
    }, []);
    return key;
};

/** The two text inks a label on a chart fill chooses between, resolved now. */
export const textInks = () => [resolveColor('--ds-text'), resolveColor('--ds-text-inverse')];
