/**
 * TutorChartsElement Component
 * 
 * Element displaying three chart types: Donut, Stacked Bar, and Line charts.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262214
 */

import React from 'react';
import PropTypes from 'prop-types';
import CardTitleHeader from '../CardTitleHeader/CardTitleHeader';
import '../CardTitleHeader/CardTitleHeader.scss';
import './TutorChartsElement.scss';

/**
 * Donut Chart Component
 */
const DonutChart = ({ percentage = 0, subtitle = 'ABC', legend = [] }) => {
    const safePercentage = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - safePercentage / 100);

    return (
        <div className="tutor-charts-element__donut">
            <div className="tutor-charts-element__donut-chart">
                <svg viewBox="0 0 180 180" className="tutor-charts-element__svg">
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
                        stroke={legend[0]?.color || '#61b5cf'}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 90 90)"
                    />
                </svg>
                <div className="tutor-charts-element__donut-center">
                    <span className="tutor-charts-element__donut-percentage">{safePercentage}%</span>
                    <span className="tutor-charts-element__donut-subtitle body1-txt">{subtitle}</span>
                </div>
            </div>
            {/* Legend */}
            {legend.length > 0 && (
                <div className="tutor-charts-element__legend">
                    {legend.map((item, index) => (
                        <div key={index} className="tutor-charts-element__legend-item">
                            <span
                                className="tutor-charts-element__legend-color"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="body3-txt">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Stacked Bar Chart Component
 */
const StackedBarChart = ({ data = [], legend = [] }) => {
    const maxTotal = Math.max(...data.map(d => d.values.reduce((a, b) => a + b, 0)), 1);

    return (
        <div className="tutor-charts-element__stacked-bar">
            <div className="tutor-charts-element__chart-content">
                {/* Y-axis */}
                <div className="tutor-charts-element__y-axis">
                    <span className="body3-txt">100%</span>
                    <span className="body3-txt">75%</span>
                    <span className="body3-txt">50%</span>
                    <span className="body3-txt">25%</span>
                    <span className="body3-txt">0%</span>
                </div>

                {/* Main chart area */}
                <div className="tutor-charts-element__main">
                    {/* Grid lines */}
                    <div className="tutor-charts-element__grid">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="tutor-charts-element__grid-line" />
                        ))}
                    </div>

                    {/* Bars */}
                    <div className="tutor-charts-element__bars">
                        {data.map((item, index) => {
                            const total = item.values.reduce((a, b) => a + b, 0);
                            const heightPercent = (total / maxTotal) * 100;

                            return (
                                <div key={index} className="tutor-charts-element__bar-col">
                                    <div
                                        className="tutor-charts-element__bar-container"
                                        style={{ height: `${heightPercent}%` }}
                                    >
                                        {item.values.map((value, segIndex) => {
                                            const percentage = total > 0 ? (value / total) * 100 : 0;
                                            return (
                                                <div
                                                    key={segIndex}
                                                    className={`tutor-charts-element__bar-segment tutor-charts-element__bar-segment--${segIndex}`}
                                                    style={{
                                                        height: `${percentage}%`,
                                                        backgroundColor: legend[segIndex]?.color || '#61b5cf',
                                                    }}
                                                >
                                                    {value > 0 && (
                                                        <span className="tutor-charts-element__bar-value body2-txt">
                                                            {value}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* X-axis label */}
                                    <span className="tutor-charts-element__date body3-txt">
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            {legend.length > 0 && (
                <div className="tutor-charts-element__legend">
                    {legend.map((item, index) => (
                        <div key={index} className="tutor-charts-element__legend-item">
                            <span
                                className="tutor-charts-element__legend-color"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="body3-txt">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Line Chart Component
 */
const LineChart = ({ data = [], legend = [] }) => {
    const maxValue = Math.max(...data.flatMap(d => d.values), 100);

    return (
        <div className="tutor-charts-element__line">
            <div className="tutor-charts-element__chart-content">
                {/* Y-axis */}
                <div className="tutor-charts-element__y-axis">
                    <span className="body3-txt">100%</span>
                    <span className="body3-txt">75%</span>
                    <span className="body3-txt">50%</span>
                    <span className="body3-txt">25%</span>
                    <span className="body3-txt">0%</span>
                </div>

                {/* Main chart area */}
                <div className="tutor-charts-element__main">
                    {/* Grid lines */}
                    <div className="tutor-charts-element__grid">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="tutor-charts-element__grid-line" />
                        ))}
                    </div>

                    {/* Lines */}
                    {data.length > 0 && (
                        <svg className="tutor-charts-element__line-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
                            {legend.map((legendItem, lineIndex) => {
                                const divisor = data.length > 1 ? data.length - 1 : 1;
                                const lineData = data.map((d, i) => ({
                                    x: (i / divisor) * 400,
                                    y: 200 - ((d.values[lineIndex] || 0) / maxValue) * 200,
                                }));

                                const pathData = lineData
                                    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                                    .join(' ');

                                return (
                                    <path
                                        key={lineIndex}
                                        d={pathData}
                                        fill="none"
                                        stroke={legendItem.color || '#61b5cf'}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                );
                            })}
                        </svg>
                    )}

                    {/* X-axis labels */}
                    <div className="tutor-charts-element__x-axis">
                        {data.map((item, index) => (
                            <span key={index} className="tutor-charts-element__date body3-txt">
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            {legend.length > 0 && (
                <div className="tutor-charts-element__legend">
                    {legend.map((item, index) => (
                        <div key={index} className="tutor-charts-element__legend-item">
                            <span
                                className="tutor-charts-element__legend-color"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="body3-txt">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Main TutorChartsElement Component
 */
const TutorChartsElement = ({
    donutPercentage = 0,
    donutSubtitle = 'ABC',
    donutLegend = [
        { color: '#61b5cf', label: 'ABC' },
        { color: '#85ecd5', label: 'XYZ' },
    ],
    stackedBarData = [],
    stackedBarLegend = [
        { color: '#61b5cf', label: 'ABC' },
        { color: '#85ecd5', label: 'XYZ' },
    ],
    lineChartData = [],
    lineChartLegend = [
        { color: '#3b525f', label: 'ABC' },
        { color: '#85ecd5', label: 'XYZ' },
    ],
    className = '',
    ...props
}) => {
    // Default data matching Figma
    const defaultStackedBarData = [
        { label: '10/11', values: [12, 6] },
        { label: '10/12', values: [16, 8] },
        { label: '10/13', values: [12, 5] },
        { label: '10/17', values: [12, 1] },
        { label: '10/18', values: [20, 2] },
    ];

    const defaultLineChartData = [
        { label: '06/03/24', values: [5, 0] },
        { label: '06/10/24', values: [60, 20] },
        { label: '06/17/24', values: [55, 75] },
        { label: '06/24/24', values: [65, 30] },
        { label: '07/01/24', values: [20, 40] },
    ];

    const displayStackedBarData = stackedBarData.length > 0 ? stackedBarData : defaultStackedBarData;
    const displayLineChartData = lineChartData.length > 0 ? lineChartData : defaultLineChartData;

    return (
        <div className={`tutor-charts-element ${className}`} {...props}>
            {/* Donut Chart */}
            <div className="tutor-charts-element__chart-wrapper">
                <CardTitleHeader title="Card Title" tooltip="Donut chart tooltip" />
                <DonutChart
                    percentage={donutPercentage}
                    subtitle={donutSubtitle}
                    legend={donutLegend}
                />
            </div>

            {/* Stacked Bar Chart */}
            <div className="tutor-charts-element__chart-wrapper">
                <CardTitleHeader title="Card Title" tooltip="Stacked bar chart tooltip" />
                <StackedBarChart data={displayStackedBarData} legend={stackedBarLegend} />
            </div>

            {/* Line Chart */}
            <div className="tutor-charts-element__chart-wrapper">
                <CardTitleHeader title="Card Title" tooltip="Line chart tooltip" />
                <LineChart data={displayLineChartData} legend={lineChartLegend} />
            </div>
        </div>
    );
};

TutorChartsElement.propTypes = {
    /** Donut chart percentage */
    donutPercentage: PropTypes.number,
    /** Donut chart subtitle */
    donutSubtitle: PropTypes.string,
    /** Donut chart legend */
    donutLegend: PropTypes.arrayOf(
        PropTypes.shape({
            color: PropTypes.string,
            label: PropTypes.string,
        })
    ),
    /** Stacked bar chart data */
    stackedBarData: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            values: PropTypes.arrayOf(PropTypes.number),
        })
    ),
    /** Stacked bar chart legend */
    stackedBarLegend: PropTypes.arrayOf(
        PropTypes.shape({
            color: PropTypes.string,
            label: PropTypes.string,
        })
    ),
    /** Line chart data */
    lineChartData: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            values: PropTypes.arrayOf(PropTypes.number),
        })
    ),
    /** Line chart legend */
    lineChartLegend: PropTypes.arrayOf(
        PropTypes.shape({
            color: PropTypes.string,
            label: PropTypes.string,
        })
    ),
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorChartsElement;
