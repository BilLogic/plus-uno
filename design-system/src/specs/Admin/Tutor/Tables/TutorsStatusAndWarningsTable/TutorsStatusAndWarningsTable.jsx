/**
 * TutorsStatusAndWarningsTable Component
 * 
 * Table for displaying tutor status and warnings information.
 * Uses Plus Design System Table component.
 * Matches Figma: node-id=258-262435
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/_internal/Table/Table';
import { StatusSelect } from '@/specs/Toolkit/In-Session/Elements/StatusSelect';
import Badge from '@/components/labels/Badge/Badge';
import UserAvatar from '@/components/_internal/UserAvatar/UserAvatar';
import './TutorsStatusAndWarningsTable.scss';

/**
 * A tutor's status, set from the table. "Check-In Needed" asks the admin to
 * act, so its field carries the info color role.
 */
const StatusCell = ({ tutor, options, onStatusChange }) => {
    const [status, setStatus] = useState(tutor.status);
    return (
        <StatusSelect
            aria-label={`Status for ${tutor.tutorName}`}
            clearable={false}
            options={options}
            value={status}
            onChange={(next) => {
                setStatus(next);
                if (onStatusChange) onStatusChange(tutor.id, next);
            }}
            tone={status === 'Check-In Needed' ? 'info' : undefined}
            className="tutors-status-and-warnings-table__status-select"
        />
    );
};

StatusCell.propTypes = {
    tutor: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tutorName: PropTypes.string,
        status: PropTypes.string,
    }).isRequired,
    options: PropTypes.array.isRequired,
    onStatusChange: PropTypes.func,
};

