/**
 * SessionOverviewSection Component
 * 
 * Section displaying 5 donut charts for session metrics:
 * - Time Allocation by Student Needs
 * - Student Attendance
 * - Student Engagement
 * - Tutor Attendance
 * - Check-in Completion
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-127692
 */

import React from 'react';
import PropTypes from 'prop-types';
import './SessionOverviewSection.scss';

/**
 * DonutChart component - renders a single donut chart
 */
const DonutChart = ({ 
    title, 
    tooltip,
    percentage, 
    subtitle, 
    legend,
    chartType = 'default',
    className = '' 
}) => {
    // Calculate stroke dash for donut
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - percentage / 100);

    // Get color based on chart type
    const getChartColor = () => {
        switch (chartType) {
            case 'needs':
                return 'var(--color-relationship-container, #ffd9e4)';
            case 'attendance':
            case 'engagement':
            case 'tutor':
            case 'checkin':
                return 'var(--color-success-container, #a1eb83)';
            default:
                return 'var(--color-success-container, #a1eb83)';
        }
    };

    return (
        <div className={`donut-chart donut-chart--${chartType} ${className}`}>
            <div className="donut-chart__header">
                <span className="body2-txt donut-chart__title">{title}</span>
                <button 
                    className="donut-chart__info-btn" 
                    aria-label="Info"
                    title={tooltip}
                >
                    <i className="fas fa-circle-info" />
                </button>
            </div>

            <div className="donut-chart__chart">
                <svg viewBox="0 0 180 180" className="donut-chart__svg">
                    {/* Background circle */}
                    <circle
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke="var(--color-surface-container-highest, #e2e2e5)"
                        strokeWidth="16"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke={getChartColor()}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 90 90)"
                    />
                </svg>
                <div className="donut-chart__center">
                    <span className="donut-chart__percentage">{percentage}%</span>
                    <span className="donut-chart__subtitle body3-txt">{subtitle}</span>
                </div>
            </div>

            <div className="donut-chart__legend">
                {legend.map((item, index) => (
                    <div key={index} className="donut-chart__legend-item">
                        <span 
                            className="donut-chart__legend-color"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="body3-txt">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

DonutChart.propTypes = {
    title: PropTypes.string.isRequired,
    tooltip: PropTypes.string,
    percentage: PropTypes.number.isRequired,
    subtitle: PropTypes.string.isRequired,
    legend: PropTypes.arrayOf(PropTypes.shape({
        color: PropTypes.string,
        label: PropTypes.string,
    })).isRequired,
    chartType: PropTypes.oneOf(['needs', 'attendance', 'engagement', 'tutor', 'checkin', 'default']),
    className: PropTypes.string,
};

/**
 * SessionOverviewSection component
 */
const SessionOverviewSection = ({
    timeAllocation = 60,
    studentAttendance = 99,
    studentEngagement = 99,
    tutorAttendance = 99,
    checkInCompletion = 99,
    className = '',
    ...props
}) => {
    const charts = [
        {
            title: 'Time Allocation by Student Needs',
            tooltip: 'Distribution of time spent addressing different student needs.',
            percentage: timeAllocation,
            subtitle: 'on addressing\nMotivation\nNeeds',
            chartType: 'needs',
            legend: [
                { color: '#ffd9e4', label: 'Needs motivation' },
                { color: '#f2daff', label: 'Needs content help' },
                { color: '#807878', label: 'Other' },
            ],
        },
        {
            title: 'Student Attendance',
            tooltip: 'Percentage of students who joined their sessions.',
            percentage: studentAttendance,
            subtitle: 'attended the\nsession',
            chartType: 'attendance',
            legend: [
                { color: '#a1eb83', label: 'Joined' },
                { color: '#ffdad6', label: "Didn't join" },
                { color: '#e2e2e5', label: 'N/A (Not recorded)' },
            ],
        },
        {
            title: 'Student Engagement',
            tooltip: 'Percentage of students engaged during sessions.',
            percentage: studentEngagement,
            subtitle: 'Present on\nZoom',
            chartType: 'engagement',
            legend: [
                { color: '#a1eb83', label: 'Fully Engaged' },
                { color: '#ffe17a', label: 'Partially Engaged' },
                { color: '#ffdad6', label: 'Not Engaged' },
                { color: '#e2e2e5', label: 'N/A (Not recorded)' },
            ],
        },
        {
            title: 'Tutor Attendance',
            tooltip: 'Percentage of tutors who joined their sessions.',
            percentage: tutorAttendance,
            subtitle: 'attended the\nsession',
            chartType: 'tutor',
            legend: [
                { color: '#a1eb83', label: 'Joined' },
                { color: '#ffdad6', label: "Didn't join" },
                { color: '#e2e2e5', label: 'N/A (Not recorded)' },
            ],
        },
        {
            title: 'Check-in Completion',
            tooltip: 'Percentage of students with completed check-ins.',
            percentage: checkInCompletion,
            subtitle: 'Present on\nZoom',
            chartType: 'checkin',
            legend: [
                { color: '#a1eb83', label: 'Marked as checked / helped' },
                { color: '#e2e2e5', label: 'Not checked / helped' },
            ],
        },
    ];

    return (
        <div className={`session-overview-section ${className}`} {...props}>
            {charts.map((chart, index) => (
                <DonutChart
                    key={index}
                    title={chart.title}
                    tooltip={chart.tooltip}
                    percentage={chart.percentage}
                    subtitle={chart.subtitle}
                    chartType={chart.chartType}
                    legend={chart.legend}
                />
            ))}
        </div>
    );
};

SessionOverviewSection.propTypes = {
    /** Time Allocation percentage */
    timeAllocation: PropTypes.number,
    /** Student Attendance percentage */
    studentAttendance: PropTypes.number,
    /** Student Engagement percentage */
    studentEngagement: PropTypes.number,
    /** Tutor Attendance percentage */
    tutorAttendance: PropTypes.number,
    /** Check-in Completion percentage */
    checkInCompletion: PropTypes.number,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SessionOverviewSection;
