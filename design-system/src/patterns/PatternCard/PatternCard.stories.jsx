import React from 'react';
import { expect, within, waitFor } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { PatternCard } from '@/patterns';
import { Skeleton, Button, IconButton } from '@/components';
import { CardJobs } from './PatternCardCases.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';

const bodyCopy = (
    <p className="body-large" style={{ margin: 0 }}>
        Some quick example text to fill the body slot of the card shell.
    </p>
);

const DemoCaption = ({ children }) => (
    <span
        style={{
            display: 'block',
            marginBottom: 'var(--stack-md)',
            font: 'var(--heading-xxsmall)',
            color: 'var(--ds-text-subtle)',
        }}
    >
        {children}
    </span>
);

const sessionBody = (
    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Last note: practice set 4 assigned</p>
);

const viewSession = <Button text="View session" appearance="subtle" spacing="compact" onClick={() => {}} />;

const imagePlaceholder = (ratio) => (
    <div
        style={{
            aspectRatio: ratio.replace(':', ' / '),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--inline-md)',
            backgroundColor: 'var(--ds-background-neutral)',
            color: 'var(--ds-text-subtle)',
            font: 'var(--body-default)',
        }}
    >
        <i className="fa-regular fa-image" aria-hidden="true" />
        {ratio}
    </div>
);

/** A row of cards at three content widths: the most that keeps each card at its minimum. */
function PatternCardRowsDemo() {
    const people = [
        ['Ana Ruiz', 'Lincoln Middle · Thu 4:00 PM'],
        ['Marcus Lee', 'Roosevelt K-8 · Thu 5:00 PM'],
        ['Priya Shah', 'North High · Fri 3:30 PM'],
        ['Jordan Kim', 'South High · Fri 4:15 PM'],
        ['Ana Ruiz', 'Lincoln Middle · Thu 4:00 PM'],
        ['Marcus Lee', 'Roosevelt K-8 · Thu 5:00 PM'],
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)' }}>
            {[['Medium', 720], ['Large', 736], ['X-Large', 1152]].map(([mode, width]) => (
                <div key={mode}>
                    <DemoCaption>{`${mode} · content ${width}`}</DemoCaption>
                    {/* Each row is a picture of one content width: scaled to fit, never reflowed. */}
                    <FitStage width={width} reflow={false}>
                        <div
                            data-row={mode}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-min-width-md), 1fr))',
                                gap: 'var(--grid-gutter)',
                                width,
                            }}
                        >
                            {people.map(([name, detail], i) => (
                                <PatternCard key={`${name}-${i}`} title={name} description={detail}>
                                    {sessionBody}
                                </PatternCard>
                            ))}
                        </div>
                    </FitStage>
                </div>
            ))}
        </div>
    );
}

export default {
    title: 'Templates/Card',
    component: PatternCard,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        title: {
            control: 'text',
            table: { category: 'Content' },
        },
        description: {
            control: 'text',
            table: { category: 'Content' },
        },
        actions: {
            control: 'text',
            table: { category: 'Slots' },
        },
        header: {
            control: 'text',
            table: { category: 'Slots' },
        },
        image: {
            control: false,
            table: { category: 'Slots' },
        },
        footer: {
            control: 'text',
            table: { category: 'Slots' },
        },
        padding: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            table: { category: 'Design' },
        },
        gap: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            table: { category: 'Design' },
        },
        imagePlacement: {
            control: 'select',
            options: ['top', 'start', 'end'],
            table: { category: 'Design' },
        },
        imageSplit: {
            control: 'select',
            options: ['1/3', '1/2'],
            table: { category: 'Design' },
        },
        minWidth: {
            control: 'text',
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
    <div style={{ maxWidth: 'var(--card-min-width-lg)', width: '100%' }}>
        <PatternCard title="Card title" description="A line that says what the card holds.">
            {bodyCopy}
        </PatternCard>
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
        imagePlacement: 'top',
        imageSplit: '1/3',
    },
    render: (args) => (
        <PatternCard
            title={args.title || undefined}
            description={args.description || undefined}
            actions={args.actions || undefined}
            header={args.header || undefined}
            footer={args.footer || undefined}
            padding={args.padding}
            image={imagePlaceholder('16:9')}
            imagePlacement={args.imagePlacement}
            imageSplit={args.imageSplit}
            gap={args.gap}
            minWidth={args.minWidth || undefined}
        >
            {bodyCopy}
        </PatternCard>
    ),
};