const TutorsStatusAndWarningsTable = ({
    tutors = [],
    onRowClick,
    onStatusChange,
    className = '',
    ...props
}) => {
    // Default tutors data matching Figma
    const defaultTutors = Array(10).fill(null).map((_, index) => ({
        id: index + 1,
        tutorName: 'Floyd Miles',
        status: 'Check-In Needed',
        totalWarnings: 16,
        micOff: 4,
        camOff: 4,
        absence: 4,
        lateCallOff: 4
    }));

    const displayTutors = tutors.length > 0 ? tutors : defaultTutors;

    const statusOptions = [
        { label: 'On Track', value: 'On Track' },
        { label: 'Check-In Needed', value: 'Check-In Needed' },
        { label: 'On Watch', value: 'On Watch' },
        { label: 'On TIP', value: 'On TIP' },
        { label: 'Recommended for Termination', value: 'Recommended for Termination' },
        { label: 'Inactive', value: 'Inactive' }
    ];

    // Define Headers matching standard Table prop format
    const headers = [
        {
            text: (
                <div className="flex items-center gap-2">
                    <span className="body3-txt font-medium">Tutor Name</span>
                    <i className="fa-solid fa-arrow-up text-xs" />
                </div>
            ),
            width: '200px',
            align: 'left'
        },
        {
            text: (
                <div className="flex items-center gap-2">
                    <span className="body3-txt">Status</span>
                    <i className="fa-solid fa-arrow-up text-xs opacity-20" />
                </div>
            ),
            width: '180px',
            align: 'left'
        },
        {
            text: (
                <div className="flex items-center justify-center gap-2 w-full">
                    <span className="body3-txt">Total Warnings</span>
                    <i className="fa-solid fa-arrow-up text-xs opacity-20" />
                </div>
            ),
            width: '140px',
            align: 'center'
        },
        {
            text: (
                <div className="flex items-center justify-center gap-2 w-full">
                    <span className="body3-txt">Mic off</span>
                    <i className="fa-solid fa-arrow-up text-xs opacity-20" />
                </div>
            ),
            width: '100px',
            align: 'center'
        },
        {
            text: (
                <div className="flex items-center justify-center gap-2 w-full">
                    <span className="body3-txt">Cam off</span>
                    <i className="fa-solid fa-arrow-up text-xs opacity-20" />
                </div>
            ),
            width: '100px',
            align: 'center'
        },
        {
            text: (
                <div className="flex items-center justify-center gap-2 w-full">
                    <span className="body3-txt">Absence</span>
                    <i className="fa-solid fa-arrow-up text-xs opacity-20" />
                </div>
            ),
            width: '100px',
            align: 'center'
        },
        {
            text: (
                <div className="flex items-center justify-center gap-2 w-full">
                    <span className="body3-txt">Late Call-off</span>
                    <i className="fa-solid fa-arrow-up text-xs opacity-20" />
                </div>
            ),
            width: '120px',
            align: 'center'
        }
    ];

    // Transform data to Rows
    const rows = displayTutors.map((tutor) => [
        {
            content: (
                <UserAvatar
                    name={tutor.tutorName}
                    firstChar={tutor.tutorName.charAt(0)}
                    counter={false}
                    className="table-avatar"
                />
            ),
            className: 'tutors-status-and-warnings-table__cell--tutor-name'
        },
        {
            content: (
                <StatusCell
                    tutor={tutor}
                    options={statusOptions}
                    onStatusChange={onStatusChange}
                />
            ),
            className: 'tutors-status-and-warnings-table__cell--status'
        },
        {
            content: (
                <div className="flex justify-center">
                    <Badge style="danger" className="warning-badge">
                        {tutor.totalWarnings}
                    </Badge>
                </div>
            ),
            align: 'center',
            className: 'tutors-status-and-warnings-table__cell--warnings'
        },
        {
            content: tutor.micOff > 0 ? (
                <div className="flex justify-center">
                    <Badge style="warning" className="metric-badge">
                        {tutor.micOff}
                    </Badge>
                </div>
            ) : <div className="flex justify-center"><span className="metric-placeholder">-</span></div>,
            align: 'center',
            className: 'tutors-status-and-warnings-table__cell--metric'
        },
        {
            content: tutor.camOff > 0 ? (
                <div className="flex justify-center">
                    <Badge style="warning" className="metric-badge">
                        {tutor.camOff}
                    </Badge>
                </div>
            ) : <div className="flex justify-center"><span className="metric-placeholder">-</span></div>,
            align: 'center',
            className: 'tutors-status-and-warnings-table__cell--metric'
        },
        {
            content: tutor.absence > 0 ? (
                <div className="flex justify-center">
                    <Badge style="warning" className="metric-badge">
                        {tutor.absence}
                    </Badge>
                </div>
            ) : <div className="flex justify-center"><span className="metric-placeholder">-</span></div>,
            align: 'center',
            className: 'tutors-status-and-warnings-table__cell--metric'
        },
        {
            content: (tutor.lateCallOff || tutor.lateCall) > 0 ? (
                <div className="flex justify-center">
                    <Badge style="warning" className="metric-badge">
                        {tutor.lateCallOff || tutor.lateCall}
                    </Badge>
                </div>
            ) : <div className="flex justify-center"><span className="metric-placeholder">-</span></div>,
            align: 'center',
            className: 'tutors-status-and-warnings-table__cell--metric'
        }
    ]);

    return (
        <div className={`tutors-status-and-warnings-table ${className}`} {...props}>
            <Table
                headers={headers}
                rows={rows}
                hover
                className="tutors-status-and-warnings-table__table"
            />
        </div>
    );
};

TutorsStatusAndWarningsTable.propTypes = {
    tutors: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tutorName: PropTypes.string,
        status: PropTypes.string,
        totalWarnings: PropTypes.number,
        micOff: PropTypes.number,
        camOff: PropTypes.number,
        absence: PropTypes.number,
        lateCallOff: PropTypes.number
    })),
    onRowClick: PropTypes.func,
    onStatusChange: PropTypes.func,
    className: PropTypes.string
};

export default TutorsStatusAndWarningsTable;
