import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import Rating from '@/components/forms-and-inputs/Rating';
import Textarea from '@/components/forms-and-inputs/Textarea';
import { PageLayout } from '@/specs/Universal/Pages';
import SideNavBar from '@/specs/Toolkit/Post-Session/Sections/SideNavBar/SideNavBar';
import SessionInformationForm from '@/specs/Toolkit/Post-Session/Sections/SessionInformationForm/SessionInformationForm';
import SessionReflectionFormV2 from '@/specs/Toolkit/Post-Session/Sections/SessionReflectionForm/SessionReflectionFormV2';
import StudentReflectionFormV2 from '@/specs/Toolkit/Post-Session/Sections/StudentReflectionForm/StudentReflectionFormV2';
import LinearScale from '@/specs/Toolkit/Post-Session/Sections/LinearScale/LinearScale';
import SaveAndExitModal from '@/specs/Toolkit/Post-Session/Modals/SaveAndExitModal/SaveAndExitModal';
import ConfirmationPopUp from '@/specs/Toolkit/Post-Session/Modals/ConfirmationPopUp/ConfirmationPopUp';
import {
    FORM_RATING_COMMENTS,
    formatLastUpdated,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

const DEFAULT_STUDENTS = [
    { id: 'kiera', name: 'Kiera Wintervale', status: 'incomplete' },
    { id: 'baxter', name: 'Baxter Ellington', status: 'incomplete' },
    { id: 'milo', name: 'Milo Thorne', status: 'incomplete' },
];

/**
 * Self reflection step body.
 *
 * @param {object} props
 */
function SelfReflectionStep({ data, onChange, onCancel, onSaveAndExit, onNext, onPrevious }) {
    const rating = data.rating || 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>Self Reflection</h4>
                <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>{formatLastUpdated()}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                    How do you feel about your performance this session?
                    <span style={{ color: 'var(--color-danger)' }}> *</span>
                </p>
                <LinearScale
                    name="self-reflection-rating"
                    value={rating}
                    onChange={(value) => onChange({ ...data, rating: value })}
                />
            </div>
            {rating > 0 && (
                <Textarea
                    id="self-reflection-notes"
                    label="Anything else you’d like to note?"
                    value={data.notes || ''}
                    onChange={(event) => onChange({ ...data, notes: event.target.value })}
                    rows={4}
                />
            )}
            <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)', marginTop: 'auto' }}>
                <Button text="Previous" style="default" fill="tonal" onClick={onPrevious} />
                <Button text="Cancel" style="default" fill="tonal" onClick={onCancel} />
                <Button text="Save & Exit" style="primary" fill="tonal" disabled={rating < 1} onClick={onSaveAndExit} />
                <Button text="Next" style="primary" fill="filled" disabled={rating < 1} onClick={onNext} />
            </div>
        </div>
    );
}

SelfReflectionStep.propTypes = {
    data: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onNext: PropTypes.func,
    onPrevious: PropTypes.func,
};

/**
 * Form feedback step body.
 *
 * @param {object} props
 */
function FormFeedbackStep({ data, onChange, onCancel, onSaveAndExit, onPrevious, onSubmit }) {
    const rating = data.rating || 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>Form Feedback</h4>
                <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>{formatLastUpdated()}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                    How was this reflection form?
                    <span style={{ color: 'var(--color-danger)' }}> *</span>
                </p>
                <Rating
                    id="form-feedback-rating"
                    value={rating}
                    onChange={(value) => onChange({ ...data, rating: value })}
                    icon="thumbs-up"
                    variant="comments"
                    showCommentsLabel={rating > 0}
                    commentsLabel={FORM_RATING_COMMENTS[rating]}
                />
            </div>
            <Textarea
                id="form-feedback-notes"
                label="Any feedback on the reflection experience?"
                value={data.notes || ''}
                onChange={(event) => onChange({ ...data, notes: event.target.value })}
                rows={4}
            />
            <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)', marginTop: 'auto' }}>
                <Button text="Previous" style="default" fill="tonal" onClick={onPrevious} />
                <Button text="Cancel" style="default" fill="tonal" onClick={onCancel} />
                <Button text="Save & Exit" style="primary" fill="tonal" disabled={rating < 1} onClick={onSaveAndExit} />
                <Button text="Submit reflection" style="primary" fill="filled" disabled={rating < 1} onClick={onSubmit} />
            </div>
        </div>
    );
}

