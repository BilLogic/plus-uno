import React, { useState } from 'react';
import { Button, Tabs } from '@/components';
import { Blanket, PatternCard, PatternModal, PatternSection } from '@/patterns';
import { ScaledPreview } from '@/storybook-docs/lib/scaled-preview.jsx';
import { slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import { SplitContext } from '../Frame/SplitContext';
import { HeadingLevelContext } from '@/lib/headingLevel';

/**
 * The do and don't examples of the Section page, built from the section and
 * card patterns. Each sits inside a docs section, so its headings are held
 * below the page outline.
 */

const quiet = { margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' };

/** `sb-unstyled` keeps Storybook's docs styles off the examples, as it does inside a canvas. */
const InDocs = ({ children }) => (
    <div className="sb-unstyled">
        <HeadingLevelContext.Provider value={5}>{children}</HeadingLevelContext.Provider>
    </div>
);

const Row = ({ children }) => (
    <div style={{ display: 'flex', gap: 'var(--grid-gutter)', flexWrap: 'wrap' }}>{children}</div>
);

const Stat = ({ title, body }) => (
    <PatternCard padding="sm" style={{ flex: '1 1 var(--card-min-width-sm)' }}>
        <p style={{ margin: 0, font: 'var(--body-default)' }}>{title}</p>
        <p style={{ margin: 0, font: 'var(--metric-small)', fontVariantNumeric: 'tabular-nums' }}>{body}</p>
    </PatternCard>
);

/** Two cards share one heading, so they form a section. */
export const SectionOfTwoCards = () => (
    <InDocs>
        <PatternSection title="Upcoming sessions" description="Next 7 days">
            <Row>
                <Stat title="Today" body="3 sessions" />
                <Stat title="This week" body="24 sessions" />
            </Row>
        </PatternSection>
    </InDocs>
);

/** One card in a section whose heading repeats the card's own title. */
export const SectionRepeatingCardTitle = () => (
    <InDocs>
        <PatternSection title="Sessions" description="Your sessions">
            <PatternCard title="Sessions" description="Your sessions">
                <p style={{ margin: 0, font: 'var(--metric-small)', fontVariantNumeric: 'tabular-nums' }}>24 this week</p>
            </PatternCard>
        </PatternSection>
    </InDocs>
);

const noteBody = (
    <p style={quiet}>Reviewed fractions; Maya is ready for ratios.</p>
);

/** The card owns its commit action in its footer. */
export const CardOwnsCommit = () => (
    <InDocs>
        <PatternSection title="Session notes" description="Thursday · Algebra I">
            <PatternCard
                title="Note for Thursday"
                description="Visible to the tutor lead"
                footer={<Button text="Save note" appearance="primary" spacing="compact" onClick={() => {}} />}
            >
                {noteBody}
            </PatternCard>
        </PatternSection>
    </InDocs>
);

/** A commit action in the section footer, far from what it saves. */
export const SectionFooterCommits = () => (
    <InDocs>
        <PatternSection
            title="Session notes"
            description="Thursday · Algebra I"
            footer={<Button text="Save note" appearance="subtle" spacing="compact" onClick={() => {}} />}
        >
            <PatternCard title="Note for Thursday" description="Visible to the tutor lead">
                {noteBody}
            </PatternCard>
        </PatternSection>
    </InDocs>
);

const StudentTabs = () => {
    const [active, setActive] = useState('active');
    return (
        <Tabs activeKey={active} onSelect={setActive} aria-label="Students">
            <Tabs.Tab eventKey="active">Active</Tabs.Tab>
            <Tabs.Tab eventKey="paused">Paused</Tabs.Tab>
            <Tabs.Tab eventKey="alumni">Alumni</Tabs.Tab>
        </Tabs>
    );
};

const activeCount = (
    <PatternCard padding="sm" style={{ maxWidth: 'var(--card-min-width-sm)' }}>
        <p style={{ margin: 0, font: 'var(--body-default)' }}>Active students</p>
        <p style={{ margin: 0, font: 'var(--metric-small)', fontVariantNumeric: 'tabular-nums' }}>12</p>
    </PatternCard>
);

/** The tabs are the bottom row of the section header. */
export const TabsInSectionHeader = () => (
    <InDocs>
        <PatternSection title="Students" description="Everyone in this session" tabs={<StudentTabs />}>
            {activeCount}
        </PatternSection>
    </InDocs>
);

/** Tabs above the section header: two competing headings. */
export const TabsAboveSectionHeader = () => (
    <InDocs>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            <StudentTabs />
            <PatternSection title="Students" description="Everyone in this session">
                {activeCount}
            </PatternSection>
        </div>
    </InDocs>
);

/* The detail pair: a section at a stand-in width of 960, scaled to the card. Stage sizes are docs geometry. */
const QUEUE = { width: 960, height: 320 };

const stepper = { onPrevious: () => {}, onNext: () => {}, previousDisabled: true };

/**
 * The list stays in view beside the selected record. The scaled preview reads
 * narrower than its stage, so the split is held the way a Frame with
 * `sectionDetail` holds it at this width.
 */
export const DetailBesideList = () => (
    <ScaledPreview {...QUEUE}>
        <InDocs>
            <SplitContext.Provider value>
            <PatternSection
                title="Compliance queue"
                description="Flags waiting on a supervisor"
                detail={slotContent('Record · one flag, its fields and notes')}
                detailTitle="Flag 1 of 12"
                {...stepper}
            >
                {slotContent('List · table or rows')}
            </PatternSection>
            </SplitContext.Provider>
        </InDocs>
    </ScaledPreview>
);

/** The record opens as a modal over the list, behind a blanket. */
export const DetailAsModal = () => (
    <ScaledPreview {...QUEUE}>
        <InDocs>
            <div style={{ position: 'relative' }}>
                <PatternSection title="Compliance queue" description="Flags waiting on a supervisor">
                    {slotContent('List · table or rows')}
                </PatternSection>
                <Blanket contained>
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--section-stack-md)' }}>
                        <PatternModal title="Flag 1 of 12" onClose={() => {}}>
                            {slotContent('Record · one flag, its fields and notes')}
                        </PatternModal>
                    </div>
                </Blanket>
            </div>
        </InDocs>
    </ScaledPreview>
);
