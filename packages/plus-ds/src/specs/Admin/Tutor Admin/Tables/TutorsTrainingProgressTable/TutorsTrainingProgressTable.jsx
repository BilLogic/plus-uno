/**
 * TutorsTrainingProgressTable Component
 * 
 * Table displaying training progress: Completion, Accuracy, Badges.
 * Matches Figma: node-id=448-93944
 * Uses custom SVG progress indicators and avatar layout.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Badge from '../../../../../components/Badge/Badge';
import UserAvatar from '../../../../../components/UserAvatar/UserAvatar';
import './TutorsTrainingProgressTable.scss';

const ProgressIndicator = ({ value }) => {
    // Percentage for the mask (0 to 100)
    let percentage = 0;
    if (typeof value === 'string' && value.includes('/')) {
        const [num, den] = value.split('/').map(Number);
        if (den > 0) percentage = (num / den) * 100;
    } else if (typeof value === 'string' && value.includes('%')) {
        percentage = parseFloat(value);
    } else if (typeof value === 'number') {
        percentage = value;
    }

    // Ensure percentage is between 0 and 100
    percentage = Math.min(100, Math.max(0, percentage));

    return (
        <div className="tutors-training-progress-table__progress-cell">
            <div style={{ width: 48, height: 40, position: 'relative' }}>
                {/* Background Track (White) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="40" viewBox="0 0 48 40" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <path d="M8.72662 39.2763C7.78931 40.2136 6.25886 40.2205 5.41982 39.1942C2.93875 36.1595 1.23059 32.5528 0.461153 28.6843C-0.464892 24.0284 0.0103881 19.2024 1.82689 14.8167C3.64339 10.4309 6.71953 6.68237 10.6663 4.04502C14.6131 1.40768 19.2532 -5.66086e-08 24 0C28.7468 5.66086e-08 33.3869 1.40768 37.3337 4.04503C41.2805 6.68237 44.3566 10.4309 46.1731 14.8167C47.9896 19.2024 48.4649 24.0284 47.5388 28.6843C46.7694 32.5528 45.0613 36.1595 42.5802 39.1942C41.7411 40.2205 40.2107 40.2136 39.2734 39.2763C38.3362 38.339 38.35 36.8274 39.1631 35.7806C40.9865 33.433 42.2469 30.6847 42.8311 27.7478C43.5719 24.0231 43.1917 20.1623 41.7385 16.6537C40.2853 13.1451 37.8244 10.1462 34.667 8.03637C31.5095 5.92649 27.7974 4.80035 24 4.80035C20.2026 4.80035 16.4905 5.92649 13.3331 8.03637C10.1756 10.1462 7.71472 13.1451 6.26151 16.6537C4.80831 20.1623 4.42809 24.0231 5.16892 27.7478C5.75307 30.6847 7.01351 33.433 8.83691 35.7806C9.64996 36.8274 9.66383 38.339 8.72662 39.2763Z" fill="white" />
                </svg>

                {/* Foreground Fill (Yellow) - Masked */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    // Using a vertical wipe mask for simplicity and robustness
                    clipPath: `inset(${100 - percentage}% 0 0 0)`
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="40" viewBox="0 0 48 40" fill="none">
                        <path opacity="0.8" d="M8.72662 39.2763C7.78931 40.2136 6.25886 40.2205 5.41982 39.1942C2.93875 36.1595 1.23059 32.5528 0.461153 28.6843C-0.464892 24.0284 0.0103881 19.2024 1.82689 14.8167C3.64339 10.4309 6.71953 6.68237 10.6663 4.04502C13.9456 1.85369 17.7036 0.511288 21.6037 0.119918C22.9227 -0.012438 24 1.07459 24 2.40018C24 3.72576 22.9212 4.78489 21.606 4.95018C18.6569 5.32081 15.8226 6.37281 13.3331 8.03637C10.1756 10.1462 7.71472 13.1451 6.26151 16.6537C4.80831 20.1623 4.42809 24.0231 5.16892 27.7478C5.75307 30.6847 7.01351 33.433 8.83691 35.7806C9.64996 36.8274 9.66383 38.339 8.72662 39.2763Z" fill="#FFE17A" />
                    </svg>
                </div>

                {/* Text centered */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <span className="h6" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-on-surface)' }}>{value}</span>
                </div>
            </div>
        </div>
    );
};



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
    const columns = [
        { key: 'tutorName', label: 'Tutor Name', sortable: true },
        { key: 'completion', label: 'Completion', sortable: true },
        { key: 'accuracy', label: 'Accuracy', sortable: true },
        { key: 'badgeClaimed', label: 'Badge Claimed', sortable: true },
        { key: 'timeSpent', label: 'Time Spent (mins)', sortable: true },
        { key: 'action', label: 'Action', sortable: false },
    ];

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

    const renderSortIcon = (columnKey) => {
        if (!sortable) return null;
        const isActive = sortColumn === columnKey;
        return (
            <i
                className={`fas fa-arrow-up tutors-training-progress-table__sort-icon ${isActive ? 'tutors-training-progress-table__sort-icon--active' : ''}`}
            />
        );
    };

    return (
        <div className={`tutors-training-progress-table ${className}`} {...props}>
            <Table hover className="tutors-training-progress-table__table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                onClick={() => col.sortable && handleSort(col.key)}
                                className={`tutors-training-progress-table__th ${col.sortable ? 'tutors-training-progress-table__th--sortable' : ''} ${sortColumn === col.key ? 'tutors-training-progress-table__th--active' : ''}`}
                            >
                                <div className="tutors-training-progress-table__th-content">
                                    <span className="body3-txt">{col.label}</span>
                                    {col.sortable && renderSortIcon(col.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayTutors.map((tutor) => (
                        <tr key={tutor.id}>
                            <td>
                                <div className="flex items-center gap-3">
                                    <UserAvatar
                                        name={tutor.tutorName}
                                        size="medium"
                                        className="tutors-training-progress-table__avatar"
                                    />
                                    <div className="flex flex-col">
                                        <span className="body2-txt font-semibold">{tutor.tutorName}</span>
                                        <span className="body3-txt text-secondary">{tutor.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <ProgressIndicator value={typeof tutor.completion === 'object' ? `${tutor.completion.value}/${tutor.completion.total}` : tutor.completion} />
                            </td>
                            <td>
                                <ProgressIndicator value={typeof tutor.accuracy === 'object' ? `${tutor.accuracy}%` : tutor.accuracy} />
                            </td>
                            <td>
                                <Badge style="secondary" size="b3">
                                    {tutor.badgeClaimed === 'N/A' ? '✕ N/A' : tutor.badgeClaimed}
                                </Badge>
                            </td>
                            <td>
                                <span className="body3-txt">{tutor.timeSpent}</span>
                            </td>
                            <td>
                                <button
                                    className="tutors-training-progress-table__action-btn"
                                    onClick={() => onViewProgress && onViewProgress(tutor)}
                                >
                                    View Progress
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
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
