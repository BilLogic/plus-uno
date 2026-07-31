import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import SideNavBar from '@/specs/Toolkit/Post-Session/Sections/SideNavBar/SideNavBar';
import SessionInfoForm from '@/specs/Toolkit/Post-Session/Sections/SessionInfoForm/SessionInfoForm';
import SessionReflectionForm from '@/specs/Toolkit/Post-Session/Sections/SessionReflectionForm/SessionReflectionForm';
import StudentReflectionForm from '@/specs/Toolkit/Post-Session/Sections/StudentReflectionForm/StudentReflectionForm';
import SelfReflectionForm from '@/specs/Toolkit/Post-Session/Sections/SelfReflectionForm/SelfReflectionForm';
import FormFeedbackForm from '@/specs/Toolkit/Post-Session/Sections/FormFeedbackForm/FormFeedbackForm';
import ConfirmationPopUp from '@/specs/Toolkit/Post-Session/Modals/ConfirmationPopUp/ConfirmationPopUp';
import {
    ReflectionContentRow,
    ReflectionExitModals,
    ReflectionPageLayout,
} from '@/specs/Toolkit/Post-Session/Pages/pageShell';

const DEFAULT_STUDENTS = [
    { id: 'kiera', name: 'Kiera Wintervale', status: 'incomplete' },
    { id: 'baxter', name: 'Baxter Ellington', status: 'incomplete' },
    { id: 'milo', name: 'Milo Thorne', status: 'incomplete' },
];

/**
 * Clamps initial tab when cadence sections are hidden.
 *
 * @param {string} tab
 * @param {boolean} showSelfReflection
 * @param {boolean} showFormFeedback
 * @returns {string}
 */
function resolveInitialTab(tab, showSelfReflection, showFormFeedback) {
    if (tab === 'self-reflection' && !showSelfReflection) {
        return showFormFeedback ? 'form-feedback' : 'session-reflection';
    }
    if (tab === 'form-feedback' && !showFormFeedback) {
        return showSelfReflection ? 'self-reflection' : 'session-reflection';
    }
    return tab;
}

/**
 * Full post-session reflection flow orchestrator (PageLayout + side nav + step content).
 * In-memory only — no backend.
 *
 * @param {object} props
 * @param {{ id?: string, name: string, status?: string }[]} [props.students]
 * @param {string} [props.initialTab='session-information']
 * @param {object} [props.initialSessionInfo]
 * @param {(result?: object) => void} [props.onExit]
 * @param {(result?: object) => void} [props.onSubmitted]
 * @param {null|'discard'|'saved'} [props.initialExitModal=null]
 * @param {boolean} [props.showSubmittedOnMount=false]
 * @param {object} [props.initialCompletedSections]
 * @param {object} [props.initialStudentReflections]
 * @param {object} [props.initialSessionReflection]
 * @param {object} [props.initialSelfReflection]
 * @param {object} [props.initialFormFeedback]
 * @param {boolean} [props.showSelfReflection=true]
 * @param {boolean} [props.showFormFeedback=true]
 */
