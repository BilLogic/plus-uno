import React from 'react';
import { expect, within, waitFor } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { Card } from '@/templates';
import { Skeleton, Button, IconButton, Image, LinkButton } from '@/components';
import { CardJobs } from './CardCases.jsx';
import { ScrollStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import sessionSummaryLight from '@/assets/images/kit/session-summary-light.svg';

const bodyCopy = (
    <p className="body-lg" style={{ margin: 0 }}>
        Reviewed two-step equations with Ava T. and assigned practice set 4 for Thursday’s session.
    </p>
);

const DemoCaption = ({ children }) => (
    <span
        style={{
            display: 'block',
            marginBottom: 'var(--stack-md)',
            font: 'var(--heading-xxs)',
            color: 'var(--ds-text-subtle)',
        }}
    >
        {children}
    </span>
);

const sessionBody = (
    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Last note: practice set 4 assigned</p>
);

/** One action that goes somewhere is a link, hugging the start of the footer. */
const viewSession = <LinkButton text="View session" href="#view-session" appearance="link" spacing="compact" onClick={(event) => event.preventDefault()} />;

const imagePlaceholder = (ratio) => (
    <Image
        src={sessionSummaryLight}
        alt={`Weekly tutoring session summary (${ratio})`}
    />
);

/** A row of cards at three content widths: the most that keeps each card at its minimum. */
function CardRowsDemo() {
    const people = [
        ['Ana Ruiz', 'Lincoln Middle · Thu 4:00 PM'],
        ['Marcus Lee', 'Roosevelt K-8 · Thu 5:00 PM'],
        ['Priya Shah', 'North High · Fri 3:30 PM'],
        ['Jordan Kim', 'South High · Fri 4:15 PM'],
        ['Ana Ruiz', 'Lincoln Middle · Thu 4:00 PM'],
        ['Marcus Lee', 'Roosevelt K-8 · Thu 5:00 PM'],
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' /* token gap: 48px */ }}>
            {[['Medium', 720], ['Large', 736], ['X-Large', 1152]].map(([mode, width]) => (
                <div key={mode}>
                    <DemoCaption>{`${mode} · content ${width}`}</DemoCaption>
                    {/* Each row renders at 1:1 scale inside a horizontally scrollable box when wider than the column. */}
                    <ScrollStage width={width}>
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
                                <Card key={`${name}-${i}`} title={name} description={detail} footer={viewSession}>
                                    {sessionBody}
                                </Card>
                            ))}
                        </div>
                    </ScrollStage>
                </div>
            ))}
        </div>
    );
}

