/**
 * StudentOverviewSection Component
 * 
 * Section showing student analytics charts: Needs Distribution, Attendance, Engagement
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=999-109007
 */

import React from 'react';
import PropTypes from 'prop-types';
import './StudentOverviewSection.scss';

/**
 * StackedBarChart component - renders a single stacked bar chart
 */
const StackedBarChart = ({ title, tooltip, data, legend, chartType = 'needs', className = '' }) => {
    // Calculate percentages for each bar
    const maxTotal = Math.max(...data.map(d => d.values.reduce((a, b) => a + b, 0)));

    return (
        <div className={`stacked-bar-chart stacked-bar-chart--${chartType} ${className}`}>
            {/* Header */}
            <div className="stacked-bar-chart__header">
                <h4 className="h4 stacked-bar-chart__title">{title}</h4>
                <button
                    className="stacked-bar-chart__info-btn"
                    aria-label="Info"
                    title={tooltip}
                >
                    <i className="fas fa-circle-info" />
                </button>
            </div>

            {/* Chart Content - Flat structure matching Figma */}
            <div className="stacked-bar-chart__graph-area">
                {/* Y-axis */}
                <div className="stacked-bar-chart__y-axis">
                    <span className="body3-txt">100%</span>
                    <span className="body3-txt">75%</span>
                    <span className="body3-txt">50%</span>
                    <span className="body3-txt">25%</span>
                    <span className="body3-txt">0%</span>
                </div>

                {/* Main chart area */}
                <div className="stacked-bar-chart__main">
                    {/* Axis lines */}
                    <div className="stacked-bar-chart__axes">
                        <div className="stacked-bar-chart__axis-y" />
                        <div className="stacked-bar-chart__axis-x" />
                    </div>

                    {/* Bars */}
                    <div className="stacked-bar-chart__cols">
                        {data.map((item, index) => {
                            const total = item.values.reduce((a, b) => a + b, 0);
                            const heightPercent = total > 0 ? (total / maxTotal) * 100 : 0;

                            return (
                                <div key={index} className="stacked-bar-chart__col">
                                    {/* Bar Cell - fixed height to align with y-axis */}
                                    <div className="stacked-bar-chart__bar-cell">
                                        {/* Bar container - dynamic height based on data */}
                                        <div
                                            className="stacked-bar-chart__bar-container"
                                            style={{ height: `${heightPercent}%` }}
                                        >
                                            {item.values.map((value, segIndex) => {
                                                const percentage = total > 0 ? (value / total) * 100 : 0;
                                                return (
                                                    <div
                                                        key={segIndex}
                                                        className={`stacked-bar-chart__bar stacked-bar-chart__bar--${segIndex}`}
                                                        style={{ height: `${percentage}%` }}
                                                    >
                                                        {value > 0 && (
                                                            <span className="stacked-bar-chart__bar-value body2-txt">
                                                                {value}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {/* X-axis label */}
                                    <span className="stacked-bar-chart__date body3-txt">
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend - Direct sibling to Header and Graph Area */}
            <div className="stacked-bar-chart__legend">
                {legend.map((item, index) => (
                    <div key={index} className="stacked-bar-chart__legend-item">
                        <span className={`stacked-bar-chart__legend-color stacked-bar-chart__legend-color--${index}`} />
                        <span className="body3-txt">{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

StackedBarChart.propTypes = {
    title: PropTypes.string.isRequired,
    tooltip: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number),
    })).isRequired,
    legend: PropTypes.arrayOf(PropTypes.string).isRequired,
    chartType: PropTypes.oneOf(['needs', 'attendance', 'engagement']),
    className: PropTypes.string,
};

/**
 * StudentOverviewSection component
 */
const StudentOverviewSection = ({
    needsData = [],
    attendanceData = [],
    engagementData = [],
    className = '',
    ...props
}) => {
    // Default data matching Figma design exactly
    const defaultNeedsData = [
        { label: '06/03/24', values: [12, 6] },
        { label: '06/10/24', values: [16, 8] },
        { label: '06/17/24', values: [12, 5] },
        { label: '06/24/24', values: [12, 1] },
        { label: '07/01/24', values: [12, 1] },
    ];

    const defaultAttendanceData = [
        { label: '06/03/24', values: [12, 6] },
        { label: '06/10/24', values: [16, 8] },
        { label: '06/17/24', values: [12, 5] },
        { label: '06/24/24', values: [12, 1] },
        { label: '07/01/24', values: [12, 1] },
    ];

    const defaultEngagementData = [
        { label: '06/03/24', values: [12, 6] },
        { label: '06/10/24', values: [16, 8] },
        { label: '06/17/24', values: [12, 5] },
        { label: '06/24/24', values: [12, 1] },
        { label: '07/01/24', values: [12, 1] },
    ];

    const displayNeedsData = needsData.length > 0 ? needsData : defaultNeedsData;
    const displayAttendanceData = attendanceData.length > 0 ? attendanceData : defaultAttendanceData;
    const displayEngagementData = engagementData.length > 0 ? engagementData : defaultEngagementData;

    return (
        <div className={`student-overview-section ${className}`} {...props}>
            <StackedBarChart
                title="Student Needs Distribution (Weekly)"
                tooltip="Weekly trend of student need across recent sessions."
                data={displayNeedsData}
                legend={['Needs motivation', 'Needs motivation', 'Other']}
                chartType="needs"
            />
            <StackedBarChart
                title="Student Attendance (Weekly)"
                tooltip="Weekly trend of student attendance rate across recent sessions."
                data={displayAttendanceData}
                legend={['Joined', "Didn't join", 'N/A (Not recorded)']}
                chartType="attendance"
            />
            <StackedBarChart
                title="Student Engagement (Weekly)"
                tooltip="Weekly trend of student engagement rate across recent sessions."
                data={displayEngagementData}
                legend={['Fully Engaged', 'Partially Engaged', 'Not Engaged', 'N/A (Not recorded)']}
                chartType="engagement"
            />
        </div>
    );
};

StudentOverviewSection.propTypes = {
    /** Data for Student Needs Distribution chart */
    needsData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number),
    })),
    /** Data for Student Attendance chart */
    attendanceData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number),
    })),
    /** Data for Student Engagement chart */
    engagementData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number),
    })),
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default StudentOverviewSection;
