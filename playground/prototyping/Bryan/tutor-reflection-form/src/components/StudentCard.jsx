import React from 'react';

const StudentCard = ({ student, highlighted = false, children }) => {
    const initials = student.name
        .split(' ')
        .map((n) => n[0])
        .join('');

    return (
        <div className={`student-card${highlighted ? ' student-card--highlighted' : ''}`}>
            <div className="student-card__header">
                <div className="student-card__avatar">{initials}</div>
                <span className="body1-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {student.name}
                </span>
            </div>
            {children}
        </div>
    );
};

export default StudentCard;
