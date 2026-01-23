import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import NavTabs from '@/components/NavTabs';
import { RadarChart } from '@/DataViz';
import './DataVisualization.scss';

/**
 * DataVisualization component for Home page
 * Displays skills overview with radar chart and tabs
 */
const DataVisualization = ({
    id,
    skillsOverviewData,
    className = '',
    style,
    defaultActiveTab = 'skills-overview'
}) => {
    const [activeTab, setActiveTab] = useState(defaultActiveTab);

    // Default skills data if not provided
    const categories = skillsOverviewData?.categories || [
        'Teaching Math',
        'Communicating Clearly',
        'Motivating Students',
        'Staying Positive',
        'Managing Time',
        'Fostering Participation',
        'Building Rapport'
    ];

    const yourPerformance = skillsOverviewData?.yourPerformance || [60, 55, 80, 90, 70, 85, 75];
    const averagePerformance = skillsOverviewData?.averagePerformance || [70, 70, 65, 75, 60, 70, 60];

    // "Your performance" - blue filled area
    // "Average tutor performance" - dashed grey line
    const radarSeries = [
        { 
            name: 'Your performance', 
            data: yourPerformance,
            color: '#61b5cf', // light blue
            dashStyle: undefined // solid line for filled area
        },
        { 
            name: 'Average tutor performance', 
            data: averagePerformance,
            color: '#445c6a', // grey
            dashStyle: 'Dash' // dashed line
        }
    ];

    return (
        <Card
            id={id}
            className={`plus-data-viz-card ${className}`}
            style={style}
            paddingSize="sm"
            gapSize="lg"
            radiusSize="sm"
            borderSize="sm"
            showBorder={true}
        >
            <NavTabs
                activeKey={activeTab}
                onSelect={(key) => setActiveTab(key)}
                className="plus-data-viz-tabs"
            >
                <NavTabs.Item 
                    eventKey="skills-overview"
                    active={activeTab === 'skills-overview'}
                >
                    <div className="plus-data-viz-tab-content">
                        <span>Skills Overview</span>
                        <i className="fas fa-circle-info" aria-hidden="true"></i>
                    </div>
                </NavTabs.Item>
                <NavTabs.Item 
                    eventKey="skills-progress"
                    active={activeTab === 'skills-progress'}
                >
                    <div className="plus-data-viz-tab-content">
                        <span>Skills Progress</span>
                        <i className="fas fa-circle-info" aria-hidden="true"></i>
                    </div>
                </NavTabs.Item>
            </NavTabs>

            <div className="plus-data-viz-content">
                {activeTab === 'skills-overview' && (
                    <div className="plus-data-viz-overview">
                        <div className="plus-data-viz-radar-container">
                            <RadarChart
                                categories={categories}
                                series={radarSeries}
                                height={290} // Base height, will scale with container
                                yAxisMax={100}
                                filled={true}
                                showLegend={false}
                                chartSpacing={[0, 0, 0, 0]} // Remove chart internal spacing
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
                )}
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
    style: PropTypes.object,
    defaultActiveTab: PropTypes.string
};

export default DataVisualization;

