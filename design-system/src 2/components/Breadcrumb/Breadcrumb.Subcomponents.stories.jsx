import React from 'react';
import RBBreadcrumb from 'react-bootstrap/Breadcrumb';
import './Breadcrumb.scss';

/**
 * Subcomponent documentation for Breadcrumb.
 * Demonstrates the internal building blocks of the Breadcrumb component as per Figma specifications.
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=27-499&m=dev
 */
export default {
    title: 'Components/Breadcrumb/Subcomponents',
    parameters: {
        docs: {
            description: {
                component: 'Documentation for the internal subcomponents of the Breadcrumb (Page Item, Divider).',
            },
        },
    },
    argTypes: {
        text: { control: 'text', description: 'Text content of the item' },
        href: { control: 'text', description: 'URL for the link (if not current)' },
        isCurrent: { control: 'boolean', description: 'Whether this is the current active page' },
    }
};

/**
 * Page Item
 * Represents a single item in the breadcrumb trail.
 * Can be a parent link (Link Item) or the current page (Current Page Item).
 */
export const PageItem = ({ text, href, isCurrent }) => (
    <nav aria-label="breadcrumb" className="plus-breadcrumb">
        <ol className="breadcrumb">
            <RBBreadcrumb.Item
                href={isCurrent ? undefined : href}
                active={isCurrent}
                className={isCurrent ? 'plus-breadcrumb-current' : 'plus-breadcrumb-link'}
            >
                {text}
            </RBBreadcrumb.Item>
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
        <span style={{ color: 'var(--color-on-surface-variant)' }}>/</span>
    </div>
);
