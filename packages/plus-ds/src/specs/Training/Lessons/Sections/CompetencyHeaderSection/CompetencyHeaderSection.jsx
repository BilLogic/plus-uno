/**
 * CompetencyHeaderSection Component
 * 
 * Section with "Students Overview" title and horizontal scrollable cards.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178172
 */

import React from 'react';
import PropTypes from 'prop-types';
import OverviewCard from '@/components/Card/OverviewCard/OverviewCard';
import './CompetencyHeaderSection.scss';

const CompetencyHeaderSection = ({
    studentNeed = { competencyArea: 'relationships', count: 3, total: 3 },
    status = { percentage: 37.5, status: 'outstanding' },
    effort = { completed: 2, total: 10, percentage: 20 },
    progress = { completed: 2, total: 10, percentage: 20 },
    className = '',
    ...props
}) => {
    const competencyAreaMap = {
        'socio-emotional': 'Socio-Emotional',
        'mastering-content': 'Mastering Content',
        'advocacy': 'Advocacy',
        'relationships': 'Relationships',
        'technology-tools': 'Technology Tools'
    };

    return (
        <section className={`competency-header-section ${className}`} {...props}>
            {/* Title + Cards container */}
            <div className="competency-header-section__container">
                {/* Title */}
                <h4 className="competency-header-section__title h4">
                    Students Overview
                </h4>

                {/* Horizontal Scroll container */}
                <div className="competency-header-section__scroll-wrapper">
                    {/* Cards container */}
                    <div className="competency-header-section__cards">
                        {/* Card 1: Student Need */}
                        <OverviewCard
                            type={studentNeed.competencyArea}
                            title="Student Need"
                            subtitle={`${competencyAreaMap[studentNeed.competencyArea] || studentNeed.competencyArea} (${studentNeed.count}/${studentNeed.total})`}
                            className="competency-header-section__card"
                        />

                        {/* Card 2: Status */}
                        <OverviewCard
                            type="status"
                            title="Status"
                            value={`${status.percentage}%`}
                            subtitle={status.status}
                            className="competency-header-section__card"
                        />

                        {/* Card 3: Effort */}
                        <OverviewCard
                            type="effort"
                            title="Effort"
                            value={`${effort.completed}/${effort.total}`}
                            subtitle={`${effort.percentage}% completed`}
                            className="competency-header-section__card"
                        />

                        {/* Card 4: Progress */}
                        <OverviewCard
                            type="progress"
                            title="Progress"
                            value={`${progress.completed}/${progress.total}`}
                            subtitle={`${progress.percentage}% completed`}
                            className="competency-header-section__card"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

CompetencyHeaderSection.propTypes = {
    /** Student need data */
    studentNeed: PropTypes.shape({
        competencyArea: PropTypes.oneOf([
            'socio-emotional',
            'mastering-content',
            'advocacy',
            'relationships',
            'technology-tools'
        ]),
        count: PropTypes.number,
        total: PropTypes.number
    }),
    /** Status data */
    status: PropTypes.shape({
        percentage: PropTypes.number,
        status: PropTypes.string
    }),
    /** Effort data */
    effort: PropTypes.shape({
        completed: PropTypes.number,
        total: PropTypes.number,
        percentage: PropTypes.number
    }),
    /** Progress data */
    progress: PropTypes.shape({
        completed: PropTypes.number,
        total: PropTypes.number,
        percentage: PropTypes.number
    }),
    /** Additional CSS class */
    className: PropTypes.string,
};

export default CompetencyHeaderSection;
