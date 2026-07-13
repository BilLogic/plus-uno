/**
 * LessonOverviewSection Component
 * 
 * Section displaying an overview of lesson progress/metrics using Universal OverviewCards.
 * Matches Figma design: 63-178172 ("Students Overview")
 */

import React from 'react';
import PropTypes from 'prop-types';
import OverviewCard from '@/specs/Universal/Cards/OverviewCard/OverviewCard';
import './LessonOverviewSection.scss';

const LessonOverviewSection = ({
    title = 'Students Overview',
    metrics = [],
    className = '',
    style,
    ...props
}) => {
    // Default metrics to match Figma node 63-178172
    const displayMetrics = metrics.length > 0 ? metrics : [
        {
            id: 'student-need',
            type: 'relationships',
            title: 'Student Need',
            subtitle: 'Relationships',
            description: '3/3 students need relationship support',
            smartData: { socio: 0.2, mastering: 0.2, advocacy: 0.2, relationships: 0.8, technology: 0.2 }
        },
        {
            id: 'status',
            type: 'status',
            title: 'Status',
            subtitle: '37.5%',
            description: 'students has status: Outstanding.',
            chartValue: 37.5
        },
        {
            id: 'effort',
            type: 'effort',
            title: 'Effort',
            subtitle: '2/10',
            description: 'students have fulfilled their effort goals.',
            chartValue: 20
        },
        {
            id: 'progress',
            type: 'progress',
            title: 'Progress',
            subtitle: '2/10',
            description: 'students have fulfilled their progress goals.',
            chartValue: 20
        }
    ];

    return (
        <section className={`lesson-overview-section ${className}`} style={style} {...props}>
            <div className="lesson-overview-section__container">
                {title && (
                    <h4 className="lesson-overview-section__title h4">
                        {title}
                    </h4>
                )}

                <div className="lesson-overview-section__scroll-wrapper">
                    <div className="lesson-overview-section__cards">
                        {displayMetrics.map((metric) => (
                            <OverviewCard
                                key={metric.id || metric.title}
                                type={metric.type}
                                title={metric.title}
                                subtitle={metric.subtitle}
                                description={metric.description}
                                smartData={metric.smartData}
                                chartValue={metric.chartValue}
                                className="lesson-overview-section__card"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

LessonOverviewSection.propTypes = {
    title: PropTypes.string,
    metrics: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.string,
        title: PropTypes.string,
        subtitle: PropTypes.string,
        description: PropTypes.string,
        smartData: PropTypes.object,
        chartValue: PropTypes.number
    })),
    className: PropTypes.string,
    style: PropTypes.object
};

export default LessonOverviewSection;