export default {
    title: 'Templates/Card',
    component: Card,
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
        surface: {
            control: 'select',
            options: ['sunken', 'default', 'raised'],
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
        imageRatio: {
            control: 'select',
            options: ['16:9', '4:3', '1:1'],
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
        <Card title="Grade 7 math · Session 4" description="Lincoln Middle · Thu 4:00 PM">
            {bodyCopy}
        </Card>
    </div>
);

export const Interactive = {
    args: {
        title: 'Card title',
        description: 'A line that says what the card holds.',
        actions: '',
        header: '',
        footer: 'Footer slot',
        surface: 'sunken',
        gap: 'md',
        minWidth: '',
        imagePlacement: 'top',
        imageRatio: '16:9',
        imageSplit: '1/3',
    },
    render: (args) => (
        <Card
            title={args.title || undefined}
            description={args.description || undefined}
            actions={args.actions || undefined}
            header={args.header || undefined}
            footer={args.footer || undefined}
            surface={args.surface}
            image={imagePlaceholder('16:9')}
            imagePlacement={args.imagePlacement}
            imageRatio={args.imageRatio}
            imageSplit={args.imageSplit}
            gap={args.gap}
            minWidth={args.minWidth || undefined}
        >
            {bodyCopy}
        </Card>
    ),
};

/**
 * A PLUS card defaults to `sunken` (`--ds-surface-sunken`, flat). `default` uses
 * `--ds-surface` with a 1px `--ds-border`, flat. `raised` uses the raised
 * pair. A clickable sunken or default card lifts to Raised on hover in place
 * and settles to `--ds-surface-raised-pressed` with `--ds-shadow-raised`; a
 * clickable raised card lifts to hovered + overlay shadow and settles back
 * while pressed; a dragged card keeps the overlay pair. Held in all four
 * modes, with a 1px border width on every card and `--ds-utility-elevation-surface-current`
 * following the chosen surface.
 */
export const Elevation = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--inline-2xl)', flexWrap: 'wrap' }}>
            <Card title="Sunken" minWidth={200 /* token gap: 200px */}>
                <div data-surface-probe="sunken" style={{ background: 'var(--ds-utility-elevation-surface-current)' }}>
                    {bodyCopy}
                </div>
            </Card>
            <Card surface="default" title="Default" minWidth={200 /* token gap: 200px */}>
                <div data-surface-probe="default" style={{ background: 'var(--ds-utility-elevation-surface-current)' }}>
                    {bodyCopy}
                </div>
            </Card>
            <Card surface="raised" title="Raised" minWidth={200 /* token gap: 200px */}>
                <div data-surface-probe="raised" style={{ background: 'var(--ds-utility-elevation-surface-current)' }}>
                    {bodyCopy}
                </div>
            </Card>
            <Card title="Clickable sunken" minWidth={200 /* token gap: 200px */} role="button" tabIndex={0} onClick={() => {}}>{bodyCopy}</Card>
            <Card surface="default" title="Clickable default" minWidth={200 /* token gap: 200px */} role="button" tabIndex={0} onClick={() => {}}>{bodyCopy}</Card>
            <Card surface="raised" title="Clickable raised" minWidth={200 /* token gap: 200px */} role="button" tabIndex={0} onClick={() => {}}>{bodyCopy}</Card>
            <Card title="Dragging" minWidth={200 /* token gap: 200px */} dragging>{bodyCopy}</Card>
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        const card = (name) => {
            const el = canvas.getByText(name).closest('.plus-template-card');
            el.style.transition = 'none';
            return el;
        };
        const paint = (el) => {
            const style = getComputedStyle(el);
            return { shadow: style.boxShadow, fill: style.backgroundColor };
        };
        const pair = (surface, shadow) => ({
            shadow: shadow ? computedShadow(canvasElement, `var(${shadow})`) : 'none',
            fill: tokenColor(canvasElement, surface),
        });
        const lightRaised = tokenColor(canvasElement, '--ds-surface-raised');

        await inEveryColorMode(async (mode) => {
            const sunkenRest = pair('--ds-surface-sunken', null);
            const defaultRest = pair('--ds-surface', null);
            const raisedRest = pair('--ds-surface-raised', '--ds-shadow-raised');
            const sunkenStatic = card('Sunken');
            const defaultStatic = card('Default');
            const raisedStatic = card('Raised');
            const clickableSunken = card('Clickable sunken');
            const clickableDefault = card('Clickable default');
            const clickableRaised = card('Clickable raised');

            await expect(paint(sunkenStatic), `${mode}: default card rests on sunken, flat`).toEqual(sunkenRest);
            await expect(paint(defaultStatic), `${mode}: default surface rests on --ds-surface, flat`).toEqual(defaultRest);
            await expect(paint(raisedStatic), `${mode}: raised surface rests on the raised pair`).toEqual(raisedRest);

            await expect(getComputedStyle(canvasElement.querySelector('[data-surface-probe="sunken"]')).backgroundColor, `${mode}: surface-current follows sunken`).toBe(sunkenRest.fill);
            await expect(getComputedStyle(canvasElement.querySelector('[data-surface-probe="default"]')).backgroundColor, `${mode}: surface-current follows default`).toBe(defaultRest.fill);
            await expect(getComputedStyle(canvasElement.querySelector('[data-surface-probe="raised"]')).backgroundColor, `${mode}: surface-current follows raised`).toBe(raisedRest.fill);

            await expect(withForcedPseudo(sunkenStatic, ':hover', () => paint(sunkenStatic)), `${mode}: hovering a static sunken card`).toEqual(sunkenRest);
            await expect(withForcedPseudo(clickableSunken, ':hover', () => paint(clickableSunken)), `${mode}: hovering a clickable sunken card lifts to Raised`)
                .toEqual(raisedRest);
            await expect(withForcedPseudo(clickableSunken, ':active', () => paint(clickableSunken)), `${mode}: pressing a clickable sunken card settles to raised shadow`)
                .toEqual(pair('--ds-surface-raised-pressed', '--ds-shadow-raised'));

            await expect(withForcedPseudo(clickableDefault, ':hover', () => paint(clickableDefault)), `${mode}: hovering a clickable default card lifts to Raised`)
                .toEqual(raisedRest);
            await expect(withForcedPseudo(clickableDefault, ':active', () => paint(clickableDefault)), `${mode}: pressing a clickable default card settles to raised shadow`)
                .toEqual(pair('--ds-surface-raised-pressed', '--ds-shadow-raised'));

            await expect(withForcedPseudo(clickableRaised, ':hover', () => paint(clickableRaised)), `${mode}: hovering a clickable raised card`)
                .toEqual(pair('--ds-surface-raised-hovered', '--ds-shadow-overlay'));
            await expect(withForcedPseudo(clickableRaised, ':active', () => paint(clickableRaised)), `${mode}: pressing a clickable raised card`)
                .toEqual(pair('--ds-surface-raised-pressed', '--ds-shadow-raised'));

            await expect(paint(card('Dragging')), `${mode}: a dragged card`).toEqual(pair('--ds-surface-overlay', '--ds-shadow-overlay'));

            await expect(getComputedStyle(sunkenStatic).borderTopWidth, `${mode}: sunken keeps a 1px transparent border`).toBe('1px');
            await expect(getComputedStyle(defaultStatic).borderTopWidth, `${mode}: default keeps a 1px border`).toBe('1px');
            await expect(getComputedStyle(defaultStatic).borderTopColor, `${mode}: default border uses --ds-border`).toBe(tokenColor(canvasElement, '--ds-border'));
            await expect(getComputedStyle(raisedStatic).borderTopWidth, `${mode}: raised keeps a 1px transparent border`).toBe('1px');
            await expect(getComputedStyle(sunkenStatic).color, `${mode}: card text`).toBe(tokenColor(canvasElement, '--ds-text'));
            if (mode.startsWith('dark')) {
                await expect(raisedRest.fill, `${mode}: the raised surface moves with the mode`).not.toBe(lightRaised);
            }
        });
    },
};

