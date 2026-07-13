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

const TimeAllocationSvg = () => (
    <svg viewBox="0 0 228 228" fill="none" className="donut-chart__svg">
        <path d="M227.638 113.819C227.638 131.781 223.387 149.488 215.232 165.492C207.078 181.496 195.251 195.343 180.72 205.9C166.189 216.458 149.365 223.427 131.624 226.236C113.883 229.046 95.7296 227.618 78.6469 222.067C61.5642 216.517 46.0377 207.002 33.3368 194.301C20.6359 181.6 11.1212 166.074 5.57069 148.991C0.0201886 131.908 -1.40855 113.754 1.4013 96.0137C4.21115 78.273 11.1798 61.4492 21.7375 46.9178L49.3619 66.9881C41.9715 77.1601 37.0935 88.9368 35.1266 101.355C33.1597 113.774 34.1598 126.481 38.0452 138.439C41.9305 150.397 48.5908 161.266 57.4814 170.156C66.3721 179.047 77.2406 185.707 89.1985 189.593C101.156 193.478 113.864 194.478 126.283 192.511C138.701 190.544 150.478 185.666 160.65 178.276C170.822 170.886 179.1 161.193 184.808 149.99C190.516 138.787 193.492 126.392 193.492 113.819H227.638Z" fill="#FFD9E4" />
        <path d="M180.72 21.7375C195.242 32.288 207.062 46.1235 215.216 62.1141C223.37 78.1048 227.626 95.7972 227.638 113.747L193.492 113.768C193.484 101.204 190.505 88.819 184.797 77.6255C179.089 66.4321 170.815 56.7473 160.65 49.3619L180.72 21.7375Z" fill="#F2DAFF" />
        <path d="M21.695 46.9763C30.4729 34.8784 41.5477 24.6279 54.2871 16.8101C67.0265 8.99227 81.181 3.7602 95.9424 1.41262C110.704 -0.934961 125.783 -0.352075 140.319 3.128C154.855 6.60807 168.564 12.9172 180.662 21.6951L160.609 49.3322C152.14 43.1877 142.544 38.7713 132.369 36.3353C122.194 33.8992 111.638 33.4912 101.305 35.1345C90.9723 36.7778 81.0642 40.4403 72.1466 45.9127C63.2291 51.3852 55.4767 58.5606 49.3322 67.0291L21.695 46.9763Z" fill="#807878" />
    </svg>
);

const GreenMetricSvg = () => (
    <svg viewBox="0 0 229 229" fill="none" className="donut-chart__svg">
        <path d="M228.74 114.37C228.74 144.392 216.936 173.21 195.875 194.604C174.813 215.999 146.185 228.254 116.167 228.726C86.1485 229.198 57.1488 217.847 35.426 197.125C13.7032 176.402 0.999436 147.969 0.0564345 117.963C-0.886567 87.9557 10.0068 58.7812 30.3856 36.7356C50.7643 14.69 78.9942 1.54118 108.983 0.126964C138.971 -1.28725 168.313 9.14654 190.676 29.1765C213.039 49.2065 226.629 77.2263 228.514 107.189L194.271 109.343C192.952 88.3694 183.438 68.7555 167.784 54.7346C152.13 40.7136 131.591 33.41 110.599 34.3999C89.6069 35.3899 69.846 44.594 55.5809 60.0259C41.3158 75.4578 33.6904 95.88 34.3505 116.885C35.0106 137.89 43.9033 157.793 59.1092 172.298C74.3152 186.804 94.615 194.749 115.628 194.419C136.64 194.089 156.68 185.51 171.423 170.534C186.166 155.558 194.429 135.385 194.429 114.37H228.74Z" fill="#A1EB83" />
        <path d="M228.462 106.392C228.629 108.782 228.721 111.176 228.737 113.572L194.427 113.811C194.415 112.134 194.351 110.458 194.234 108.785L228.462 106.392Z" fill="#FFDAD6" />
    </svg>
);

const DonutChart = ({
    title,
    tooltip,
    percentage,
    subtitle,
    legend,
    chartType = 'default',
    className = '',
    CustomSvg
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
                {CustomSvg ? (
                    <CustomSvg />
                ) : (
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
                )}
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
            CustomSvg: TimeAllocationSvg,
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
            CustomSvg: GreenMetricSvg,
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
            CustomSvg: GreenMetricSvg,
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
            CustomSvg: GreenMetricSvg,
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
            CustomSvg: GreenMetricSvg,
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
                    CustomSvg={chart.CustomSvg}
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
