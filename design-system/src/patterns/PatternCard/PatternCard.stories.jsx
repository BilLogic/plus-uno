import React from 'react';
import { expect, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
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
                    actions={<span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>Actions slot</span>}
                    footer={<span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>Footer slot</span>}
                >
                    {bodyCopy}
                </PatternCard>
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CUSTOM HEADER</span>
                <PatternCard header={<span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>Custom header slot: tabs or a toolbar</span>}>
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
            description: 'Card title (Heading/xsmall)',
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
 * A card rests on Atlassian's raised pair: the raised surface and its shadow,
 * whose ring is the edge, with no border. A clickable card lifts while hovered
 * (the raised surface's hovered step under the overlay shadow) and settles
 * back while pressed; a dragged card is on the overlay pair. Held in all four
 * modes.
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
        const card = (name) => {
            const el = within(canvasElement).getByText(name).closest('.plus-pattern-card');
            el.style.transition = 'none';
            return el;
        };
        const paint = (el) => {
            const style = getComputedStyle(el);
            return { shadow: style.boxShadow, fill: style.backgroundColor };
        };
        const pair = (surface, shadow) => ({
            shadow: computedShadow(canvasElement, `var(${shadow})`),
            fill: tokenColor(canvasElement, surface),
        });
        const lightRaised = tokenColor(canvasElement, '--ds-surface-raised');

        await inEveryColorMode(async (mode) => {
            const raised = pair('--ds-surface-raised', '--ds-shadow-raised');
            const static_ = card('Static');
            const clickable = card('Clickable');

            await expect(paint(static_), `${mode}: a card rests on the raised pair`).toEqual(raised);
            await expect(paint(clickable), `${mode}: a clickable card rests on the raised pair`).toEqual(raised);
            await expect(withForcedPseudo(static_, ':hover', () => paint(static_)), `${mode}: hovering a static card`).toEqual(raised);
            await expect(withForcedPseudo(clickable, ':hover', () => paint(clickable)), `${mode}: hovering a clickable card`)
                .toEqual(pair('--ds-surface-raised-hovered', '--ds-shadow-overlay'));
            await expect(withForcedPseudo(clickable, ':active', () => paint(clickable)), `${mode}: pressing a clickable card`)
                .toEqual(pair('--ds-surface-raised-pressed', '--ds-shadow-raised'));
            await expect(paint(card('Dragging')), `${mode}: a dragged card`).toEqual(pair('--ds-surface-overlay', '--ds-shadow-overlay'));
            await expect(getComputedStyle(static_).borderTopWidth, `${mode}: the ring is the edge, not a border`).toBe('0px');
            await expect(getComputedStyle(static_).color, `${mode}: card text`).toBe(tokenColor(canvasElement, '--ds-text'));
            if (mode.startsWith('dark')) {
                await expect(raised.fill, `${mode}: the raised surface moves with the mode`).not.toBe(lightRaised);
            }
        });
    },
};
