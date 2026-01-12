/**
 * GroupTrainingProgressTable Component
 * 
 * Table showing group training progress by competency area with columns:
 * Competency, Completion, Accuracy, Rating, Time Spent, Action
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=1107-269190
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Button from '../../../../../components/Button/Button';
import { StaticBadgeSmart } from '../../../../../components/StaticBadgeSmart/StaticBadgeSmart';
import './GroupTrainingProgressTable.scss';

/**
 * Circular progress indicator component
 */
const ProgressIndicator = ({ value, type = 'completion' }) => {
    // Calculate percentage from value
    let percentage = 0;
    if (value.includes('/')) {
        const parts = value.split('/');
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        percentage = denominator > 0 ? (numerator / denominator) * 100 : 0;
    } else if (value.includes('%')) {
        percentage = parseFloat(value.replace('%', ''));
    }

    // Determine color based on type and percentage
    let progressColorVar;
    if (type === 'completion') {
        progressColorVar = percentage >= 99.9 
            ? '--color-success-container' 
            : '--color-warning-container';
    } else if (type === 'accuracy') {
        progressColorVar = '--color-relationship-container';
    } else {
        progressColorVar = '--color-success-container';
    }

    // Display percentage for progress circle (cap at 95% for visual gap)
    const displayPercentage = Math.min(percentage, 95);
    const circumference = 2 * Math.PI * 18;
    const strokeDasharray = `${(displayPercentage / 100) * circumference} ${circumference}`;

    return (
        <div className="progress-indicator">
            <svg width="48" height="40" viewBox="0 0 48 40">
                {/* Background circle */}
                <circle
                    cx="24"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="var(--color-outline-variant)"
                    strokeWidth="4"
                />
                {/* Progress arc */}
                {percentage > 0 && (
                    <circle
                        cx="24"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke={`var(${progressColorVar})`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        transform="rotate(-90 24 20)"
                    />
                )}
            </svg>
            <span className="progress-indicator__value body3-txt">{value}</span>
        </div>
    );
};

ProgressIndicator.propTypes = {
    value: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['completion', 'accuracy', 'rating']),
};

