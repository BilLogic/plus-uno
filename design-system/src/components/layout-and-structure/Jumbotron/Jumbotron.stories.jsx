import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { computedShadow, tokenColor, tokenLength, px } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { Button } from '@/components';
import Jumbotron from './Jumbotron';

const TITLE = 'Plan your next session';
const DESCRIPTION = 'See who is on your roster, review their progress and join the call from one place.';

const actions = (
    <>
        <Button text="Get started" style="primary" fill="filled" />
        <Button text="Learn more" style="secondary" fill="outline" />
    </>
);

/** A stand-in for an image: it fills the media slot at the slot's ratio. */
const placeholderMedia = (label) => (
    <div
        role="img"
        aria-label={label}
        style={{ width: '100%', height: '100%', backgroundColor: 'var(--ds-background-neutral)' }}
    />
);

const col = { display: 'flex', flexDirection: 'column', gap: '32px' };

const caption = (text) => (
    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">{text}</span>
);

export default {
    title: 'Components/Layout and structure/Jumbotron',
    component: Jumbotron,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The one hero block at the top of a landing or overview page: a page-level title, one '
                    + 'supporting line and up to two actions, with optional media, in a card or a full-bleed band.',
            },
        },
    },
    argTypes: {
        title: { control: 'text', description: 'The page title, its h1 (Heading/large)', table: { category: 'Content' } },
        description: { control: 'text', description: 'One supporting line (Body/default)', table: { category: 'Content' } },
        actionPreset: {
            control: 'select',
            options: ['none', 'primary', 'both'],
            description: 'What goes in the actions slot',
            table: { category: 'Slots' },
        },
        mediaPreset: {
            control: 'select',
            options: ['none', 'top', 'side'],
            description: 'Media slot and where it sits',
            table: { category: 'Slots' },
        },
        container: {
            control: 'select',
            options: ['card', 'band'],
            description: 'A raised card in the content column, or a full-bleed band',
            table: { category: 'Design' },
        },
        align: {
            control: 'select',
            options: ['start', 'center'],
            description: 'Text alignment; side media keeps it start',
            table: { category: 'Design' },
        },
        actions: { table: { disable: true } },
        media: { table: { disable: true } },
        mediaPosition: { table: { disable: true } },
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        id: { table: { disable: true } },
        className: { table: { disable: true } },
        subtitle: { table: { disable: true } },
        fluid: { table: { disable: true } },
        primaryButton: { table: { disable: true } },
        secondaryButton: { table: { disable: true } },
        paddingSize: { table: { disable: true } },
        gapSize: { table: { disable: true } },
        radiusSize: { table: { disable: true } },
    },
};

export const Overview = () => (
    <div style={{ width: '100%' }}>
        <Jumbotron title={TITLE} description={DESCRIPTION} actions={actions} />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.jumbotron },
    },
};

export const Containers = () => (
    <div style={col}>
        <div>
            {caption('container="card"')}
            <Jumbotron title={TITLE} description={DESCRIPTION} actions={actions} />
        </div>
        <div>
            {caption('container="band"')}
            <Jumbotron container="band" title={TITLE} description={DESCRIPTION} actions={actions} />
        </div>
    </div>
);

export const Alignment = () => (
    <div style={col}>
        <div>
            {caption('align="start"')}
            <Jumbotron title={TITLE} description={DESCRIPTION} actions={actions} />
        </div>
        <div>
            {caption('align="center"')}
            <Jumbotron align="center" title={TITLE} description={DESCRIPTION} actions={actions} />
        </div>
    </div>
);

export const Media = () => (
    <div style={col}>
        <div>
            {caption('mediaPosition="top" · 16:9')}
            <Jumbotron title={TITLE} description={DESCRIPTION} actions={actions} media={placeholderMedia('Image, 16:9')} />
        </div>
        <div style={{ width: '960px', maxWidth: '100%' }}>
            {caption('mediaPosition="side" · 4:3, 944 wide or more')}
            <Jumbotron
                title={TITLE}
                description={DESCRIPTION}
                actions={actions}
                media={placeholderMedia('Image, 4:3')}
                mediaPosition="side"
            />
        </div>
    </div>
);

export const WithoutActions = () => (
    <Jumbotron title={TITLE} description={DESCRIPTION} />
);

export const Interactive = {
    args: {
        title: TITLE,
        description: DESCRIPTION,
        actionPreset: 'both',
        mediaPreset: 'none',
        container: 'card',
        align: 'start',
    },
    render: ({ actionPreset, mediaPreset, ...args }) => (
        <Jumbotron
            title={args.title}
            description={args.description}
            container={args.container}
            align={args.align}
            actions={
                actionPreset === 'none'
                    ? undefined
                    : actionPreset === 'primary'
                        ? <Button text="Get started" style="primary" fill="filled" />
                        : actions
            }
            media={mediaPreset === 'none' ? undefined : placeholderMedia('Image')}
            mediaPosition={mediaPreset === 'side' ? 'side' : 'top'}
        />
    ),
};

