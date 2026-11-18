import React from 'react';
import { expect } from 'storybook/test';
import Breadcrumb from './Breadcrumb';
import './Breadcrumb.scss';

/**
 * Subcomponent documentation for Breadcrumb.
 * Demonstrates the internal building blocks of the Breadcrumb component as per Figma specifications.
 */
export default {
    title: 'Components/Navigation/Breadcrumbs',
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Documentation for the internal subcomponents of the Breadcrumb (Page Item, Divider).',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        text: { control: 'text', description: 'Text content of the item' },
        href: { control: 'text', description: 'URL for the link (if not current)' },
        isCurrent: { control: 'boolean', description: 'Whether this is the current active page' },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onFocus: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onBlur: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
    }
};

/**
 * Page Item
 * Represents a single item in the breadcrumb trail.
 * Can be a parent link (Link Item) or the current page (Current Page Item).
 */
export const PageItem = ({ text, href, isCurrent }) => (
    <nav aria-label="breadcrumb" className="plus-breadcrumb">
        <ol className="plus-breadcrumb-list">
            {isCurrent ? (
                <li aria-current="page" className="plus-breadcrumb-item plus-breadcrumb-current">{text}</li>
            ) : (
                <li className="plus-breadcrumb-item plus-breadcrumb-link"><a href={href}>{text}</a></li>
            )}
        </ol>
    </nav>
);
PageItem.args = {
    text: 'Lesson plans',
    href: '#',
    isCurrent: false,
};

/**
 * Divider
 * Visual separator between items (default slash).
 * Figma State: state=divider
 */
export const Divider = {
    render: () => (
        <Breadcrumb
            items={[
                { text: 'Home', href: '#home' },
                { text: 'Tutoring', href: '#tutoring' },
                { text: 'Algebra B' },
            ]}
        />
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'Home' })).toBeInTheDocument();
        await expect(canvas.getByText('Algebra B')).toHaveAttribute('aria-current', 'page');
    },
};
