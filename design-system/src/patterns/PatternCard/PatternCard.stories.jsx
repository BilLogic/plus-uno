import React from 'react';
import PatternCard from '@/patterns/PatternCard';

const cardCol = { display: 'flex', flexDirection: 'column', gap: '24px' };

const bodyCopy = (
    <p className="body1-txt" style={{ margin: 0 }}>
        Some quick example text to fill the body slot of the card shell.
    </p>
);

/** Slot combinations — docs section only */
function PatternCardSlotsDemos() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">BODY ONLY</span>
                <PatternCard>{bodyCopy}</PatternCard>
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">HEADER + BODY</span>
                <PatternCard header={<span className="h5" style={{ margin: 0 }}>Header slot</span>}>
                    {bodyCopy}
                </PatternCard>
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">HEADER + BODY + FOOTER</span>
                <PatternCard
                    header={<span className="h5" style={{ margin: 0 }}>Header slot</span>}
                    footer={<span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Footer slot</span>}
                >
                    {bodyCopy}
                </PatternCard>
            </div>
        </div>
    );
}

/** Padding and width constraints */
function PatternCardConstraintsDemos() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">PADDING SCALE</span>
                <div style={cardCol}>
                    {['sm', 'md', 'lg'].map((padding) => (
                        <PatternCard key={padding} padding={padding}>
                            <span className="body1-txt">{`padding="${padding}"`}</span>
                        </PatternCard>
                    ))}
                </div>
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MIN WIDTH</span>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <PatternCard minWidth={280}>
                        <span className="body1-txt">minWidth 280px</span>
                    </PatternCard>
                    <PatternCard minWidth="360px">
                        <span className="body1-txt">minWidth 360px</span>
                    </PatternCard>
                </div>
            </div>
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Card',
    component: PatternCard,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        header: {
            control: 'text',
            description: 'Header slot',
            table: { category: 'Slots' },
        },
        footer: {
            control: 'text',
            description: 'Footer slot',
            table: { category: 'Slots' },
        },
        padding: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Card padding scale',
            table: { category: 'Design' },
        },
        gap: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Gap between slots',
            table: { category: 'Design' },
        },
        minWidth: {
            control: 'text',
            description: 'Minimum width constraint',
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
    <div style={{ maxWidth: '400px', width: '100%' }}>
        <PatternCard header={<span className="h5" style={{ margin: 0 }}>Header slot</span>}>
            {bodyCopy}
        </PatternCard>
    </div>
);

export const Slots = () => (
    <div style={cardCol}>
        <PatternCardSlotsDemos />
    </div>
);

export const Constraints = () => (
    <div style={cardCol}>
        <PatternCardConstraintsDemos />
    </div>
);

export const Interactive = {
    args: {
        header: 'Header slot',
        footer: 'Footer slot',
        padding: 'md',
        gap: 'md',
        minWidth: '',
    },
    render: (args) => (
        <PatternCard
            header={args.header || undefined}
            footer={args.footer || undefined}
            padding={args.padding}
            gap={args.gap}
            minWidth={args.minWidth || undefined}
        >
            {bodyCopy}
        </PatternCard>
    ),
};