/** Every part of a card: image, header with actions, body and footer. */
export const Anatomy = () => (
    <div style={{ maxWidth: 'var(--card-min-width-md)' }}>
        <Card
            image={imagePlaceholder('16:9')}
            title="Ana Ruiz"
            description="Lincoln Middle · Thu 4:00 PM"
            actions={<IconButton icon="ellipsis-vertical" appearance="subtle" spacing="compact" label="More actions" onClick={() => {}} />}
            footer={viewSession}
        >
            {sessionBody}
        </Card>
    </div>
);

export const Jobs = () => <CardJobs />;

/** One minimum width per story; every width uses the same pad (16) and radius (16). */
const sizedCard = (width) => (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
    <Card
        minWidth={`var(--card-min-width-${width})`}
        title="Ana Ruiz"
        description="Lincoln Middle · Thu 4:00 PM"
        footer={viewSession}
    >
        {sessionBody}
    </Card>
    </div>
);

const assertCardPadAndRadius = async ({ canvasElement }) => {
    const card = canvasElement.querySelector('.plus-template-card');
    const inner = canvasElement.querySelector('.plus-template-card-inner');
    const cardStyle = getComputedStyle(card);
    const innerStyle = getComputedStyle(inner);
    for (const corner of ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']) {
        await expect(cardStyle[`border${corner}Radius`], `card ${corner} radius is 16px`).toBe('16px');
    }
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        await expect(innerStyle[`padding${side}`], `card ${side} padding is 16px`).toBe('16px');
    }
};

export const MinWidth224 = { name: 'Minimum width 224', render: () => sizedCard('sm'), play: assertCardPadAndRadius };
export const MinWidth304 = { name: 'Minimum width 304', render: () => sizedCard('md'), play: assertCardPadAndRadius };
export const MinWidth480 = { name: 'Minimum width 480', render: () => sizedCard('lg'), play: assertCardPadAndRadius };

/** One image ratio per story, edge to edge above the padded content. */
const imageCard = (ratio) => (
    <Card image={imagePlaceholder(ratio)} imageRatio={ratio} title="Ana Ruiz" description="Lincoln Middle · Thu 4:00 PM" style={{ width: 'var(--card-min-width-md)' }}>
        {sessionBody}
    </Card>
);

