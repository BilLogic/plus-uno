import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import SideNavBar from '@/specs/Toolkit/Post-Session/Sections/SideNavBar/SideNavBar';
import SessionInfo from '@/specs/Toolkit/Post-Session/Pages/SessionInfo/SessionInfo';
import SessionReflectionFormV2 from '@/specs/Toolkit/Post-Session/Sections/SessionReflectionForm/SessionReflectionFormV2';
import StudentReflectionFormV2 from '@/specs/Toolkit/Post-Session/Sections/StudentReflectionForm/StudentReflectionFormV2';
import SelfReflectionForm from '@/specs/Toolkit/Post-Session/Sections/SelfReflectionForm/SelfReflectionForm';
import FormFeedbackForm from '@/specs/Toolkit/Post-Session/Sections/FormFeedbackForm/FormFeedbackForm';
import ConfirmationPopUp from '@/specs/Toolkit/Post-Session/Modals/ConfirmationPopUp/ConfirmationPopUp';

const DEFAULT_STUDENTS = [
    { id: 'kiera', name: 'Kiera Wintervale', status: 'incomplete' },
    { id: 'baxter', name: 'Baxter Ellington', status: 'incomplete' },
    { id: 'milo', name: 'Milo Thorne', status: 'incomplete' },
];

/**
 * Full post-session reflection flow orchestrator (PageLayout + side nav + step content).
 * In-memory only — no backend.
 *
 * @param {object} props
 * @param {{ id?: string, name: string, status?: string }[]} [props.students]
 * @param {string} [props.initialTab='session-information']
 * @param {object} [props.initialSessionInfo]
 * @param {() => void} [props.onExit]
 * @param {() => void} [props.onSubmitted]
 * @param {boolean} [props.showSaveAndExitOnMount=false]
 * @param {boolean} [props.showSelfReflection=true] - Cadence flag (session_count % 10 == 5)
 * @param {boolean} [props.showFormFeedback=true] - Cadence flag (≤ once / 3 weeks)
 */
