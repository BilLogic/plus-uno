import React from 'react';
import Card from '@/components/Card';

export default {
    title: 'Components/Card',
    component: Card,
    tags: ['autodocs'],
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

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Card
            title="Card Title"
            body="Some quick example text to build on the card title and make up the bulk of the card's content."
        />

        <Card
            image={
                <div style={{
                    width: '100%',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-surface-variant)',
                    color: 'var(--color-on-surface-variant)'
                }}>
                    Image cap
                </div>
            }
            title="Card Title"
            body="Some quick example text to build on the card title and make up the bulk of the card's content."
        />

        <Card
            title="Card Title"
            subtitle="Card Subtitle"
            body="Some quick example text to build on the card title and make up the bulk of the card's content."
        />

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

        <Card
            title="Card Title"
            items={['Item #1', 'Item #2', 'Item #3']}
        />

        <Card
            image={
                <div style={{
                    width: '100%',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-surface-variant)',
                    color: 'var(--color-on-surface-variant)'
                }}>
                    Image cap
                </div>
            }
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
