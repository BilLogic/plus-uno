import React from 'react';
import Navigation from '@/components/Navigation';

export default {
    title: 'Components/Navigation/Navigation',
    component: Navigation,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['horizontal', 'vertical', 'tabs', 'pills']
        },
        alignment: {
            control: { type: 'select' },
            options: ['left', 'center', 'right']
        },
    },
};

const items = [
    { text: 'Home', href: '#', selected: true },
    { text: 'Profile', href: '#' },
    { text: 'Settings', href: '#' },
    { text: 'Disabled', disabled: true },
];

const dropdownItems = [
    { text: 'Action', href: '#' },
    { text: 'Another action', href: '#' },
    { text: 'Something else here', href: '#' },
];

const complexItems = [
    { text: 'Active', href: '#', selected: true },
    { text: 'Link', href: '#' },
    { text: 'Dropdown', dropdownItems: dropdownItems },
    { text: 'Disabled', disabled: true },
];

export const Horizontal = {
    args: {
        type: 'horizontal',
        items: items,
    },
};

export const Tabs = {
    args: {
        type: 'tabs',
        items: items,
    },
};

export const Pills = {
    args: {
        type: 'pills',
        items: items,
    },
};

export const Vertical = {
    args: {
        type: 'vertical',
        items: items,
        style: { width: '200px' }
    },
};

export const WithDropdowns = {
    args: {
        type: 'tabs',
        items: complexItems,
    },
};

export const Centered = {
    args: {
        type: 'pills',
        alignment: 'center',
        items: items,
    },
};
