/**
 * Static Badge SMART
 * Interactive SMART competency area badge with type and size properties
 */

import { createStaticBadgeSmart } from '../../../../components/StaticBadgeSmart/index.js';

export default {
    title: 'Specs/Universal/Elements/Static Badge SMART',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Interactive SMART competency area badge with type and size properties.',
            },
        },
    },
};

export const Interactive = {
    render: (args) => {
        // Ensure fonts are loaded
        if (!document.getElementById('google-fonts-lato')) {
            const link = document.createElement('link');
            link.id = 'google-fonts-lato';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;600;700&family=Merriweather+Sans:wght@300;400;600;700&display=swap';
            document.head.appendChild(link);
        }

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-start'; // Prevent stretching
        container.style.gap = 'var(--size-element-gap-md)';
        container.style.padding = 'var(--size-section-pad-y-lg)';
        container.style.padding = 'var(--size-section-pad-y-lg)';

        const badge = createStaticBadgeSmart({
            type: args.type,
            size: args.size
        });
        container.appendChild(badge);

        return container;
    },
    argTypes: {
        type: {
            control: 'select',
            options: [
                'socio-emotional',
                'mastering-content',
                'advocacy',
                'relationships',
                'technology-tools'
            ],
            description: 'SMART competency area type',
        },
        size: {
            control: 'select',
            options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
            description: 'Badge size',
        },
    },
    args: {
        type: 'socio-emotional',
        size: 'h1',
    },
};

export const AllSizes = {
    render: (args) => {
        // Ensure fonts are loaded
        if (!document.getElementById('google-fonts-lato')) {
            const link = document.createElement('link');
            link.id = 'google-fonts-lato';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;600;700&family=Merriweather+Sans:wght@300;400;600;700&display=swap';
            document.head.appendChild(link);
        }

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = 'var(--size-element-gap-md)';
        container.style.padding = 'var(--size-section-pad-y-lg)';

        const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'];

        sizes.forEach(size => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '20px';

            const label = document.createElement('span');
            label.textContent = size.toUpperCase();
            label.style.width = '40px';
            label.style.fontFamily = 'monospace';

            const badge = createStaticBadgeSmart({
                type: args.type,
                size: size
            });

            wrapper.appendChild(label);
            wrapper.appendChild(badge);
            container.appendChild(wrapper);
        });

        return container;
    },
    argTypes: {
        type: {
            control: 'select',
            options: [
                'socio-emotional',
                'mastering-content',
                'advocacy',
                'relationships',
                'technology-tools'
            ],
            description: 'SMART competency area type',
        }
    },
    args: {
        type: 'socio-emotional',
    },
};