const GroupTrainingProgressTable = ({
    data = [],
    sortable = true,
    hover = true,
    onAssignClick,
    onExpandClick,
    className = '',
    ...props
}) => {
    const [expandedItems, setExpandedItems] = useState({});

    const headers = [
        { text: 'Competency', colSpan: 2, sortable: false },
        { text: 'Completion', sortable },
        { text: 'Accuracy', sortable },
        { text: 'Rating', sortable },
        { text: 'Time Spent', sortable },
        { text: 'Action', sortable: false },
    ];

    const defaultData = [
        {
            id: 1,
            competencyArea: 'socio-emotional',
            completion: '12/16',
            accuracy: '75%',
            rating: '4.5/5',
            timeSpent: '420 mins',
            level: 1,
            children: [
                {
                    id: 11,
                    lessonName: 'Motivation to Learn',
                    completion: '4/4',
                    accuracy: '80%',
                    rating: '4.5/5',
                    timeSpent: '120 mins',
                    level: 2,
                    children: [
                        { id: 111, lessonName: 'Reacting to Errors', completion: '4/4', accuracy: '85%', rating: '5.0/5', timeSpent: '60 mins', level: 3 },
                    ]
                }
            ]
        },
        {
            id: 2,
            competencyArea: 'mastering-content',
            completion: '10/16',
            accuracy: '65%',
            rating: '4.0/5',
            timeSpent: '380 mins',
            level: 1
        },
        {
            id: 3,
            competencyArea: 'advocacy',
            completion: '6/16',
            accuracy: '55%',
            rating: '3.5/5',
            timeSpent: '250 mins',
            level: 1
        },
        {
            id: 4,
            competencyArea: 'relationships',
            completion: '8/16',
            accuracy: '70%',
            rating: '4.2/5',
            timeSpent: '300 mins',
            level: 1
        },
        {
            id: 5,
            competencyArea: 'technology-tools',
            completion: '14/16',
            accuracy: '85%',
            rating: '4.8/5',
            timeSpent: '450 mins',
            level: 1
        },
        {
            id: 6,
            competencyArea: 'socio-emotional',
            completion: '9/16',
            accuracy: '60%',
            rating: '3.8/5',
            timeSpent: '280 mins',
            level: 1
        },
        {
            id: 7,
            competencyArea: 'mastering-content',
            completion: '11/16',
            accuracy: '72%',
            rating: '4.1/5',
            timeSpent: '340 mins',
            level: 1
        },
        {
            id: 8,
            competencyArea: 'advocacy',
            completion: '7/16',
            accuracy: '58%',
            rating: '3.6/5',
            timeSpent: '220 mins',
            level: 1
        },
        {
            id: 9,
            competencyArea: 'relationships',
            completion: '13/16',
            accuracy: '82%',
            rating: '4.6/5',
            timeSpent: '400 mins',
            level: 1
        },
    ];

    const displayData = data.length > 0 ? data : defaultData;

    const handleExpandClick = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
        if (onExpandClick) {
            onExpandClick(itemId);
        }
    };

    const renderRow = (item, isHovered = false) => {
        const isExpanded = expandedItems[item.id];
        const rowClass = `training-progress-table__row training-progress-table__row--level-${item.level} ${hover && isHovered ? 'training-progress-table__row--hover' : ''}`;

        return (
            <React.Fragment key={item.id}>
                <tr className={rowClass}>
                    {/* Competency column - spans 2 columns */}
                    <td colSpan={2} className="training-progress-table__cell training-progress-table__cell--competency">
                        {item.level === 1 && (
                            <button
                                className="training-progress-table__expand-btn"
                                onClick={() => handleExpandClick(item.id)}
                                aria-expanded={isExpanded}
                            >
                                <i
                                    className={`fas ${isExpanded ? 'fa-caret-down' : 'fa-caret-right'}`}
                                    style={{ color: 'var(--color-on-surface)' }}
                                />
                                <StaticBadgeSmart
                                    type={item.competencyArea}
                                    size="b3"
                                />
                            </button>
                        )}
                        {item.level === 2 && (
                            <button
                                className="training-progress-table__expand-btn training-progress-table__expand-btn--level-2"
                                onClick={() => handleExpandClick(item.id)}
                                aria-expanded={isExpanded}
                            >
                                <i
                                    className={`fas ${isExpanded ? 'fa-caret-down' : 'fa-caret-right'}`}
                                    style={{ color: 'var(--color-on-surface-variant)' }}
                                />
                                <span className="body3-txt" style={{ color: 'var(--color-secondary-text)' }}>
                                    {item.lessonName}
                                </span>
                            </button>
                        )}
                        {item.level === 3 && (
                            <p className="body3-txt training-progress-table__lesson-name--level-3">
                                {item.lessonName}
                            </p>
                        )}
                    </td>

                    {/* Completion column */}
                    <td className="training-progress-table__cell training-progress-table__cell--progress">
                        <ProgressIndicator value={item.completion} type="completion" />
                    </td>

                    {/* Accuracy column */}
                    <td className="training-progress-table__cell training-progress-table__cell--progress">
                        <ProgressIndicator value={item.accuracy} type="accuracy" />
                    </td>

                    {/* Rating column */}
                    <td className="training-progress-table__cell training-progress-table__cell--progress">
                        <ProgressIndicator value={item.rating} type="rating" />
                    </td>

                    {/* Time Spent column */}
                    <td className="training-progress-table__cell training-progress-table__cell--time">
                        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 300 }}>
                            {item.timeSpent}
                        </span>
                    </td>

                    {/* Action column */}
                    <td className="training-progress-table__cell training-progress-table__cell--action">
                        <Button
                            text="Assign"
                            style="default"
                            fill="ghost"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAssignClick && onAssignClick(item);
                            }}
                        />
                    </td>
                </tr>

                {/* Render children if expanded */}
                {isExpanded && item.children && item.children.map(child => renderRow(child))}
            </React.Fragment>
        );
    };

    return (
        <div className={`training-progress-table-wrapper ${className}`} {...props}>
            <Table className="training-progress-table">
                <thead>
                    <tr className="training-progress-table__header">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                colSpan={header.colSpan || 1}
                                className="training-progress-table__header-cell"
                            >
                                <div className="training-progress-table__header-content">
                                    <span
                                        className="body3-txt"
                                        style={{
                                            color: 'var(--color-on-surface)',
                                            fontWeight: 400
                                        }}
                                    >
                                        {header.text}
                                    </span>
                                    {header.sortable && (
                                        <i
                                            className="fas fa-arrow-up"
                                            style={{
                                                fontSize: '10px',
                                                color: 'var(--color-outline-variant)',
                                                lineHeight: '2'
                                            }}
                                        />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayData.map(item => renderRow(item))}
                </tbody>
            </Table>
        </div>
    );
};

GroupTrainingProgressTable.propTypes = {
    /** Array of training progress data */
    data: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        competencyArea: PropTypes.string,
        lessonName: PropTypes.string,
        completion: PropTypes.string,
        accuracy: PropTypes.string,
        rating: PropTypes.string,
        timeSpent: PropTypes.string,
        level: PropTypes.oneOf([1, 2, 3]),
        children: PropTypes.array,
    })),
    /** Enable sortable columns */
    sortable: PropTypes.bool,
    /** Enable row hover effects */
    hover: PropTypes.bool,
    /** Callback when Assign button is clicked */
    onAssignClick: PropTypes.func,
    /** Callback when expand/collapse is clicked */
    onExpandClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default GroupTrainingProgressTable;
