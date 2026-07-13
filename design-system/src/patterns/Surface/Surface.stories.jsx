import React from 'react';
import Surface, { SURFACE_LEVELS } from '@/patterns/Surface';

const col = { display: 'flex', flexDirection: 'column', gap: '24px' };

const slotContent = (label) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '96px',
            border: 'var(--size-element-border) dashed var(--color-outline)',
            borderRadius: 'var(--size-element-radius-md)',
            color: 'var(--color-on-surface-variant)',
        }}
        className="body1-txt"
    >
        {label}
    </div>
);

/** Every surface level token, side by side — docs section only */
function SurfaceLevelsDemo() {
    return (
        <div style={col}>
            {SURFACE_LEVELS.map((level) => (
                <div key={level}>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">
                        {level.toUpperCase()}
                    </span>
                    <Surface level={level} padding="sm" radius="md" border>
                        {slotContent(`--color-${level}`)}
                    </Surface>
                </div>
            ))}
        </div>
    );
}

/** Elevation steps on a surface */
function SurfaceElevationDemo() {
    return (
        <div style={col}>
            {[0, 1, 2, 3].map((elevation) => (
                <div key={elevation}>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">
                        {`ELEVATION ${elevation}`}
                    </span>
                    <Surface level="surface-container-lowest" padding="sm" radius="md" elevation={elevation}>
                        {slotContent(elevation === 0 ? 'Flat' : `--elevation-light-${elevation}`)}
                    </Surface>
                </div>
            ))}
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Surfaces',
    component: Surface,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        as: { table: { disable: true } },
        level: {
            control: 'select',
            options: SURFACE_LEVELS,
            description: 'Surface color token',
            table: { category: 'Design' },
        },
        padding: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            description: 'Padding scale',
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
        elevation: {
            control: 'select',
            options: [0, 1, 2, 3, 4, 5],
            description: 'Elevation level',
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
    <Surface level="surface" padding="md" radius="lg" border>
        {slotContent('Content slot')}
    </Surface>
);

export const Levels = () => <SurfaceLevelsDemo />;

export const Elevation = () => <SurfaceElevationDemo />;

export const Interactive = {
    args: {
        level: 'surface',
        padding: 'md',
        radius: 'lg',
        border: true,
        elevation: 0,
    },
    render: (args) => (
        <Surface {...args}>
            {slotContent('Content slot')}
        </Surface>
    ),
};
