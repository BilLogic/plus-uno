import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Banner, Flag, FlagGroup } from '@/components';
import { Page, Section } from '@/templates';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { STUDENTS, StudentsTable, ViewPills } from '@/storybook-docs/lib/view-bar.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './NotificationsExamples.jsx';
import examplesSource from './NotificationsExamples.jsx?raw';
import { DemoPageHeader } from '../../../templates/Page/pageDemo.jsx';

/**
 * Interactive key cases for the Notifications pattern page, kept beside the
 * stories so `notificationsDemo.jsx` stays clean for other callers.
 */

const WINDOW = 260; // docs-literal: window height in px
const noop = () => {};
const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };

const TopRight = ({ padded = true, children }) => (
    <div style={{ ...(padded ? pad : {}), display: 'flex', justifyContent: 'flex-end' }}>
        <FlagGroup position="top-end" containerPosition="static">
            {children}
        </FlagGroup>
    </div>
);

TopRight.propTypes = {
    padded: PropTypes.bool,
    children: PropTypes.node,
};

/** Dismissible single Flag at top right. */
export const FlagTopRightCase = () => {
    const [show, setShow] = useState(true);
    return (
        <TopRight>
            <Flag icon="circle-check" title="Session logged" autohide={false} show={show} onDismiss={() => setShow(false)}>
                Maya&apos;s supervisor will see it Friday.
            </Flag>
        </TopRight>
    );
};

/** Dismissible Flag stack. */
export const FlagStackCase = () => {
    const [gone, setGone] = useState([]);
    const dismiss = (id) => () => setGone((prev) => [...prev, id]);
    return (
        <TopRight>
            <Flag icon="circle-check" title="Note saved" autohide={false} show={!gone.includes('note')} onDismiss={dismiss('note')}>
                Maya can read it now.
            </Flag>
            <Flag title="Schedule updated" autohide={false} show={!gone.includes('schedule')} onDismiss={dismiss('schedule')}>
                Thursday moved to 4:30 PM.
            </Flag>
        </TopRight>
    );
};

/** Interactive Flag with Undo / View sessions actions. */
export const FlagWithActionsCase = () => {
    const [restored, setRestored] = useState(false);
    const [show, setShow] = useState(true);
    return (
        <TopRight>
            {restored ? (
                <Flag icon="circle-check" title="Session restored" autohide={false} show={show} onDismiss={() => setShow(false)} />
            ) : (
                <Flag
                    icon="circle-check"
                    title="Session deleted"
                    autohide={false}
                    show={show}
                    onDismiss={() => setShow(false)}
                    actions={[
                        { text: 'Undo', onClick: () => setRestored(true) },
                        { text: 'View sessions', onClick: noop },
                    ]}
                >
                    Lincoln Middle on Tuesday.
                </Flag>
            )}
        </TopRight>
    );
};

/** Timed Undo Flag paired with its restored confirmation Flag. */
export const FlagUndoCase = () => {
    const [undone, setUndone] = useState(false);
    const [showRestored, setShowRestored] = useState(true);
    return (
        <TopRight>
            <Flag
                title="Session deleted"
                timer
                delay={60000}
                show={!undone}
                onDismiss={() => setUndone(true)}
                actions={[{ text: 'Undo', onClick: () => setUndone(true) }]}
            />
            <Flag
                icon="circle-check"
                title="Session restored"
                autohide={false}
                show={showRestored}
                onDismiss={() => setShowRestored(false)}
            />
        </TopRight>
    );
};

/** Dismissible Flag positioned over a full Page. */
export const FlagOnPageCase = () => {
    const [show, setShow] = useState(true);
    return (
        <BrowserWindow address="app.plus.org/sessions" height={WINDOW}>
            <Page header={<DemoPageHeader title="Sessions" description="This week" />}>
                <TopRight padded={false}>
                    <Flag icon="circle-check" title="Session logged" autohide={false} show={show} onDismiss={() => setShow(false)}>
                        Maya&apos;s supervisor will see it Friday.
                    </Flag>
                </TopRight>
            </Page>
        </BrowserWindow>
    );
};

/** Frame tier: system banner across the whole width above the Page and sortable StudentsTable. */
export const TierFrameCase = () => (
    <BrowserWindow address="app.plus.org/students">
        <Banner appearance="announcement">Scheduled maintenance Saturday 2–4 AM ET.</Banner>
        <Page header={<DemoPageHeader title="Students" description="Lincoln Middle" />}>
            <Section title="Students">
                <StudentsTable sortable count={3} />
            </Section>
        </Page>
    </BrowserWindow>
);

/** Page tier: page-level banner below the header above a sortable StudentsTable. */
export const TierPageCase = () => (
    <BrowserWindow address="app.plus.org/students">
        <Page
            header={<DemoPageHeader title="Students" description="Lincoln Middle" />}
            banner={<Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>}
        >
            <Section title="Students">
                <StudentsTable sortable count={3} />
            </Section>
        </Page>
    </BrowserWindow>
);

/** Section tier: banner above a filterable, sortable six-student collection (two paused). */
export const TierSectionCase = () => {
    const [view, setView] = useState('All students');
    return (
        <BrowserWindow address="app.plus.org/students">
            <Page header={<DemoPageHeader title="Students" description="Lincoln Middle" />}>
                <Section
                    title="All students"
                    views={<ViewPills views={['All students', 'Paused']} activeView={view} onViewChange={setView} />}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
                        <Banner appearance="warning">Two of six students have no guardian contact on file.</Banner>
                        <StudentsTable
                            sortable
                            view={view === 'Paused' ? 'Paused' : undefined}
                            count={STUDENTS.length}
                        />
                    </div>
                </Section>
            </Page>
        </BrowserWindow>
    );
};

/** The Show code for each do and don't example, read from `NotificationsExamples.jsx`. */
export const CODE = showCode(examplesSource, ['FlagDo', 'FlagDont', 'BannerDo', 'BannerDont']);

/** Do: a passing notice, one line of next step, held at the top right of the picture. */
export const FlagDo = () => (
    <div style={{ ...pad, display: 'flex', justifyContent: 'flex-end' }}><Example.FlagDo /></div>
);

/** Don't: a decision in a Flag, which is gone before it is answered. */
export const FlagDont = () => (
    <div style={{ ...pad, display: 'flex', justifyContent: 'flex-end' }}><Example.FlagDont /></div>
);

/** Do: one Banner, one line, at the tier it concerns. */
export const BannerDo = () => <div style={pad}><Example.BannerDo /></div>;

/** Don't: two Banners stacked, pushing the page down. */
export const BannerDont = () => <div style={pad}><Example.BannerDont /></div>;
