import React from 'react';
import Section from '@/components/_internal/Section';

export default {
    title: 'Components/Layout and structure/Section',
    component: Section,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Page-level content band. Wraps a titled group of content with token-bound padding and an optional surface background — the code counterpart of the Pattern/Section layout family in Figma.'
            }
        }
    },
    argTypes: {
        style: { table: { disable: true } },

        // CONTENT
        title: {
            control: 'text',
            description: 'Optional heading rendered above the content',
            table: { category: 'Content' }
        },
        children: {
            control: false,
            description: 'Section content',
            table: { category: 'Content' }
        },

        // DESIGN
        padding: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg', 'xl'],
            description: 'Inner padding, bound to the --size-section-pad-* token family',
            table: { category: 'Design' }
        },
        background: {
            control: 'select',
            options: ['transparent', 'surface', 'surface-alt'],
            description: 'Background treatment',
            table: { category: 'Design' }
        },

        // DEVELOPMENT
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } }
    }
};

const body = (
    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
        Sections group related content into a labelled band. Padding and background are token-bound,
        so a section always matches the spacing scale of the page around it.
    </p>
);

export const Overview = {
    args: { title: 'Section title', padding: 'md', background: 'surface', children: body }
};

export const Transparent = {
    args: { title: 'No background', padding: 'lg', background: 'transparent', children: body }
};

export const Untitled = {
    args: { padding: 'md', background: 'surface-alt', children: body },
    parameters: {
        docs: { description: { story: 'Omit `title` when the surrounding page already names the region.' } }
    }
};
