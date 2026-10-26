import React from 'react';
import { RefTable, C } from '@/storybook-docs/foundation-blocks.jsx';

export default {
    title: 'Foundations/Design tokens',
    tags: ['!dev', '!autodocs'],
};

/** Each Figma variable collection, the tokens it becomes in code, and what it holds. */
export const Collections = () => (
    <RefTable
        head={['Figma collection', 'In code', 'Holds']}
        rows={[
            [<C>color / foundations</C>, <C>--ds-*</C>, 'Every color: text, icon, border, background, surface, shadow, chart. Four modes: Light, Dark, Light IC, Dark IC.'],
            [<C>color / primitives</C>, <C>--palette-*</C>, 'The color ramps the foundations point at. Hidden.'],
            [<C>spacing / primitives</C>, <><C>--space-*</C>, <C>--radius-*</C>, <C>--size-*</C></>, 'The raw spacing, radius, stroke and size scales. Hidden.'],
            [<C>spacing / foundations</C>, <><C>--element-*</C>, <C>--border-*</C>, <C>--item-*</C>, <C>--row-*</C>, <C>--icon-*</C>, <C>--image-*</C></>, 'Element spacing, border widths and the size roles.'],
            [<C>spacing / patterns</C>, <><C>--card-*</C>, <C>--section-*</C>, <C>--modal-*</C>, <C>--popover-*</C>, <C>--table-*</C></>, 'Each pattern’s pad, stack, inline, radius and sizes.'],
            [<C>spacing / layout</C>, <><C>--layout-*</C>, <C>--surface-*</C></>, 'The grid, the frame and the content widths. Three modes: Medium, Large, X-Large.'],
            [<C>typography</C>, <><C>--heading-*</C>, <C>--body-*</C>, <C>--metric-*</C>, <C>--type-*</C></>, 'The text styles, their families and weights.'],
        ]}
    />
);