const ReflectionFlow = ({
    students: studentsProp = DEFAULT_STUDENTS,
    initialTab = 'session-information',
    initialSessionInfo = {},
    onExit,
    onSubmitted,
    initialExitModal = null,
    showSubmittedOnMount = false,
    initialCompletedSections = {},
    initialStudentReflections = {},
    initialSessionReflection = {},
    initialSelfReflection = {},
    initialFormFeedback = {},
    showSelfReflection = true,
    showFormFeedback = true,
}) => {
    const [students, setStudents] = useState(studentsProp);
    const [activeTab, setActiveTab] = useState(
        () => resolveInitialTab(initialTab, showSelfReflection, showFormFeedback),
    );
    const [sessionInfo, setSessionInfo] = useState(initialSessionInfo);
    const [studentReflections, setStudentReflections] = useState(initialStudentReflections);
    const [sessionReflection, setSessionReflection] = useState(initialSessionReflection);
    const [selfReflection, setSelfReflection] = useState(initialSelfReflection);
    const [formFeedback, setFormFeedback] = useState(initialFormFeedback);
    const [completedSections, setCompletedSections] = useState(initialCompletedSections);
    const [draftSnapshot, setDraftSnapshot] = useState(null);
    /** @type {[null|'discard'|'saved', Function]} */
    const [exitModal, setExitModal] = useState(initialExitModal);
    const [submitted, setSubmitted] = useState(showSubmittedOnMount);
    const [cancelled, setCancelled] = useState(Boolean(initialSessionInfo.didNotHappen));

    const selectedStudentIndex = activeTab.startsWith('student-')
        ? Number(activeTab.replace('student-', ''))
        : 0;

    const completedStudents = useMemo(
        () => students.length > 0 && students.every((student) => student.status === 'complete'),
        [students],
    );

    const sessionInfoDone = Boolean(completedSections['session-information']);
    const studentReflectionDone = Boolean(completedSections['student-reflection']) || completedStudents;
    const sessionReflectionDone = Boolean(completedSections['session-reflection']);
    const selfReflectionDone = Boolean(completedSections['self-reflection']);

    /**
     * Prior steps required before Form Feedback / final Submit (excludes form-feedback itself).
     */
    const prerequisitesMet = Boolean(
        sessionInfoDone
        && studentReflectionDone
        && sessionReflectionDone
        && (!showSelfReflection || selfReflectionDone),
    );

    /**
     * SideNav Submit enablement — prior steps only (navigates to Form Feedback when needed).
     * Finalization still requires a Form Feedback rating when that step is shown.
     */
    const canSubmit = !cancelled && !submitted && prerequisitesMet;

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
     * Persists a draft snapshot into the active step's in-memory state.
     *
     * @param {object|null|undefined} data
     */
    const persistDraft = (data) => {
        if (!data) return;
        if (activeTab === 'session-information') setSessionInfo(data);
        else if (activeTab.startsWith('student-') || activeTab === 'student-reflection') {
            const index = activeTab === 'student-reflection' ? 0 : selectedStudentIndex;
            const student = students[index];
            if (student) {
                setStudentReflections((prev) => ({
                    ...prev,
                    [student.id || student.name]: data,
                }));
            }
        } else if (activeTab === 'session-reflection') setSessionReflection(data);
        else if (activeTab === 'self-reflection') setSelfReflection(data);
        else if (activeTab === 'form-feedback') setFormFeedback(data);
    };

    /**
     * Cancel → discard modal when dirty; clean Cancel exits immediately.
     *
     * @param {object} [data]
     * @param {boolean} [dirty=true]
     */
    const openDiscardModal = (data, dirty = true) => {
        if (!dirty) {
            onExit?.({ saved: false });
            return;
        }
        setDraftSnapshot(data || null);
        setExitModal('discard');
    };

    /**
     * Save & Exit from nav → persist then Saved modal (Figma type=exit).
     *
     * @param {object} [data]
     */
    const openSavedModal = (data) => {
        persistDraft(data);
        setDraftSnapshot(data || null);
        setExitModal('saved');
    };

    /**
     * Discard modal secondary: Save & Exit — persist then show Saved.
     */
    const handleDiscardSaveAndExit = () => {
        persistDraft(draftSnapshot);
        setExitModal('saved');
    };

    /**
     * Discard modal primary: leave without saving.
     */
    const handleExitWithoutSaving = () => {
        setExitModal(null);
        setDraftSnapshot(null);
        onExit?.({ saved: false });
    };

    /**
     * Saved modal primary: Exit after save.
     */
    const handleSavedExit = () => {
        const draft = draftSnapshot;
        setExitModal(null);
        setDraftSnapshot(null);
        onExit?.({ saved: true, draft });
    };

    /**
     * Saved modal secondary: Continue Editing.
     */
    const handleContinueEditing = () => {
        setExitModal(null);
        setDraftSnapshot(null);
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
     * Final submit — gated on prior steps + Form Feedback rating when shown.
     *
     * @param {object} [data]
     */
    const handleSubmit = (data) => {
        if (cancelled || submitted || !prerequisitesMet) return;

        if (showFormFeedback && activeTab !== 'form-feedback' && !data) {
            setActiveTab('form-feedback');
            return;
        }

        const payload = data || formFeedback;
        if (showFormFeedback && Number(payload?.rating) < 1) {
            if (activeTab !== 'form-feedback') setActiveTab('form-feedback');
            return;
        }

        if (data) setFormFeedback(data);
        markComplete('form-feedback');
        setSubmitted(true);
        onSubmitted?.({
            sessionInfo,
            studentReflections,
            sessionReflection,
            selfReflection,
            formFeedback: payload,
        });
    };

    /**
     * Gate SideNav jumps to completed (or current) prerequisites.
     *
     * @param {string} tab
     */
    const handleTabClick = (tab) => {
        if (tab === 'session-information') {
            setActiveTab(tab);
            return;
        }
        if (!sessionInfoDone) return;
        if (tab.startsWith('student-') || tab === 'student-reflection') {
            setActiveTab(tab);
            return;
        }
        if (tab === 'session-reflection') {
            if (studentReflectionDone || activeTab.startsWith('student-')) setActiveTab(tab);
            return;
        }
        if (tab === 'self-reflection') {
            if (showSelfReflection && sessionReflectionDone) setActiveTab(tab);
            return;
        }
        if (tab === 'form-feedback') {
            if (
                showFormFeedback
                && sessionReflectionDone
                && (!showSelfReflection || selfReflectionDone)
            ) {
                setActiveTab(tab);
            }
        }
    };

    /**
     * @returns {React.ReactNode}
     */
    const renderStep = () => {
        if (activeTab === 'session-information') {
            return (
                <SessionInfoForm
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
                    onCancel={(data, dirty) => openDiscardModal(data, dirty)}
                    onSaveAndExit={(data) => openSavedModal(data)}
                />
            );
        }

        if (activeTab.startsWith('student-') || activeTab === 'student-reflection') {
            const index = activeTab === 'student-reflection' ? 0 : selectedStudentIndex;
            const student = students[Number.isFinite(index) ? index : 0] || students[0];
            if (!student) {
                return <p className="body1-txt">Add students in Session Information to continue.</p>;
            }
            const studentKey = student.id || student.name;
            return (
                <StudentReflectionForm
                    key={studentKey}
                    studentName={student.name}
                    initialData={studentReflections[studentKey] || {}}
                    onCancel={(data, dirty) => openDiscardModal(data, dirty)}
                    onSaveAndExit={(data) => openSavedModal(data)}
                    onNext={handleStudentNext}
                />
            );
        }

        if (activeTab === 'session-reflection') {
            return (
                <SessionReflectionForm
                    initialData={sessionReflection}
                    onCancel={(data, dirty) => openDiscardModal(data, dirty)}
                    onSaveAndExit={(data) => openSavedModal(data)}
                    onNext={handleSessionReflectionNext}
                />
            );
        }

        if (activeTab === 'self-reflection' && showSelfReflection) {
            return (
                <SelfReflectionForm
                    initialData={selfReflection}
                    onPrevious={() => setActiveTab('session-reflection')}
                    onCancel={(data, dirty) => openDiscardModal(data, dirty)}
                    onSaveAndExit={(data) => openSavedModal(data)}
                    onNext={handleSelfNext}
                />
            );
        }

        if (activeTab === 'form-feedback' && showFormFeedback) {
            return (
                <FormFeedbackForm
                    initialData={formFeedback}
                    onDraftChange={setFormFeedback}
                    onPrevious={() => setActiveTab(showSelfReflection ? 'self-reflection' : 'session-reflection')}
                    onCancel={(data, dirty) => openDiscardModal(data, dirty)}
                    onSaveAndExit={(data) => openSavedModal(data)}
                    onSubmit={handleSubmit}
                />
            );
        }

        return null;
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReflectionPageLayout id="post-session-reflection-flow">
                <ReflectionContentRow
                    sideNav={(
                        <SideNavBar
                            students={students}
                            activeTab={activeTab}
                            completedSections={{
                                ...completedSections,
                                'student-reflection': studentReflectionDone,
                            }}
                            canSubmit={canSubmit}
                            showSelfReflection={showSelfReflection}
                            showFormFeedback={showFormFeedback}
                            onTabClick={handleTabClick}
                            onSubmit={() => handleSubmit()}
                        />
                    )}
                >
                    {renderStep()}
                </ReflectionContentRow>
            </ReflectionPageLayout>

            <ReflectionExitModals
                exitModal={exitModal}
                setExitModal={(next) => {
                    setExitModal(next);
                    if (next == null) setDraftSnapshot(null);
                }}
                onExitWithoutSaving={handleExitWithoutSaving}
                onSavedExit={handleSavedExit}
                onDiscardSaveAndExit={handleDiscardSaveAndExit}
                onContinueEditing={handleContinueEditing}
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
    initialExitModal: PropTypes.oneOf([null, 'discard', 'saved']),
    showSubmittedOnMount: PropTypes.bool,
    initialCompletedSections: PropTypes.object,
    initialStudentReflections: PropTypes.object,
    initialSessionReflection: PropTypes.object,
    initialSelfReflection: PropTypes.object,
    initialFormFeedback: PropTypes.object,
    showSelfReflection: PropTypes.bool,
    showFormFeedback: PropTypes.bool,
};

export default ReflectionFlow;