/**
 * The anatomy against its tokens, in all four color modes: the card on the
 * raised pair at Card/pad-lg with no border, the band on the surface container
 * with no radius or shadow, the title an h1 at Heading/large, and the header
 * Section/stack-lg above the actions.
 */
export const Anatomy = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={col}>
            <Jumbotron data-testid="card" title="Card" description={DESCRIPTION} actions={actions} />
            <Jumbotron data-testid="band" container="band" title="Band" description={DESCRIPTION} actions={actions} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const card = canvas.getByTestId('card');
        const band = canvas.getByTestId('band');

        await expect(canvas.getByRole('heading', { level: 1, name: 'Card' })).toBeInTheDocument();
        const title = card.querySelector('.plus-jumbotron-title');
        const probeFont = document.createElement('span');
        probeFont.style.font = 'var(--heading-large)';
        canvasElement.appendChild(probeFont);
        await expect(getComputedStyle(title).fontSize, 'the title is Heading/large').toBe(getComputedStyle(probeFont).fontSize);
        probeFont.remove();

        const inner = card.querySelector('.plus-pattern-card-inner');
        await expect(px(getComputedStyle(inner).paddingTop), 'the card pads at Card/pad-lg').toBe(tokenLength(canvasElement, '--card-pad-lg'));
        await expect(px(getComputedStyle(band).paddingTop), 'the band pads at Surface/stack-lg').toBe(tokenLength(canvasElement, '--surface-stack-lg'));
        await expect(px(getComputedStyle(band).paddingLeft), 'and at Screen/pad-x-screen').toBe(tokenLength(canvasElement, '--layout-pad-x-screen'));
        const content = card.querySelector('.plus-jumbotron-content');
        await expect(px(getComputedStyle(content).rowGap), 'the header sits Section/stack-lg above the actions').toBe(tokenLength(canvasElement, '--section-stack-lg'));

        await inEveryColorMode(async (mode) => {
            card.style.transition = 'none';
            const cardStyle = getComputedStyle(card);
            const bandStyle = getComputedStyle(band);
            await expect(cardStyle.backgroundColor, `${mode}: the card is on the raised surface`).toBe(tokenColor(canvasElement, '--ds-surface-raised'));
            await expect(cardStyle.boxShadow, `${mode}: under the raised shadow`).toBe(computedShadow(canvasElement, 'var(--ds-shadow-raised)'));
            await expect(cardStyle.borderTopWidth, `${mode}: the card has no border`).toBe('0px');
            await expect(bandStyle.backgroundColor, `${mode}: the band is on the surface container`).toBe(tokenColor(canvasElement, '--ds-surface-container'));
            await expect(bandStyle.boxShadow, `${mode}: the band has no shadow`).toBe('none');
            await expect(bandStyle.borderTopLeftRadius, `${mode}: the band is square`).toBe('0px');
            await expect(getComputedStyle(card.querySelector('.plus-jumbotron-description')).color, `${mode}: the description is subtle text`)
                .toBe(tokenColorAsText(canvasElement, '--ds-text-subtle'));
        });
    },
};

/** What a color token computes to as text color, read through a probe. */
function tokenColorAsText(host, token) {
    const el = document.createElement('span');
    el.style.color = `var(${token})`;
    host.appendChild(el);
    const value = getComputedStyle(el).color;
    el.remove();
    return value;
}

/**
 * The 944 rule: side media sits beside the text at 960 wide, and moves on top
 * below 944, where there is no room for 480 of text beside 400 of image.
 */
export const SideMediaNeeds944 = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={col}>
            <div style={{ width: '960px' }}>
                <Jumbotron data-testid="wide" title="Wide" description={DESCRIPTION} actions={actions} media={placeholderMedia('Wide image')} mediaPosition="side" />
            </div>
            <div style={{ width: '720px' }}>
                <Jumbotron data-testid="narrow" title="Narrow" description={DESCRIPTION} actions={actions} media={placeholderMedia('Narrow image')} mediaPosition="side" />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const layout = (id) => canvas.getByTestId(id).querySelector('.plus-jumbotron-layout');
        const media = (id) => canvas.getByTestId(id).querySelector('.plus-jumbotron-media');

        await expect(getComputedStyle(layout('wide')).flexDirection, 'at 960 the media is beside the text').toBe('row');
        await expect(media('wide').getBoundingClientRect().width, 'at Size/Width/2500').toBe(tokenLength(canvasElement, '--width-2500'));
        await expect(getComputedStyle(layout('narrow')).flexDirection, 'at 720 the media moves on top').toBe('column');
        const narrowMedia = media('narrow').getBoundingClientRect();
        const narrowContent = canvas.getByTestId('narrow').querySelector('.plus-jumbotron-content').getBoundingClientRect();
        await expect(narrowMedia.bottom <= narrowContent.top, 'above the content').toBe(true);
    },
};
