import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Card from '@/components/Card';

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
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIA SUPPORT</span>
                <Card image={imageCap} title="Card Title" body="Some quick example text to build on the card title and make up the bulk of the card's content." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SUBTITLES</span>
                <Card
                    title="Card Title"
                    subtitle="Card Subtitle"
                    body="Some quick example text to build on the card title and make up the bulk of the card's content."
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
    title: 'Components/Card',
    component: Card,
    tags: ['!dev'],
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
            description: 'Show card border',
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
        source: { language: 'html', code: webAppSourceSnippets.card }
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
        showBorder: true,
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