/**
 * A PLUS card rests on the raised pair: the raised surface and its shadow,
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

/** Every part of a card: image, header with actions, body and footer. */
export const Anatomy = () => (
    <div style={{ maxWidth: 'var(--card-min-width-md)' }}>
        <PatternCard
            image={imagePlaceholder('16:9')}
            title="Ana Ruiz"
            description="Lincoln Middle · Thu 4:00 PM"
            actions={<IconButton icon="ellipsis-vertical" appearance="subtle" spacing="compact" label="More actions" onClick={() => {}} />}
            footer={viewSession}
        >
            {sessionBody}
        </PatternCard>
    </div>
);

export const Jobs = () => <CardJobs />;

/** One size per story: the pad, the radius and the minimum width move together. */
const sizedCard = (size) => (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
    <PatternCard
        padding={size}
        minWidth={`var(--card-min-width-${size})`}
        title="Ana Ruiz"
        description="Lincoln Middle · Thu 4:00 PM"
        footer={viewSession}
    >
        {sessionBody}
    </PatternCard>
    </div>
);

export const SizeSmall = { name: 'Small', render: () => sizedCard('sm') };
export const SizeMedium = { name: 'Medium', render: () => sizedCard('md') };
export const SizeLarge = { name: 'Large', render: () => sizedCard('lg') };

/** One image ratio per story, edge to edge above the padded content. */
const imageCard = (ratio) => (
    <PatternCard image={imagePlaceholder(ratio)} title="Ana Ruiz" description="Lincoln Middle · Thu 4:00 PM" style={{ width: 'var(--card-min-width-md)' }}>
        {sessionBody}
    </PatternCard>
);

export const ImageWide = { name: 'Image 16:9', render: () => imageCard('16:9') };
export const ImageStandard = { name: 'Image 4:3', render: () => imageCard('4:3') };
export const ImageSquare = { name: 'Image 1:1', render: () => imageCard('1:1') };

/** Each image placement retains the card's elevation states. */
const placementStory = (imagePlacement, state = 'rest', imageSplit = '1/3') => ({
    render: () => (
        <PatternCard imagePlacement={imagePlacement} imageSplit={imageSplit}
            image={<img alt="Session illustration" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90'%3E%3C/svg%3E"
                style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', background: 'var(--ds-skeleton)' }} />}
            title="Ana Ruiz" description="Lincoln Middle · Thu 4:00 PM" footer={viewSession}
            role="article" aria-label="Session summary" dragging={state === 'dragging'}
            onClick={state === 'hovered' || state === 'pressed' ? () => {} : undefined}
            data-hovered={state === 'hovered' || undefined} data-pressed={state === 'pressed' || undefined}
            style={{ width: 'var(--card-min-width-lg)', maxWidth: '100%' }}>
            {sessionBody}
        </PatternCard>
    ),
    play: async ({ canvasElement }) => {
        const card = within(canvasElement).getByRole('article', { name: 'Session summary' });
        const image = within(card).getByRole('img', { name: 'Session illustration' });
        const heading = within(card).getByRole('heading', { name: 'Ana Ruiz' });
        const root = card.getBoundingClientRect();
        const media = image.getBoundingClientRect();
        const title = heading.getBoundingClientRect();
        if (imagePlacement === 'top') {
            await expect(media.width).toBeCloseTo(root.width, 0);
            await expect(title.top).toBeGreaterThanOrEqual(media.bottom);
            await expect(media.width / media.height).toBeCloseTo(16 / 9, 2);
        } else {
            await expect(media.width).toBeCloseTo(root.width / (imageSplit === '1/2' ? 2 : 3), 0);
            await expect(media.height).toBeCloseTo(root.height, 0);
            await expect(media.top).toBe(root.top);
            await expect(getComputedStyle(image).objectFit).toBe('cover');
            if (imagePlacement === 'start') {
                await expect(media.left).toBe(root.left);
                await expect(title.left).toBeGreaterThanOrEqual(media.right);
            } else {
                await expect(media.right).toBe(root.right);
                await expect(title.right).toBeLessThanOrEqual(media.left);
            }
        }
        const typeProbe = document.createElement('span');
        typeProbe.style.font = `var(${imagePlacement !== 'top' && imageSplit === '1/2' ? '--heading-medium' : '--heading-xsmall'})`;
        card.appendChild(typeProbe);
        await expect(getComputedStyle(heading).fontSize).toBe(getComputedStyle(typeProbe).fontSize);
        typeProbe.remove();
        const surface = state === 'dragging' ? '--ds-surface-overlay' : state === 'hovered' ? '--ds-surface-raised-hovered' : state === 'pressed' ? '--ds-surface-raised-pressed' : '--ds-surface-raised';
        const shadow = state === 'dragging' || state === 'hovered' ? '--ds-shadow-overlay' : '--ds-shadow-raised';
        card.style.transition = 'none';
        await expect(getComputedStyle(card).backgroundColor).toBe(tokenColor(canvasElement, surface));
        await expect(getComputedStyle(card).boxShadow).toBe(computedShadow(canvasElement, `var(${shadow})`));
        await expect(getComputedStyle(card).overflow).toBe('hidden');
    },
});

export const ImageTop = placementStory('top', 'rest');
export const ImageTopHovered = placementStory('top', 'hovered');
export const ImageTopPressed = placementStory('top', 'pressed');
export const ImageTopDragging = placementStory('top', 'dragging');
export const ImageStart = placementStory('start', 'rest');
export const ImageStartHovered = placementStory('start', 'hovered');
export const ImageStartPressed = placementStory('start', 'pressed');
export const ImageStartDragging = placementStory('start', 'dragging');
export const ImageEnd = placementStory('end', 'rest');
export const ImageEndHovered = placementStory('end', 'hovered');
export const ImageEndPressed = placementStory('end', 'pressed');
export const ImageEndDragging = placementStory('end', 'dragging');
export const ImageStartHalf = placementStory('start', 'rest', '1/2');
export const ImageEndHalf = placementStory('end', 'rest', '1/2');
export const ImageTopIgnoresSplit = placementStory('top', 'rest', '1/2');

const slotNote = (text) => <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{text}</span>;

/** No header: the body carries its own title, as a metric tile does. */
export const BodyOnly = () => (
    <PatternCard style={{ maxWidth: 'var(--card-min-width-lg)' }}>{bodyCopy}</PatternCard>
);

/** A header with actions over the body, and a footer for actions that commit. */
export const WithFooter = () => (
    <PatternCard
        title="Card title"
        actions={slotNote('Actions slot')}
        footer={slotNote('Footer slot')}
        style={{ maxWidth: 'var(--card-min-width-lg)' }}
    >
        {bodyCopy}
    </PatternCard>
);

/** `header` replaces the title, description and actions. */
export const CustomHeader = () => (
    <PatternCard header={slotNote('Custom header slot: tabs or a toolbar')} style={{ maxWidth: 'var(--card-min-width-lg)' }}>
        {bodyCopy}
    </PatternCard>
);

/** A card at rest on the raised pair. */
export const Static = () => (
    <PatternCard title="Static" minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }}>{bodyCopy}</PatternCard>
);

