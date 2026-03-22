import React, { useReducer, useMemo } from 'react';
import './App.scss';
import FormSidebar from './components/FormSidebar';
import FormProgress from './components/FormProgress';
import SessionInfo from './sections/SessionInfo';
import SessionOverview from './sections/SessionOverview';
import StudentCheckIn from './sections/StudentCheckIn';
import StudentDeepDive from './sections/StudentDeepDive';
import TeachingStrategies from './sections/TeachingStrategies';
import ReviewSubmit from './sections/ReviewSubmit';
import SuccessScreen from './components/SuccessScreen';
import Button from '@/components/Button';

const STEPS = [
    { id: 'session-info', label: 'Session Information', icon: 'clipboard-list' },
    { id: 'session-overview', label: 'Session Overview', icon: 'star' },
    { id: 'student-checkin', label: 'Student Check-In', icon: 'users' },
    { id: 'student-deepdive', label: 'Student Deep-Dive', icon: 'magnifying-glass' },
    { id: 'strategies', label: 'Teaching Strategies', icon: 'lightbulb' },
    { id: 'review-submit', label: 'Review & Submit', icon: 'paper-plane' },
];

const MOCK_STUDENTS = [
    { id: 1, name: 'Amara Johnson' },
    { id: 2, name: 'Carlos Rivera' },
    { id: 3, name: 'Mei-Lin Chen' },
    { id: 4, name: 'Devon Williams' },
];

const MOCK_SESSIONS = [
    { value: 'session-1', label: 'Monday 3:00 PM – Algebra Fundamentals' },
    { value: 'session-2', label: 'Tuesday 4:00 PM – Reading Comprehension' },
    { value: 'session-3', label: 'Wednesday 3:30 PM – Essay Writing' },
];

const STRATEGIES_LIST = [
    'Guided questioning',
    'Think-aloud modeling',
    'Error analysis',
    'Scaffolding',
    'Peer discussion',
    'Visual aids / diagrams',
    'Worked examples',
    'Retrieval practice',
];

const initialState = {
    currentStep: 0,
    submitted: false,

    sessionInfo: {
        date: '',
        session: '',
        sessionDidNotHappen: false,
        cancelReasons: [],
        cancelNotes: '',
        recordingFile: null,
        attendance: MOCK_STUDENTS.reduce((acc, s) => ({ ...acc, [s.id]: 'present' }), {}),
    },

    sessionOverview: {
        rating: 0,
        wentWell: '',
        challenges: '',
    },

    studentCheckIn: MOCK_STUDENTS.reduce((acc, s) => ({
        ...acc,
        [s.id]: { engagement: '', understanding: '', comment: '' },
    }), {}),

    studentDeepDive: {
        selectedStudent: '',
        keyInsight: '',
        escalate: false,
        escalateNote: '',
    },

    strategies: {
        selected: [],
        ratings: {},
        useAgain: {},
    },

    escalation: {
        severity: '',
        description: '',
    },
};

function formReducer(state, action) {
    switch (action.type) {
        case 'SET_STEP':
            return { ...state, currentStep: action.payload };
        case 'NEXT_STEP':
            return { ...state, currentStep: Math.min(state.currentStep + 1, STEPS.length - 1) };
        case 'PREV_STEP':
            return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
        case 'UPDATE_SESSION_INFO':
            return { ...state, sessionInfo: { ...state.sessionInfo, ...action.payload } };
        case 'UPDATE_SESSION_OVERVIEW':
            return { ...state, sessionOverview: { ...state.sessionOverview, ...action.payload } };
        case 'UPDATE_STUDENT_CHECKIN':
            return {
                ...state,
                studentCheckIn: {
                    ...state.studentCheckIn,
                    [action.payload.studentId]: {
                        ...state.studentCheckIn[action.payload.studentId],
                        ...action.payload.data,
                    },
                },
            };
        case 'UPDATE_STUDENT_DEEPDIVE':
            return { ...state, studentDeepDive: { ...state.studentDeepDive, ...action.payload } };
        case 'UPDATE_STRATEGIES':
            return { ...state, strategies: { ...state.strategies, ...action.payload } };
        case 'UPDATE_ESCALATION':
            return { ...state, escalation: { ...state.escalation, ...action.payload } };
        case 'SUBMIT':
            return { ...state, submitted: true };
        default:
            return state;
    }
}