FormFeedbackStep.propTypes = {
    data: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onPrevious: PropTypes.func,
    onSubmit: PropTypes.func,
};

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
 * @param {boolean} [props.showSaveAndExitOnMount=false] - Story helper for Save & Exit modal state
 */
const ReflectionFlow = ({
    students: studentsProp = DEFAULT_STUDENTS,
    initialTab = 'session-information',
    initialSessionInfo = {},
    onExit,
    onSubmitted,
    showSaveAndExitOnMount = false,
}) => {
    const [students, setStudents] = useState(studentsProp);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [sessionInfo, setSessionInfo] = useState(initialSessionInfo);
    const [studentReflections, setStudentReflections] = useState({});
    const [sessionReflection, setSessionReflection] = useState({});
    const [selfReflection, setSelfReflection] = useState({});
    const [formFeedback, setFormFeedback] = useState({});
    const [completedSections, setCompletedSections] = useState({});
    const [showSaveExit, setShowSaveExit] = useState(showSaveAndExitOnMount);
    const [submitted, setSubmitted] = useState(false);

    const selectedStudentIndex = activeTab.startsWith('student-')
        ? Number(activeTab.replace('student-', ''))
        : 0;

    const completedStudents = useMemo(
        () => students.every((student) => student.status === 'complete'),
        [students],
    );

    const canSubmit = Boolean(
        completedSections['session-information']
        && completedStudents
        && completedSections['session-reflection']
        && completedSections['self-reflection']
        && completedSections['form-feedback'],
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
     * Opens Save & Exit confirmation.
     */
    const openSaveExit = () => setShowSaveExit(true);

    /**
     * Advances after Session Information.
     * @param {object} data
     */
    const handleSessionInfoNext = (data) => {
        setSessionInfo(data);
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
        setActiveTab('self-reflection');
    };

    /**
     * Completes self reflection and moves to form feedback.
     */
    const handleSelfNext = () => {
        markComplete('self-reflection');
        setActiveTab('form-feedback');
    };

    /**
     * Final submit of the in-memory reflection.
     */
    const handleSubmit = () => {
        markComplete('form-feedback');
        setSubmitted(true);
        onSubmitted?.();
    };

    /**
     * Renders the active step panel.
     * @returns {React.ReactNode}
     */
    const renderStep = () => {
        if (activeTab === 'session-information') {
            return (
                <SessionInformationForm
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
                    onCancel={openSaveExit}
                    onSaveAndExit={(data) => {
                        setSessionInfo(data);
                        openSaveExit();
                    }}
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
                    aiState={studentReflections[studentKey]?.goalProgress?.length ? 'ready' : 'idle'}
                    onCancel={openSaveExit}
                    onSaveAndExit={(data) => {
                        setStudentReflections((prev) => ({ ...prev, [studentKey]: data }));
                        openSaveExit();
                    }}
                    onNext={handleStudentNext}
                />
            );
        }

        if (activeTab === 'session-reflection') {
            return (
                <SessionReflectionFormV2
                    initialData={sessionReflection}
                    onCancel={openSaveExit}
                    onSaveAndExit={(data) => {
                        setSessionReflection(data);
                        openSaveExit();
                    }}
                    onNext={handleSessionReflectionNext}
                />
            );
        }

        if (activeTab === 'self-reflection') {
            return (
                <SelfReflectionStep
                    data={selfReflection}
                    onChange={setSelfReflection}
                    onPrevious={() => setActiveTab('session-reflection')}
                    onCancel={openSaveExit}
                    onSaveAndExit={openSaveExit}
                    onNext={handleSelfNext}
                />
            );
        }

        if (activeTab === 'form-feedback') {
            return (
                <FormFeedbackStep
                    data={formFeedback}
                    onChange={setFormFeedback}
                    onPrevious={() => setActiveTab('self-reflection')}
                    onCancel={openSaveExit}
                    onSaveAndExit={openSaveExit}
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
                        onTabClick={setActiveTab}
                        onSubmit={handleSubmit}
                    />
                    <div style={{ flex: '1 1 auto', minWidth: 0, width: '100%' }}>
                        {renderStep()}
                    </div>
                </div>
            </PageLayout>

            <SaveAndExitModal
                show={showSaveExit}
                onClose={() => setShowSaveExit(false)}
                onExitWithoutSaving={() => {
                    setShowSaveExit(false);
                    onExit?.();
                }}
                onSaveAndExit={() => {
                    setShowSaveExit(false);
                    onExit?.();
                }}
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
};

export default ReflectionFlow;
