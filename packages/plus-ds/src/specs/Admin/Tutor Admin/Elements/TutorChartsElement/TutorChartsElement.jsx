/**
 * TutorChartsElement Component
 * 
 * Displays one of three chart variants: Pie (Donut), Bar (Stacked), or Line.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262214
 */

import React from 'react';
import PropTypes from 'prop-types';
import DonutChart from '@/DataViz/PartToWhole/DonutChart/DonutChart'; // Assumed path based on imports
import './TutorChartsElement.scss';

// --- INTERNAL CHART COMPONENTS ---

const PieVariant = ({ data, legend, className }) => {
    const percentage = data?.percentage || 0;
    const label = data?.label || '';

    // Legend colors
    const colorABC = legend[0]?.color || '#61b5cf';
    const colorXYZ = legend[1]?.color || '#85ecd5';

    return (
        <div className={`tutor-charts-element tutor-charts-element--pie ${className}`}>
            <div className="tutor-charts-element__chart-area">
                <DonutChart
                    size={227}
                    value={`${percentage}%`}
                    label={label}
                    segments={[
                        { value: percentage, color: colorABC },
                        { value: 100 - percentage, color: colorXYZ } // Or gray if 'remaining'? Figma shows full circle usually mostly blue?
                        // Actually Figma screenshot shows a blue ring segment and a cyan ring segment?
                        // Wait, DonutChart usually shows parts of a whole.
                        // If ABC is 85% and XYZ is 15%, then it sums to 100.
                        // Screenshot shows "00%" and "ABC". 
                        // It looks like a progress ring + text.
                        // I'll assume segment 0 is the 'value' and 'segment 1' is remainder/background or second value.
                        // If it's 2 values (ABC vs XYZ), then:
                        // { value: percentage, color: colorABC },
                        // { value: 100-percentage, color: colorXYZ }
                    ]}
                    thickness={30} // Thick ring
                    centerTextSize="h1"
                />
            </div>
            {/* Legend */}
            <div className="tutor-charts-element__legend">
                {legend.map((item, index) => (
                    <div key={index} className="tutor-charts-element__legend-item">
                        <span
                            className="tutor-charts-element__legend-color"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="tutor-charts-element__legend-label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarVariant = ({ data, legend, className }) => {
    // Determine max value for Y scaling
    // Each bar is sum of values?
    // Stacking: values[0] is bottom, values[1] is top.
    const maxTotal = Math.max(...data.map(d => d.values.reduce((a, b) => a + b, 0)), 1);

    return (
        <div className={`tutor-charts-element tutor-charts-element--bar ${className}`}>
            <div className="tutor-charts-element__chart-container">
                {/* Y Axis */}
                <div className="tutor-charts-element__y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                </div>

                {/* Plot Area */}
                <div className="tutor-charts-element__plot">
                    {data.map((item, i) => {
                        const total = item.values.reduce((a, b) => a + b, 0);
                        // Scale height relative to assumed '100% reference' or maxTotal?
                        // Figma axis says 100%. Usually this means the chart scales so the max is 100% or relative to a fixed max like 25 entries? 
                        // Screenshot values: 12+6 = 18. max axis 100%. 
                        // If these are raw counts, maybe Y axis isn't %, or it's % of capacity?
                        // Screenshot Y axis LABELS are %. But values are integers (6, 12, 16, 8...).
                        // I'll assume max height represents 100% of some capacity, OR the axis labels are just static and the bars visualize relative distribution?
                        // Let's assume maxTotal maps to 100% height for now to fill the space.
                        // Or maybe fixed max = 25?
                        // I'll use maxTotal for scaling.

                        const heightPct = (total / maxTotal) * 100; // Total bar height %

                        return (
                            <div key={i} className="tutor-charts-element__bar-group" style={{ height: '100%' }}>
                                <div className="tutor-charts-element__bar" style={{ height: `${heightPct}%` }}>
                                    {item.values.map((val, segIdx) => (
                                        <div
                                            key={segIdx}
                                            className="tutor-charts-element__bar-segment"
                                            title={`${legend[segIdx]?.label || ''}: ${val}`}
                                            style={{
                                                height: `${(val / total) * 100}%`, // % of the BAR height
                                                backgroundColor: legend[segIdx]?.color,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {val > 0 && val}
                                        </div>
                                    ))}
                                </div>
                                <span className="tutor-charts-element__x-label">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="tutor-charts-element__legend">
                {legend.map((item, index) => (
                    <div key={index} className="tutor-charts-element__legend-item">
                        <span
                            className="tutor-charts-element__legend-color"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="tutor-charts-element__legend-label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LineVariant = ({ data, legend, className }) => {
    // Data: [{ label: 'date', values: [v1, v2] }, ...]
    // Max value for Y scale
    const allValues = data.flatMap(d => d.values);
    const maxVal = Math.max(...allValues, 1);

    // Generate SVG paths
    const width = 430; // approx plot width
    const height = 200; // approx plot height 

    // Calculate points for each line
    const linesPoints = legend.map((_, lineIdx) => {
        return data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d.values[lineIdx] / maxVal) * height);
            return { x, y, value: d.values[lineIdx], label: d.label };
        });
    });

    const linesPaths = linesPoints.map(points => {
        // Convert points to path 'M x y L x y'
        return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    });

    return (
        <div className={`tutor-charts-element tutor-charts-element--line ${className}`}>
            <div className="tutor-charts-element__chart-container">
                {/* Y Axis */}
                <div className="tutor-charts-element__y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                </div>

                {/* Plot Area */}
                <div className="tutor-charts-element__plot">
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        {/* Lines */}
                        {linesPaths.map((d, i) => (
                            <path
                                key={`line-${i}`}
                                d={d}
                                fill="none"
                                stroke={legend[i]?.color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ))}

                        {/* Interactive Points (Circles) */}
                        {linesPoints.map((points, lineIdx) => (
                            <g key={`points-${lineIdx}`}>
                                {points.map((p, i) => (
                                    <circle
                                        key={i}
                                        cx={p.x}
                                        cy={p.y}
                                        r="6" // Larger invisible target or visible marker? Let's make it visible on hover via CSS
                                        className="tutor-charts-element__point"
                                        fill={legend[lineIdx]?.color}
                                        stroke="#fff"
                                        strokeWidth="2"
                                        title={`${legend[lineIdx]?.label}: ${p.value}`} // Tooltip
                                    />
                                ))}
                            </g>
                        ))}
                    </svg>

                    {data.map((item, i) => (
                        <div
                            key={i}
                            className="tutor-charts-element__x-label"
                            style={{ left: `${(i / (data.length - 1)) * 100}%` }}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="tutor-charts-element__legend">
                {legend.map((item, index) => (
                    <div key={index} className="tutor-charts-element__legend-item">
                        <span
                            className="tutor-charts-element__legend-color"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="tutor-charts-element__legend-label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const TutorChartsElement = ({
    variant = 'Pie',
    data,
    legend,
    // Legacy props support (optional mapping)
    donutPercentage,
    donutSubtitle,
    stackedBarData,
    lineChartData,
    className = '',
    ...props
}) => {
    // Prepare Data/Legend based on Variant if generic 'data' not provided
    let chartData = data;
    let chartLegend = legend;

    // Default Fallbacks from specific props if 'data' missing
    if (!chartData) {
        if (variant === 'Pie') {
            chartData = { percentage: donutPercentage || 0, label: donutSubtitle || 'ABC' };
            chartLegend = legend || [
                { label: 'ABC', color: '#61b5cf' },
                { label: 'XYZ', color: '#85ecd5' }
            ];
        } else if (variant === 'Bar') {
            chartData = stackedBarData || [
                { label: '10/11', values: [12, 6] },
                { label: '10/12', values: [16, 8] },
                { label: '10/13', values: [12, 5] },
                { label: '10/17', values: [12, 1] },
                { label: '10/18', values: [20, 2] },
            ];
            chartLegend = legend || [
                { label: 'ABC', color: '#61b5cf' },
                { label: 'XYZ', color: '#85ecd5' }
            ];
        } else if (variant === 'Line') {
            chartData = lineChartData || [
                { label: '06/03/24', values: [5, 0] },
                { label: '06/10/24', values: [60, 20] },
                { label: '06/17/24', values: [55, 75] },
                { label: '06/24/24', values: [65, 30] },
                { label: '07/01/24', values: [20, 40] },
            ];
            chartLegend = legend || [
                { label: 'ABC', color: '#004b6b' }, // Dark Blue for Line Chart ABC
                { label: 'XYZ', color: '#85ecd5' }
            ];
        }
    }

    // Render Variant
    switch (variant) {
        case 'Pie':
            return <PieVariant data={chartData} legend={chartLegend} className={className} />;
        case 'Bar':
            return <BarVariant data={chartData} legend={chartLegend} className={className} />;
        case 'Line':
            return <LineVariant data={chartData} legend={chartLegend} className={className} />;
        default:
            return <div>Unknown Variant</div>;
    }
};

TutorChartsElement.propTypes = {
    variant: PropTypes.oneOf(['Pie', 'Bar', 'Line']),
    data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    legend: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        color: PropTypes.string
    })),
    // Legacy support
    donutPercentage: PropTypes.number,
    donutSubtitle: PropTypes.string,
    stackedBarData: PropTypes.array,
    lineChartData: PropTypes.array,
    className: PropTypes.string
};

export default TutorChartsElement;
