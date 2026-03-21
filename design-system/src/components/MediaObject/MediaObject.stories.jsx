import React from 'react';
import MediaObject from './MediaObject';

export default {
    title: 'Components/MediaObject',
    component: MediaObject,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Media Object component for creating media objects with image/icon and content. Built on Bootstrap 4.6.2 media object pattern with PLUS design token customizations.'
            }
        }
    },
    argTypes: {
        alignment: {
            control: 'select',
            options: ['left', 'left-center', 'left-bottom', 'right', 'right-center', 'right-bottom'],
            description: 'Media alignment'
        },
        mediaSize: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Media size'
        },
        onClick: { action: 'clicked' }
    }
};

const PlaceholderMedia = ({ size = '64px', text = '64' }) => (
    <div style={{
        width: size,
        height: size,
        borderRadius: 'var(--size-element-radius-sm)',
        backgroundColor: 'var(--color-surface-variant)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-on-surface-variant)'
    }}>
        {text}
    </div>
);

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
            <h5>Left Alignment (Default)</h5>
            <MediaObject
                media={<PlaceholderMedia />}
                heading="Media heading"
            >
                Will you do the same for me? It's time to face the music.
            </MediaObject>
        </section>

        <section>
            <h5>Right Alignment</h5>
            <MediaObject
                media={<PlaceholderMedia />}
                heading="Media heading"
                alignment="right"
            >
                Will you do the same for me? It's time to face the music.
            </MediaObject>
        </section>

        <section>
            <h5>Center Vertical Alignment</h5>
            <MediaObject
                media={<PlaceholderMedia />}
                heading="Center Aligned"
                alignment="left-center"
            >
                Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis. Fusce condimentum nunc ac nisi vulputate fringilla. Donec lacinia congue felis in faucibus.
            </MediaObject>
        </section>

        <section>
            <h5>Media Sizes</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <MediaObject
                    media={<PlaceholderMedia size="48px" text="48" />}
                    heading="Small Media"
                    mediaSize="small"
                >
                    Small media size.
                </MediaObject>
                <MediaObject
                    media={<PlaceholderMedia size="64px" text="64" />}
                    heading="Default Media"
                    mediaSize="default"
                >
                    Default media size.
                </MediaObject>
                <MediaObject
                    media={<PlaceholderMedia size="96px" text="96" />}
                    heading="Large Media"
                    mediaSize="large"
                >
                    Large media size.
                </MediaObject>
            </div>
        </section>

        <section>
            <h5>Nested Media</h5>
            <MediaObject
                media={<PlaceholderMedia />}
                heading="Parent Media"
            >
                Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin.
                <MediaObject
                    media={<PlaceholderMedia size="48px" text="48" />}
                    heading="Nested Media"
                    className="mt-3"
                    mediaSize="small"
                >
                    Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin.
                </MediaObject>
            </MediaObject>
        </section>
    </div>
);

export const Interactive = (args) => (
    <MediaObject {...args}>
        will you do the same for me? It's time to face the music I'm no longer your muse. Heard it's beautiful, be the judge and my girls gonna take a vote.
    </MediaObject>
);
Interactive.args = {
    media: <PlaceholderMedia />,
    heading: 'Media Heading',
    alignment: 'left',
    mediaSize: 'default'
};
