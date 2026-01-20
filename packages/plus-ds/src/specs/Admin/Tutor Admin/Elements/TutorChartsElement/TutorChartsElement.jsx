/**
 * TutorChartsElement Component
 * 
 * Displays one of three chart variants: Pie (Donut), Bar (Stacked), or Line.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262214
 */

import React from 'react';
import PropTypes from 'prop-types';
import DonutChart from '@/DataViz/PartToWhole/DonutChart/DonutChart';
import StackedBarChart from '@/DataViz/Comparison/StackedBarChart/StackedBarChart';
import './TutorChartsElement.scss';

// --- INTERNAL CHART COMPONENTS ---

const PieVariant = ({ data, legend, className, centerText, centerSubtext }) => {
    // Check if data is array (multi-segment) or percentage object (legacy/single)
    const isMultiSegment = Array.isArray(data);

    let segments = [];
    let valueText = "";
    let labelText = "";

    if (isMultiSegment) {
        segments = data.map(item => ({
            value: item.value,
            color: item.color,
            label: item.label
        }));
        // Use provided center text or default to total
        valueText = centerText || data.reduce((sum, item) => sum + item.value, 0).toString();
        labelText = centerSubtext || "Total";
    } else {
        // Legacy single percentage mode
        const percentage = data?.percentage || 0;
        const colorABC = legend?.[0]?.color || '#61b5cf';
        const colorXYZ = legend?.[1]?.color || '#85ecd5';

        segments = [
            { value: percentage, color: colorABC },
            { value: 100 - percentage, color: colorXYZ }
        ];
        valueText = `${percentage}%`;
        labelText = data?.label || '';
    }

    return (
        <div className={`tutor-charts-element tutor-charts-element--pie ${className}`}>
            <div className="tutor-charts-element__chart-area">
                <DonutChart
                    size={227}
                    value={valueText}
                    label={labelText}
                    segments={segments}
                    thickness={30} // Thick ring
                    centerTextSize="h1"
                />
            </div>
            {/* Legend */}
            <div className="tutor-charts-element__legend">
                {legend && legend.map((item, index) => (
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

const BarVariant = ({ data, legend, className, hideLegend }) => {
    // Transform data for StackedBarChart
    // StackedBarChart expects:
    // data: [ { segments: [ { value, color, height, textColor } ] } ]
    // dates: ['Week 1', 'Week 2'...]

    // Input data: [ { label: 'Week 1', values: [17, 3, 2...] } ]
    // where values correspond to legend colors.

    const dates = data.map(d => d.label);
    const convertedData = data.map(item => ({
        segments: item.values.map((val, idx) => ({
            value: val, // The number to show in the bar
            color: legend[idx]?.color || '#ccc',
            height: val.toString(), // Used as the Y value by the component
            textColor: '#ffffff'
        }))
    }));

    return (
        <div className={`tutor-charts-element tutor-charts-element--bar ${className}`}>
            {/* Use Design System Component */}
            <StackedBarChart
                data={convertedData}
                dates={dates}
                height={232}
            />

            {/* Internal legend if needed (hidden by default in current page usage) */}
            {!hideLegend && legend && legend.length > 0 && (
                <div className="tutor-charts-element__legend">
                    {legend.map((item, index) => (
                        <div key={index} className="tutor-charts-element__legend-item">
                            <span className="tutor-charts-element__legend-color" style={{ backgroundColor: item.color }} />
                            <span className="tutor-charts-element__legend-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
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
    centerText,
    centerSubtext,
    hideLegend,
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
            return <PieVariant data={chartData} legend={chartLegend} centerText={centerText} centerSubtext={centerSubtext} className={className} />;
        case 'Bar':
            return <BarVariant data={chartData} legend={chartLegend} className={className} hideLegend={hideLegend} />;
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
