import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Card from '@/components/Card';
import NavTabs from '@/components/NavTabs';
import Button from '@/components/Button/Button';
import chartTheme from '@/DataViz/chartTheme';
import { RadarChart } from '@/DataViz';
import './DataVisualization.scss';

/**
 * DataVisualizationSkillsProgress component for Home page
 * Displays a card with tabs for "Skills Overview" and "Skills Progress"
 * Shows radar chart for Skills Overview and line chart for Skills Progress
 */
const DataVisualizationSkillsProgress = ({
    id,
    skillsOverviewData,
    skillsProgressData,
    defaultActiveTab = 'skills-progress',
    className = '',
    style,
    variant = 'tabs',
    title,
    hideRadarYAxisLabels = false,
    radarCategoryLabelBody3Regular = false,
    radarChartSpacing,
    radarHeight,
    radarCategoryIcons,
    /** When true, render content without the Card wrapper (content only, for use inside a parent card container) */
    unwrapCard = false
}) => {
    const [activeTab, setActiveTab] = useState(defaultActiveTab);

    // Default skills progress data if not provided
    const sessionRanges = skillsProgressData?.sessionRanges || [
        '64-68',
        '74-78',
        '84-88',
        '94-98',
        '104-108'
    ];

    const averageScores = skillsProgressData?.averageScores || [30, 55, 12, 25, 65];

    // Use secondary color token for line chart (matches active tab styling)
    // --color-secondary: #445c6a (per Figma: _Secondary/Secondary)
    const secondaryColor = '#445c6a';

    // Configure line chart options to match Figma design
    // Height will be controlled by CSS container (.plus-data-viz-chart-container)
    const lineChartOptions = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'line',
            height: 290, // Base height, will scale with container
            spacing: [16, 16, 16, 16]
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: sessionRanges,
            title: { text: null }
        },
        yAxis: {
            ...chartTheme.yAxis,
            min: 0,
            max: 100,
            tickPositions: [0, 25, 50, 75, 100],
            title: { text: null }
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true,
                    symbol: 'circle',
                    radius: 4,
                    fillColor: secondaryColor,
                    lineWidth: 0
                },
                lineWidth: 2,
                color: secondaryColor
            }
        },
        legend: { enabled: false },
        tooltip: {
            ...chartTheme.tooltip,
            formatter: function() {
                return `<b>${this.x}</b><br/>Average Score: ${this.y}`;
            }
        },
        series: [{
            name: 'Average Score',
            data: averageScores,
            color: secondaryColor
        }]
    };

    const innerContent = (
        <>
            {variant === 'buttonGroup' ? (
                <div className="plus-data-viz-header-with-title">
                    {title && <h4 className="h4 plus-data-viz-header-title">{title}</h4>}
                    <div className="plus-data-viz-nav-buttons">
                        <Button
                            style="primary"
                            fill="outline"
                            size="small"
                            leadingVisual="chart-pie"
                            onClick={() => setActiveTab('skills-overview')}
                            active={activeTab === 'skills-overview'}
                            title="Skills Overview"
                            aria-label="Skills Overview"
                        />
                        <Button
                            style="primary"
                            fill="outline"
                            size="small"
                            leadingVisual="chart-line"
                            onClick={() => setActiveTab('skills-progress')}
                            active={activeTab === 'skills-progress'}
                            title="Skills Progress"
                            aria-label="Skills Progress"
                        />
                    </div>
                </div>
            ) : variant === 'toggle' ? (
                <div className="plus-data-viz-toggle" role="group" aria-label="Skills view">
                    <button
                        type="button"
                        className={`plus-data-viz-toggle-option ${activeTab === 'skills-overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('skills-overview')}
                        aria-pressed={activeTab === 'skills-overview'}
                        aria-label="Skills Overview"
                        title="Skills Overview"
                    >
                        <i className="fa-solid fa-chart-pie" aria-hidden="true"></i>
                    </button>
                    <button
                        type="button"
                        className={`plus-data-viz-toggle-option ${activeTab === 'skills-progress' ? 'active' : ''}`}
                        onClick={() => setActiveTab('skills-progress')}
                        aria-pressed={activeTab === 'skills-progress'}
                        aria-label="Skills Progress"
                        title="Skills Progress"
                    >
                        <i className="fa-solid fa-chart-line" aria-hidden="true"></i>
                    </button>
                </div>
            ) : (
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
            )}

            <div className="plus-data-viz-content">
                {activeTab === 'skills-overview' ? (
                    <div className="plus-data-viz-overview">
                        {(() => {
                            // Prepare data for radar chart
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
                            
                            const radarSeries = [
                                { 
                                    name: 'Your performance', 
                                    data: yourPerformance,
                                    color: '#61b5cf',
                                    dashStyle: undefined
                                },
                                { 
                                    name: 'Average tutor performance', 
                                    data: averagePerformance,
                                    color: '#445c6a',
                                    dashStyle: 'Dash'
                                }
                            ];
                            
                            return (
                                <>
                                    <div className="plus-data-viz-radar-container">
                                        <RadarChart
                                            categories={categories}
                                            series={radarSeries}
                                            height={radarHeight !== undefined ? radarHeight : 290}
                                            yAxisMax={100}
                                            filled={true}
                                            showLegend={false}
                                            chartSpacing={radarChartSpacing !== undefined ? radarChartSpacing : [0, 0, 0, 0]}
                                            showYAxisLabels={!hideRadarYAxisLabels}
                                            categoryLabelBody3Regular={radarCategoryLabelBody3Regular}
                                            categoryIcons={radarCategoryIcons}
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
                                </>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="plus-data-viz-progress">
                        <div className="plus-data-viz-chart-container">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={lineChartOptions}
                            />
                        </div>
                        <div className="plus-data-viz-legend">
                            <div className="plus-data-viz-legend-item">
                                <div className="plus-data-viz-legend-color" style={{ backgroundColor: secondaryColor }}></div>
                                <span className="body3-txt">Each point represents the average score across 5 sessions.</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    if (unwrapCard) {
        return (
            <div
                id={id}
                className={`plus-card-content card-body ${className}`}
                style={style}
            >
                <div className="plus-card-description">
                    <div className="plus-card-body body1-txt card-text">
                        {innerContent}
                    </div>
                </div>
            </div>
        );
    }

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
            {innerContent}
        </Card>
    );
};

DataVisualizationSkillsProgress.propTypes = {
    id: PropTypes.string,
    skillsOverviewData: PropTypes.shape({
        categories: PropTypes.arrayOf(PropTypes.string),
        yourPerformance: PropTypes.arrayOf(PropTypes.number),
        averagePerformance: PropTypes.arrayOf(PropTypes.number)
    }),
    skillsProgressData: PropTypes.shape({
        sessionRanges: PropTypes.arrayOf(PropTypes.string),
        averageScores: PropTypes.arrayOf(PropTypes.number)
    }),
    defaultActiveTab: PropTypes.oneOf(['skills-overview', 'skills-progress']),
    className: PropTypes.string,
    style: PropTypes.object,
    variant: PropTypes.oneOf(['tabs', 'toggle', 'buttonGroup']),
    title: PropTypes.string,
    hideRadarYAxisLabels: PropTypes.bool,
    radarCategoryLabelBody3Regular: PropTypes.bool,
    radarChartSpacing: PropTypes.arrayOf(PropTypes.number),
    /** Radar chart height in pixels or '100%' to fill container (responsive) */
    radarHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['100%'])]),
    /** Font Awesome icon classes for radar axes (e.g. ['fa-calculator', 'fa-comments']) */
    radarCategoryIcons: PropTypes.arrayOf(PropTypes.string),
    /** When true, render content without the Card wrapper (content only, for use inside a parent card container) */
    unwrapCard: PropTypes.bool
};

export default DataVisualizationSkillsProgress;
