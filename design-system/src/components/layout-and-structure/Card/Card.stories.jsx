import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Card from '@/components/layout-and-structure/Card';

const cardCol = { display: 'flex', flexDirection: 'column', gap: '24px' };

const imageCap = (
    <div
        style={{
            width: '100%',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-surface-variant)',
            color: 'var(--color-on-surface-variant)'
        }}
    >
        Image cap
    </div>
);

/** Title, body, subtitle, and media slot — docs section only */
function CardContentDemos() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">BASIC INFO</span>
                <Card
                    title="Card Title"
                    body="Some quick example text to build on the card title and make up the bulk of the card's content."
                    actionButton={{ text: 'Go somewhere', onClick: () => {} }}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIA SUPPORT</span>
                <Card
                    image={imageCap}
                    title="Card Title"
                    body="Some quick example text to build on the card title and make up the bulk of the card's content."
                    actionButton={{ text: 'Go somewhere', onClick: () => {} }}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SUBTITLES</span>
                <Card
                    title="Card Title"
                    subtitle="Card Subtitle"
                    body="Some quick example text to build on the card title and make up the bulk of the card's content."
                    actionButton={{ text: 'Go somewhere', onClick: () => {} }}
                />
            </div>
        </div>
    );
}

/** Actions, links, and lists */
function CardActionsDemos() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">BUTTON ACTIONS</span>
                <Card
                    title="Card Title"
                    body="Some quick example text to build on the card title and make up the bulk of the card's content."
                    actionButton={{
                        text: 'Go somewhere',
                        onClick: () => console.log('Button clicked')
                    }}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LINK ACTIONS</span>
                <Card
                    title="Card Title"
                    body="Some quick example text to build on the card title and make up the bulk of the card's content."
                    links={[
                        { text: 'Card link', href: '#', onClick: () => console.log('Link 1 clicked') },
                        { text: 'Another link', href: '#', onClick: () => console.log('Link 2 clicked') }
                    ]}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LIST ITEMS</span>
                <Card title="Card Title" items={['Item #1', 'Item #2', 'Item #3']} />
            </div>
        </div>
    );
}

/** Dense layout: header, footer, media, links, and action together */
function CardLayoutDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DENSE LAYOUT</span>
            <Card
                image={imageCap}
                title="Card Title"
                subtitle="Card Subtitle"
                body="Some quick example text to build on the card title and make up the bulk of the card's content."
                header="Header"
                items={['Item #1', 'Item #2']}
                footer="Footer"
                links={[
                    { text: 'Card link', href: '#' },
                    { text: 'Another link', href: '#' }
                ]}
                actionButton={{
                    text: 'Action',
                    onClick: () => console.log('Action clicked')
                }}
            />
        </div>
    );
}

export default {
    title: 'Components/Layout and structure/Card',
    component: Card,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        contentPreset: {
            control: 'select',
            options: ['basic', 'media', 'action', 'links', 'list', 'full'],
            description: 'Curated card content combination',
            table: { category: 'Content' },
        },
        title: {
            control: 'text',
            description: 'Card title',
            table: { category: 'Content' },
        },
        subtitle: {
            control: 'text',
            description: 'Optional subtitle',
            table: { category: 'Content' },
        },
        body: {
            control: 'text',
            description: 'Card body copy',
            table: { category: 'Content' },
        },
        paddingSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Card padding size',
            table: { category: 'Design' },
        },
        gapSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Card gap size',
            table: { category: 'Design' },
        },
        radiusSize: {
            control: 'select',
            options: ['sm', 'md'],
            description: 'Card border radius size',
            table: { category: 'Design' },
        },
        borderSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Card border size',
            table: { category: 'Design' },
        },
        showBorder: {
            control: 'boolean',
            description: 'Bordered option: flat on a 1px outline instead of the raised shadow',
            table: { category: 'Design' },
        },
        text: {
            control: 'inline-radio',
            options: ['wrap', 'truncate'],
            description: 'truncate clamps the title to one line and the subtitle and body to three',
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
        image: {
            table: { disable: true, category: 'Development' },
        },
        header: {
            table: { disable: true, category: 'Development' },
        },
        footer: {
            table: { disable: true, category: 'Development' },
        },
        links: {
            table: { disable: true, category: 'Development' },
        },
        items: {
            table: { disable: true, category: 'Development' },
        },
        actionButton: {
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Content = () => (
    <div style={cardCol}>
        <CardContentDemos />
    </div>
);

export const Actions = () => (
    <div style={cardCol}>
        <CardActionsDemos />
    </div>
);

export const Layout = () => (
    <div style={cardCol}>
        <CardLayoutDemo />
    </div>
);

export const Overview = () => (
    <div style={{ maxWidth: '400px', width: '100%' }}>
        <Card
            title="Card Title"
            body="Some quick example text to build on the card title and make up the bulk of the card's content."
        />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.card }
    }
};

