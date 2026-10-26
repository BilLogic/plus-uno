import React from 'react';

import { Button } from '@/components';
import { Frame, PatternCard, Topbar } from '@/patterns';
import { PageLayout } from '@/specs/Universal/Pages';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';

/**
 * The do and don't examples on the Page templates docs page: live
 * compositions of the page template, never pictures.
 */

const BREADCRUMBS = [{ text: 'Home', href: '#' }, { text: 'Sessions' }];
const USER = { name: 'John Doe', type: 'lead tutor' };

const box = { height: 280, width: '100%' };

const noteActions = (
    <>
        <Button style="secondary" fill="outline" text="Save draft" />
        <Button style="primary" fill="filled" text="Submit note" />
    </>
);

/** Do: a focused page names its task and offers Back and Close. */
export const FocusedTopbarDo = () => (
    <div style={box}>
        <PageLayout frame="focused" title="Add a session note" style={{ height: '100%' }} onBack={() => {}} onClose={() => {}}>
            {slotContent('Content slot: Sections')}
        </PageLayout>
    </div>
);

/** Don't: the app topbar, with a sidebar toggle and a breadcrumb, on a page for one task. */
export const FocusedTopbarDont = () => (
    <div style={box}>
        <Frame topbar={<Topbar breadcrumbs={BREADCRUMBS} user={USER} />} style={{ height: '100%' }} width="reading">
            {slotContent('Add a session note')}
        </Frame>
    </div>
);

/** Do: the actions end-aligned in the footer, one primary, last. */
export const FocusedActionsDo = () => (
    <div style={box}>
        <PageLayout frame="focused" title="Add a session note" style={{ height: '100%' }} onBack={() => {}} onClose={() => {}} actions={noteActions}>
            {slotContent('Content slot: Sections')}
        </PageLayout>
    </div>
);

/** Don't: several primary actions, start-aligned in the content. */
export const FocusedActionsDont = () => (
    <div style={box}>
        <PageLayout frame="focused" title="Add a session note" style={{ height: '100%' }} onBack={() => {}} onClose={() => {}}>
            <div style={{ display: 'flex', gap: 'var(--space-100)' }}>
                <Button style="primary" fill="filled" text="Submit note" />
                <Button style="primary" fill="filled" text="Save draft" />
                <Button style="primary" fill="filled" text="Send to lead" />
            </div>
        </PageLayout>
    </div>
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

/** Don't: the card is rebuilt by hand, with 24 of extra space added to the chrome. */
export const SlotsDont = () => (
    <div
        style={{
            padding: 'var(--space-300)',
            borderRadius: 'var(--card-radius)',
            background: 'var(--ds-surface-raised)',
            boxShadow: 'var(--ds-shadow-raised)',
        }}
    >
        <p style={{ margin: '0 0 var(--space-100)', font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>Next session</p>
        {nextSession}
    </div>
);
