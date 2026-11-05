import React from 'react';
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
