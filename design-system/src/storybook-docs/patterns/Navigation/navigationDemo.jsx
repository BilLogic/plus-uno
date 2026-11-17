import React, { useState } from 'react';

import { Breadcrumb, PageHeader } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { Page, PatternSection } from '@/patterns';
import {
    CardsSection,
    DemoPageHeader,
    PageActions,
    PageTabs,
    RecordTabSection,
    SessionsTable,
    STUDENT_SESSION_CARDS,
} from '../../../patterns/Page/pageDemo.jsx';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { RECORD_CRUMBS } from '@/storybook-docs/lib/pattern-demo.jsx';
import { StudentsTable, ViewBar } from '@/storybook-docs/lib/view-bar.jsx';
import { NamesDo, TabLabelDo, TabLabelDont } from '../../../patterns/Sidebar/Sidebar.examples.jsx';

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
 *   ViewsPicture             pill views in a Section's view bar
 *   PageTabsPicture          page tabs under a record's title
 *   DrillPicture             the record page after a drill-in, breadcrumb above the title
 *   AreaPagePicture          an area page: no breadcrumb
 *   TabsUnderPicture         page tabs with the Section's views as one PopupSelect
 *   BreadcrumbOnRecordCase   live Do example: breadcrumb above a record's title
 *   BreadcrumbOnAreaCase     live Don't example: breadcrumb on an area page
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

/** Tier 2: pill views in a Section's view bar. */
export const ViewsPicture = () => {
    const [view, setView] = useState('Upcoming');
    return (
        <div style={pad}>
            <PatternSection
                title="Sessions"
                tabs={<ViewBar views={['Upcoming', 'Past']} activeView={view} onViewChange={setView} filters={null} primary={null} more={false} search={false} />}
            >
                <SessionsTable status={view === 'Past' ? 'past' : 'upcoming'} />
            </PatternSection>
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

/** An area page: the title alone, no breadcrumb, the collection's Primary at the end of its view bar. */
export const AreaPagePicture = () => (
    <BrowserWindow address="app.plus.org/students">
        <Page header={<DemoPageHeader title="Students" />}>
            <PatternSection title="Students" type="tabs-only" tabs={<ViewBar views={['All students']} filters={null} primary="Add student" more={false} />}>
                <StudentsTable count={4} />
            </PatternSection>
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

/** Live Do: a breadcrumb above the record page's title, parents only. */
export const BreadcrumbOnRecordCase = () => (
    <CaseSurface border="none" padding="none" surface={false}>
        <HeadingLevelContext.Provider value={5}>
            <Page
                padding="md"
                header={(
                    <PageHeader
                        title="Maya Rodriguez"
                        titleAs="h4"
                        breadcrumbs={(
                            <Breadcrumb
                                label="Record page breadcrumb"
                                items={[
                                    { text: 'Students', href: '#students', onClick: () => {} },
                                    { text: 'Maya Rodriguez' },
                                ]}
                            />
                        )}
                    />
                )}
            >
                <PatternSection title="Sessions">
                    <SessionsTable />
                </PatternSection>
            </Page>
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** Live Don't: a breadcrumb on an area page, where there is nothing to climb out of. */
export const BreadcrumbOnAreaCase = () => (
    <CaseSurface border="none" padding="none" surface={false}>
        <HeadingLevelContext.Provider value={5}>
            <Page
                padding="md"
                header={(
                    <PageHeader
                        title="Students"
                        titleAs="h4"
                        breadcrumbs={(
                            <Breadcrumb
                                label="Area page breadcrumb"
                                items={[
                                    { text: 'Home', href: '#home', onClick: () => {} },
                                    { text: 'Students' },
                                ]}
                            />
                        )}
                    />
                )}
            >
                <PatternSection title="Students" type="tabs-only">
                    <StudentsTable count={3} />
                </PatternSection>
            </Page>
        </HeadingLevelContext.Provider>
    </CaseSurface>
);
