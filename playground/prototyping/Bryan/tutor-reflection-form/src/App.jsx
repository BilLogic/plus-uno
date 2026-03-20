import React, { useReducer, useMemo } from 'react';
import UserAvatar from '@/components/UserAvatar';
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

    const escalationCount = useMemo(() => {
        return Object.values(state.studentDeepDive).filter((d) => d.flagForSupervisor).length;
    }, [state.studentDeepDive]);

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

    if (state.submitted) {
        return (
            <div className="reflection-app">
                <div className="reflection-topbar">
                    <div className="reflection-topbar__breadcrumbs">
                        <a href="#">Dashboard</a>
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }} />
                        <a href="#">Sessions</a>
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }} />
                        <span>Reflection</span>
                    </div>
                    <div className="reflection-topbar__user">
                        <UserAvatar firstChar="B" name="Bryan" counter={false} />
                    </div>
                </div>
                <SuccessScreen
                    formState={state}
                    onReturnToDashboard={() => dispatch({ type: 'RESET' })}
                />
            </div>
        );
    }

    const renderSection = () => {
        const props = { formState: state, dispatch };
        switch (state.currentStep) {
            case 1:
                return <SessionInfo {...props} />;
            case 2:
                return <SessionOverview {...props} />;
            case 3:
                return <StudentCheckIn {...props} />;
            case 4:
                return <StudentDeepDive {...props} />;
            case 5:
                return <TeachingStrategies {...props} />;
            case 6:
                return <ReviewSubmit {...props} onSubmit={handleSubmit} />;
            default:
                return null;
        }
    };

    return (
        <div className="reflection-app">
            {/* Top Bar */}
            <div className="reflection-topbar">
                <div className="reflection-topbar__breadcrumbs">
                    <a href="#">Dashboard</a>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }} />
                    <a href="#">Sessions</a>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }} />
                    <span>Reflection</span>
                </div>
                <div className="reflection-topbar__user">
                    <UserAvatar firstChar="B" name="Bryan" counter={false} />
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ padding: 'var(--size-element-pad-y-sm) var(--size-section-pad-x-lg)' }}>
                <FormProgress
                    currentStep={state.currentStep}
                    totalSteps={6}
                    skippedSteps={skippedSteps}
                />
            </div>

            {/* Main Layout */}
            <div className="reflection-layout">
                <FormSidebar
                    currentStep={state.currentStep}
                    completedSteps={state.completedSteps}
                    skippedSteps={skippedSteps}
                    escalationCount={escalationCount}
                    onStepClick={goToStep}
                />

                <main className="reflection-main">
                    {renderSection()}

                    {/* Navigation Buttons */}
                    <div className="section-actions" style={{ marginTop: 'var(--size-section-gap-md)' }}>
                        <div>
                            {state.currentStep > 1 && (
                                <Button
                                    text="Back"
                                    style="secondary"
                                    fill="outline"
                                    leadingVisual="arrow-left"
                                    onClick={prevStep}
                                />
                            )}
                        </div>
                        <div>
                            {state.currentStep < 6 && (
                                <Button
                                    text="Continue"
                                    style="primary"
                                    fill="filled"
                                    trailingVisual="arrow-right"
                                    onClick={nextStep}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
