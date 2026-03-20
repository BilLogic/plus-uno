import React, { useReducer, useMemo, useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import SideNavBar from '@/specs/Toolkit/post-session/sections/SideNavBar/SideNavBar';
import FormFeedback from '@/specs/Toolkit/post-session/sections/FormFeedback/FormFeedback';
import FormProgress from './components/FormProgress';
import SessionInfo from './sections/SessionInfo';
import SessionOverview from './sections/SessionOverview';
import StudentCheckIn from './sections/StudentCheckIn';
import StudentDeepDive from './sections/StudentDeepDive';
import TeachingStrategies from './sections/TeachingStrategies';
import ReviewSubmit from './sections/ReviewSubmit';
import Button from '@/components/Button';
import { STUDENTS } from './data/mockData';

const initialState = {
    selectedSession: '',
    recordingFile: null,
    sessionDidNotHappen: false,
    cancellationReason: '',
    attendance: {},

    sessionRating: 0,
    whatWentWell: '',
    whatWasChallenging: '',

    studentCheckIn: {},
    studentDeepDive: {},

    selectedStrategies: [],
    strategyDetails: {},

    escalationDescription: '',
    recommendedAction: '',

    submitted: false,
};

function formReducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };

        case 'SET_ATTENDANCE':
            return {
                ...state,
                attendance: { ...state.attendance, [action.studentId]: action.value },
            };

        case 'SET_STUDENT_CHECKIN': {
            const current = state.studentCheckIn[action.studentId] || {};
            return {
                ...state,
                studentCheckIn: {
                    ...state.studentCheckIn,
                    [action.studentId]: { ...current, [action.field]: action.value },
                },
            };
        }

        case 'SET_STUDENT_DEEP_DIVE': {
            const current = state.studentDeepDive[action.studentId] || {};
            return {
                ...state,
                studentDeepDive: {
                    ...state.studentDeepDive,
                    [action.studentId]: { ...current, [action.field]: action.value },
                },
            };
        }

        case 'SET_STRATEGY_DETAIL': {
            const current = state.strategyDetails[action.strategyId] || {};
            return {
                ...state,
                strategyDetails: {
                    ...state.strategyDetails,
                    [action.strategyId]: { ...current, [action.field]: action.value },
                },
            };
        }

        case 'SUBMIT':
            return { ...state, submitted: true };

        case 'RESET':
            return { ...initialState };

        default:
            return state;
    }
}

/**
 * Tab-to-section mapping.
 * The SideNavBar has fixed tabs designed for the existing reflection flow.
 * We map our redesigned sections to those tab IDs so we use the real DS
 * component rather than building a custom sidebar.
 *
 *   SideNavBar tab             →  Our section
 *   ─────────────────────────────────────────
 *   session-information        →  Session Information (1)
 *   student-reflection         →  Student Check-In (2)
 *     student-0..N (children)  →  per-student cards
 *   session-reflection         →  Session Overview (3)
 *   self-reflection            →  Teaching Strategies (4)
 *   form-feedback              →  Review & Submit (5)
 */
const TAB_TO_SECTION = {
    'session-information': 'session-info',
    'student-reflection': 'student-checkin',
    'session-reflection': 'session-overview',
    'self-reflection': 'teaching-strategies',
    'form-feedback': 'review-submit',
};

const SECTION_TO_TAB = Object.fromEntries(
    Object.entries(TAB_TO_SECTION).map(([k, v]) => [v, k])
);

const SECTION_ORDER = [
    'session-info',
    'session-overview',
    'student-checkin',
    'student-deepdive',
    'teaching-strategies',
    'review-submit',
];

const SECTION_TITLES = {
    'session-info': 'Session Information',
    'session-overview': 'Session Evaluation: How did the session go?',
    'student-checkin': 'Student Check-In',
    'student-deepdive': 'Student Deep Dive',
    'teaching-strategies': 'Teaching Strategies',
    'review-submit': 'Review & Submit',
};