const ReflectionFlow = ({
    students: studentsProp = DEFAULT_STUDENTS,
    initialTab = 'session-information',
    initialSessionInfo = {},
    onExit,
    onSubmitted,
    showSaveAndExitOnMount = false,
    showSelfReflection = true,
    showFormFeedback = true,
}) => {
    const [students, setStudents] = useState(studentsProp);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [sessionInfo, setSessionInfo] = useState(initialSessionInfo);
    const [studentReflections, setStudentReflections] = useState({});
    const [sessionReflection, setSessionReflection] = useState({});
    const [selfReflection, setSelfReflection] = useState({});
    const [formFeedback, setFormFeedback] = useState({});
    const [completedSections, setCompletedSections] = useState({});
    const [draftSnapshot, setDraftSnapshot] = useState(null);
    const [showSaveExit, setShowSaveExit] = useState(showSaveAndExitOnMount);
    const [submitted, setSubmitted] = useState(false);
    const [cancelled, setCancelled] = useState(Boolean(initialSessionInfo.didNotHappen));

    const selectedStudentIndex = activeTab.startsWith('student-')
        ? Number(activeTab.replace('student-', ''))
        : 0;

    const completedStudents = useMemo(
        () => students.length > 0 && students.every((student) => student.status === 'complete'),
        [students],
    );

    const canSubmit = cancelled
        ? Boolean(completedSections.cancellation)
        : Boolean(
            completedSections['session-information']
            && completedStudents
            && completedSections['session-reflection']
            && (!showSelfReflection || completedSections['self-reflection'])
            && (!showFormFeedback || completedSections['form-feedback']),
        );

    /**
     * @param {string} section
     */
    const markComplete = (section) => {
        setCompletedSections((prev) => ({ ...prev, [section]: true }));
    };

    /**
     * @param {number} index
     */
    const markStudentComplete = (index) => {
        setStudents((prev) =>
            prev.map((student, i) => (i === index ? { ...student, status: 'complete' } : student)),
        );
    };

    /**
     * Opens Save & Exit confirmation, optionally capturing a draft snapshot.
     *
     * @param {object} [data]
     */
    const openSaveExit = (data) => {
        if (data) setDraftSnapshot(data);
        setShowSaveExit(true);
    };

    /**
     * Persists in-memory draft then exits (Save & Exit path).
     */
    const handleSaveAndExitConfirm = () => {
        if (draftSnapshot) {
            if (activeTab === 'session-information') setSessionInfo(draftSnapshot);
            else if (activeTab.startsWith('student-')) {
                const student = students[selectedStudentIndex];
                if (student) {
                    setStudentReflections((prev) => ({
                        ...prev,
                        [student.id || student.name]: draftSnapshot,
                    }));
                }
            } else if (activeTab === 'session-reflection') setSessionReflection(draftSnapshot);
            else if (activeTab === 'self-reflection') setSelfReflection(draftSnapshot);
            else if (activeTab === 'form-feedback') setFormFeedback(draftSnapshot);
        }
        setShowSaveExit(false);
        setDraftSnapshot(null);
        onExit?.({ saved: true, draft: draftSnapshot });
    };

    /**
     * Discards unsaved changes and exits.
     */
    const handleExitWithoutSaving = () => {
        setShowSaveExit(false);
        setDraftSnapshot(null);
        onExit?.({ saved: false });
    };

    /**
     * @param {object} data
     */
    const handleSessionInfoNext = (data) => {
        setSessionInfo(data);
        if (data.didNotHappen) {
            setCancelled(true);
            markComplete('cancellation');
            markComplete('session-information');
            setSubmitted(true);
            onSubmitted?.({ cancelled: true, data });
            return;
        }
        setCancelled(false);
        markComplete('session-information');
        setActiveTab(students.length ? 'student-0' : 'session-reflection');
    };

    /**
     * @param {object} data
     */
    const handleStudentNext = (data) => {
        const student = students[selectedStudentIndex];
        setStudentReflections((prev) => ({ ...prev, [student.id || student.name]: data }));
        markStudentComplete(selectedStudentIndex);
        const nextIndex = selectedStudentIndex + 1;
        if (nextIndex < students.length) {
            setActiveTab(`student-${nextIndex}`);
        } else {
            setCompletedSections((prev) => ({ ...prev, 'student-reflection': true }));
            setActiveTab('session-reflection');
        }
    };

    /**
     * @param {object} data
     */
    const handleSessionReflectionNext = (data) => {
        setSessionReflection(data);
        markComplete('session-reflection');
        if (showSelfReflection) {
            setActiveTab('self-reflection');
        } else if (showFormFeedback) {
            setActiveTab('form-feedback');
        } else {
            setSubmitted(true);
            onSubmitted?.({ data: { sessionReflection: data } });
        }
    };

    /**
     * @param {object} data
     */
    const handleSelfNext = (data) => {
        setSelfReflection(data);
        markComplete('self-reflection');
        if (showFormFeedback) {
            setActiveTab('form-feedback');
        } else {
            setSubmitted(true);
            onSubmitted?.({ data: { selfReflection: data } });
        }
    };

    /**
     * @param {object} data
     */
    const handleSubmit = (data) => {
        if (data) setFormFeedback(data);
        markComplete('form-feedback');
        setSubmitted(true);
        onSubmitted?.({
            sessionInfo,
            studentReflections,
            sessionReflection,
            selfReflection,
            formFeedback: data || formFeedback,
        });
    };

    /**
     * @returns {React.ReactNode}
     */
    const renderStep = () => {
        if (activeTab === 'session-information') {
            return (
                <SessionInfo
                    initialData={sessionInfo}
                    availableStudents={studentsProp}
                    selectedStudentIds={sessionInfo.selectedStudentIds || students.map((s) => s.id || s.name)}
                    onStudentSelectionChange={(ids) => {
                        setSessionInfo((prev) => ({ ...prev, selectedStudentIds: ids }));
                        setStudents(
                            studentsProp.filter((student) => ids.includes(student.id || student.name)),
                        );
                    }}
                    onSave={handleSessionInfoNext}
                    onCancel={() => openSaveExit()}
                    onSaveAndExit={(data) => openSaveExit(data)}
                />
            );
        }

        if (activeTab.startsWith('student-') || activeTab === 'student-reflection') {
            const index = activeTab === 'student-reflection' ? 0 : selectedStudentIndex;
            const student = students[index] || students[0];
            if (!student) {
                return <p className="body1-txt">Add students in Session Information to continue.</p>;
            }
            const studentKey = student.id || student.name;
            return (
                <StudentReflectionFormV2
                    key={studentKey}
                    studentName={student.name}
                    initialData={studentReflections[studentKey] || {}}
                    onCancel={() => openSaveExit()}
                    onSaveAndExit={(data) => openSaveExit(data)}
                    onNext={handleStudentNext}
                />
            );
        }

        if (activeTab === 'session-reflection') {
            return (
                <SessionReflectionFormV2
                    initialData={sessionReflection}
                    onCancel={() => openSaveExit()}
                    onSaveAndExit={(data) => openSaveExit(data)}
                    onNext={handleSessionReflectionNext}
                />
            );
        }

        if (activeTab === 'self-reflection' && showSelfReflection) {
            return (
                <SelfReflectionForm
                    initialData={selfReflection}
                    onPrevious={() => setActiveTab('session-reflection')}
                    onCancel={() => openSaveExit()}
                    onSaveAndExit={(data) => openSaveExit(data)}
                    onNext={handleSelfNext}
                />
            );
        }

        if (activeTab === 'form-feedback' && showFormFeedback) {
            return (
                <FormFeedbackForm
                    initialData={formFeedback}
                    onPrevious={() => setActiveTab(showSelfReflection ? 'self-reflection' : 'session-reflection')}
                    onCancel={() => openSaveExit()}
                    onSaveAndExit={(data) => openSaveExit(data)}
                    onSubmit={handleSubmit}
                />
            );
        }

        return null;
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <PageLayout
                topBarConfig={{
                    breadcrumbs: [
                        { text: 'Toolkit', href: '#' },
                        { text: 'Sessions', href: '#' },
                        { text: 'Reflection Form' },
                    ],
                    user: { name: 'John Doe', role: 'Lead' },
                }}
                sidebarConfig={{
                    user: 'tutor',
                    activeTab: 'sessions',
                }}
                id="post-session-reflection-flow"
                style={{ width: '100%', height: '100%' }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-surface-gap-md)',
                        width: '100%',
                        minHeight: '100%',
                        alignItems: 'stretch',
                    }}
                >
                    <SideNavBar
                        state={activeTab === 'session-information' ? 'pre-student-add' : activeTab.startsWith('student-') ? 'students-confirmed' : 'in-progress'}
                        students={students}
                        activeTab={activeTab}
                        completedSections={{
                            ...completedSections,
                            'student-reflection': completedStudents || completedSections['student-reflection'],
                        }}
                        canSubmit={canSubmit}
                        showSelfReflection={showSelfReflection}
                        showFormFeedback={showFormFeedback}
                        onTabClick={setActiveTab}
                        onSubmit={() => handleSubmit()}
                    />
                    <div style={{ flex: '1 1 auto', minWidth: 0, width: '100%' }}>
                        {renderStep()}
                    </div>
                </div>
            </PageLayout>

            <ConfirmationPopUp
                show={showSaveExit}
                type="exit-without-saving"
                onClose={() => {
                    setShowSaveExit(false);
                    setDraftSnapshot(null);
                }}
                onPrimary={handleExitWithoutSaving}
                onSecondary={handleSaveAndExitConfirm}
            />
            <ConfirmationPopUp
                show={submitted}
                type="reflection-submitted"
                onClose={() => setSubmitted(false)}
                onSecondary={() => setSubmitted(false)}
                onPrimary={onExit}
            />
        </div>
    );
};

ReflectionFlow.propTypes = {
    students: PropTypes.array,
    initialTab: PropTypes.string,
    initialSessionInfo: PropTypes.object,
    onExit: PropTypes.func,
    onSubmitted: PropTypes.func,
    showSaveAndExitOnMount: PropTypes.bool,
    showSelfReflection: PropTypes.bool,
    showFormFeedback: PropTypes.bool,
};

export default ReflectionFlow;