/** A clickable card lifts while hovered and settles while pressed. */
export const Clickable = () => (
    <PatternCard title="Clickable" minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }} role="button" tabIndex={0} onClick={() => {}}>{bodyCopy}</PatternCard>
);

/** A dragged card is on the overlay pair. */
export const Dragging = () => (
    <PatternCard title="Dragging" minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }} dragging>{bodyCopy}</PatternCard>
);

/** Skeleton bars at the text line heights, in a card kept at its final size. */
export const LoadingCard = {
    name: 'Loading',
    render: () => (
        <PatternCard aria-busy="true" style={{ width: 'var(--card-min-width-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
                <Skeleton shape="text" width="50%" />
                <Skeleton shape="text" width="75%" />
                <Skeleton shape="text" width="100%" />
                <Skeleton shape="text" width="40%" />
            </div>
        </PatternCard>
    ),
};

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

/** Cards reflow at the large minimum width independently of the page width. */
export const PlacementBoundary = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {['start', 'end'].flatMap((placement) => ['1/3', '1/2'].map((split) => (
                <PatternCard key={`${placement}-${split}`} imagePlacement={placement} imageSplit={split}
                    image={imagePlaceholder('1:1')} title="Ana Ruiz" role="article"
                    aria-label={`${placement} ${split}`} style={{ width: 479 }}>
                    {sessionBody}
                </PatternCard>
            )))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        for (const placement of ['start', 'end']) {
            for (const split of ['1/3', '1/2']) {
                const card = within(canvasElement).getByRole('article', { name: `${placement} ${split}` });
                const image = card.firstElementChild;
                const heading = within(card).getByRole('heading', { name: 'Ana Ruiz' });
                for (const width of [479, 480, 600, 479]) {
                    card.style.width = `${width}px`;
                    await waitFor(() => {
                        const media = image.getBoundingClientRect();
                        expect(media.width).toBeCloseTo(width < 480 ? width : width / (split === '1/2' ? 2 : 3), 0);
                        if (width < 480) {
                            expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(media.bottom);
                            expect(media.height).toBeCloseTo(width, 0);
                        }
                    });
                }
            }
        }
    },
};