export default function App() {
    const [state, dispatch] = useReducer(formReducer, initialState);
    const [activeSection, setActiveSection] = useState('session-info');

    const sideNavStudents = useMemo(() => {
        return STUDENTS.map((s) => ({
            name: s.name,
            status: state.studentCheckIn[s.id]?.engagement ? 'complete' : undefined,
        }));
    }, [state.studentCheckIn]);

    const activeTab = SECTION_TO_TAB[activeSection] || 'session-information';

    const handleTabClick = (tabId) => {
        if (tabId.startsWith('student-') && tabId !== 'student-reflection') {
            setActiveSection('student-checkin');
            return;
        }
        const section = TAB_TO_SECTION[tabId];
        if (section) setActiveSection(section);
    };

    const currentIdx = SECTION_ORDER.indexOf(activeSection);

    const nextSection = () => {
        let next = currentIdx + 1;
        if (state.sessionDidNotHappen && SECTION_ORDER[next] === 'session-overview') {
            next = SECTION_ORDER.indexOf('review-submit');
        }
        if (
            SECTION_ORDER[next] === 'student-deepdive' &&
            !STUDENTS.some((s) => state.studentCheckIn[s.id]?.flagForDeepDive)
        ) {
            next++;
        }
        if (next < SECTION_ORDER.length) {
            setActiveSection(SECTION_ORDER[next]);
        }
    };

    const prevSection = () => {
        let prev = currentIdx - 1;
        if (
            SECTION_ORDER[prev] === 'student-deepdive' &&
            !STUDENTS.some((s) => state.studentCheckIn[s.id]?.flagForDeepDive)
        ) {
            prev--;
        }
        if (
            state.sessionDidNotHappen &&
            ['session-overview', 'student-checkin', 'student-deepdive', 'teaching-strategies'].includes(
                SECTION_ORDER[prev]
            )
        ) {
            prev = 0;
        }
        if (prev >= 0) {
            setActiveSection(SECTION_ORDER[prev]);
        }
    };

    const handleSubmit = () => {
        dispatch({ type: 'SUBMIT' });
    };

    if (state.submitted) {
        return (
            <div style={{ width: '100%', height: '100%' }}>
                <PageLayout
                    topBarConfig={{
                        breadcrumbs: [
                            { text: 'Toolkit', href: '#' },
                            { text: 'Sessions', href: '#' },
                            { text: 'Reflection Form' },
                        ],
                        user: { name: 'Bryan', type: 'regular tutor' },
                    }}
                    sidebarConfig={{ user: 'tutor', activeTabId: 'sessions' }}
                >
                    <FormFeedback
                        title="Reflection Submitted"
                        message="Thank you for completing your session reflection. Your responses have been recorded and are ready for review."
                        primaryAction={{
                            label: 'Return to Dashboard',
                            onClick: () => dispatch({ type: 'RESET' }),
                        }}
                        secondaryAction={{
                            label: 'View Summary',
                            onClick: () => window.print(),
                        }}
                    />
                </PageLayout>
            </div>
        );
    }

    const renderSection = () => {
        const props = { formState: state, dispatch };
        switch (activeSection) {
            case 'session-info': return <SessionInfo {...props} />;
            case 'session-overview': return <SessionOverview {...props} />;
            case 'student-checkin': return <StudentCheckIn {...props} />;
            case 'student-deepdive': return <StudentDeepDive {...props} />;
            case 'teaching-strategies': return <TeachingStrategies {...props} />;
            case 'review-submit': return <ReviewSubmit {...props} onSubmit={handleSubmit} />;
            default: return null;
        }
    };

    const isLast = activeSection === 'review-submit';
    const isFirst = activeSection === 'session-info';

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <PageLayout
                topBarConfig={{
                    breadcrumbs: [
                        { text: 'Toolkit', href: '#' },
                        { text: 'Sessions', href: '#' },
                        { text: 'Reflection Form' },
                    ],
                    user: { name: 'Bryan', type: 'regular tutor' },
                }}
                sidebarConfig={{ user: 'tutor', activeTabId: 'sessions' }}
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
                        state="default"
                        students={sideNavStudents}
                        activeTab={activeTab}
                        onTabClick={handleTabClick}
                    />

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--size-section-gap-md)',
                            flex: '1 0 0',
                        }}
                    >
                        <FormProgress
                            currentStep={currentIdx + 1}
                            totalSteps={SECTION_ORDER.length}
                            skippedSteps={[]}
                        />

                        <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                            {SECTION_TITLES[activeSection]}
                        </h4>

                        {renderSection()}

                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--size-element-gap-lg)',
                                alignItems: 'center',
                            }}
                        >
                            {!isFirst && (
                                <Button text="Previous" style="primary" fill="tonal" size="medium" onClick={prevSection} />
                            )}
                            {!isLast && (
                                <Button text="Next" style="primary" fill="tonal" size="medium" onClick={nextSection} />
                            )}
                        </div>
                    </div>
                </div>
            </PageLayout>
        </div>
    );
}
