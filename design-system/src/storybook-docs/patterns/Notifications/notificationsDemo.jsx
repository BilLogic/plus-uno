import React from 'react';

import {
    Banner,
    Flag,
    FlagGroup,
    SectionMessage,
} from '@/components';
import {
    Page,
    Section,
} from '@/templates';
import { DemoPageHeader } from '../../../templates/Page/pageDemo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { StudentsTable } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Notifications pattern's examples, drawn with the real Flag, Banner,
 * SectionMessage, NotificationItem and Panel.
 *
 *   FlagTopRight      one Flag at the top right, over the page
 *   FlagStack         several Flags, newest on top
 *   FlagWithActions   a Flag with up to two verbs
 *   FlagUndo          the timed Undo Flag, then the plain "restored" Flag
 *   MustStay          a SectionMessage with dismiss off, by the action it informs
 *   (the Inbox picture is shared with the Panel template: `storybook-docs/lib/inbox-demo.jsx`)
 *   TierPicture       one Banner at the Frame, Page or Section tier
 *   SeverityRow       the four statuses on SectionMessage
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal: stage width in px

/** The width the small pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const PLACE_STAGE = 600; // docs-literal: card stage width in px

/** Docs geometry, in px: the window height of the picture whose Flag sits over the page; the others hug their content. */
const WINDOW = 260; // docs-literal: window height in px

const noop = () => {};
const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };

/** A Flag stack at the top right, held in the picture. */
const TopRight = ({ padded = true, children }) => (
    <div style={{ ...(padded ? pad : {}), display: 'flex', justifyContent: 'flex-end' }}>
        <FlagGroup position="top-end" containerPosition="static">
            {children}
        </FlagGroup>
    </div>
);

/** One passing notice: the title names the event, one line gives the next step. */
export const FlagTopRight = () => (
    <TopRight>
        <Flag icon="circle-check" title="Session logged" autohide={false} show>
            Maya's supervisor will see it Friday.
        </Flag>
    </TopRight>
);

/** Several Flags, newest on top, each its own message. A stack is all default flags, each with its ×. */
export const FlagStack = () => (
    <TopRight>
        <Flag icon="circle-check" title="Note saved" autohide={false} show>
            Maya can read it now.
        </Flag>
        <Flag title="Schedule updated" autohide={false} show>
            Thursday moved to 4:30 PM.
        </Flag>
    </TopRight>
);

/** A Flag with two verbs. */
export const FlagWithActions = () => (
    <TopRight>
        <Flag
            icon="circle-check"
            title="Session deleted"
            autohide={false}
            show
            actions={[{ text: 'Undo', onClick: noop }, { text: 'View sessions', onClick: noop }]}
        >
            Lincoln Middle on Tuesday.
        </Flag>
    </TopRight>
);

/** Undo: a timed Flag with Undo first, then the plain Flag that replaces it once Undo is pressed. */
export const FlagUndo = () => (
    <TopRight>
        <Flag title="Session deleted" timer delay={60000} show actions={[{ text: 'Undo', onClick: noop }]} />
        <Flag icon="circle-check" title="Session restored" autohide={false} show />
    </TopRight>
);

/** A SectionMessage that stays: dismiss off, placed by the action it informs. */
export const MustStay = () => (
    <div style={{ ...pad, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' }}>
        <SectionMessage appearance="warning" title="Sessions can't be moved after 3:00 PM" dismissible={false}>
            Move Thursday's session before then, or ask a supervisor.
        </SectionMessage>
    </div>
);

/** The four statuses on one carrier: information, success, warning, danger. The words say it too. */
export const SeverityRow = () => (
    <div style={{ ...pad, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <SectionMessage appearance="info" title="Schedule updated" dismissible={false}>Thursday moved to 4:30 PM.</SectionMessage>
        <SectionMessage appearance="success" title="Session logged" dismissible={false}>Maya's supervisor will see it Friday.</SectionMessage>
        <SectionMessage appearance="warning" title="Notes are due Friday" dismissible={false}>Two sessions have no note yet.</SectionMessage>
        <SectionMessage appearance="danger" title="Couldn't save your note" dismissible={false}>Check your connection and try again.</SectionMessage>
    </div>
);

/** The Frame tier: system news across the whole width, above the page. The Frame's own banner slot is Planned, so the picture sets the Banner above the Frame's content. */
export const TierFrame = () => (
    <BrowserWindow address="app.plus.org/sessions">
        <Banner appearance="announcement">Scheduled maintenance Saturday 2–4 AM ET.</Banner>
        <Page header={<DemoPageHeader title="Sessions" description="This week" />} />
    </BrowserWindow>
);

/** The Page tier: under the page header, about this page. */
export const TierPage = () => (
    <BrowserWindow address="app.plus.org/sessions">
        <Page
            header={<DemoPageHeader title="Sessions" description="This week" />}
            banner={<Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>}
        />
    </BrowserWindow>
);

/** The Section tier: at the top of one collection, about that collection. */
export const TierSection = () => (
    <BrowserWindow address="app.plus.org/students">
        <Page header={<DemoPageHeader title="Students" description="Lincoln Middle" />}>
            <Section title="All students" isTitleHidden>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
                    <Banner appearance="warning">Two students have no guardian contact on file.</Banner>
                    <StudentsTable count={2} />
                </div>
            </Section>
        </Page>
    </BrowserWindow>
);

/** A page whose Flag has found the person at the top right: the page behind them. */
export const FlagOnPage = () => (
    <BrowserWindow address="app.plus.org/sessions" height={WINDOW}>
        <Page header={<DemoPageHeader title="Sessions" description="This week" />}>
            <TopRight padded={false}>
                <Flag icon="circle-check" title="Session logged" autohide={false} show>
                    Maya's supervisor will see it Friday.
                </Flag>
            </TopRight>
        </Page>
    </BrowserWindow>
);
