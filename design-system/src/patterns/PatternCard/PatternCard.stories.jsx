import React from 'react';
import { expect, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { computedShadow } from '@/storybook-docs/lib/style-probes.js';
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
                <PatternCard title="Card title" description="A line that says what the card holds.">
                    {bodyCopy}
                </PatternCard>
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">HEADER + BODY + FOOTER</span>
                <PatternCard
                    title="Card title"
                    actions={<span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Actions slot</span>}
                    footer={<span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Footer slot</span>}
                >
                    {bodyCopy}
                </PatternCard>
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CUSTOM HEADER</span>
                <PatternCard header={<span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Custom header slot: tabs or a toolbar</span>}>
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
        title: {
            control: 'text',
            description: 'Card title (Heading/small)',
            table: { category: 'Content' },
        },
        description: {
            control: 'text',
            description: 'Description under the title',
            table: { category: 'Content' },
        },
        actions: {
            control: 'text',
            description: 'Actions at the end of the header row',
            table: { category: 'Slots' },
        },
        header: {
            control: 'text',
            description: 'Custom header that replaces title, description and actions',
            table: { category: 'Slots' },
        },
        image: {
            control: false,
            description: 'Image slot above the content',
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
            description: 'Header-to-body stack',
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
        <PatternCard title="Card title" description="A line that says what the card holds.">
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
        title: 'Card title',
        description: 'A line that says what the card holds.',
        actions: '',
        header: '',
        footer: 'Footer slot',
        padding: 'md',
        gap: 'md',
        minWidth: '',
    },
    render: (args) => (
        <PatternCard
            title={args.title || undefined}
            description={args.description || undefined}
            actions={args.actions || undefined}
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

/**
 * A card rests flat on its outline. Only a clickable card lifts, to the raised
 * shadow (Light/2), while it is hovered or dragged.
 */
export const Elevation = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <PatternCard title="Static" minWidth={200}>{bodyCopy}</PatternCard>
            <PatternCard title="Clickable" minWidth={200} role="button" tabIndex={0} onClick={() => {}}>{bodyCopy}</PatternCard>
            <PatternCard title="Dragging" minWidth={200} dragging>{bodyCopy}</PatternCard>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const card = (name) => within(canvasElement).getByText(name).closest('.plus-pattern-card');
        const shadow = (el) => {
            el.style.transition = 'none';
            return getComputedStyle(el).boxShadow;
        };
        const raised = computedShadow(canvasElement, 'var(--surface-raised-shadow)');

        await expect(shadow(card('Static')), 'a static card rests flat').toBe('none');
        await expect(shadow(card('Clickable')), 'a clickable card rests flat').toBe('none');
        await expect(withForcedPseudo(card('Static'), ':hover', () => shadow(card('Static'))), 'hovering a static card').toBe('none');
        await expect(withForcedPseudo(card('Clickable'), ':hover', () => shadow(card('Clickable'))), 'hovering a clickable card').toBe(raised);
        await expect(shadow(card('Dragging')), 'a dragged card').toBe(raised);
        await expect(getComputedStyle(card('Static')).borderTopWidth, 'the 1px outline').toBe('1px');
    },
};