export const ImageWide = { name: 'Image 16:9', render: () => imageCard('16:9') };
export const ImageStandard = { name: 'Image 4:3', render: () => imageCard('4:3') };
export const ImageSquare = { name: 'Image 1:1', render: () => imageCard('1:1') };

/** The image height follows the card width for each ratio, rounded to a multiple of 4. */
export const ImageRatioGrid = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {['16:9', '4:3', '1:1'].flatMap((ratio) => [240, 333, 477].map((width) => (
                <Card key={`${ratio}-${width}`} role="article" aria-label={`${ratio} at ${width}`}
                    image={imagePlaceholder(ratio)} imageRatio={ratio} title="Ana Ruiz"
                    style={{ width }}>
                    {sessionBody}
                </Card>
            )))}
        </div>
    ),
    play: async ({ canvas }) => {
        for (const ratio of ['16:9', '4:3', '1:1']) {
            const [w, h] = ratio.split(':').map(Number);
            for (const width of [240, 333, 477]) {
                const card = canvas.getByRole('article', { name: `${ratio} at ${width}` });
                const media = card.firstElementChild.getBoundingClientRect();
                await expect(media.height % 4, `${ratio} at ${width} is a multiple of 4`).toBe(0);
                await expect(Math.abs(media.height - (card.clientWidth * h) / w), `${ratio} at ${width} follows the width`).toBeLessThanOrEqual(2);
                await expect(getComputedStyle(card.firstElementChild.firstElementChild).objectFit).toBe('cover');
            }
        }
    },
};

/** Without `imageRatio` the image is 16:9. */
export const ImageRatioDefault = {
    render: () => (
        <Card role="article" aria-label="Default ratio" image={imagePlaceholder('16:9')} title="Ana Ruiz" style={{ width: 320 }}>
            {sessionBody}
        </Card>
    ),
    play: async ({ canvas }) => {
        const card = canvas.getByRole('article', { name: 'Default ratio' });
        const media = card.firstElementChild.getBoundingClientRect();
        await expect(media.height % 4).toBe(0);
        await expect(Math.abs(media.height - (card.clientWidth * 9) / 16)).toBeLessThanOrEqual(2);
    },
};

