/**
 * TrainingLessonStatusSelect Component
 *
 * Lesson status filter: pick any number of statuses, each row with its icon
 * and lesson count. It applies when the list closes, so the lesson list
 * refilters once; with nothing picked it reads "All statuses".
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=779-75384
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FilterSelect } from '@/specs/Toolkit/Pre-Session/Elements/Filters/FilterSelect';
import './TrainingLessonStatusSelect.scss';

/** Each status: its label, icon, color role, and the key of its count. */
const STATUSES = [
    { value: 'assigned', label: 'Assigned', icon: 'circle-check', role: 'info', countKey: 'assigned' },
    { value: 'in-progress', label: 'In Progress', icon: 'spinner', role: 'warning', countKey: 'inProgress' },
    { value: 'completed', label: 'Completed', icon: 'circle-check', role: 'success', countKey: 'completed' },
    { value: 'not-started', label: 'Not Started', icon: 'circle-stop', role: 'danger', countKey: 'notStarted' },
];

const TrainingLessonStatusSelect = ({
    selectedStatuses,
    counts = {
        assigned: 0,
        inProgress: 0,
        completed: 5,
        notStarted: 15
    },
    onStatusChange,
    open,
    className = '',
    style
}) => {
    const options = STATUSES.map(({ value, label, icon, role, countKey }) => ({
        value,
        label,
        leading: (
            <i
                className={`fa-solid fa-${icon} training-lesson-status-select__icon training-lesson-status-select__icon--${role}`}
                aria-hidden="true"
            />
        ),
        trailing: counts[countKey] !== undefined
            ? <span className="filter-select-count">{counts[countKey]}</span>
            : undefined,
    }));

    return (
        <div
            className={`training-lesson-status-select ${className}`}
            style={style}
            data-node-id="778:68959"
        >
            <FilterSelect
                aria-label="Lesson status"
                mode="multi"
                placeholder="All statuses"
                options={options}
                value={onStatusChange ? (selectedStatuses ?? []) : undefined}
                defaultValue={selectedStatuses ?? []}
                onChange={onStatusChange}
                open={open}
            />
        </div>
    );
};

TrainingLessonStatusSelect.propTypes = {
    /** Picked status ids; empty means all */
    selectedStatuses: PropTypes.arrayOf(PropTypes.oneOf(STATUSES.map((s) => s.value))),
    /** Lesson counts per status */
    counts: PropTypes.shape({
        assigned: PropTypes.number,
        inProgress: PropTypes.number,
        completed: PropTypes.number,
        notStarted: PropTypes.number
    }),
    /** `(ids)` once the list closes with a changed pick */
    onStatusChange: PropTypes.func,
    /** Holds the list open, for documentation */
    open: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default TrainingLessonStatusSelect;
