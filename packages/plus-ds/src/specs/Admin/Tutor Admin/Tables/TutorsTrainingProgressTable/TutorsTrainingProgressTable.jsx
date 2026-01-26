/**
 * TutorsTrainingProgressTable Component
 * 
 * Table displaying training progress: Completion, Accuracy, Badges.
 * Matches Figma: node-id=448-93944
 * Uses custom SVG progress indicators and avatar layout.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Table from '../../../../../components/Table/Table';
import Badge from '../../../../../components/Badge/Badge';
import { BadgeClaimedPill, ProgressRing } from '../../Elements';

import './TutorsTrainingProgressTable.scss';





const TutorsTrainingProgressTable = ({
    tutors = [],
    sortable = true,
    sortColumn = 'tutorName',
    sortDirection = 'asc',
    onSort,
    onViewProgress,
    className = '',
    ...props
}) => {
    const defaultTutors = [
        {
            id: 1,
            tutorName: 'Ben Green',
            email: 'dummy@gmail.com',
            completion: { value: 8, total: 18, percentage: 44 },
            accuracy: 30,
            badgeClaimed: 'N/A',
            timeSpent: 328
        },
        {
            id: 2,
            tutorName: 'Albert Flores',
            email: 'albert@gmail.com',
            completion: { value: 18, total: 18, percentage: 100 },
            accuracy: 95,
            badgeClaimed: 'Badge 1',
            timeSpent: 520
        },
    ];

    const displayTutors = tutors.length > 0 ? tutors : defaultTutors;

    const handleSort = (columnKey) => {
        if (sortable && onSort) {
            onSort(columnKey);
        }
    };

    const renderHeader = (label, key) => (
        <div
            className="flex items-center gap-2"
            style={{ cursor: sortable ? 'pointer' : 'default' }}
            onClick={() => handleSort(key)}
        >
            <span className="body3-txt">{label}</span>
            {sortable && (
                <i className={`fas fa-arrow-up tutors-training-progress-table__sort-icon ${sortColumn === key ? 'tutors-training-progress-table__sort-icon--active' : ''}`} />
            )}
        </div>
    );

    const headers = [
        { text: renderHeader('Tutor Name', 'tutorName'), width: '25%', align: 'left' },
        { text: renderHeader('Completion', 'completion'), width: '15%', align: 'center' },
        { text: renderHeader('Accuracy', 'accuracy'), width: '15%', align: 'center' },
        { text: renderHeader('Badge Claimed', 'badgeClaimed'), width: '15%', align: 'center' },
        { text: renderHeader('Time Spent (mins)', 'timeSpent'), width: '15%', align: 'left' },
        { text: <span className="body3-txt">Action</span>, width: '15%', align: 'left' },
    ];

    const rows = displayTutors.map((tutor) => [
        {
            content: (
                <div className="tutors-training-progress-table__custom-avatar">
                    <div className="tutors-training-progress-table__avatar-circle">
                        <i className="fas fa-chalkboard-user" />
                    </div>
                    <div className="tutors-training-progress-table__avatar-info">
                        <span className="body2-txt font-semibold" style={{ color: 'var(--color-on-surface)' }}>{tutor.tutorName}</span>
                        <span className="tutors-training-progress-table__email">{tutor.email}</span>
                    </div>
                </div>
            )
        },
        {
            content: <ProgressRing value={typeof tutor.completion === 'object' ? `${tutor.completion.value}/${tutor.completion.total}` : tutor.completion} />,
            align: 'center'
        },
        {
            content: <ProgressRing value={typeof tutor.accuracy === 'object' ? `${tutor.accuracy}%` : tutor.accuracy} />,
            align: 'center'
        },
        {
            content: <BadgeClaimedPill state={tutor.badgeClaimed} />,
            align: 'center'
        },
        {
            content: <span className="body3-txt">{tutor.timeSpent}</span>
        },
        {
            content: (
                <button
                    className="tutors-training-progress-table__action-btn"
                    onClick={() => onViewProgress && onViewProgress(tutor)}
                >
                    View Progress
                </button>
            )
        }
    ]);

    return (
        <div className={`tutors-training-progress-table ${className}`} {...props}>
            <Table
                headers={headers}
                rows={rows}
                hover
                className="tutors-training-progress-table__table"
            />
        </div>
    );
};

TutorsTrainingProgressTable.propTypes = {
    tutors: PropTypes.array,
    sortable: PropTypes.bool,
    sortColumn: PropTypes.string,
    sortDirection: PropTypes.string,
    onSort: PropTypes.func,
    onViewProgress: PropTypes.func,
    className: PropTypes.string
};

export default TutorsTrainingProgressTable;
