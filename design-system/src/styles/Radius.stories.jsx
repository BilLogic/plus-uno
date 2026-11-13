import React from 'react';
import { expect, waitFor } from 'storybook/test';
import {
    ButtonInField,
    JoinedGroup,
    NestingDiagram,
    PillExemption,
    ScaleStrip,
    TemplateMap,
    WindowEdge,
} from '@/storybook-docs/radius-demos.jsx';

/**
 * Live figures for Foundations/Radius. Every corner a figure draws reads a
 * radius token, and every value it names sits outside the drawing, read from
 * the same token. Each play test holds both to the code.
 */
export default {
    title: 'Foundations/Visual/Radius',
    tags: ['!dev', '!autodocs'],
};

/** A token's radius as the page resolves it, in px. */
const radiusOf = (canvasElement, token) => {
    const probe = document.createElement('span');
    probe.style.borderTopLeftRadius = `var(${token})`;
    canvasElement.appendChild(probe);
    const px = parseFloat(getComputedStyle(probe).borderTopLeftRadius);
    probe.remove();
    return px;
};

/** A drawn corner, in px of the drawing's own units. */
const rxOf = (el) => parseFloat(getComputedStyle(el).rx) || 0;

/** A drawn box's corner: an SVG rect's rx, or a box's border radius. */
const cornerOf = (el) => (el.tagName.toLowerCase() === 'rect' ? rxOf(el) : parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);

/** Diagrams carry no words: names and values sit outside the drawing. */
const expectNoWords = async (root) => {
    const svgs = root.querySelectorAll('svg');
    await expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) await expect(svg.querySelector('text'), 'a diagram draws no words').toBeNull();
};

/** The legend beside a figure shows each value its token resolves to. */
const expectLegendValue = async (root, part, token, canvasElement) => {
    const item = root.querySelector(`[data-legend="${part}"]`);
    await expect(item, `legend names ${part}`).not.toBeNull();
    const px = radiusOf(canvasElement, token);
    await waitFor(() => expect(item.querySelector('[data-value]')).toHaveTextContent(px >= 999 ? 'full' : String(px)));
};

/* --------------------------------------------------------------- scale */

const STEPS = ['--radius-0125', '--radius-025', '--radius-0375', '--radius-050', '--radius-0625', '--radius-075', '--radius-100', '--radius-full'];

/** The eight steps, each drawn at its token and labeled by role outside the tile. */
export const Scale = {
    render: () => <ScaleStrip />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="radius-scale"]');
        await expectNoWords(root);
        const tiles = root.querySelectorAll('[data-step]');
        await expect(tiles).toHaveLength(8);
        for (const [i, tile] of [...tiles].entries()) {
            await expect(tile.dataset.step).toBe(STEPS[i]);
            const rect = tile.querySelector('rect[data-corner]');
            const want = radiusOf(canvasElement, STEPS[i]);
            const side = Number(rect.getAttribute('width'));
            await expect(rxOf(rect)).toBeCloseTo(Math.min(want, side / 2), 1);
            await expect(tile.querySelector('[data-value]')).toHaveTextContent(want >= 999 ? 'full' : String(want));
        }
    },
};

/* ----------------------------------------------------------- templates */

/** Frame, Page, Section and Card, each rounded by its own token. */
export const Templates = {
    render: () => <TemplateMap />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="radius-templates"]');
        await expectNoWords(root);
        await expect(root.querySelector('[data-legend="page"] [data-value]')).toHaveTextContent('0');
        await expectLegendValue(root, 'section', '--section-radius', canvasElement);
        await expectLegendValue(root, 'card', '--card-radius', canvasElement);
        await expectLegendValue(root, 'card-compact', '--card-radius-compact', canvasElement);
        // The drawing is at half scale: one unit is 2px.
        const section = root.querySelector('[data-part="section-box"]');
        await expect(cornerOf(section)).toBeCloseTo(radiusOf(canvasElement, '--section-radius') / 2, 1);
        const compact = root.querySelector('[data-part="card-compact"]');
        await expect(cornerOf(compact)).toBeCloseTo(radiusOf(canvasElement, '--card-radius-compact'), 1);
    },
};

/* ------------------------------------------------------------- nesting */

/** Inner corner = outer corner − padding. */
export const Nesting = {
    render: () => <NestingDiagram />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="radius-nesting"]');
        await expectNoWords(root);
        const outer = rxOf(root.querySelector('[data-part="outer"]'));
        const inner = rxOf(root.querySelector('[data-part="inner"]'));
        await expect(outer).toBeCloseTo(radiusOf(canvasElement, '--popup-radius'), 1);
        await expect(inner).toBeCloseTo(outer - radiusOf(canvasElement, '--popover-pad-menu'), 1);
        await expectLegendValue(root, 'outer', '--popup-radius', canvasElement);
        await expectLegendValue(root, 'inner', '--radius-control-md', canvasElement);
    },
};

/** A button in a field: the field's radius minus the 4 inset. */
export const ButtonsInFields = {
    render: () => <ButtonInField />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="radius-button-in-field"]');
        await expectNoWords(root);
        const inset = radiusOf(canvasElement, '--pad-x-xs');
        for (const [density, field, button] of [
            ['default', '--radius-control-lg', '--button-radius-default'],
            ['compact', '--radius-control-md', '--button-radius-compact'],
        ]) {
            const pair = root.querySelector(`[data-density="${density}"]`);
            const f = rxOf(pair.querySelector('[data-part="field"]'));
            const b = rxOf(pair.querySelector('[data-part="button"]'));
            await expect(f).toBeCloseTo(radiusOf(canvasElement, field), 1);
            await expect(b).toBeCloseTo(radiusOf(canvasElement, button), 1);
            await expect(b).toBeCloseTo(f - inset, 1);
        }
    },
};

/** Joined group: outer corners rounded, inner seams square. */
export const Joined = {
    render: () => <JoinedGroup />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="radius-joined"]');
        await expectNoWords(root);
        const clip = root.querySelector('clipPath rect');
        await expect(rxOf(clip)).toBeCloseTo(radiusOf(canvasElement, '--button-radius-default'), 1);
        await expect(root.querySelectorAll('[data-part="seam"]').length).toBeGreaterThan(0);
    },
};

/** Window edge: a Page in the Frame, and a full-bleed Modal footer, take 0. */
export const Window = {
    render: () => <WindowEdge />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="radius-window"]');
        await expectNoWords(root);
        await expect(rxOf(root.querySelector('[data-part="page"]'))).toBe(0);
        await expect(rxOf(root.querySelector('[data-part="footer-seam"]'))).toBe(0);
        // The screen figures draw at the kit's half scale: one unit is 2px.
        await expect(rxOf(root.querySelector('[data-part="modal"]'))).toBeCloseTo(radiusOf(canvasElement, '--modal-radius') / 2, 1);
    },
};

/** A pill keeps --radius-full wherever it sits. */
export const Pill = {
    render: () => <PillExemption />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="radius-pill"]');
        await expectNoWords(root);
        for (const pill of root.querySelectorAll('[data-part="pill"]')) {
            await expect(rxOf(pill)).toBeCloseTo(Number(pill.getAttribute('height')) / 2, 1);
        }
    },
};
