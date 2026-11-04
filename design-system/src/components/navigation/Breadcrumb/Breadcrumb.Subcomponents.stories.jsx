import React from 'react';
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
    text: 'Page Title',
    href: '#',
    isCurrent: false,
};

/**
 * Divider
 * Visual separator between items.
 * Figma State: state=divider
 */
export const Divider = () => (
    <div className="plus-breadcrumb">
        <span style={{ color: 'var(--ds-text-subtlest)' }}>/</span>
    </div>
);
