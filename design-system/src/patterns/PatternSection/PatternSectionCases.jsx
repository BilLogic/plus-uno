import React from 'react';
import { Button, FilterButton, IconButton, TextField } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { FormatSwitch, StudentsTable, ViewBar, ViewPills, row } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The do and don't examples of the Section template page, built from
 * `PatternSection`, `PatternCard`, the view bar and real PLUS controls.
 */

const unstyled = (Case) => {
    const Wrapped = () => (
        <div className="sb-unstyled">
            <HeadingLevelContext.Provider value={5}>
                <Case />
            </HeadingLevelContext.Provider>
        </div>
    );
    return Wrapped;
};

const sessionCard = (
    <PatternCard
        title="Upcoming session"
        description="Tuesday at 4:30 PM · Lincoln Middle · 6 students"
        actions={<Button text="Join session" appearance="primary" spacing="compact" onClick={() => {}} />}
    />
);

/** A card with its own title stands on its own in the page. */
const CardStandsAloneCase = () => sessionCard;

/** A Section whose heading repeats its only card's title: two headings for one thing. */
const SectionRepeatsCardCase = () => (
    <PatternSection title="Upcoming session">
        {sessionCard}
    </PatternSection>
);

/** No view bar, so the actions sit at the end of the title row. */
const ActionsInTitleRowCase = () => (
    <PatternSection
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={(
            <>
                <Button text="Export" iconBefore="download" onClick={() => {}} />
                <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
    >
        <StudentsTable count={2} />
    </PatternSection>
);

/** Actions in the title row and again in the view bar: one action, two homes. */
const ActionsInTwoHomesCase = () => (
    <PatternSection
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={<Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
        tabs={<ViewBar views={['All students', 'Needs follow-up']} search={false} more={false} />}
    >
        <StudentsTable count={2} />
    </PatternSection>
);

/** Format switch, Search, Filter, More, then the labeled Primary last. */
const RightSideInOrderCase = () => (
    <PatternSection
        title="Sessions"
        description="This term"
        tabs={(
            <ViewBar
                views={['Upcoming', 'Past']}
                format
                filters={<FilterButton text="Filters" iconBefore="filter" hasChevronDown={false} appearance="subtle" onClick={() => {}} />}
                primary="New session"
                primaryIcon="plus"
                searchLabel="Search sessions"
            />
        )}
    >
        <StudentsTable count={2} />
    </PatternSection>
);

/** Six controls in no order, the Primary first and a second labeled button: fold extras into More. */
const RightSideCrowdedCase = () => (
    <PatternSection
        title="Sessions"
        description="This term"
        tabs={(
            <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
                <ViewPills views={['Upcoming']} />
                <div style={{ ...row, marginInlineStart: 'auto' }}>
                    <Button text="New session" iconBefore="plus" appearance="primary" onClick={() => {}} />
                    <IconButton icon="download" label="Export" appearance="subtle" onClick={() => {}} />
                    <Button text="Share" onClick={() => {}} />
                    <IconButton icon="filter" label="Filters" appearance="subtle" onClick={() => {}} />
                    <FormatSwitch />
                    <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />
                </div>
            </div>
        )}
    >
        <StudentsTable count={2} />
    </PatternSection>
);

const contactFields = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--stack-lg) var(--grid-gutter)' }}>
        <TextField label="Guardian name" defaultValue="Dana Thompson" />
        <TextField label="Phone" defaultValue="(412) 555-0148" />
    </div>
);

/** The form card holds its own Save; the Section footer is for paging and "View all". */
const CardOwnsSaveCase = () => (
    <PatternSection
        title="Contact details"
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        <PatternCard
            footer={(
                <>
                    <Button text="Save" appearance="primary" onClick={() => {}} />
                    <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                </>
            )}
        >
            {contactFields}
        </PatternCard>
    </PatternSection>
);

/** Cancel and Save in the Section footer, away from the fields they commit. */
const FooterCommitsCase = () => (
    <PatternSection
        title="Contact details"
        footer={(
            <>
                <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                <Button text="Save" appearance="primary" onClick={() => {}} />
            </>
        )}
    >
        <PatternCard>
            {contactFields}
        </PatternCard>
    </PatternSection>
);

export const CardStandsAlone = unstyled(CardStandsAloneCase);
export const SectionRepeatsCard = unstyled(SectionRepeatsCardCase);
export const ActionsInTitleRow = unstyled(ActionsInTitleRowCase);
export const ActionsInTwoHomes = unstyled(ActionsInTwoHomesCase);
export const RightSideInOrder = unstyled(RightSideInOrderCase);
export const RightSideCrowded = unstyled(RightSideCrowdedCase);
export const CardOwnsSave = unstyled(CardOwnsSaveCase);
export const FooterCommits = unstyled(FooterCommitsCase);
