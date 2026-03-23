import React from 'react';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';

/**
 * Modal showing all sessions the user has been assigned to,
 * with an "Attended" or "Absent" badge per session.
 */
const AttendanceModal = ({ onClose }) => {
    const assignedSessions = [
        { id: 1, title: 'Math Tutoring Session', date: 'Mon, Dec 2', status: 'attended' },
        { id: 2, title: 'Reading Workshop', date: 'Wed, Dec 4', status: 'attended' },
        { id: 3, title: 'Science Lab', date: 'Fri, Dec 6', status: 'absent' },
        { id: 4, title: 'Writing Group', date: 'Mon, Dec 9', status: 'attended' },
        { id: 5, title: 'History Review', date: 'Wed, Dec 11', status: 'absent' },
    ];

    const modalBody = (
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
            {assignedSessions.map((session) => (
                <li
                    key={session.id}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                        backgroundColor: 'var(--color-surface-container)',
                        borderRadius: 'var(--size-radius-md)',
                        border: '1px solid var(--color-outline-variant)',
                    }}
                >
                    <div>
                        <div className="body1-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                            {session.title}
                        </div>
                        <div className="body3-txt" style={{ color: 'var(--color-on-surface-secondary)', marginTop: 'var(--size-element-gap-xs)' }}>
                            {session.date}
                        </div>
                    </div>
                    <Badge
                        text={session.status === 'attended' ? 'Attended' : 'Absent'}
                        style={session.status === 'attended' ? 'success' : 'danger'}
                        size="b2"
                    />
                </li>
            ))}
        </ul>
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
            aria-labelledby="attendance-modal-title"
        >
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px' }}>
                <Modal
                    id="attendance-modal"
                    title="Sessions you've been assigned to"
                    onClose={onClose}
                    showBottomButtons={false}
                    type="scrollable"
                    width={480}
                    paddingSize="md"
                    gapSize="md"
                >
                    {modalBody}
                </Modal>
            </div>
        </div>
    );
};

export default AttendanceModal;
