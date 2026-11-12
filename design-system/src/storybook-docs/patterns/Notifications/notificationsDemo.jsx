import React from 'react';

import { Banner, Flag, FlagGroup, SectionMessage } from '@/components';
import { PatternSection } from '@/patterns';
import { DemoPageHeader } from '../../../patterns/Page/pageDemo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { StudentsTable, ViewBar } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Notifications pattern's examples, drawn with the real Flag, Banner and
 * SectionMessage. Every picture renders the state its heading names through
 * props: a Flag is held with `show` and `autohide={false}` so it stays in the
 * docs picture, and no picture runs a play. The Inbox is the Panel template's
 * own demo (panelDemo.jsx), reused so the two pages show one thing.
 *
 *   FlagTopRight      one Flag at the top right, over the page
 *   FlagStack         several Flags, newest on top
 *   FlagWithActions   a Flag with up to two verbs
 *   MustStay          a SectionMessage with dismiss off, by the action it informs
 *   TierPicture       one Banner at the Frame, Page or Section tier
 *   SeverityRow       the four statuses on SectionMessage
 *   FlagDo / FlagDont, BannerDo / BannerDont  the do and don't pairs
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** The width the small pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const PLACE_STAGE = 600; // docs-literal

/** Docs geometry, in px: the window height of the picture whose Flag sits over the page; the others hug their content. */
const WINDOW = 260; // docs-literal

const noop = () => {};
const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };

/** A Flag stack at the top right, held in the picture. */
const TopRight = ({ children }) => (
    <div style={{ ...pad, display: 'flex', justifyContent: 'flex-end' }}>
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
        <div style={pad}>
            <DemoPageHeader title="Sessions" description="This week" />
        </div>
    </BrowserWindow>
);

/** The Page tier: under the page header, about this page. */
export const TierPage = () => (
    <BrowserWindow address="app.plus.org/sessions">
        <div style={pad}>
            <DemoPageHeader title="Sessions" description="This week" />
            <Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>
        </div>
    </BrowserWindow>
);

/** The Section tier: at the top of one collection, about that collection. */
export const TierSection = () => (
    <BrowserWindow address="app.plus.org/students">
        <div style={pad}>
            <DemoPageHeader title="Students" description="Lincoln Middle" />
            <PatternSection title="Students" tabs={<ViewBar views={['All students']} filters={null} primary={null} />}>
                <Banner appearance="warning">Two students have no guardian contact on file.</Banner>
                <StudentsTable count={2} />
            </PatternSection>
        </div>
    </BrowserWindow>
);

/** Do: a finished action as a success Flag, the event in the title and the next step below. */
export const FlagDo = () => (
    <TopRight>
        <Flag icon="circle-check" title="Session logged" autohide={false} show>Maya's supervisor will see it Friday.</Flag>
    </TopRight>
);

/** Don't: a decision in a Flag, which is gone before it is answered. */
export const FlagDont = () => (
    <TopRight>
        <Flag title="Move this session to 4:30 PM?" autohide={false} show actions={[{ text: 'Move', onClick: noop }, { text: 'Keep', onClick: noop }]} />
    </TopRight>
);

/** Do: one Banner, one line, at the tier it concerns. */
export const BannerDo = () => (
    <div style={pad}>
        <Banner appearance="danger">We lost the connection. Your work is kept on this device.</Banner>
    </div>
);

/** Don't: two Banners stacked, pushing the page down. */
export const BannerDont = () => (
    <div style={pad}>
        <Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>
        <Banner appearance="danger">We lost the connection. Your work is kept on this device.</Banner>
    </div>
);

/** A page whose Flag has found the person at the top right: the page behind them. */
export const FlagOnPage = () => (
    <BrowserWindow address="app.plus.org/sessions" height={WINDOW}>
        <div style={pad}>
            <DemoPageHeader title="Sessions" description="This week" />
            <TopRight>
                <Flag icon="circle-check" title="Session logged" autohide={false} show>
                    Maya's supervisor will see it Friday.
                </Flag>
            </TopRight>
        </div>
    </BrowserWindow>
);
