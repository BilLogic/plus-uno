import React, { useState } from 'react';
import { Button, PageHeader } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { Page, PatternCard, PatternSection } from '@/patterns';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { ViewBar } from '@/storybook-docs/lib/view-bar.jsx';
import { PageTabs, SessionsTable, ViewBarWithAdd, ViewSelect } from './pageDemo.jsx';

/**
 * The live do and don't examples of the Page template page, built from
 * `Page`, `PageHeader`, `PatternSection`, `PopupSelect`, `Tabs` and `Button`.
 */

const InDocs = ({ children }) => (
    <CaseSurface border="none" padding="none" surface={false}>
        <HeadingLevelContext.Provider value={5}>
            {children}
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** "Add" ends the collection's view bar; the header carries only page actions. */
export const AddInViewBar = () => (
    <InDocs>
        <Page header={<PageHeader title="Students" titleAs="h4" />} padding="md">
            <PatternSection title="Students" type="tabs-only" tabs={<ViewBarWithAdd />} />
        </Page>
    </InDocs>
);

/** The same Primary twice: in the page header and in the Section's view bar. */
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
            padding="md"
        >
            <PatternSection title="Students" type="tabs-only" tabs={<ViewBarWithAdd />} />
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
                padding="md"
            >
                {tab === 'overview' ? (
                    <PatternSection title="Overview">
                        <PatternCard title="Lincoln Middle · Grade 8" description="Math · Tue & Thu at 4:30 PM" />
                    </PatternSection>
                ) : (
                    <PatternSection title="Sessions" type="tabs-only" tabs={<ViewSelect value={status} onChange={setStatus} />}>
                        <SessionsTable status={status} />
                    </PatternSection>
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
                padding="md"
            >
                <PatternSection
                    title="Sessions"
                    type="tabs-only"
                    tabs={<ViewBar views={['Upcoming', 'Past']} search={false} more={false} />}
                >
                    <SessionsTable status="upcoming" />
                </PatternSection>
            </Page>
        </InDocs>
    );
};
