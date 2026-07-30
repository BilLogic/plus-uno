import React from 'react';
import Navbar from '@/components/_internal/Navbar';

export default {
    title: 'Components/Navigation/Navbar',
    component: Navbar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Horizontal navigation bar with a brand slot and a list of links. For the authenticated PLUS app shell use the Top Bar spec instead — this is the generic, standalone bar.'
            }
        }
    },
    argTypes: {
        style: { table: { disable: true } },

        // CONTENT
        brand: {
            control: 'text',
            description: 'Brand label or node shown at the start of the bar',
            table: { category: 'Content' }
        },
        items: {
            control: 'object',
            description: 'Nav links — { text, href, onClick, active, disabled }',
            table: { category: 'Content' }
        },

        // DESIGN
        backgroundColor: {
            control: 'select',
            options: ['light', 'dark', 'primary'],
            description: 'Bar background treatment',
            table: { category: 'Design' }
        },

        // DEVELOPMENT
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } }
    }
};

const items = [
    { text: 'Home', href: '#', active: true },
    { text: 'Sessions', href: '#' },
    { text: 'Training', href: '#' },
    { text: 'Archive', href: '#', disabled: true }
];

export const Overview = {
    args: { brand: 'PLUS', items, backgroundColor: 'light' }
};

export const Dark = {
    args: { brand: 'PLUS', items, backgroundColor: 'dark' }
};

export const Primary = {
    args: { brand: 'PLUS', items, backgroundColor: 'primary' }
};
