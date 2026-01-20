/**
 * TrainingLessonStatusSelect Component
 * 
 * Status filter dropdown with colored icons and counters.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=779-75384
 */

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';
import Badge from '@/components/Badge';
import './TrainingLessonStatusSelect.scss';

const TrainingLessonStatusSelect = ({
    selectedStatus = 'All',
    counts = {
        all: 20,
        assigned: 0,
        inProgress: 0,
        completed: 5,
        notStarted: 15
    },
    onStatusChange,
    className = '',
    style
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const statusConfig = {
        All: { icon: 'list', colorStyle: 'primary', count: counts.all },
        Assigned: { icon: 'circle-check', colorStyle: 'info', count: counts.assigned },
        'In Progress': { icon: 'spinner', colorStyle: 'warning', count: counts.inProgress },
        Completed: { icon: 'circle-check', colorStyle: 'success', count: counts.completed },
        'Not Started': { icon: 'circle-stop', colorStyle: 'danger', count: counts.notStarted }
    };

    const currentConfig = statusConfig[selectedStatus] || statusConfig.All;

    const handleSelect = (status) => {
        if (onStatusChange) {
            onStatusChange(status);
        }
        setIsOpen(false);
    };

    const getBadgeStyle = (colorStyle) => {
        const styleMap = {
            primary: 'primary',
            info: 'info',
            warning: 'warning',
            success: 'success',
            danger: 'danger'
        };
        return styleMap[colorStyle] || 'primary';
    };

    return (
        <div
            ref={dropdownRef}
            className={`training-lesson-status-select ${className}`}
            style={style}
            data-node-id={isOpen ? '779:75361' : '778:68959'}
        >
            <Dropdown show={isOpen} onToggle={setIsOpen}>
                <Dropdown.Toggle
                    as="button"
                    className={`training-lesson-status-select__button ${isOpen ? 'training-lesson-status-select__button--open' : ''}`}
                    id="status-select-dropdown"
                >
                    <span className="training-lesson-status-select__button-text">{selectedStatus}</span>
                    <Badge
                        style={getBadgeStyle(currentConfig.colorStyle)}
                        size="small"
                        className="training-lesson-status-select__counter"
                    >
                        {currentConfig.count}
                    </Badge>
                    <i className="fas fa-caret-down training-lesson-status-select__caret" />
                </Dropdown.Toggle>

                <Dropdown.Menu className="training-lesson-status-select__menu">
                    {Object.entries(statusConfig).map(([status, config]) => {
                        const isSelected = status === selectedStatus;
                        return (
                            <Dropdown.Item
                                key={status}
                                className={`training-lesson-status-select__item ${isSelected ? 'training-lesson-status-select__item--selected' : ''}`}
                                onClick={() => handleSelect(status)}
                            >
                                <i className={`fas fa-check training-lesson-status-select__check ${isSelected ? 'training-lesson-status-select__check--visible' : ''}`} />
                                <i className={`fas fa-${config.icon} training-lesson-status-select__icon training-lesson-status-select__icon--${config.colorStyle}`} />
                                <span className={`training-lesson-status-select__item-text training-lesson-status-select__item-text--${config.colorStyle}`}>
                                    {status}
                                </span>
                                <Badge
                                    style={getBadgeStyle(config.colorStyle)}
                                    size="small"
                                    className="training-lesson-status-select__item-counter"
                                >
                                    {config.count}
                                </Badge>
                            </Dropdown.Item>
                        );
                    })}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

TrainingLessonStatusSelect.propTypes = {
    /** Currently selected status */
    selectedStatus: PropTypes.oneOf(['All', 'Assigned', 'In Progress', 'Completed', 'Not Started']),
    /** Status counts object */
    counts: PropTypes.shape({
        all: PropTypes.number,
        assigned: PropTypes.number,
        inProgress: PropTypes.number,
        completed: PropTypes.number,
        notStarted: PropTypes.number
    }),
    /** Status change handler */
    onStatusChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default TrainingLessonStatusSelect;
