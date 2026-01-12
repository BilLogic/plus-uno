/**
 * GroupsTable Component
 * 
 * Table showing group details with columns: Group Name, Group Size, Action
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=322-155598
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Button from '../../../../../components/Button/Button';
import Badge from '../../../../../components/Badge/Badge';
import './GroupsTable.scss';

const GroupsTable = ({
    groups = [],
    sortable = true,
    hover = true,
    onEditClick,
    onViewProgressClick,
    onExpandClick,
    className = '',
    ...props
}) => {
    const [expandedGroups, setExpandedGroups] = useState({});

    const headers = [
        { text: 'Group Name', sortable, active: true },
        { text: 'Group Size', sortable },
        { text: 'Action', sortable: false },
    ];

    const defaultGroups = [
        { id: 1, name: 'Math Masters', size: 4 },
        { id: 2, name: 'Science Explorers', size: 6 },
        { id: 3, name: 'Reading Champions', size: 5 },
        { id: 4, name: 'Writing Warriors', size: 3 },
        { id: 5, name: 'History Buffs', size: 7 },
    ];

    const displayGroups = groups.length > 0 ? groups : defaultGroups;

    const handleExpandClick = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
        if (onExpandClick) {
            onExpandClick(groupId);
        }
    };

    return (
        <div className={`groups-table-wrapper ${className}`} {...props}>
            <Table className="groups-table">
                <thead>
                    <tr className="groups-table__header">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                className="groups-table__header-cell"
                            >
                                <div className="groups-table__header-content">
                                    <span
                                        className="body3-txt"
                                        style={{
                                            color: header.active
                                                ? 'var(--color-secondary-text)'
                                                : 'var(--color-on-surface)',
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
                                                color: header.active
                                                    ? 'var(--color-secondary)'
                                                    : 'var(--color-outline-variant)',
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
                    {displayGroups.map((group, rowIndex) => (
                        <tr
                            key={group.id || rowIndex}
                            className={`groups-table__row ${hover ? 'groups-table__row--hover' : ''}`}
                        >
                            {/* Group Name column */}
                            <td className="groups-table__cell groups-table__cell--name">
                                <button
                                    className="groups-table__expand-btn"
                                    onClick={() => handleExpandClick(group.id)}
                                    aria-expanded={expandedGroups[group.id] || false}
                                >
                                    <i
                                        className={`fas ${expandedGroups[group.id] ? 'fa-caret-down' : 'fa-caret-right'}`}
                                        style={{
                                            fontSize: 'var(--font-size-body3)',
                                            color: 'var(--color-on-surface-variant)'
                                        }}
                                    />
                                    <span
                                        className="body3-txt"
                                        style={{
                                            fontWeight: 400,
                                            color: 'var(--color-secondary-text)'
                                        }}
                                    >
                                        {group.name}
                                    </span>
                                </button>
                            </td>

                            {/* Group Size column */}
                            <td className="groups-table__cell groups-table__cell--size">
                                <Badge
                                    style="info"
                                    size="b3"
                                    className="groups-table__size-badge"
                                >
                                    {group.size}
                                </Badge>
                            </td>

                            {/* Action column */}
                            <td className="groups-table__cell groups-table__cell--action">
                                <div className="groups-table__action-buttons">
                                    <Button
                                        text="Edit"
                                        style="default"
                                        fill="ghost"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditClick && onEditClick(group);
                                        }}
                                    />
                                    <Button
                                        text="View Progress"
                                        style="default"
                                        fill="ghost"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewProgressClick && onViewProgressClick(group);
                                        }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

GroupsTable.propTypes = {
    /** Array of group objects */
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        size: PropTypes.number,
    })),
    /** Enable sortable columns */
    sortable: PropTypes.bool,
    /** Enable row hover effects */
    hover: PropTypes.bool,
    /** Callback when Edit button is clicked */
    onEditClick: PropTypes.func,
    /** Callback when View Progress button is clicked */
    onViewProgressClick: PropTypes.func,
    /** Callback when expand button is clicked */
    onExpandClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default GroupsTable;
