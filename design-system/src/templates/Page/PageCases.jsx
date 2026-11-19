import React, { useState } from 'react';
import { Button, PageHeader } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { Page, Card, Section } from '@/templates';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { ViewPills } from '@/storybook-docs/lib/view-bar.jsx';
import { AddStudentAction, PageTabs, SessionsTable, StudentViews, ViewSelect } from './pageDemo.jsx';
import * as Example from './PageExamples.jsx';
import examplesSource from './PageExamples.jsx?raw';

/**
 * The live do and don't examples of the Page template page, built from
 * `Page`, `PageHeader`, `Section`, `PopupSelect`, `Tabs` and `Button`.
 */

const InDocs = ({ children }) => (
    <CaseSurface border="none" padding="none" surface={false}>
        <HeadingLevelContext.Provider value={5}>
            {children}
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** "Add" is the Section's one action, in its title row; the page header carries only page actions. */
export const AddInTitleRow = () => (
    <InDocs>
        <Page header={<PageHeader title="Students" titleAs="h4" />}>
            <Section title="Students" views={<StudentViews />} actions={<AddStudentAction />} />
        </Page>
    </InDocs>
);

/** The same Primary twice: in the page header and in the Section's title row. */
export const AddTwice = () => (
    <InDocs>
        <Page
            header={(
                <PageHeader
                    title="Students"
                    titleAs="h4"
                    actions={<Button text="Add student" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
                />
            )}
        >
            <Section title="Students" views={<StudentViews />} actions={<AddStudentAction />} />
        </Page>
    </InDocs>
);

/** Under page tabs the Section's views are one labeled PopupSelect at the start of its bar. */
export const OneTabSystem = () => {
    const [tab, setTab] = useState('sessions');
    const [status, setStatus] = useState('upcoming');
    return (
        <InDocs>
            <Page
                header={(
                    <PageHeader
                        title="Maya Rodriguez"
                        titleAs="h4"
                        bottomBar={<PageTabs active={tab} onSelect={setTab} labels={['Overview', 'Sessions']} />}
                    />
                )}
            >
                {tab === 'overview' ? (
                    <Section title="Overview">
                        <Card title="Lincoln Middle · Grade 8" description="Math · Tue & Thu at 4:30 PM" />
                    </Section>
                ) : (
                    <Section title="Sessions" views={<ViewSelect value={status} onChange={setStatus} />}>
                        <SessionsTable status={status} />
                    </Section>
                )}
            </Page>
        </InDocs>
    );
};

/** Pill views under page tabs: two tab systems on one page. */
export const TwoTabSystems = () => {
    const [tab, setTab] = useState('sessions');
    return (
        <InDocs>
            <Page
                header={(
                    <PageHeader
                        title="Maya Rodriguez"
                        titleAs="h4"
                        bottomBar={<PageTabs active={tab} onSelect={setTab} labels={['Overview', 'Sessions']} />}
                    />
                )}
            >
                <Section
                    title="Sessions"
                    views={<ViewPills views={['Upcoming', 'Past']} />}
                >
                    <SessionsTable status="upcoming" />
                </Section>
            </Page>
        </InDocs>
    );
};

/** The Show code for each example that prints, read from `PageExamples.jsx`. */
export const CODE = showCode(examplesSource, [
    'HeaderIsTheH1',
    'SectionsAsTitles',
    'AreaPageTitleAlone',
    'BreadcrumbOnAreaPage',
    'OneLineDescription',
    'ParagraphUnderTitle',
]);

/** The page header is the page's one h1; the Section under it opens at h2. */
export const HeaderIsTheH1 = () => <InDocs><Example.HeaderIsTheH1 /></InDocs>;

/** Sections standing in for the title: two page-level headings and no page header. */
export const SectionsAsTitles = () => <InDocs><Example.SectionsAsTitles /></InDocs>;

/** An area page: the title alone, with nothing above it. */
export const AreaPageTitleAlone = () => <InDocs><Example.AreaPageTitleAlone /></InDocs>;

/** A breadcrumb on an area page, repeating the Sidebar's place. */
export const BreadcrumbOnAreaPage = () => <InDocs><Example.BreadcrumbOnAreaPage /></InDocs>;

/** One detail line under the title. */
export const OneLineDescription = () => <InDocs><Example.OneLineDescription /></InDocs>;

/** A paragraph under the title pushes the first Section down. */
export const ParagraphUnderTitle = () => <InDocs><Example.ParagraphUnderTitle /></InDocs>;
