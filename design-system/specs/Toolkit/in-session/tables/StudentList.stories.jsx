import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button';
import Badge from '../../../../../packages/plus-ds/src/components/Badge/Badge';
import { AttendanceDropdown } from '../elements/AttendanceDropdown.jsx';
import { EngagementDropdown } from '../elements/EngagementDropdown.jsx';

export default {
    title: 'Specs/Toolkit/In-Session/Tables/Student List',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Student List table for in-session view. 17-column grid layout with student name, status badge, attendance dropdown, engagement dropdown, and action button.'
            }
        }
    },
};

/**
 * Student status badge configuration
 * Maps status to badge style and text
 */
const getStatusConfig = (status) => {
    const configs = {
        'needs-motivation': { text: 'Needs motivation', style: 'relationship' },
        'needs-goals': { text: 'Needs to set goals', style: 'relationship' },
        'on-track': { text: 'On track', style: 'info' },
        'exceeding': { text: 'Exceeding goals', style: 'success' }
    };
    return configs[status] || configs['needs-goals'];
};

/**
 * Student Badge Component
 * "New" badge for new students
 */
const StudentBadge = ({ isNew }) => {
    if (!isNew) return null;
    return (
        <Badge
            text="New"
            style="info"
            size="b3"
            className="fw-normal"
        />
    );
};

/**
 * Table Header Row
 * 17-column grid matching Figma design
 * Columns: Name (4), Status (4), Attendance (3), Engagement (3), Action (3)
 */
