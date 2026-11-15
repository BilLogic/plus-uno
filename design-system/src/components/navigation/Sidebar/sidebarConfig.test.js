import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { iconClass } from '../../../lib/icon';
import Sidebar from './Sidebar';
import { SIDEBAR_GROUPS, sidebarGroups } from './sidebarConfig';

describe('sidebar config icons', () => {
    const icons = SIDEBAR_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item.icon]));

    it('draws every tab outlined, with brand marks as the only exception', () => {
        for (const [id, icon] of icons) {
            const classes = iconClass(icon);
            if (icon.startsWith('fa-brands ')) expect(classes, id).toContain('fa-brands');
            else expect(classes, id).toMatch(/^fa-regular /);
        }
    });

    it('uses the outlined house for Home', () => {
        expect(iconClass(icons.find(([id]) => id === 'home')[1])).toBe('fa-regular fa-house');
    });
});

describe('sidebarGroups config override', () => {
    it('keeps the role navigation and appends added areas to an existing group', () => {
        const result = sidebarGroups('tutor', {
            groups: [
                {
                    id: 'toolkit',
                    items: [{ id: 'reviews', text: 'Reviews', icon: 'clipboard-check' }],
                },
            ],
            countTags: { reviews: { count: 4, countLabel: '4 pending reviews' } },
        });

        expect(result.map((group) => group.id)).toEqual(['home', 'training', 'toolkit']);
        const toolkit = result.find((group) => group.id === 'toolkit');
        expect(toolkit.items.map((item) => item.id)).toEqual(['sessions', 'toolkit-students', 'reviews']);
        expect(toolkit.items.find((item) => item.id === 'reviews')).toMatchObject({
            id: 'reviews',
            text: 'Reviews',
            icon: 'clipboard-check',
            count: 4,
            countLabel: '4 pending reviews',
        });
    });

    it('updates an existing row in place and appends a new group when id is not in the role config', () => {
        const result = sidebarGroups('tutor', {
            groups: [
                {
                    id: 'toolkit',
                    items: [{ id: 'sessions', text: 'Session log', icon: 'calendar-check' }],
                },
                {
                    id: 'prototype',
                    title: 'Prototype',
                    items: [{ id: 'queue', text: 'Queue', icon: 'inbox' }],
                },
            ],
        });

        expect(result.map((group) => group.id)).toEqual(['home', 'training', 'toolkit', 'prototype']);
        const toolkit = result.find((group) => group.id === 'toolkit');
        expect(toolkit.items.map((item) => item.id)).toEqual(['sessions', 'toolkit-students']);
        expect(toolkit.items[0]).toMatchObject({ id: 'sessions', text: 'Session log', icon: 'calendar-check' });
        const prototype = result.find((group) => group.id === 'prototype');
        expect(prototype).toEqual({
            id: 'prototype',
            title: 'Prototype',
            items: [{ id: 'queue', text: 'Queue', icon: 'inbox' }],
        });
    });

    it('renders Sidebar with the real app nav plus the prototype area added and selected', () => {
        render(
            React.createElement(Sidebar, {
                user: 'tutor',
                groups: [
                    {
                        id: 'toolkit',
                        items: [{ id: 'reviews', text: 'Reviews', icon: 'clipboard-check' }],
                    },
                ],
                activeTabId: 'reviews',
                account: { id: 'ana', name: 'Ana Ruiz', role: 'Tutor' },
            })
        );

        const nav = screen.getByRole('navigation', { name: 'Main' });
        expect(within(nav).getByRole('button', { name: 'Home' })).toBeInTheDocument();
        expect(within(nav).getByRole('button', { name: 'Sessions' })).toBeInTheDocument();
        const reviews = within(nav).getByRole('button', { name: 'Reviews' });
        expect(reviews).toHaveAttribute('aria-current', 'page');
    });
});
