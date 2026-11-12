import React from 'react';

import { PatternSection } from '@/patterns';
import { CardsSection, DemoPageHeader, PageActions, PageTabs, ViewSelect } from '../../../patterns/Page/pageDemo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { ViewBar } from '@/storybook-docs/lib/view-bar.jsx';
import { NamesDo, TabLabelDo, TabLabelDont } from '../../../patterns/Sidebar/Sidebar.examples.jsx';

/**
 * The Navigation pattern's examples, drawn with the real Sidebar, Tabs,
 * Breadcrumb and PageHeader. Every picture renders the state its heading
 * names through props: the selected area, the drilled-in record page, the
 * page tabs on their Sessions tab. The Sidebar pictures are the Sidebar
 * docs' own examples (inert, hidden from assistive technology), reused so
 * the pages show one thing. Nothing here runs a play.
 *
 *   AreaPicture        the Sidebar with an area selected
 *   OpenItemsPicture   open items under Sessions, named by time and who
 *   OpenItemsDont      the same item carrying everything, cut off
 *   ViewsPicture       pill views in a Section's view bar
 *   PageTabsPicture    page tabs under a record's title
 *   DrillPicture       the record page after a drill-in, breadcrumb above the title
 *   AreaPagePicture    an area page: no breadcrumb
 *   TabsUnderPicture   page tabs with the Section's views as one Select
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** The width the small pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const SMALL_STAGE = 640; // docs-literal

/** The width of a Sidebar picture's box. Docs geometry, in px. */
export const SIDEBAR_STAGE = 320; // docs-literal

/** Docs geometry, in px: the window height of a page picture. */
const WINDOW = 420; // docs-literal

const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };

const RECORD_CRUMBS = [{ text: 'Students', href: '#' }, { text: 'Maya Rodriguez' }];

/** Tier 1: the Sidebar with an area selected. */
export const AreaPicture = () => (
    <div style={{ ...pad, inlineSize: 'var(--card-min-width-md)' }}>
        <NamesDo />
    </div>
);

/** Tier 1b: sessions opened earlier, as temporary items under Sessions. */
export const OpenItemsPicture = () => (
    <div style={{ ...pad, inlineSize: 'var(--card-min-width-md)' }}>
        <TabLabelDo />
    </div>
);

/** Don't: an open item that carries everything, so the time it is found by is cut off. */
export const OpenItemsDont = () => (
    <div style={{ ...pad, inlineSize: 'var(--card-min-width-md)' }}>
        <TabLabelDont />
    </div>
);

/** Tier 2: pill views in a Section's view bar. */
export const ViewsPicture = () => (
    <div style={pad}>
        <PatternSection title="Sessions" tabs={<ViewBar views={['Upcoming', 'Past']} filters={null} primary={null} more={false} search={false} />}>
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Same rows, two views.</p>
        </PatternSection>
    </div>
);

/** Tier 2: page tabs at the bottom of a record's page header. */
export const PageTabsPicture = () => (
    <BrowserWindow address="app.plus.org/students/maya-rodriguez" height={WINDOW}>
        <div style={pad}>
            <DemoPageHeader breadcrumb={RECORD_CRUMBS} title="Maya Rodriguez" description="Grade 8 · Math" actions={<PageActions />} tabs={<PageTabs active="sessions" />} />
        </div>
    </BrowserWindow>
);

/** Tier 3: the record page after a drill-in. The breadcrumb is the record's place, parents only. */
export const DrillPicture = () => (
    <BrowserWindow address="app.plus.org/students/maya-rodriguez" height={WINDOW}>
        <div style={pad}>
            <DemoPageHeader breadcrumb={RECORD_CRUMBS} title="Maya Rodriguez" description="Grade 8 · Math" actions={<PageActions />} />
            <CardsSection title="Upcoming sessions" />
        </div>
    </BrowserWindow>
);

/** An area page: the title alone, no breadcrumb, the collection's Primary at the end of its view bar. */
export const AreaPagePicture = () => (
    <BrowserWindow address="app.plus.org/students" height={WINDOW}>
        <div style={pad}>
            <DemoPageHeader title="Students" />
            <PatternSection title="Students" type="tabs-only" tabs={<ViewBar views={['All students']} filters={null} primary="Add student" more={false} />}>
                <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Students table</p>
            </PatternSection>
        </div>
    </BrowserWindow>
);

/** One tab system: page tabs under the title, and the Section's views as one Select. */
export const TabsUnderPicture = () => (
    <BrowserWindow address="app.plus.org/students/maya-rodriguez" height={WINDOW}>
        <div style={pad}>
            <DemoPageHeader breadcrumb={RECORD_CRUMBS} title="Maya Rodriguez" description="Grade 8 · Math" tabs={<PageTabs active="sessions" />} />
            <PatternSection title="Sessions" type="tabs-only" tabs={<ViewSelect />}>
                <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Sessions table</p>
            </PatternSection>
        </div>
    </BrowserWindow>
);
