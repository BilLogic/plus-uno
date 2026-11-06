import React from 'react';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { expect, within } from 'storybook/test';
import Footer from './Footer';

export default {
    title: 'Components/Layout and structure/Footer',
    component: Footer,
    /** Hide CSF stories from the sidebar; docs live on Footer.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: { docs: { toc: { title: 'On this page' } } },
    argTypes: {
        version: { control: 'text', description: 'The product version, shown first.', table: { category: 'Content' } },
        copyright: { control: 'text', description: 'The copyright line.', table: { category: 'Content' } },
        termsText: { control: 'text', description: 'The label of the terms link.', table: { category: 'Content' } },
        termsUrl: { control: 'text', description: 'Where the terms link goes.', table: { category: 'Content' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        style: { control: false, table: { disable: true, category: 'Development' } },
    },
};

export const Overview = {
    render: (args) => <Footer {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('contentinfo')).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'Terms of Use' })).toBeInTheDocument();
    },
};

export const CustomContent = {
    render: () => (
        <Footer version="v6.0.1" copyright="Copyright © Carnegie Mellon University 2026" termsText="Terms" termsUrl="/terms" />
    ),
};

export const Interactive = {
    render: (args) => <Footer {...args} />,
};

/* ------------------------------------------------------------------- states */

const termsLink = (canvasElement) => within(canvasElement).getByRole('link', { name: 'Terms of Use' });
const linkColor = (el, pseudo) => {
    el.style.transition = 'none';
    const read = () => getComputedStyle(el).color;
    return pseudo ? withForcedPseudo(el, pseudo, read) : read();
};

/** Rest: the terms link in the link color, the line in the default text color. */
export const Rest = {
    render: () => <Footer />,
    play: async ({ canvasElement }) => {
        await expect(linkColor(termsLink(canvasElement))).toBe(tokenColor(canvasElement, '--ds-link'));
        await expect(getComputedStyle(canvasElement.querySelector('footer p')).color).toBe(tokenColor(canvasElement, '--ds-text'));
    },
};

/** Hovered: the link takes the pressed link color. */
export const Hovered = {
    render: () => <Footer />,
    play: async ({ canvasElement }) => {
        await expect(linkColor(termsLink(canvasElement), ':hover')).toBe(tokenColor(canvasElement, '--ds-link-pressed'));
    },
};

/** Pressed: the same pressed link color. */
export const Pressed = {
    render: () => <Footer />,
    play: async ({ canvasElement }) => {
        await expect(linkColor(termsLink(canvasElement), ':active')).toBe(tokenColor(canvasElement, '--ds-link-pressed'));
    },
};

/** Focused: the 2px ring, 2px off the link. */
export const Focused = {
    render: () => <Footer />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, termsLink(canvasElement), 'terms link');
    },
};
