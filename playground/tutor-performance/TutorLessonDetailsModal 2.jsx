/**
 * Modal showing lesson details for a selected tutor:
 * lessons learned, completion status, accuracy per lesson, time spent.
 * Opened when clicking a tutor row in Performance Details table.
 */
import React from 'react';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';

// Mock lesson data per tutor (in real app would come from API keyed by tutor id).
const LESSONS_BY_TUTOR = {
    1: [
        { id: 1, name: 'SMART Goals', completed: true, accuracy: 95, timeSpentMins: 12 },
        { id: 2, name: 'Active Listening', completed: true, accuracy: 88, timeSpentMins: 18 },
        { id: 3, name: 'Questioning Techniques', completed: true, accuracy: 72, timeSpentMins: 25 },
        { id: 4, name: 'Feedback & Reflection', completed: false, accuracy: null, timeSpentMins: 8 },
    ],
    2: [
        { id: 1, name: 'SMART Goals', completed: true, accuracy: 70, timeSpentMins: 15 },
        { id: 2, name: 'Active Listening', completed: false, accuracy: null, timeSpentMins: 5 },
    ],
    3: [
        { id: 1, name: 'SMART Goals', completed: true, accuracy: 100, timeSpentMins: 10 },
        { id: 2, name: 'Active Listening', completed: true, accuracy: 92, timeSpentMins: 20 },
        { id: 3, name: 'Questioning Techniques', completed: true, accuracy: 85, timeSpentMins: 22 },
    ],
    4: [
        { id: 1, name: 'SMART Goals', completed: true, accuracy: 65, timeSpentMins: 30 },
        { id: 2, name: 'Active Listening', completed: true, accuracy: 78, timeSpentMins: 14 },
        { id: 3, name: 'Questioning Techniques', completed: false, accuracy: null, timeSpentMins: 0 },
    ],
    5: [
        { id: 1, name: 'SMART Goals', completed: true, accuracy: 90, timeSpentMins: 11 },
        { id: 2, name: 'Active Listening', completed: true, accuracy: 94, timeSpentMins: 19 },
        { id: 3, name: 'Questioning Techniques', completed: true, accuracy: 88, timeSpentMins: 28 },
        { id: 4, name: 'Feedback & Reflection', completed: true, accuracy: 82, timeSpentMins: 16 },
    ],
    6: [],
    7: [
        { id: 1, name: 'SMART Goals', completed: true, accuracy: 98, timeSpentMins: 9 },
        { id: 2, name: 'Active Listening', completed: true, accuracy: 91, timeSpentMins: 21 },
    ],
    8: [
        { id: 1, name: 'SMART Goals', completed: true, accuracy: 75, timeSpentMins: 17 },
        { id: 2, name: 'Active Listening', completed: true, accuracy: 80, timeSpentMins: 23 },
        { id: 3, name: 'Questioning Techniques', completed: false, accuracy: null, timeSpentMins: 3 },
    ],
    9: [
        { id: 1, name: 'SMART Goals', completed: false, accuracy: null, timeSpentMins: 0 },
    ],
};

const getAccuracyStyle = (value) => {
    if (value == null) return 'secondary';
    if (value >= 80) return 'success';
    if (value >= 50) return 'warning';
    return 'danger';
};

const TutorLessonDetailsModal = ({ tutor, onClose }) => {
    const lessons = (tutor && LESSONS_BY_TUTOR[tutor.id]) || [];
    const completedCount = lessons.filter((l) => l.completed).length;
    const totalMins = lessons.reduce((acc, l) => acc + (l.timeSpentMins || 0), 0);

    const modalBody = (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-md)',
            }}
        >
            {tutor && (
                <div
                    className="body3-txt"
                    style={{
                        color: 'var(--color-on-surface-secondary)',
                        marginBottom: 'var(--size-element-gap-xs)',
                    }}
                >
                    Summary: {completedCount}/{lessons.length} lessons completed · {totalMins} min total
                </div>
            )}
            {lessons.length === 0 ? (
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-secondary)' }}>
                    No lesson data for this tutor yet.
                </p>
            ) : (
                <ul
                    className="list-unstyled"
                    style={{
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-element-gap-sm)',
                    }}
                >
                    {lessons.map((lesson) => (
                        <li
                            key={lesson.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto auto',
                                alignItems: 'center',
                                gap: 'var(--size-element-gap-md)',
                                padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                                backgroundColor: 'var(--color-surface-container)',
                                borderRadius: 'var(--size-radius-md)',
                                border: '1px solid var(--color-outline-variant)',
                            }}
                        >
                            <div>
                                <div className="body1-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                    {lesson.name}
                                </div>
                                <div className="body3-txt" style={{ color: 'var(--color-on-surface-secondary)', marginTop: 'var(--size-element-gap-xs)' }}>
                                    {lesson.completed ? 'Completed' : 'In progress'}
                                </div>
                            </div>
                            <Badge
                                text={lesson.completed ? 'Done' : '—'}
                                style={lesson.completed ? 'success' : 'secondary'}
                                size="b2"
                            />
                            <span className="body3-txt" style={{ color: 'var(--color-on-surface)' }}>
                                {lesson.accuracy != null ? (
                                    <Badge style={getAccuracyStyle(lesson.accuracy)} size="b2">
                                        {lesson.accuracy}%
                                    </Badge>
                                ) : (
                                    '—'
                                )}
                            </span>
                            <span className="body3-txt" style={{ color: 'var(--color-on-surface-secondary)', whiteSpace: 'nowrap' }}>
                                {lesson.timeSpentMins != null ? `${lesson.timeSpentMins} min` : '—'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'var(--color-scrim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1050,
                padding: 'var(--size-section-pad-md)',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutor-lesson-details-modal-title"
        >
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '560px' }}>
                <Modal
                    id="tutor-lesson-details-modal"
                    title={tutor ? `Lesson details — ${tutor.tutorName}` : 'Lesson details'}
                    onClose={onClose}
                    showBottomButtons={false}
                    type="scrollable"
                    width={560}
                    paddingSize="md"
                    gapSize="md"
                >
                    {modalBody}
                </Modal>
            </div>
        </div>
    );
};

export default TutorLessonDetailsModal;
