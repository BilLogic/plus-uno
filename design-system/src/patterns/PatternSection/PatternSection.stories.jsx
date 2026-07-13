import React from 'react';
import PatternSection from '@/patterns/PatternSection';
import PatternCard from '@/patterns/PatternCard';
import Button from '@/components/actions/Button';

const col = { display: 'flex', flexDirection: 'column', gap: '32px' };

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

/** Header slot combinations — docs section only */
function PatternSectionSlotsDemos() {
    return (
        <div style={col}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TITLE ONLY</span>
                <PatternSection title="Section title" padding="sm">
                    {slotContent('Content slot')}
                </PatternSection>
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TITLE + DESCRIPTION + ACTIONS</span>
                <PatternSection
                    title="Section title"
                    description="Optional description that explains what this section contains."
                    actions={<Button text="Action" style="primary" fill="filled" size="small" onClick={() => {}} />}
                    padding="sm"
                >
                    {slotContent('Content slot')}
                </PatternSection>
            </div>
        </div>
    );
}

/** Filled section composed with card shells */
function PatternSectionCompositionDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FILLED SECTION WITH CARDS</span>
            <PatternSection
                title="Section title"
                description="Sections group related cards, tables, or forms on a page."
                background="surface-container-low"
                padding="sm"
            >
                <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', flexWrap: 'wrap' }}>
                    <PatternCard minWidth={220} style={{ flex: 1 }}>
                        <span className="body1-txt">Card slot #1</span>
                    </PatternCard>
                    <PatternCard minWidth={220} style={{ flex: 1 }}>
                        <span className="body1-txt">Card slot #2</span>
                    </PatternCard>
                </div>
            </PatternSection>
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Section',
    component: PatternSection,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        actions: { table: { disable: true } },
        title: {
            control: 'text',
            description: 'Section title',
            table: { category: 'Slots' },
        },
        description: {
            control: 'text',
            description: 'Optional description under the title',
            table: { category: 'Slots' },
        },
        padding: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            description: 'Section padding scale',
            table: { category: 'Design' },
        },
        gap: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Gap between header and content',
            table: { category: 'Design' },
        },
        background: {
            control: 'select',
            options: ['none', 'surface-container-low'],
            description: 'Section background token',
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
    <PatternSection
        title="Section title"
        description="Optional description that explains what this section contains."
        actions={<Button text="Action" style="primary" fill="filled" size="small" onClick={() => {}} />}
        padding="none"
    >
        {slotContent('Content slot')}
    </PatternSection>
);

export const Slots = () => <PatternSectionSlotsDemos />;

export const Composition = () => <PatternSectionCompositionDemo />;

export const Interactive = {
    args: {
        title: 'Section title',
        description: 'Optional description that explains what this section contains.',
        padding: 'sm',
        gap: 'md',
        background: 'none',
    },
    render: (args) => (
        <PatternSection
            title={args.title || undefined}
            description={args.description || undefined}
            actions={<Button text="Action" style="primary" fill="filled" size="small" onClick={() => {}} />}
            padding={args.padding}
            gap={args.gap}
            background={args.background}
        >
            {slotContent('Content slot')}
        </PatternSection>
    ),
};
