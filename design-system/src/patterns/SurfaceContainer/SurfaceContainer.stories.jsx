import React from 'react';
import SurfaceContainer from '@/patterns/SurfaceContainer';
import Surface from '@/patterns/Surface';

const slotContent = (label, minHeight = '72px') => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight,
            border: 'var(--size-element-border) dashed var(--color-outline)',
            borderRadius: 'var(--size-element-radius-md)',
            color: 'var(--color-on-surface-variant)',
        }}
        className="body1-txt"
    >
        {label}
    </div>
);

/** Surface container wrapping stacked page regions — docs section only */
function SurfaceContainerCompositionDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">
                CONTAINER INSIDE A SURFACE
            </span>
            <Surface level="surface" padding="sm" radius="lg">
                <SurfaceContainer radius="md">
                    {slotContent('Region slot #1')}
                    {slotContent('Region slot #2')}
                </SurfaceContainer>
            </Surface>
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Surface container',
    component: SurfaceContainer,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        as: { table: { disable: true } },
        padding: {
            control: 'select',
            options: ['none', 'md'],
            description: 'Padding scale',
            table: { category: 'Design' },
        },
        gap: {
            control: 'select',
            options: ['none', 'md'],
            description: 'Gap between stacked children',
            table: { category: 'Design' },
        },
        radius: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            description: 'Radius scale',
            table: { category: 'Design' },
        },
        border: {
            control: 'boolean',
            description: 'Outline border',
            table: { category: 'Design' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = () => (
    <SurfaceContainer radius="md">
        {slotContent('Region slot #1')}
        {slotContent('Region slot #2')}
    </SurfaceContainer>
);

export const Composition = () => <SurfaceContainerCompositionDemo />;

export const Interactive = {
    args: {
        padding: 'md',
        gap: 'md',
        radius: 'md',
        border: false,
    },
    render: (args) => (
        <SurfaceContainer {...args}>
            {slotContent('Region slot #1')}
            {slotContent('Region slot #2')}
        </SurfaceContainer>
    ),
};
