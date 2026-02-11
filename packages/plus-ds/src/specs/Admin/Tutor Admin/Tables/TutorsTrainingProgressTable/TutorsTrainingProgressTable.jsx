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
    onRowClick,
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
            className="flex items-center gap-2 tutors-training-progress-table__header-cell"
            style={{
                cursor: sortable ? 'pointer' : 'default',
                justifyContent: 'space-between',
                width: '100%',
            }}
            onClick={() => handleSort(key)}
        >
            <span className="body3-txt">{label}</span>
            {sortable && (
                <i
                    className={`fas fa-arrow-up tutors-training-progress-table__sort-icon ${sortColumn === key ? 'tutors-training-progress-table__sort-icon--active' : ''}`}
                    style={sortColumn === key && sortDirection === 'desc' ? { transform: 'rotate(180deg)' } : undefined}
                />
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

    const getPercentage = (metric) => {
        if (typeof metric === 'object' && metric !== null && typeof metric.percentage === 'number') {
            return Math.max(0, Math.min(100, metric.percentage));
        }
        if (typeof metric === 'string' && metric.includes('/')) {
            const [num, den] = metric.split('/').map(Number);
            if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
                return Math.max(0, Math.min(100, (num / den) * 100));
            }
        }
        if (typeof metric === 'string' && metric.includes('%')) {
            const p = parseFloat(metric.replace('%', '').trim());
            return Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0;
        }
        if (typeof metric === 'number') {
            return Math.max(0, Math.min(100, metric));
        }
        return 0;
    };

    const getStateColor = (percentage) => {
        if (percentage >= 85) return 'var(--color-success-container, #d6f7c8)';
        if (percentage >= 60) return 'var(--color-warning-container, #f8efc1)';
        return 'var(--color-error-container, #f8d7d7)';
    };

    const rows = displayTutors.map((tutor, rowIndex) => [
        {
            content: (
                <div className="tutors-training-progress-table__cell-reveal" style={{ '--row-index': rowIndex }}>
                    <div className="tutors-training-progress-table__custom-avatar">
                        <div className="tutors-training-progress-table__avatar-circle">
                            <i className="fas fa-chalkboard-user" />
                        </div>
                        <div className="tutors-training-progress-table__avatar-info">
                            <span className="body2-txt font-semibold" style={{ color: 'var(--color-on-surface)' }}>{tutor.tutorName}</span>
                            <span className="tutors-training-progress-table__email">{tutor.email}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            content: (
                <div className="tutors-training-progress-table__cell-reveal tutors-training-progress-table__cell-reveal--gauge" style={{ '--row-index': rowIndex }}>
                    <ProgressRing
                        value={typeof tutor.completion === 'object' ? `${tutor.completion.value}/${tutor.completion.total}` : tutor.completion}
                        color={getStateColor(getPercentage(tutor.completion))}
                        delay={rowIndex * 120}
                    />
                </div>
            ),
            align: 'center'
        },
        {
            content: (
                <div className="tutors-training-progress-table__cell-reveal tutors-training-progress-table__cell-reveal--gauge" style={{ '--row-index': rowIndex }}>
                    <ProgressRing
                        value={typeof tutor.accuracy === 'object' ? `${tutor.accuracy}%` : tutor.accuracy}
                        color={getStateColor(getPercentage(tutor.accuracy))}
                        delay={110 + (rowIndex * 120)}
                    />
                </div>
            ),
            align: 'center'
        },
        {
            content: (
                <div className="tutors-training-progress-table__cell-reveal" style={{ '--row-index': rowIndex }}>
                    <BadgeClaimedPill state={tutor.badgeClaimed} />
                </div>
            ),
            align: 'center'
        },
        {
            content: (
                <div className="tutors-training-progress-table__cell-reveal" style={{ '--row-index': rowIndex }}>
                    <span className="body3-txt">{tutor.timeSpent}</span>
                </div>
            )
        },
        {
            content: (
                <div className="tutors-training-progress-table__cell-reveal" style={{ '--row-index': rowIndex }}>
                    <button
                        type="button"
                        className="tutors-training-progress-table__action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewProgress && onViewProgress(tutor);
                        }}
                    >
                        View Progress
                    </button>
                </div>
            )
        }
    ]);

    const handleRowClick = (rowIndex) => {
        if (onRowClick && displayTutors[rowIndex]) {
            onRowClick(displayTutors[rowIndex]);
        }
    };

    return (
        <div className={`tutors-training-progress-table ${className}`} {...props}>
            <Table
                headers={headers}
                rows={rows}
                hover
                onRowClick={onRowClick ? handleRowClick : undefined}
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
    onRowClick: PropTypes.func,
    onViewProgress: PropTypes.func,
    className: PropTypes.string
};

export default TutorsTrainingProgressTable;
