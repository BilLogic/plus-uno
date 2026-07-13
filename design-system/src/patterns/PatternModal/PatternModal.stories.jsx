import React from 'react';
import PatternModal from '@/patterns/PatternModal';
import Button from '@/components/actions/Button';

const modalFrame = { maxWidth: '480px', width: '100%' };

const bodyCopy = (
    <p className="body1-txt" style={{ margin: 0 }}>
        Some quick example text to fill the body slot of the modal shell.
    </p>
);

const longBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
        {Array.from({ length: 10 }, (_, i) => (
            <p key={i} className="body1-txt" style={{ margin: 0 }}>
                {`Paragraph ${i + 1} — long body content demonstrating the internal scroll behavior of the modal body slot.`}
            </p>
        ))}
    </div>
);

const footerActions = (
    <>
        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => {}} />
        <Button text="Confirm" style="primary" fill="filled" size="small" onClick={() => {}} />
    </>
);

/** Internal scroll with maxHeight — docs section only */
function PatternModalScrollDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MAX HEIGHT + INTERNAL SCROLL</span>
            <div style={modalFrame}>
                <PatternModal
                    title="Scrollable modal"
                    onClose={() => {}}
                    footer={footerActions}
                    maxHeight={320}
                >
                    {longBody}
                </PatternModal>
            </div>
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Modal',
    component: PatternModal,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        onClose: { table: { disable: true } },
        footer: { table: { disable: true } },
        title: {
            control: 'text',
            description: 'Modal title',
            table: { category: 'Slots' },
        },
        maxHeight: {
            control: 'number',
            description: 'Max height (px) — body scrolls internally',
            table: { category: 'Design' },
        },
        padding: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Modal padding scale',
            table: { category: 'Design' },
        },
        gap: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Gap between slots',
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
    <div style={modalFrame}>
        <PatternModal title="Modal title" onClose={() => {}} footer={footerActions}>
            {bodyCopy}
        </PatternModal>
    </div>
);

export const Scrolling = () => <PatternModalScrollDemo />;

export const Interactive = {
    args: {
        title: 'Modal title',
        maxHeight: 320,
        padding: 'md',
        gap: 'md',
    },
    render: (args) => (
        <div style={modalFrame}>
            <PatternModal
                title={args.title}
                onClose={() => {}}
                footer={footerActions}
                maxHeight={args.maxHeight || undefined}
                padding={args.padding}
                gap={args.gap}
            >
                {longBody}
            </PatternModal>
        </div>
    ),
};
