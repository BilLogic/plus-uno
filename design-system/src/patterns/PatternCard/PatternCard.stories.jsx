import React from 'react';
import { expect, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import PatternCard from '@/patterns/PatternCard';
import { Button, Skeleton } from '@/components';
import { CardJobs } from './PatternCardCases.jsx';

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

const CARD_SIZES = ['sm', 'md', 'lg'];

const DemoCaption = ({ children }) => (
    <span
        style={{
            display: 'block',
            marginBottom: 'var(--element-stack-md)',
            font: 'var(--heading-xxsmall)',
            textTransform: 'uppercase',
            color: 'var(--ds-text-subtle)',
        }}
    >
        {children}
    </span>
);

const wrapRow = { display: 'flex', gap: 'var(--layout-gutter)', flexWrap: 'wrap', alignItems: 'flex-start' };

const sessionBody = (
    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Last note: practice set 4 assigned</p>
);

const viewSession = <Button text="View session" style="primary" fill="text" size="small" onClick={() => {}} />;

/** The three sizes: each sets the pad, the radius and the minimum width together. */
function PatternCardSizesDemo() {
    return (
        <div style={wrapRow}>
            {CARD_SIZES.map((size) => (
                <div key={size}>
                    <DemoCaption>{`size=${size}`}</DemoCaption>
                    <PatternCard
                        padding={size}
                        minWidth={`var(--card-min-width-${size})`}
                        title="Ana Ruiz"
                        description="Algebra I · Thu 4:00 PM"
                        footer={viewSession}
                    >
                        {sessionBody}
                    </PatternCard>
                </div>
            ))}
        </div>
    );
}

const imagePlaceholder = (ratio) => (
    <div
        style={{
            aspectRatio: ratio.replace(':', ' / '),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--element-inline-md)',
            backgroundColor: 'var(--ds-background-neutral)',
            color: 'var(--ds-text-subtle)',
            font: 'var(--body-default)',
        }}
    >
        <i className="fa-regular fa-image" aria-hidden="true" />
        {ratio}
    </div>
);

/** The image slot at each ratio, edge to edge above the padded content. */
function PatternCardImageDemo() {
    return (
        <div style={wrapRow}>
            {['16:9', '4:3', '1:1'].map((ratio) => (
                <PatternCard
                    key={ratio}
                    image={imagePlaceholder(ratio)}
                    title="Ana Ruiz"
                    description="Algebra I · Thu 4:00 PM"
                    style={{ width: 'var(--card-min-width-md)' }}
                >
                    {sessionBody}
                </PatternCard>
            ))}
        </div>
    );
}

/** A loading card: text bars at the text line heights, in a card kept at its final size. */
function PatternCardLoadingDemo() {
    return (
        <div style={wrapRow}>
            <div>
                <DemoCaption>Default</DemoCaption>
                <PatternCard title="Ana Ruiz" description="Algebra I · Thu 4:00 PM" footer={viewSession} style={{ width: 'var(--card-min-width-md)' }}>
                    {sessionBody}
                </PatternCard>
            </div>
            <div>
                <DemoCaption>Loading</DemoCaption>
                <PatternCard aria-busy="true" style={{ width: 'var(--card-min-width-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
                        <Skeleton shape="text" width="50%" />
                        <Skeleton shape="text" width="75%" />
                        <Skeleton shape="text" width="100%" />
                        <Skeleton shape="text" width="40%" />
                    </div>
                </PatternCard>
            </div>
        </div>
    );
}

/** A row of cards at three content widths: the most that keeps each card at its minimum. */
function PatternCardRowsDemo() {
    const people = [
        ['Ana Ruiz', 'Algebra I · Thu 4:00 PM'],
        ['Marcus Lee', 'Geometry · Thu 5:00 PM'],
        ['Priya Shah', 'Biology · Fri 3:30 PM'],
        ['Jordan Kim', 'Chemistry · Fri 4:15 PM'],
        ['Ana Ruiz', 'Algebra I · Thu 4:00 PM'],
        ['Marcus Lee', 'Geometry · Thu 5:00 PM'],
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)' }}>
            {[['Medium', 720], ['Large', 744], ['X-Large', 1144]].map(([mode, width]) => (
                <div key={mode} style={{ overflowX: 'auto' }}>
                    <DemoCaption>{`${mode} · content ${width}`}</DemoCaption>
                    <div
                        data-row={mode}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-min-width-md), 1fr))',
                            gap: 'var(--layout-gutter)',
                            width,
                        }}
                    >
                        {people.map(([name, detail], i) => (
                            <PatternCard key={`${name}-${i}`} title={name} description={detail}>
                                {sessionBody}
                            </PatternCard>
                        ))}
                    </div>
                </div>
            ))}
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
            description: 'Card title, in the card title type',
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

/** A static card, a clickable card and a dragged card, for the docs page. */
export const ElevationStates = () => (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <PatternCard title="Static" minWidth={200}>{bodyCopy}</PatternCard>
        <PatternCard title="Clickable" minWidth={200} role="button" tabIndex={0} onClick={() => {}}>{bodyCopy}</PatternCard>
        <PatternCard title="Dragging" minWidth={200} dragging>{bodyCopy}</PatternCard>
    </div>
);

export const Sizes = () => <PatternCardSizesDemo />;

export const Jobs = () => <CardJobs />;

export const ImageRatios =() => <PatternCardImageDemo />;

export const Loading = () => <PatternCardLoadingDemo />;

/** At the content widths of the three modes, a md card row holds 2, 2 and 3 cards. */
export const Rows = {
    render: () => <PatternCardRowsDemo />,
    play: async ({ canvasElement }) => {
        const count = (mode) => {
            const cards = Array.from(canvasElement.querySelector(`[data-row="${mode}"]`).children);
            const top = Math.min(...cards.map((card) => Math.round(card.getBoundingClientRect().top)));
            return cards.filter((card) => Math.round(card.getBoundingClientRect().top) === top).length;
        };
        await expect(count('Medium'), 'Medium holds 2 md cards').toBe(2);
        await expect(count('Large'), 'Large holds 2 md cards').toBe(2);
        await expect(count('X-Large'), 'X-Large holds 3 md cards').toBe(3);
    },
};
