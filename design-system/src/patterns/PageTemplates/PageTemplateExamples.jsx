import React from 'react';

import { Breadcrumb, Button, Sidebar } from '@/components';
import { Frame, PatternCard } from '@/patterns';
import { PageLayout } from '@/specs/Universal/Pages';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import { ScaledPreview } from '@/storybook-docs/lib/scaled-preview.jsx';

/**
 * The do and don't examples on the Templates docs page: live
 * compositions of the template, laid out at a 1024 stage and scaled down to
 * the card, so each frame docks and pads as it does at Large.
 */

const BREADCRUMBS = [{ text: 'Home', href: '#' }, { text: 'Sessions' }];
const ACCOUNT = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

// Stage geometry for the docs, not a design value.
const Stage = ({ children }) => <ScaledPreview width={1024} height={560}>{children}</ScaledPreview>;

const pageProps = {
    sidebarConfig: { user: 'tutor', activeTabId: 'home' },
    topBarConfig: { breadcrumbs: BREADCRUMBS, user: { name: 'John Doe', type: 'lead tutor' } },
    style: { height: '100%' },
};

/** Do: the template, with its content slot filled. */
export const FillSlotsDo = () => (
    <Stage>
        <PageLayout title="Sessions" {...pageProps}>
            {slotContent('Content slot: Sections')}
        </PageLayout>
    </Stage>
);

/** Don't: the page chrome rebuilt by hand: a gray block for a sidebar beside the content. */
export const FillSlotsDont = () => (
    <Stage>
        <div style={{ display: 'flex', height: '100%', background: 'var(--ds-surface)' }}>
            <div
                style={{
                    width: 'var(--frame-sidebar-width)',
                    padding: 'var(--pad-x-md)',
                    background: 'var(--ds-background-neutral)',
                    color: 'var(--ds-text-subtle)',
                    font: 'var(--body-default)',
                }}
            >
                Hand-drawn sidebar
            </div>
            <div style={{ flex: 1, padding: 'var(--page-pad)' }}>{slotContent('Content slot: Sections')}</div>
        </div>
    </Stage>
);

const noteActions = (
    <>
        <Button text="Save draft" />
        <Button appearance="primary" text="Submit note" />
    </>
);

/** Do: a focused page names its task and offers Back and Close. */
export const FocusedHeaderDo = () => (
    <Stage>
        <PageLayout frame="focused" title="Add a session note" style={{ height: '100%' }} onBack={() => {}} onClose={() => {}}>
            {slotContent('Content slot: Sections')}
        </PageLayout>
    </Stage>
);

/** Don't: the app frame, with the sidebar and a breadcrumb, on a page for one task. */
export const FocusedHeaderDont = () => (
    <Stage>
        <Frame header={<Breadcrumb items={BREADCRUMBS} />} sidebar={<Sidebar user="tutor" account={ACCOUNT} />} style={{ height: '100%' }} width="reading">
            {slotContent('Add a session note')}
        </Frame>
    </Stage>
);

/** Do: the actions end-aligned in the footer, one primary, last. */
export const FocusedActionsDo = () => (
    <Stage>
        <PageLayout frame="focused" title="Add a session note" style={{ height: '100%' }} onBack={() => {}} onClose={() => {}} actions={noteActions}>
            {slotContent('Content slot: Sections')}
        </PageLayout>
    </Stage>
);

/** Don't: several primary actions, start-aligned in the footer. */
export const FocusedActionsDont = () => (
    <Stage>
        <PageLayout
            frame="focused"
            title="Add a session note"
            style={{ height: '100%' }}
            onBack={() => {}}
            onClose={() => {}}
            actions={(
                // An auto end margin moves the group to the start of the end-aligned footer.
                <div style={{ display: 'flex', gap: 'var(--space-050)', marginRight: 'auto' }}>
                    <Button appearance="primary" text="Submit note" />
                    <Button appearance="primary" text="Save draft" />
                    <Button appearance="primary" text="Discard" />
                </div>
            )}
        >
            {slotContent('Content slot: Sections')}
        </PageLayout>
    </Stage>
);

const nextSession = (
    <>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>Thursday · 4:30 PM</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Algebra I with Ana Ruiz</p>
    </>
);

/** Do: the card stays attached, and its own stack sets the spacing. */
export const SlotsDo = () => (
    // Level 4, so the card's title is an h5 and stays out of the page's outline.
    <HeadingLevelContext.Provider value={4}>
        <PatternCard title="Next session" padding="sm">{nextSession}</PatternCard>
    </HeadingLevelContext.Provider>
);

/** Don't: the card is rebuilt by hand, with 24 of extra space added to the chrome (the labeled spacer). */
export const SlotsDont = () => (
    <div
        style={{
            padding: '0 var(--space-100) var(--space-100)',
            borderRadius: 'var(--card-radius)',
            background: 'var(--ds-surface-raised)',
            boxShadow: 'var(--ds-shadow-raised)',
        }}
    >
        <div
            style={{
                height: 'var(--space-150)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--ds-background-danger-subtler)',
                color: 'var(--ds-text)',
                font: 'var(--body-small)',
            }}
        >
            24 added by hand
        </div>
        <p style={{ margin: 'var(--space-100) 0 var(--space-050)', font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>Next session</p>
        {nextSession}
    </div>
);
