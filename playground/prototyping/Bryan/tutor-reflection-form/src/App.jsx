import React, { useReducer, useMemo } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import FormSidebar from './components/FormSidebar';
import FormProgress from './components/FormProgress';
import SuccessScreen from './components/SuccessScreen';
import SessionInfo from './sections/SessionInfo';
import SessionOverview from './sections/SessionOverview';
import StudentCheckIn from './sections/StudentCheckIn';
import StudentDeepDive from './sections/StudentDeepDive';
import TeachingStrategies from './sections/TeachingStrategies';
import ReviewSubmit from './sections/ReviewSubmit';
import Button from '@/components/Button';
import { STUDENTS } from './data/mockData';

const initialState = {
    currentStep: 1,
    completedSteps: [],

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

        case 'SET_STEP':
            return { ...state, currentStep: action.step };

        case 'COMPLETE_STEP': {
            const completed = state.completedSteps.includes(action.step)
                ? state.completedSteps
                : [...state.completedSteps, action.step];
            return { ...state, completedSteps: completed };
        }

        case 'SET_ATTENDANCE':
            return {
                ...state,
                attendance: {
                    ...state.attendance,
                    [action.studentId]: action.value,
                },
            };

        case 'SET_STUDENT_CHECKIN': {
            const current = state.studentCheckIn[action.studentId] || {};
            return {
                ...state,
                studentCheckIn: {
                    ...state.studentCheckIn,
                    [action.studentId]: {
                        ...current,
                        [action.field]: action.value,
                    },
                },
            };
        }

        case 'SET_STUDENT_DEEP_DIVE': {
            const current = state.studentDeepDive[action.studentId] || {};
            return {
                ...state,
                studentDeepDive: {
                    ...state.studentDeepDive,
                    [action.studentId]: {
                        ...current,
                        [action.field]: action.value,
                    },
                },
            };
        }

        case 'SET_STRATEGY_DETAIL': {
            const current = state.strategyDetails[action.strategyId] || {};
            return {
                ...state,
                strategyDetails: {
                    ...state.strategyDetails,
                    [action.strategyId]: {
                        ...current,
                        [action.field]: action.value,
                    },
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

export default function App() {
    const [state, dispatch] = useReducer(formReducer, initialState);

    const skippedSteps = useMemo(() => {
        if (state.sessionDidNotHappen) return [2, 3, 4, 5];
        return [];
    }, [state.sessionDidNotHappen]);

    const sidebarStudents = useMemo(() => {
        return STUDENTS.map((s) => ({
            ...s,
            checked: !!state.studentCheckIn[s.id]?.engagement,
        }));
    }, [state.studentCheckIn]);

    const nextStep = () => {
        dispatch({ type: 'COMPLETE_STEP', step: state.currentStep });
        let next = state.currentStep + 1;
        while (next <= 6 && skippedSteps.includes(next)) {
            next++;
        }
        if (next <= 6) {
            dispatch({ type: 'SET_STEP', step: next });
        }
    };

    const prevStep = () => {
        let prev = state.currentStep - 1;
        while (prev >= 1 && skippedSteps.includes(prev)) {
            prev--;
        }
        if (prev >= 1) {
            dispatch({ type: 'SET_STEP', step: prev });
        }
    };

    const goToStep = (step) => {
        if (!skippedSteps.includes(step)) {
            dispatch({ type: 'SET_STEP', step });
        }
    };

    const handleSubmit = () => {
        dispatch({ type: 'COMPLETE_STEP', step: 6 });
        dispatch({ type: 'SUBMIT' });
    };

    const renderSection = () => {
        const props = { formState: state, dispatch };
        switch (state.currentStep) {
            case 1: return <SessionInfo {...props} />;
            case 2: return <SessionOverview {...props} />;
            case 3: return <StudentCheckIn {...props} />;
            case 4: return <StudentDeepDive {...props} />;
            case 5: return <TeachingStrategies {...props} />;
            case 6: return <ReviewSubmit {...props} onSubmit={handleSubmit} />;
            default: return null;
        }
    };

    const sectionTitles = {
        1: 'Session Information',
        2: 'Session Evaluation: How did the session go?',
        3: 'Student Check-In',
        4: 'Student Deep Dive',
        5: 'Teaching Strategies',
        6: 'Review & Submit',
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
                    sidebarConfig={{
                        user: 'tutor',
                        activeTabId: 'sessions',
                    }}
                >
                    <SuccessScreen
                        formState={state}
                        onReturnToDashboard={() => dispatch({ type: 'RESET' })}
                    />
                </PageLayout>
            </div>
        );
    }

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
                sidebarConfig={{
                    user: 'tutor',
                    activeTabId: 'sessions',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-surface-gap-md)',
                        width: '100%',
                        minHeight: '100%',
                    }}
                >
                    {/* Form-specific side nav */}
                    <FormSidebar
                        currentStep={state.currentStep}
                        completedSteps={state.completedSteps}
                        skippedSteps={skippedSteps}
                        students={sidebarStudents}
                        onStepClick={goToStep}
                        onSubmitClick={handleSubmit}
                    />

                    {/* Content area */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--size-section-gap-md)',
                            flex: '1 0 0',
                        }}
                    >
                        {/* Progress bar */}
                        <FormProgress
                            currentStep={state.currentStep}
                            totalSteps={6}
                            skippedSteps={skippedSteps}
                        />

                        {/* Section title */}
                        <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                            {sectionTitles[state.currentStep]}
                        </h4>

                        {/* Active section */}
                        {renderSection()}

                        {/* Navigation */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--size-element-gap-lg)',
                                alignItems: 'center',
                            }}
                        >
                            {state.currentStep > 1 && (
                                <Button
                                    text="Previous"
                                    style="primary"
                                    fill="tonal"
                                    size="medium"
                                    onClick={prevStep}
                                />
                            )}
                            {state.currentStep < 6 && (
                                <Button
                                    text="Next"
                                    style="primary"
                                    fill="tonal"
                                    size="medium"
                                    onClick={nextStep}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </PageLayout>
        </div>
    );
}
