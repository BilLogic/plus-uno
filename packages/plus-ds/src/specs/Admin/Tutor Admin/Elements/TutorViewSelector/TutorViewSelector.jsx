/**
 * TutorViewSelector Component
 * 
 * Segmented control / tab-like selector for switching between By Tutor, By Lesson, By Group views.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=433-370346
 */

import React from 'react';
import PropTypes from 'prop-types';
import './TutorViewSelector.scss';

const TutorViewSelector = ({
    activeView = 'tutor',
    onViewChange,
    className = '',
    ...props
}) => {
    const views = [
        { id: 'tutor', label: 'By Tutor' },
        { id: 'lesson', label: 'By Lesson' },
        { id: 'group', label: 'By Group' },
    ];

    return (
        <div className={`tutor-view-selector ${className}`} {...props}>
            <div className="tutor-view-selector__container">
                {views.map((view) => (
                    <button
                        key={view.id}
                        type="button"
                        className={`tutor-view-selector__item ${activeView === view.id ? 'tutor-view-selector__item--active' : ''}`}
                        onClick={() => onViewChange && onViewChange(view.id)}
                    >
                        {view.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

TutorViewSelector.propTypes = {
    /** Currently active view ID */
    activeView: PropTypes.oneOf(['tutor', 'lesson', 'group']),
    /** Callback when view changes */
    onViewChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorViewSelector;