const App = () => {
    const [state, dispatch] = useReducer(formReducer, initialState);

    const presentStudents = useMemo(() => {
        return MOCK_STUDENTS.filter(
            (s) => state.sessionInfo.attendance[s.id] === 'present' || state.sessionInfo.attendance[s.id] === 'late'
        );
    }, [state.sessionInfo.attendance]);

    const lowScoringStudents = useMemo(() => {
        return presentStudents.filter((s) => {
            const check = state.studentCheckIn[s.id];
            return (check?.engagement && parseInt(check.engagement) <= 2) ||
                   (check?.understanding && parseInt(check.understanding) <= 2);
        });
    }, [presentStudents, state.studentCheckIn]);

    const hasEscalations = state.studentDeepDive.escalate;

    const progressPercentage = useMemo(() => {
        if (state.submitted) return 100;
        return Math.round(((state.currentStep) / STEPS.length) * 100);
    }, [state.currentStep, state.submitted]);

    if (state.submitted) {
        return (
            <div className="reflection-form">
                <div className="reflection-form__main">
                    <div className="reflection-form__content" style={{ margin: '0 auto' }}>
                        <SuccessScreen />
                    </div>
                </div>
            </div>
        );
    }

    const renderSection = () => {
        switch (STEPS[state.currentStep].id) {
            case 'session-info':
                return (
                    <SessionInfo
                        data={state.sessionInfo}
                        sessions={MOCK_SESSIONS}
                        students={MOCK_STUDENTS}
                        onChange={(payload) => dispatch({ type: 'UPDATE_SESSION_INFO', payload })}
                    />
                );
            case 'session-overview':
                return (
                    <SessionOverview
                        data={state.sessionOverview}
                        onChange={(payload) => dispatch({ type: 'UPDATE_SESSION_OVERVIEW', payload })}
                    />
                );
            case 'student-checkin':
                return (
                    <StudentCheckIn
                        students={presentStudents}
                        data={state.studentCheckIn}
                        onChange={(studentId, data) =>
                            dispatch({ type: 'UPDATE_STUDENT_CHECKIN', payload: { studentId, data } })
                        }
                    />
                );
            case 'student-deepdive':
                return (
                    <StudentDeepDive
                        students={presentStudents}
                        lowScoringStudents={lowScoringStudents}
                        data={state.studentDeepDive}
                        onChange={(payload) => dispatch({ type: 'UPDATE_STUDENT_DEEPDIVE', payload })}
                    />
                );
            case 'strategies':
                return (
                    <TeachingStrategies
                        strategiesList={STRATEGIES_LIST}
                        data={state.strategies}
                        onChange={(payload) => dispatch({ type: 'UPDATE_STRATEGIES', payload })}
                    />
                );
            case 'review-submit':
                return (
                    <ReviewSubmit
                        state={state}
                        students={MOCK_STUDENTS}
                        presentStudents={presentStudents}
                        hasEscalations={hasEscalations}
                        escalation={state.escalation}
                        onEscalationChange={(payload) => dispatch({ type: 'UPDATE_ESCALATION', payload })}
                        onSubmit={() => dispatch({ type: 'SUBMIT' })}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="reflection-form">
            <div className="reflection-form__sidebar-wrapper">
                <FormSidebar
                    steps={STEPS}
                    currentStep={state.currentStep}
                    onStepClick={(index) => dispatch({ type: 'SET_STEP', payload: index })}
                    hasEscalations={hasEscalations}
                />
            </div>

            <div className="reflection-form__main">
                <div className="reflection-form__header">
                    <div className="reflection-form__header-top">
                        <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>
                            Post-Session Reflection
                        </h4>
                        <span className="body3-txt reflection-form__progress-label">
                            Step {state.currentStep + 1} of {STEPS.length}
                        </span>
                    </div>
                    <FormProgress value={progressPercentage} />
                </div>

                <div className="reflection-form__content">
                    {renderSection()}
                </div>

                <div className="reflection-form__nav-footer">
                    <div>
                        {state.currentStep > 0 && (
                            <Button
                                text="Previous"
                                style="default"
                                fill="outline"
                                size="medium"
                                leadingVisual="chevron-left"
                                onClick={() => dispatch({ type: 'PREV_STEP' })}
                            />
                        )}
                    </div>
                    <div className="reflection-form__nav-right">
                        {state.currentStep < STEPS.length - 1 && (
                            <Button
                                text="Next"
                                style="primary"
                                fill="filled"
                                size="medium"
                                trailingVisual="chevron-right"
                                onClick={() => dispatch({ type: 'NEXT_STEP' })}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