export const TableHeaderRow = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(17, 1fr)',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)'
        }}
    >
        {/* Name Header - spans 4 columns */}
        <div
            style={{
                gridColumn: 'span 4',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-sm)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Name
            </span>
            <i
                className="fa-solid fa-arrow-up"
                style={{
                    fontSize: 'var(--font-size-fa-b2-solid)',
                    color: 'var(--color-outline-variant)'
                }}
            />
        </div>

        {/* Status Header - spans 4 columns */}
        <div
            style={{
                gridColumn: 'span 4',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-sm)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Status
            </span>
            <i
                className="fa-solid fa-arrow-up"
                style={{
                    fontSize: 'var(--font-size-fa-b2-solid)',
                    color: 'var(--color-outline-variant)'
                }}
            />
        </div>

        {/* Attendance Header - spans 3 columns */}
        <div
            style={{
                gridColumn: 'span 3',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Attendance
            </span>
        </div>

        {/* Engagement Header - spans 3 columns */}
        <div
            style={{
                gridColumn: 'span 3',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Engagement
            </span>
        </div>

        {/* Action Header - spans 3 columns */}
        <div
            style={{
                gridColumn: 'span 3',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Action
            </span>
        </div>
    </div>
);

/**
 * Table Row Component
 * 17-column grid layout matching Figma node 1952-150240
 * Cell padding: var(--size-table-cell-x), var(--size-table-cell-y)
 * 
 * Interactive states:
 * - Hover: background changes to --color-on-surface-state-08
 * - Pressed: background changes to --color-on-surface-state-16
 */
export const TableRow = ({ 
    studentName, 
    isNew = false, 
    status = 'needs-goals',
    attendanceStatus = 'unknown',
    engagementStatus = 'unknown',
    state: forcedState, 
    interactive = true,
    onAttendanceChange,
    onEngagementChange
}) => {
    const [currentState, setCurrentState] = useState('default');

    const effectiveState = forcedState || currentState;

    const stateStyles = {
        default: {},
        hover: { backgroundColor: 'var(--color-on-surface-state-08)' },
        pressed: { backgroundColor: 'var(--color-on-surface-state-16)' }
    };

    const handleMouseEnter = interactive && !forcedState ? () => setCurrentState('hover') : undefined;
    const handleMouseLeave = interactive && !forcedState ? () => setCurrentState('default') : undefined;
    const handleMouseDown = interactive && !forcedState ? () => setCurrentState('pressed') : undefined;
    const handleMouseUp = interactive && !forcedState ? () => setCurrentState('hover') : undefined;

    const statusConfig = getStatusConfig(status);

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(17, 1fr)',
                width: '100%',
                borderRadius: 'var(--size-table-radius-md)',
                transition: 'background-color 0.15s ease',
                ...stateStyles[effectiveState]
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            {/* Name Cell - spans 4 columns */}
            <div
                style={{
                    gridColumn: 'span 4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <StudentBadge isNew={isNew} />
                <span 
                    className="body3-txt" 
                    style={{ 
                        color: 'var(--color-on-surface)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {studentName}
                </span>
            </div>

            {/* Status Cell - spans 4 columns */}
            <div
                style={{
                    gridColumn: 'span 4',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <Badge
                    text={statusConfig.text}
                    style={statusConfig.style}
                    size="b3"
                    className="fw-normal"
                />
            </div>

            {/* Attendance Cell - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <AttendanceDropdown 
                    initialStatus={attendanceStatus}
                    onStatusChange={onAttendanceChange}
                />
            </div>

            {/* Engagement Cell - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <EngagementDropdown 
                    initialStatus={engagementStatus}
                    onStatusChange={onEngagementChange}
                />
            </div>

            {/* Action Cell - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Button
                    text="Goals"
                    style="primary"
                    fill="outline"
                    size="small"
                />
            </div>
        </div>
    );
};

// Sample student data matching Figma design
const sampleStudents = [
    { studentName: 'Cameron Williamson', isNew: true, status: 'needs-motivation', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
    { studentName: 'Cameron Williamson', isNew: true, status: 'needs-goals', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
    { studentName: 'Cameron Williamson', isNew: true, status: 'needs-goals', attendanceStatus: 'unknown', engagementStatus: 'unknown' }
];

/**
 * Overview
 * Shows the complete Student List table with header and sample rows
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <TableHeaderRow />
        {sampleStudents.map((student, index) => (
            <TableRow
                key={index}
                studentName={student.studentName}
                isNew={student.isNew}
                status={student.status}
                attendanceStatus={student.attendanceStatus}
                engagementStatus={student.engagementStatus}
            />
        ))}
    </div>
);

/**
 * Row States
 * Shows different visual states for table rows
 */
export const RowStates = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--size-spacing-space-400)',
        padding: 'var(--size-spacing-space-400)'
    }}>
        <h3 className="h5">Table Row States</h3>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default</h6>
            <TableRow
                studentName="Cameron Williamson"
                isNew={true}
                status="needs-motivation"
                state="default"
            />
        </div>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover</h6>
            <TableRow
                studentName="Cameron Williamson"
                isNew={true}
                status="needs-goals"
                state="hover"
            />
        </div>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed</h6>
            <TableRow
                studentName="Cameron Williamson"
                isNew={true}
                status="needs-goals"
                state="pressed"
            />
        </div>
    </div>
);

/**
 * Interactive
 * Fully interactive table with working dropdowns
 */
export const Interactive = () => {
    const [students, setStudents] = useState([
        { id: 1, studentName: 'Cameron Williamson', isNew: true, status: 'needs-motivation', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
        { id: 2, studentName: 'Jane Cooper', isNew: true, status: 'needs-goals', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
        { id: 3, studentName: 'Robert Fox', isNew: false, status: 'on-track', attendanceStatus: 'present', engagementStatus: 'fully-engaged' },
        { id: 4, studentName: 'Esther Howard', isNew: true, status: 'needs-goals', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
        { id: 5, studentName: 'Leslie Alexander', isNew: false, status: 'exceeding', attendanceStatus: 'present', engagementStatus: 'fully-engaged' }
    ]);

    const handleAttendanceChange = (studentId) => (newStatus) => {
        setStudents(prev => prev.map(s => 
            s.id === studentId ? { ...s, attendanceStatus: newStatus } : s
        ));
    };

    const handleEngagementChange = (studentId) => (newStatus) => {
        setStudents(prev => prev.map(s => 
            s.id === studentId ? { ...s, engagementStatus: newStatus } : s
        ));
    };

    return (
        <div 
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                width: '100%',
                backgroundColor: 'var(--color-surface-variant)',
                padding: 'var(--size-section-gap-lg)',
                minHeight: '100vh'
            }}
        >
            <div style={{ marginBottom: 'var(--size-section-gap-md)' }}>
                <h5 className="text-muted mb-2">Interactive Student List</h5>
                <p className="text-muted small mb-0">Click on the Attendance and Engagement dropdowns to change status.</p>
            </div>

            <div 
                style={{ 
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)'
                }}
            >
                <TableHeaderRow />
                {students.map((student) => (
                    <TableRow
                        key={student.id}
                        studentName={student.studentName}
                        isNew={student.isNew}
                        status={student.status}
                        attendanceStatus={student.attendanceStatus}
                        engagementStatus={student.engagementStatus}
                        onAttendanceChange={handleAttendanceChange(student.id)}
                        onEngagementChange={handleEngagementChange(student.id)}
                    />
                ))}
            </div>
        </div>
    );
};
