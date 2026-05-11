import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import MediaObject from './MediaObject';

export default {
    title: 'Components/MediaObject',
    component: MediaObject,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Media Object component for creating media objects with image/icon and content. Built on Bootstrap 4.6.2 media object pattern with PLUS design token customizations.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        heading: {
            control: 'text',
            description: 'Heading text',
            table: { category: 'Content' }
        },
        bodyText: {
            control: 'text',
            description: 'Body copy shown beside the media',
            table: { category: 'Content' }
        },
        mediaPreset: {
            control: 'select',
            options: ['image', 'icon'],
            description: 'Preset media content for the interactive demo',
            table: { category: 'Content' }
        },
        alignment: {
            control: 'select',
            options: ['left', 'left-center', 'left-bottom', 'right', 'right-center', 'right-bottom'],
            description: 'Media alignment',
            table: { category: 'Layout' }
        },
        mediaSize: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Media size',
            table: { category: 'Design' }
        },
        media: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },}
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

const col = { display: 'flex', flexDirection: 'column', gap: '32px' };

function MediaObjectLayoutDemos() {
    return (
        <>
            <section>
                <h5>Left alignment (default)</h5>
                <MediaObject
                    media={<PlaceholderMedia />}
                    heading="Media heading"
                >
                    Will you do the same for me? It's time to face the music.
                </MediaObject>
            </section>
            <section>
                <h5>Right alignment</h5>
                <MediaObject
                    media={<PlaceholderMedia />}
                    heading="Media heading"
                    alignment="right"
                >
                    Will you do the same for me? It's time to face the music.
                </MediaObject>
            </section>
            <section>
                <h5>Center vertical alignment</h5>
                <MediaObject
                    media={<PlaceholderMedia />}
                    heading="Center Aligned"
                    alignment="left-center"
                >
                    Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis. Fusce condimentum nunc ac nisi vulputate fringilla. Donec lacinia congue felis in faucibus.
                </MediaObject>
            </section>
        </>
    );
}

function MediaObjectSizesDemos() {
    return (
        <section>
            <h5>Media sizes</h5>
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
    );
}

function MediaObjectContentNestedDemo() {
    return (
        <section>
            <h5>Nested media</h5>
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
    );
}

export const Layout = () => (
    <div style={col}>
        <MediaObjectLayoutDemos />
    </div>
);

export const Sizes = () => (
    <div style={col}>
        <MediaObjectSizesDemos />
    </div>
);

export const Content = () => (
    <div style={col}>
        <MediaObjectContentNestedDemo />
    </div>
);

export const Overview = () => (
    <div style={{ maxWidth: '560px', width: '100%' }}>
        <MediaObject
            media={<PlaceholderMedia />}
            heading="Media heading"
        >
            Will you do the same for me? It's time to face the music.
        </MediaObject>
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.mediaObject }
    }
};

export const Interactive = (args) => {
    const mediaSizeMap = {
        small: '48px',
        default: '64px',
        large: '96px'
    };

    return (
        <MediaObject
            heading={args.heading}
            alignment={args.alignment}
            mediaSize={args.mediaSize}
            media={
                args.mediaPreset === 'icon'
                    ? (
                        <PlaceholderMedia
                            size={mediaSizeMap[args.mediaSize] || '64px'}
                            text="i"
                        />
                    )
                    : (
                        <PlaceholderMedia
                            size={mediaSizeMap[args.mediaSize] || '64px'}
                            text={mediaSizeMap[args.mediaSize] || '64px'}
                        />
                    )
            }
        >
            {args.bodyText}
        </MediaObject>
    );
};
Interactive.args = {
    heading: 'Media Heading',
    bodyText: "Will you do the same for me? It's time to face the music.",
    mediaPreset: 'image',
    alignment: 'left',
    mediaSize: 'default'
};