/** Each image placement retains the card's elevation states. */
const placementStory = (imagePlacement, state = 'rest', imageSplit = '1/3') => ({
    render: () => (
        <Card surface="raised" imagePlacement={imagePlacement} imageSplit={imageSplit}
            image={<Image alt="Session illustration" src={sessionSummaryLight}
                />}
            title="Ana Ruiz" description="Lincoln Middle · Thu 4:00 PM" footer={viewSession}
            role="article" aria-label="Session summary" dragging={state === 'dragging'}
            onClick={state === 'hovered' || state === 'pressed' ? () => {} : undefined}
            data-hovered={state === 'hovered' || undefined} data-pressed={state === 'pressed' || undefined}
            style={{ width: 'var(--card-min-width-lg)', maxWidth: '100%' }}>
            {sessionBody}
        </Card>
    ),
    play: async ({ canvas, canvasElement }) => {
        const card = canvas.getByRole('article', { name: 'Session summary' });
        const image = within(card).getByRole('img', { name: 'Session illustration' });
        const heading = within(card).getByRole('heading', { name: 'Ana Ruiz' });
        const root = card.getBoundingClientRect();
        const inner = { width: card.clientWidth, height: card.clientHeight };
        const borderX = parseFloat(getComputedStyle(card).borderLeftWidth);
        const borderY = parseFloat(getComputedStyle(card).borderTopWidth);
        const media = image.getBoundingClientRect();
        const title = heading.getBoundingClientRect();
        if (imagePlacement === 'top') {
            await expect(media.width).toBeCloseTo(inner.width, 0);
            await expect(title.top).toBeGreaterThanOrEqual(media.bottom);
            await expect(media.height % 4).toBe(0);
            await expect(Math.abs(media.height - (media.width * 9) / 16)).toBeLessThanOrEqual(2);
        } else {
            await expect(media.width).toBeCloseTo(inner.width / (imageSplit === '1/2' ? 2 : 3), 0);
            await expect(media.height).toBeCloseTo(inner.height, 0);
            await expect(media.top).toBeCloseTo(root.top + borderY, 0);
            await expect(getComputedStyle(image).objectFit).toBe('cover');
            if (imagePlacement === 'start') {
                await expect(media.left).toBeCloseTo(root.left + borderX, 0);
                await expect(title.left).toBeGreaterThanOrEqual(media.right);
            } else {
                await expect(media.right).toBeCloseTo(root.right - borderX, 0);
                await expect(title.right).toBeLessThanOrEqual(media.left);
            }
        }
        const typeProbe = document.createElement('span');
        typeProbe.style.font = `var(${imagePlacement !== 'top' && imageSplit === '1/2' ? '--heading-md' : '--heading-xs'})`;
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

const slotNote = (text) => <span style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>{text}</span>;

/** No header: the body carries its own title, as a metric tile does. */
export const BodyOnly = () => (
    <Card style={{ maxWidth: 'var(--card-min-width-lg)' }}>{bodyCopy}</Card>
);

/** A header with actions over the body, and a footer for actions that commit. */
export const WithFooter = () => (
    <Card
        title="Grade 7 math · Session 4"
        actions={slotNote('Save or edit')}
        footer={slotNote('Next: Practice set 4')}
        style={{ maxWidth: 'var(--card-min-width-lg)' }}
    >
        {bodyCopy}
    </Card>
);

/** `header` replaces the title, description and actions. */
export const CustomHeader = () => (
    <Card header={slotNote('Session notes · Oct 24')} style={{ maxWidth: 'var(--card-min-width-lg)' }}>
        {bodyCopy}
    </Card>
);

/** Sunken surface (default): `--ds-surface-sunken`, flat. */
export const SurfaceSunken = {
    render: () => (
        <Card title="Sunken" description="Default flat surface for grouping static content." minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }}>
            {bodyCopy}
        </Card>
    ),
    play: async ({ canvas, canvasElement }) => {
        const card = canvas.getByText('Sunken').closest('.plus-template-card');
        card.style.transition = 'none';
        await expect(getComputedStyle(card).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(getComputedStyle(card).boxShadow).toBe('none');
    },
};

/** Default surface: `--ds-surface` with a 1px `--ds-border`, flat. */
export const SurfaceDefault = {
    render: () => (
        <Card surface="default" title="Default" description="Page fill with a 1px border, flat." minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }}>
            {bodyCopy}
        </Card>
    ),
    play: async ({ canvas, canvasElement }) => {
        const card = canvas.getByText('Default').closest('.plus-template-card');
        card.style.transition = 'none';
        await expect(getComputedStyle(card).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface'));
        await expect(getComputedStyle(card).borderTopWidth).toBe('1px');
        await expect(getComputedStyle(card).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border'));
        await expect(getComputedStyle(card).boxShadow).toBe('none');
    },
};

/** Raised surface: `--ds-surface-raised` with `--ds-shadow-raised`. */
export const SurfaceRaised = {
    render: () => (
        <Card surface="raised" title="Raised" description="Primary card per view, first in reading order." minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }}>
            {bodyCopy}
        </Card>
    ),
    play: async ({ canvas, canvasElement }) => {
        const card = canvas.getByText('Raised').closest('.plus-template-card');
        card.style.transition = 'none';
        await expect(getComputedStyle(card).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-raised'));
        await expect(getComputedStyle(card).boxShadow).toBe(computedShadow(canvasElement, 'var(--ds-shadow-raised)'));
    },
};

/** A card at rest on the default sunken surface. */
export const Static = () => (
    <Card title="Static" minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }}>{bodyCopy}</Card>
);

/** A clickable sunken card lifts to Raised on hover and settles to the raised shadow while pressed. */
export const Clickable = {
    render: () => (
        <Card title="Clickable" minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }} role="button" tabIndex={0} onClick={() => {}}>{bodyCopy}</Card>
    ),
    play: async ({ canvas, canvasElement }) => {
        const card = canvas.getByText('Clickable').closest('.plus-template-card');
        card.style.transition = 'none';
        await expect(getComputedStyle(card).boxShadow).toBe('none');
        const hoveredShadow = withForcedPseudo(card, ':hover', () => getComputedStyle(card).boxShadow);
        await expect(hoveredShadow).toBe(computedShadow(canvasElement, 'var(--ds-shadow-raised)'));
        await expect(hoveredShadow).not.toBe('none');
    },
};

