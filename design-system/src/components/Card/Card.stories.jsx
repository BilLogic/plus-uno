import React from 'react';
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
        <>
            <Card
                title="Card Title"
                body="Some quick example text to build on the card title and make up the bulk of the card's content."
            />
            <Card image={imageCap} title="Card Title" body="Some quick example text to build on the card title and make up the bulk of the card's content." />
            <Card
                title="Card Title"
                subtitle="Card Subtitle"
                body="Some quick example text to build on the card title and make up the bulk of the card's content."
            />
        </>
    );
}

/** Actions, links, and lists */
function CardActionsDemos() {
    return (
        <>
            <Card
                title="Card Title"
                body="Some quick example text to build on the card title and make up the bulk of the card's content."
                actionButton={{
                    text: 'Go somewhere',
                    onClick: () => console.log('Button clicked')
                }}
            />
            <Card
                title="Card Title"
                body="Some quick example text to build on the card title and make up the bulk of the card's content."
                links={[
                    { text: 'Card link', href: '#', onClick: () => console.log('Link 1 clicked') },
                    { text: 'Another link', href: '#', onClick: () => console.log('Link 2 clicked') }
                ]}
            />
            <Card title="Card Title" items={['Item #1', 'Item #2', 'Item #3']} />
        </>
    );
}

/** Dense layout: header, footer, media, links, and action together */
function CardLayoutDemo() {
    return (
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
    );
}

export default {
    title: 'Components/Card',
    component: Card,
    tags: ['!dev'],
    argTypes: {
        paddingSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Card padding size',
        },
        gapSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Card gap size',
        },
        radiusSize: {
            control: 'select',
            options: ['sm', 'md'],
            description: 'Card border radius size',
        },
        borderSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Card border size',
        },
        showBorder: {
            control: 'boolean',
            description: 'Show card border',
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
    <div style={cardCol}>
        <CardContentDemos />
        <CardActionsDemos />
        <CardLayoutDemo />
    </div>
);

export const Interactive = {
    args: {
        title: 'Card Title',
        subtitle: 'Card Subtitle',
        body: "Some quick example text to build on the card title and make up the bulk of the card's content.",
        paddingSize: 'md',
        gapSize: 'md',
        radiusSize: 'sm',
        borderSize: 'sm',
        showBorder: true,
    },
};