export const Interactive = {
    args: {
        contentPreset: 'basic',
        title: 'Card Title',
        subtitle: 'Card Subtitle',
        body: "Some quick example text to build on the card title and make up the bulk of the card's content.",
        paddingSize: 'md',
        gapSize: 'md',
        radiusSize: 'sm',
        borderSize: 'sm',
        showBorder: false,
        text: 'wrap',
    },
    render: (args) => {
        const contentPreset = args.contentPreset || 'basic';

        return (
            <Card
                title={args.title}
                subtitle={args.subtitle}
                body={args.body}
                paddingSize={args.paddingSize}
                gapSize={args.gapSize}
                radiusSize={args.radiusSize}
                borderSize={args.borderSize}
                showBorder={args.showBorder}
                text={args.text}
                image={['media', 'full'].includes(contentPreset) ? imageCap : undefined}
                header={contentPreset === 'full' ? 'Header' : undefined}
                footer={contentPreset === 'full' ? 'Footer' : undefined}
                items={['list', 'full'].includes(contentPreset) ? ['Item #1', 'Item #2', 'Item #3'] : undefined}
                links={['links', 'full'].includes(contentPreset)
                    ? [
                        { text: 'Card link', href: '#' },
                        { text: 'Another link', href: '#' }
                    ]
                    : undefined}
                actionButton={['action', 'full'].includes(contentPreset)
                    ? {
                        text: contentPreset === 'full' ? 'Action' : 'Go somewhere',
                        onClick: () => console.log('Card action clicked')
                    }
                    : undefined}
            />
        );
    },
};

/**
 * A card rests on the raised pair, the raised surface with its shadow and no
 * border. A clickable card lifts to the overlay shadow while hovered, settles
 * back to the raised shadow while pressed, and a dragged card sits at overlay.
 * The bordered option stays flat on its outline.
 */
export const Elevation = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <Card title="Static" body="Sits on the page." />
            <Card title="Clickable" body="Opens a session." onClick={() => {}} />
            <Card title="Dragging" body="Being moved." dragging />
            <Card title="Bordered" body="Flat on its outline." showBorder />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const card = (name) => within(canvasElement).getByText(name).closest('.plus-card');
        const still = (el) => {
            el.style.transition = 'none';
            return el;
        };
        const shadow = (el) => getComputedStyle(still(el)).boxShadow;
        const fill = (el) => getComputedStyle(still(el)).backgroundColor;
        const raised = computedShadow(canvasElement, 'var(--ds-shadow-raised)');
        const overlay = computedShadow(canvasElement, 'var(--ds-shadow-overlay)');

        await expect(shadow(card('Static')), 'a static card rests on the raised shadow').toBe(raised);
        await expect(fill(card('Static')), 'the raised surface').toBe(tokenColor(canvasElement, '--ds-surface-raised'));
        await expect(getComputedStyle(card('Static')).borderTopWidth, 'a raised card has no border').toBe('0px');
        await expect(shadow(card('Clickable')), 'a clickable card rests on the raised shadow').toBe(raised);
        await expect(withForcedPseudo(card('Static'), ':hover', () => shadow(card('Static'))), 'hovering a static card').toBe(raised);
        await expect(withForcedPseudo(card('Clickable'), ':hover', () => shadow(card('Clickable'))), 'hovering a clickable card lifts').toBe(overlay);
        await expect(withForcedPseudo(card('Clickable'), ':active', () => shadow(card('Clickable'))), 'pressing settles back').toBe(raised);
        await expect(withForcedPseudo(card('Clickable'), ':active', () => fill(card('Clickable'))), 'the pressed surface').toBe(tokenColor(canvasElement, '--ds-surface-raised-pressed'));
        await expect(shadow(card('Dragging')), 'a dragged card').toBe(overlay);
        await expect(shadow(card('Bordered')), 'the bordered option is flat').toBe('none');
        await expect(getComputedStyle(card('Bordered')).borderTopColor, 'the outline role').toBe(tokenColor(canvasElement, '--color-outline-variant'));
    },
};

const longTitle = 'A card title that runs on well past the width of the card it sits in';
const longBody = 'Some quick example text that keeps going so the clamp has something to cut. It carries on across several lines of the card body, past the third, so the wrapped card shows all of it and the truncated card ends in an ellipsis.';

/** `text="truncate"` clamps the title to one line and the body to three; `wrap`, the default, shows everything. */
export const TextClamp = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ width: '280px' }}><Card title={longTitle} subtitle={longBody} body={longBody} /></div>
            <div style={{ width: '280px' }}><Card title={longTitle} subtitle={longBody} body={longBody} text="truncate" /></div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [wrapped, clamped] = within(canvasElement).getAllByRole('heading').map((h) => h.closest('.plus-card'));
        const part = (card, cls) => card.querySelector(cls);
        await expect(wrapped.classList.contains('plus-card--truncate'), 'wrap is the default').toBe(false);
        await expect(getComputedStyle(part(wrapped, '.plus-card-title')).whiteSpace, 'wrapped title').not.toBe('nowrap');
        await expect(getComputedStyle(part(clamped, '.plus-card-title')).whiteSpace, 'clamped title keeps one line').toBe('nowrap');
        await expect(getComputedStyle(part(clamped, '.plus-card-title')).textOverflow).toBe('ellipsis');
        await expect(part(clamped, '.plus-card-body').scrollHeight, 'the clamped body is cut').toBeGreaterThan(part(clamped, '.plus-card-body').clientHeight);
        await expect(part(wrapped, '.plus-card-body').scrollHeight, 'the wrapped body is whole').toBeLessThanOrEqual(part(wrapped, '.plus-card-body').clientHeight);
    },
};
