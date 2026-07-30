import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import SideNavBar from '@/specs/Toolkit/Post-Session/Sections/SideNavBar/SideNavBar';
import SessionReflectionFormV2 from '@/specs/Toolkit/Post-Session/Sections/SessionReflectionForm/SessionReflectionFormV2';
import ConfirmationPopUp from '@/specs/Toolkit/Post-Session/Modals/ConfirmationPopUp/ConfirmationPopUp';
import { WHAT_WORKED_OPTIONS, WHAT_COULD_IMPROVE_OPTIONS, SUPERVISOR_FOLLOWUP_OPTIONS } from '@/specs/Toolkit/Post-Session/reflectionCopy';

const defaultStudents = [
    { name: 'Kiera Wintervale', status: 'complete' },
    { name: 'Baxter Ellington', status: 'complete' },
    { name: 'Milo Thorne', status: 'complete' },
];

/**
 * Shared page shell for Session Reflection story states.
 *
 * @param {object} props
 */
const SessionReflectionShell = ({
    students = defaultStudents,
    formProps = {},
    showSaveExit = false,
}) => {
    const [activeTab, setActiveTab] = useState('session-reflection');
    const [saveExitOpen, setSaveExitOpen] = useState(showSaveExit);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <PageLayout
                topBarConfig={{
                    breadcrumbs: [
                        { text: 'Toolkit', href: '#' },
                        { text: 'Sessions', href: '#' },
                        { text: 'Reflection Form' },
                    ],
                    user: { name: 'John Doe', type: 'lead tutor' },
                }}
                sidebarConfig={{ user: 'tutor', activeTab: 'sessions' }}
                id="session-reflection-story"
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-surface-gap-md)',
                        width: '100%',
                        minHeight: '100%',
                    }}
                >
                    <SideNavBar
                        students={students}
                        activeTab={activeTab}
                        completedSections={{
                            'session-information': true,
                            'student-reflection': true,
                        }}
                        onTabClick={setActiveTab}
                    />
                    <SessionReflectionFormV2
                        {...formProps}
                        onCancel={() => setSaveExitOpen(true)}
                        onSaveAndExit={() => setSaveExitOpen(true)}
                        onNext={() => {}}
                    />
                </div>
            </PageLayout>
            <ConfirmationPopUp
                show={saveExitOpen}
                type="exit-without-saving"
                onClose={() => setSaveExitOpen(false)}
                onPrimary={() => setSaveExitOpen(false)}
                onSecondary={() => setSaveExitOpen(false)}
            />
        </div>
    );
};

SessionReflectionShell.propTypes = {
    students: PropTypes.array,
    formProps: PropTypes.object,
    showSaveExit: PropTypes.bool,
};

const BreakpointPreview = ({ children }) => (
    <div style={{ height: '100%', width: '100%', overflow: 'auto', borderRadius: 'var(--size-card-radius-sm)' }}>
        {children}
    </div>
);

BreakpointPreview.propTypes = {
    children: PropTypes.node,
};

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Session Reflection',
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
};

/** Empty — rating only, Next / Save disabled until answered. */
export const Empty = {
    name: 'Empty',
    render: () => (
        <BreakpointPreview>
            <SessionReflectionShell formProps={{ initialData: { rating: 0 }, simulateAi: false }} />
        </BreakpointPreview>
    ),
};

/** In progress with AI generating placeholder. */
export const InProgressAi = {
    name: 'In progress (AI generating)',
    render: () => (
        <BreakpointPreview>
            <SessionReflectionShell
                formProps={{
                    simulateAi: false,
                    aiState: 'generating',
                    initialData: {
                        rating: 4,
                        whatWorked: ['good-pacing', 'smooth-tech', 'strong-rapport'],
                        whatImprove: [],
                        followUp: [],
                    },
                }}
            />
        </BreakpointPreview>
    ),
};

/** Filled happy path with AI follow-up ready. */
export const Filled = {
    name: 'Filled',
    render: () => (
        <BreakpointPreview>
            <SessionReflectionShell
                formProps={{
                    simulateAi: false,
                    aiState: 'ready',
                    initialData: {
                        rating: 4,
                        whatWorked: ['good-pacing', 'smooth-tech', 'strong-rapport'],
                        whatImprove: ['pacing'],
                        followUp: ['no'],
                        aiPrompt: 'Based on what you selected, what would you try differently next time to protect pacing?',
                        aiAnswer: 'Open with a tighter warm-up and park tech checks before content.',
                    },
                }}
            />
        </BreakpointPreview>
    ),
};

/** Worst case — Other selected across chip banks. */
export const WorstCase = {
    name: 'Worst case (Other everywhere)',
    render: () => (
        <BreakpointPreview>
            <SessionReflectionShell
                formProps={{
                    simulateAi: false,
                    aiState: 'ready',
                    initialData: {
                        rating: 2,
                        whatWorked: ['other'],
                        whatImprove: ['other'],
                        followUp: ['other-urgent'],
                        otherWorked: 'Students stayed engaged despite a late start.',
                        otherImprove: 'Room audio kept cutting out mid-explanation.',
                        aiPrompt: 'What support do you need before the next session?',
                        aiAnswer: '',
                    },
                }}
            />
        </BreakpointPreview>
    ),
};

/** Save & Exit confirmation scrim over a filled form. */
export const SaveAndExitConfirmation = {
    name: 'Save & Exit confirmation',
    render: () => (
        <BreakpointPreview>
            <SessionReflectionShell
                showSaveExit
                formProps={{
                    simulateAi: false,
                    aiState: 'ready',
                    initialData: {
                        rating: 4,
                        whatWorked: WHAT_WORKED_OPTIONS.slice(0, 3).map((o) => o.id),
                        whatImprove: WHAT_COULD_IMPROVE_OPTIONS.slice(0, 1).map((o) => o.id),
                        followUp: SUPERVISOR_FOLLOWUP_OPTIONS.slice(0, 1).map((o) => o.id),
                        aiPrompt: 'Anything else to capture before you leave?',
                    },
                }}
            />
        </BreakpointPreview>
    ),
};

/** @deprecated Prefer Empty / Filled — kept for live-app import stability. */
export const Part1 = Empty;
/** @deprecated Prefer InProgressAi. */
export const Part2 = InProgressAi;
/** @deprecated Prefer Filled. */
export const Part3 = Filled;
/** @deprecated Prefer WorstCase. */
export const Part4 = WorstCase;
