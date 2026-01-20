import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import RadarChart from '@/DataViz/RadarChart';
import './DataVisualization.scss';

/**
 * DataVisualization component for Home page
 * Displays skills overview with radar chart
 */
const DataVisualization = ({
    id,
    skillsOverviewData,
    className = '',
    style
}) => {
    // Default skills data if not provided
    const defaultCategories = skillsOverviewData?.categories || [
        'Teaching Math',
        'Communicating Clearly',
        'Motivating Students',
        'Staying Positive',
        'Managing Time',
        'Fostering Participation',
        'Building Rapport'
    ];

    const defaultYourPerformance = skillsOverviewData?.yourPerformance || [60, 55, 80, 90, 70, 85, 75];
    const defaultAveragePerformance = skillsOverviewData?.averagePerformance || [70, 70, 65, 75, 60, 70, 60];

    return (
        <Card
            id={id}
            className={`plus-data-viz-card ${className}`}
            style={style}
            paddingSize="md"
            gapSize="lg"
            radiusSize="sm"
            borderSize="sm"
            showBorder={true}
        >
            <div className="plus-data-viz-content">
                <div className="plus-data-viz-overview">
                    <div className="plus-data-viz-radar-container">
                        <RadarChart
                            categories={defaultCategories}
                            yourPerformance={defaultYourPerformance}
                            averagePerformance={defaultAveragePerformance}
                            height={290}
                        />
                    </div>
                    <div className="plus-data-viz-legend">
                        <div className="plus-data-viz-legend-item">
                            <div className="plus-data-viz-legend-color" style={{ backgroundColor: '#61b5cf' }}></div>
                            <span className="body3-txt">Your performance</span>
                        </div>
                        <div className="plus-data-viz-legend-item">
                            <div className="plus-data-viz-legend-color" style={{ backgroundColor: '#445c6a' }}></div>
                            <span className="body3-txt">Average tutor performance</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

DataVisualization.propTypes = {
    id: PropTypes.string,
    skillsOverviewData: PropTypes.shape({
        categories: PropTypes.arrayOf(PropTypes.string),
        yourPerformance: PropTypes.arrayOf(PropTypes.number),
        averagePerformance: PropTypes.arrayOf(PropTypes.number)
    }),
    className: PropTypes.string,
    style: PropTypes.object
};

export default DataVisualization;

