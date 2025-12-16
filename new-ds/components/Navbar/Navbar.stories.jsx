import React from 'react';
import Navbar from '@/components/Navbar';

export default {
    title: 'Components/Navigation/Navbar',
    component: Navbar,
    tags: ['autodocs'],
    argTypes: {
        backgroundColor: {
            control: { type: 'select' },
            options: ['light', 'dark', 'primary']
        },
    },
};

const items = [
    { text: 'Home', href: '#', active: true },
    { text: 'Features', href: '#' },
    { text: 'Pricing', href: '#' },
    {
        text: 'Dropdown',
        dropdownItems: [
            { text: 'Action', href: '#' },
            { text: 'Another action', href: '#' },
        ]
    },
];

const components = [
    {
        type: 'form',
        input: { placeholder: 'Search' },
        button: { text: 'Search' }
    },
    {
        type: 'button',
        text: 'Sign In',
        variant: 'outline-primary',
        className: 'ms-2'
    }
];

export const Default = {
    args: {
        brand: 'PLUS',
        items: items,
    },
};

export const DarkUser = {
    args: {
        brand: 'Dashboard',
        items: items,
        backgroundColor: 'dark',
    },
};

export const WithComponents = {
    args: {
        brand: 'App',
        items: items,
        components: components,
    },
};
