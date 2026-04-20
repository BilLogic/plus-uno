import React from 'react';
import Button from './Button';
import { ButtonSizesFilledRowContainer } from './button-segmented-demos.jsx';

const icons = {
    'none': null,
    'plus': 'plus',
    'xmark': 'xmark',
    'check': 'check',
    'arrow-right': 'arrow-right',
    'chevron-right': 'chevron-right',
    'star': 'star',
    'user': 'user',
    'trash': 'trash',
    'upload': 'upload'
};

export default {
    title: 'Components/Button',
    component: Button,
    /** Hide CSF stories from the sidebar; docs live on Button.mdx (Canvas still embeds them). */
    tags: ['!dev'],
    parameters: {
        docs: {
            toc: {
                title: 'On this page'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        // CONTENT
        text: {
            control: 'text',
            description: 'Button label text',
            table: { category: 'Content' }
        },
        leadingVisual: {
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'Icon at start of button',
            table: { category: 'Content' }
        },
        trailingVisual: {
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'Icon at end of button',
            table: { category: 'Content' }
        },

        // DESIGN
        style: {
            control: 'select',
            options: [
                'primary', 'secondary', 'tertiary',
                'success', 'warning', 'danger', 'info',
                'social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools', 'default'
            ],
            table: { category: 'Design' }
        },
        fill: {
            control: 'select',
            options: ['filled', 'tonal', 'outline', 'ghost'],
            table: { category: 'Design' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            table: { category: 'Design' }
        },
        vertical: {
            table: { disable: true, category: 'Design' }
        },
        block: {
            control: 'boolean',
            description: 'Full width button',
            table: { category: 'Design' }
        },

        // BEHAVIOR
        disabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        active: {
            table: { disable: true, category: 'Behavior' }
        },
        loading: {
            control: 'boolean',
            description: 'Show loading spinner',
            table: { category: 'Behavior' }
        },
        href: {
            table: { disable: true, category: 'Behavior' }
        },
        target: {
            table: { disable: true, category: 'Behavior' }
        },
        type: {
            table: { disable: true, category: 'Behavior' }
        },

        // DEVELOPMENT
        title: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        as: {
            table: { disable: true, category: 'Development' }
        }
    }
};

/** Docs-only embed for Button.mdx (`Canvas`); sidebar hidden via meta `!dev`. */
export const SizesFilledRow = {
    render: () => <ButtonSizesFilledRowContainer />
};

/**
 * Interactive Playground
 */
export const Interactive = {
    args: {
        text: 'Interactive Button',
        style: 'primary',
        fill: 'filled',
        size: 'medium',
        leadingVisual: 'none',
        trailingVisual: 'none',
        disabled: false,
        loading: false,
        block: false
    },
    render: args => <Button {...args} />
};
