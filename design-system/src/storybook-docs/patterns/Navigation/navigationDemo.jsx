import React, { useState } from 'react';

import { Page, Section } from '@/templates';
import {
    CardsSection,
    DemoPageHeader,
    PageActions,
    PageTabs,
    RecordTabSection,
    SessionsTable,
    STUDENT_SESSION_CARDS,
} from '../../../templates/Page/pageDemo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { RECORD_CRUMBS } from '@/storybook-docs/lib/template-demo.jsx';
import { SectionActions } from '@/storybook-docs/lib/section-header.jsx';
import { StudentsTable, ViewPills } from '@/storybook-docs/lib/view-bar.jsx';
import { NamesDo, TabLabelDo, TabLabelDont } from '../../../components/navigation/Sidebar/Sidebar.examples.jsx';

/**
 * The Navigation pattern's examples, drawn with the real Sidebar, Tabs,
 * Breadcrumb and PageHeader. Every example renders the state its heading
 * names through props and stays interactive: the selected area, the drilled-in
 * record page, the page tabs on their Sessions tab. The Sidebar examples are
 * the Sidebar docs' own live examples, reused so the pages show one thing.
 *
 *   AreaPicture              the Sidebar with an area selected
 *   OpenItemsPicture         open items under Sessions, named by time and who
 *   OpenItemsDont            the same item carrying everything, cut off
 *   ViewsPicture             pill views in a Section's header
 *   PageTabsPicture          page tabs under a record's title
 *   DrillPicture             the record page after a drill-in, breadcrumb above the title
 *   AreaPagePicture          an area page: no breadcrumb
 *   TabsUnderPicture         page tabs with the Section's views as one PopupSelect
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** The width the small pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const SMALL_STAGE = 640; // docs-literal

/** The width of a Sidebar picture's box. Docs geometry, in px. */
export const SIDEBAR_STAGE = 320; // docs-literal

const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };

/** Tier 1: the Sidebar with an area selected. */
export const AreaPicture = ({ label = 'Navigation areas example' } = {}) => (
    <div style={{ ...pad, inlineSize: 'var(--card-min-width-md)' }}>
        <NamesDo label={label} />
    </div>
);

/** Tier 1b: sessions opened earlier, as temporary items under Sessions. */
export const OpenItemsPicture = ({ label = 'Open items — do' } = {}) => (
    <div style={{ ...pad, inlineSize: 'var(--card-min-width-md)' }}>
        <TabLabelDo label={label} />
    </div>
);

/** Don't: an open item that carries everything, so the time it is found by is cut off. */
export const OpenItemsDont = ({ label = "Open items — don't" } = {}) => (
    <div style={{ ...pad, inlineSize: 'var(--card-min-width-md)' }}>
        <TabLabelDont label={label} />
    </div>
);

/** Tier 2: pill views in a Section's header. */
export const ViewsPicture = () => {
    const [view, setView] = useState('Upcoming');
    return (
        <div style={pad}>
            <Section
                title="Sessions"
                views={<ViewPills views={['Upcoming', 'Past']} activeView={view} onViewChange={setView} />}
            >
                <SessionsTable status={view === 'Past' ? 'past' : 'upcoming'} />
            </Section>
        </div>
    );
};

/** Tier 2: page tabs at the bottom of a record's page header. */
export const PageTabsPicture = () => {
    const [tab, setTab] = useState('sessions');
    const [status, setStatus] = useState('upcoming');
    return (
        <BrowserWindow address="app.plus.org/students/maya-rodriguez">
            <Page
                header={(
                    <DemoPageHeader
                        breadcrumb={RECORD_CRUMBS}
                        title="Maya Rodriguez"
                        description="Grade 8 · Math"
                        actions={<PageActions />}
                        tabs={<PageTabs active={tab} onSelect={setTab} />}
                    />
                )}
            >
                <RecordTabSection tab={tab} status={status} onStatusChange={setStatus} overviewItems={STUDENT_SESSION_CARDS} />
            </Page>
        </BrowserWindow>
    );
};

/** Tier 3: the record page after a drill-in. The breadcrumb is the record's place, parents only. */
export const DrillPicture = () => (
    <BrowserWindow address="app.plus.org/students/maya-rodriguez">
        <Page header={<DemoPageHeader breadcrumb={RECORD_CRUMBS} title="Maya Rodriguez" description="Grade 8 · Math" actions={<PageActions />} />}>
            <CardsSection title="Upcoming sessions" items={STUDENT_SESSION_CARDS} />
        </Page>
    </BrowserWindow>
);

/** An area page: the title alone, no breadcrumb, the collection's Primary in its Section's title row. */
export const AreaPagePicture = () => (
    <BrowserWindow address="app.plus.org/students">
        <Page header={<DemoPageHeader title="Students" />}>
            <Section title="All students" actions={<SectionActions primary="Add student" more={false} />} views={<ViewPills views={['All students']} />}>
                <StudentsTable count={4} />
            </Section>
        </Page>
    </BrowserWindow>
);

/** One tab system: page tabs under the title, and the Section's views as one labeled PopupSelect. */
export const TabsUnderPicture = () => {
    const [tab, setTab] = useState('sessions');
    const [status, setStatus] = useState('upcoming');
    return (
        <BrowserWindow address="app.plus.org/students/maya-rodriguez">
            <Page
                header={(
                    <DemoPageHeader
                        breadcrumb={RECORD_CRUMBS}
                        title="Maya Rodriguez"
                        description="Grade 8 · Math"
                        tabs={<PageTabs active={tab} onSelect={setTab} />}
                    />
                )}
            >
                <RecordTabSection tab={tab} status={status} onStatusChange={setStatus} overviewItems={STUDENT_SESSION_CARDS} />
            </Page>
        </BrowserWindow>
    );
};
