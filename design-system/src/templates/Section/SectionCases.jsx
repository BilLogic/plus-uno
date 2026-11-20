import React from 'react';
import { Button, IconButton, TextField } from '@/components';
import { Card, Section } from '@/templates';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { HeaderSearch, SectionActions } from '@/storybook-docs/lib/section-header.jsx';
import { FormatSwitch, StudentsTable, ViewPills } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The do and don't examples of the Section template page, built from
 * `Section` and its header props, `Card` and real PLUS controls.
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
    <Card
        title="Upcoming session"
        description="Tuesday at 4:30 PM · Lincoln Middle · 6 students"
        actions={<Button text="Join session" appearance="primary" onClick={() => {}} />}
    />
);

/** A card with its own title stands on its own in the page. */
const CardStandsAloneCase = () => sessionCard;

/** A Section whose heading repeats its only card's title: two headings for one thing. */
const SectionRepeatsCardCase = () => (
    <Section title="Upcoming session">
        {sessionCard}
    </Section>
);

/** The title row first, then the views row, so the title, the first pill and the first column share one left edge. */
const TitleRowAboveHeaderRowsCase = () => (
    <Section
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={<SectionActions />}
        views={<ViewPills views={['All students', 'Needs follow-up']} />}
    >
        <StudentsTable count={2} />
    </Section>
);

/** The title pushed into the views row: the heading and the pills fight for the start, and the description has nowhere to go. */
const TitleInViewsRowCase = () => (
    <Section
        actions={<SectionActions />}
        views={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-lg)' }}>
                <span style={{ font: 'var(--heading-sm)', color: 'var(--ds-text)' }}>Students</span>
                <ViewPills views={['All students', 'Needs follow-up']} />
            </div>
        )}
    >
        <StudentsTable count={2} />
    </Section>
);

/** The actions sit at the end of the title row, with the views under it. */
const ActionsInTitleRowCase = () => (
    <Section
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
    </Section>
);

/** Actions in the title row and again in the views row: one action, two homes. */
const ActionsInTwoHomesCase = () => (
    <Section
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={<SectionActions more={false} />}
        views={<ViewPills views={['All students', 'Needs follow-up']} />}
        format={<Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
    >
        <StudentsTable count={2} />
    </Section>
);

/** More and the labeled Primary in the title row; the format switch ends the views row; Search, then the filter, lead the filters row. */
const RightSideInOrderCase = () => (
    <Section
        title="Sessions"
        description="This term"
        actions={<SectionActions primary="New session" icon="plus" />}
        views={<ViewPills views={['Upcoming', 'Past']} />}
        format={<FormatSwitch />}
        search={<HeaderSearch label="Search sessions" />}
        filters={[{ key: 'status', label: 'Status', text: 'All', onClick: () => {} }]}
    >
        <StudentsTable count={2} />
    </Section>
);

/** Five controls in no order, the Primary first and a second labeled button: fold extras into More. */
const RightSideCrowdedCase = () => (
    <Section
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
    </Section>
);

const contactFields = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--stack-lg) var(--inline-xl)' }}>
        <TextField label="Guardian name" defaultValue="Dana Thompson" />
        <TextField label="Phone" defaultValue="(412) 555-0148" />
    </div>
);

/** The form card holds its own Save; the Section footer is for paging and "View all". */
const CardOwnsSaveCase = () => (
    <Section
        title="Contact details"
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        <Card
            footer={(
                <>
                    <Button text="Save" appearance="primary" onClick={() => {}} />
                    <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                </>
            )}
        >
            {contactFields}
        </Card>
    </Section>
);

/** Cancel and Save in the Section footer, away from the fields they commit. */
const FooterCommitsCase = () => (
    <Section
        title="Contact details"
        footer={(
            <>
                <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                <Button text="Save" appearance="primary" onClick={() => {}} />
            </>
        )}
    >
        <Card>
            {contactFields}
        </Card>
    </Section>
);

export const TitleRowAboveHeaderRows = unstyled(TitleRowAboveHeaderRowsCase);
export const TitleInViewsRow = unstyled(TitleInViewsRowCase);
export const CardStandsAlone = unstyled(CardStandsAloneCase);
export const SectionRepeatsCard = unstyled(SectionRepeatsCardCase);
export const ActionsInTitleRow = unstyled(ActionsInTitleRowCase);
export const ActionsInTwoHomes = unstyled(ActionsInTwoHomesCase);
export const RightSideInOrder = unstyled(RightSideInOrderCase);
export const RightSideCrowded = unstyled(RightSideCrowdedCase);
export const CardOwnsSave = unstyled(CardOwnsSaveCase);
export const FooterCommits = unstyled(FooterCommitsCase);
