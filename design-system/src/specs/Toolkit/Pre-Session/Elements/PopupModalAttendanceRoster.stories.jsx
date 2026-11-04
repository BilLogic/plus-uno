import React from 'react';
import { AttendanceBadge } from './badges/AttendanceBadge.jsx';
import { LeadBadge } from './badges/TutorBadges.jsx';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Pop-up Modal Attendance Roster',
    parameters: {
        layout: 'centered',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Attendance Roster Row
 * A single row in the attendance roster showing name, optional lead badge, and attendance status badge.
 *
 * Types:
 * - student: Name + Attendance Badge
 * - tutor: Name + Lead Badge (optional) + Attendance Badge
 *
 * Tokens:
 * - Padding: --pad-y-lg
 * - Gap: --stack-md
 * - Typography: body2-txt (light weight)
 * - Color: --color-on-surface
 * - Border radius: --size-modal-radius-md (legacy radius-3)
 */
export const AttendanceRosterRow = ({
    name,
    type = 'student',
    status = 'unknown',
    showDropdown = true,
    showBadge = true,
    isLead = false,
}) => (
    <div
        className="d-flex align-items-center w-100"
        style={{
            padding: 'var(--pad-y-lg) 0',
            gap: 'var(--stack-md)',
            borderRadius: 'var(--size-modal-radius-md)',
        }}
    >
        {/* Name Tag */}
        <div
            className="d-flex align-items-center"
            style={{
                flex: '1 0 0',
                gap: type === 'tutor' ? 'var(--stack-md)' : '0',
            }}
        >
            <span
                className="body2-txt font-weight-light"
                style={{
                    color: 'var(--ds-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {name}
            </span>

            {/* Lead Badge (tutor only) */}
            {type === 'tutor' && isLead && <LeadBadge />}
        </div>

        {/* Attendance Badge */}
        {showBadge && <AttendanceBadge status={status} showDropdown={showDropdown} />}
    </div>
);

/**
 * Overview
 * Shows all types and states of the attendance roster row
 */
export const Overview = () => (
    <div
        style={{
            width: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
        }}
    >
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-md)' }}>Student Rows</h6>
            <div>
                <AttendanceRosterRow name="Ben Green" type="student" status="unknown" showDropdown />
                <AttendanceRosterRow name="Ben Green" type="student" status="present" showDropdown={false} />
                <AttendanceRosterRow name="Ben Green" type="student" status="absent" showDropdown={false} />
                <AttendanceRosterRow name="Ben Green" type="student" status="na" showDropdown={false} />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-md)' }}>Tutor Rows</h6>
            <div>
                <AttendanceRosterRow name="Ben Green" type="tutor" status="unknown" showDropdown />
                <AttendanceRosterRow name="Ben Green" type="tutor" status="unknown" showDropdown isLead />
            </div>
        </section>
    </div>
);