/** A dragged card keeps the overlay pair. */
export const Dragging = {
    render: () => (
        <Card title="Dragging" minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-md)' }} dragging>{bodyCopy}</Card>
    ),
    play: async ({ canvas, canvasElement }) => {
        const card = canvas.getByText('Dragging').closest('.plus-template-card');
        card.style.transition = 'none';
        await expect(getComputedStyle(card).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-overlay'));
        await expect(getComputedStyle(card).boxShadow).toBe(computedShadow(canvasElement, 'var(--ds-shadow-overlay)'));
    },
};

/** Every surface keeps a 1px border width so forced colors draw its edge. */
export const ForcedColors = {
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--inline-2xl)', flexWrap: 'wrap' }}>
            <Card surface="sunken" title="Sunken" minWidth="var(--card-min-width-sm)">{bodyCopy}</Card>
            <Card surface="default" title="Default" minWidth="var(--card-min-width-sm)">{bodyCopy}</Card>
            <Card surface="raised" title="Raised" minWidth="var(--card-min-width-sm)">{bodyCopy}</Card>
        </div>
    ),
    play: async ({ canvas }) => {
        for (const label of ['Sunken', 'Default', 'Raised']) {
            const card = canvas.getByText(label).closest('.plus-template-card');
            await expect(getComputedStyle(card).borderTopWidth, `${label} keeps a 1px border width`).toBe('1px');
            await expect(getComputedStyle(card).borderTopStyle, `${label} border is solid`).toBe('solid');
        }
    },
};

/** Skeleton bars at the text line heights, in a card kept at its final size. */
export const LoadingCard = {
    name: 'Loading',
    render: () => (
        <Card aria-busy="true" style={{ width: 'var(--card-min-width-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
                <Skeleton shape="text" width="50%" />
                <Skeleton shape="text" width="75%" />
                <Skeleton shape="text" width="100%" />
                <Skeleton shape="text" width="40%" />
            </div>
        </Card>
    ),
};

/** At the content widths of the three modes, a md card row holds 2, 2 and 3 cards. */
export const Rows = {
    render: () => <CardRowsDemo />,
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const count = (mode) => {
            const cards = Array.from(canvasElement.querySelector(`[data-row="${mode}"]`).children);
            const top = Math.min(...cards.map((card) => Math.round(card.getBoundingClientRect().top)));
            return cards.filter((card) => Math.round(card.getBoundingClientRect().top) === top).length;
        };
        await expect(count('Medium'), 'Medium holds 2 md cards').toBe(2);
        await expect(count('Large'), 'Large holds 2 md cards').toBe(2);
        await expect(count('X-Large'), 'X-Large holds 3 md cards').toBe(3);
        const firstAction = canvas.getAllByRole('link', { name: 'View session' })[0];
        firstAction.focus();
        await expect(firstAction).toHaveFocus();
    },
};

/** Cards reflow at the large minimum width independently of the page width. */
export const PlacementBoundary = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {['start', 'end'].flatMap((placement) => ['1/3', '1/2'].map((split) => (
                <Card key={`${placement}-${split}`} imagePlacement={placement} imageSplit={split}
                    image={imagePlaceholder('1:1')} imageRatio="1:1" title="Ana Ruiz" role="article"
                    aria-label={`${placement} ${split}`} style={{ width: 479 /* token gap: 479px */ }}>
                    {sessionBody}
                </Card>
            )))}
        </div>
    ),
    play: async ({ canvas }) => {
        for (const placement of ['start', 'end']) {
            for (const split of ['1/3', '1/2']) {
                const card = canvas.getByRole('article', { name: `${placement} ${split}` });
                const image = card.firstElementChild;
                const heading = within(card).getByRole('heading', { name: 'Ana Ruiz' });
                for (const width of [479, 480, 600, 479]) {
                    card.style.width = `${width}px`;
                    await waitFor(() => {
                        const innerWidth = card.clientWidth;
                        const media = image.getBoundingClientRect();
                        expect(media.width).toBeCloseTo(width < 480 ? innerWidth : innerWidth / (split === '1/2' ? 2 : 3), 0);
                        if (width < 480) {
                            expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(media.bottom);
                            expect(Math.abs(media.height - innerWidth)).toBeLessThanOrEqual(2);
                        }
                    });
                }
            }
        }
    },
};
