import React from 'react';
import { Button, IconButton, TextField } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { HeaderSearch, SectionActions } from '@/storybook-docs/lib/section-header.jsx';
import { FormatSwitch, StudentsTable, ViewPills } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The do and don't examples of the Section template page, built from
 * `PatternSection` and its header props, `PatternCard` and real PLUS controls.
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
        actions={<Button text="Join session" appearance="primary" onClick={() => {}} />}
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

/** The actions sit at the end of the title row, with the views under it. */
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
        views={<ViewPills views={['All students', 'Needs follow-up']} />}
    >
        <StudentsTable count={2} />
    </PatternSection>
);

/** Actions in the title row and again in the views row: one action, two homes. */
const ActionsInTwoHomesCase = () => (
    <PatternSection
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={<SectionActions more={false} />}
        views={<ViewPills views={['All students', 'Needs follow-up']} />}
        format={<Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
    >
        <StudentsTable count={2} />
    </PatternSection>
);

/** More and the labeled Primary in the title row; the format switch ends the views row; Search, then the filter, lead row 3. */
const RightSideInOrderCase = () => (
    <PatternSection
        title="Sessions"
        description="This term"
        actions={<SectionActions primary="New session" icon="plus" />}
        views={<ViewPills views={['Upcoming', 'Past']} />}
        format={<FormatSwitch />}
        search={<HeaderSearch label="Search sessions" />}
        filters={[{ key: 'status', label: 'Status', text: 'All', onClick: () => {} }]}
    >
        <StudentsTable count={2} />
    </PatternSection>
);

/** Six controls in no order, the Primary first and a second labeled button: fold extras into More. */
const RightSideCrowdedCase = () => (
    <PatternSection
        title="Sessions"
        description="This term"
        actions={(
            <>
                <Button text="New session" iconBefore="plus" appearance="primary" onClick={() => {}} />
                <IconButton icon="download" label="Export" appearance="subtle" onClick={() => {}} />
                <Button text="Share" onClick={() => {}} />
                <IconButton icon="filter" label="Filters" appearance="subtle" onClick={() => {}} />
                <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />
            </>
        )}
        views={<ViewPills views={['Upcoming']} />}
        format={<FormatSwitch />}
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
