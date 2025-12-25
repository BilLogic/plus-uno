import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
// Import polar module for radar charts (auto-initializes in Highcharts v12+)
import 'highcharts/highcharts-more';
import chartTheme from './chartTheme';

/**
 * RadarChart Component
 * Displays a radar/spider chart using Highcharts polar chart type.
 * Used for Skills Overview visualization.
 */
const RadarChart = ({
    categories = [],
    yourPerformance = [],
    averagePerformance = [],
    height = 290
}) => {
    // Ensure we have data for all categories
    const dataLength = categories.length || 0;
    const yourData = dataLength > 0 
        ? yourPerformance.slice(0, dataLength).concat(
            Array(Math.max(0, dataLength - yourPerformance.length)).fill(0)
        )
        : [];
    const avgData = dataLength > 0
        ? averagePerformance.slice(0, dataLength).concat(
            Array(Math.max(0, dataLength - averagePerformance.length)).fill(0)
        )
        : [];
    
    // Build series array - grid lines first, then data series
    const buildSeries = () => {
        const seriesArray = [];
        
        // Add grid lines as separate series (only if we have categories)
        if (dataLength > 0) {
            const gridValues = [25, 50, 75, 100];
            const gridDashStyles = ['Dash', 'Dash', 'Dash', 'Solid'];
            
            gridValues.forEach((value, index) => {
                seriesArray.push({
                    name: `Grid ${value}`,
                    data: Array(dataLength).fill(value),
                    type: 'line',
                    color: 'var(--color-outline-variant, #bec8ca)',
                    lineWidth: 1.5,
                    dashStyle: gridDashStyles[index],
                    enableMouseTracking: false,
                    showInLegend: false,
                    zIndex: 1,
                    pointPlacement: 'on'
                });
            });
        }
        
        // Add data series
        seriesArray.push({
            name: 'Your performance',
            data: yourData,
            type: 'area',
            color: '#61b5cf',
            fillColor: '#61b5cf',
            fillOpacity: 0.3,
            pointPlacement: 'on',
            zIndex: 2
        });
        
        seriesArray.push({
            name: 'Average tutor performance',
            data: avgData,
            type: 'line',
            color: '#445c6a',
            dashStyle: 'Dash',
            pointPlacement: 'on',
            zIndex: 3
        });
        
        return seriesArray;
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            polar: true,
            type: 'area',
            height: height,
            backgroundColor: 'transparent'
        },
        title: { text: null },
        pane: {
            size: '75%',
            startAngle: -90, // Start at top (Teaching Math at top)
            endAngle: 270
        },
        xAxis: {
            ...chartTheme.xAxis,
            categories: categories,
            tickmarkPlacement: 'on',
            lineWidth: 0,
            labels: {
                style: {
                    ...chartTheme.xAxis.labels?.style,
                    fontSize: '12px',
                    fontFamily: 'var(--font-family-body)',
                    fontWeight: 'var(--font-weight-normal)',
                    color: 'var(--color-on-surface)'
                }
            }
        },
        yAxis: {
            ...chartTheme.yAxis,
            gridLineInterpolation: 'polygon',
            gridLineColor: 'var(--color-outline-variant, #bec8ca)',
            gridLineWidth: 0, // Disable default grid lines - we'll render them as series
            lineWidth: 0,
            min: 0,
            max: 100,
            tickInterval: 25,
            tickPositions: [25, 50, 75, 100],
            labels: {
                enabled: true,
                style: {
                    ...chartTheme.yAxis.labels?.style,
                    fontSize: '12px',
                    fontFamily: 'var(--font-family-body)',
                    fontWeight: 'var(--font-weight-light)',
                    color: 'var(--color-on-surface-variant)'
                },
                formatter: function() {
                    return this.value;
                }
            },
            minorGridLineWidth: 0,
            minorTickInterval: null
        },
        plotOptions: {
            area: {
                fillOpacity: 0.08, // Very transparent so grid lines are clearly visible
                marker: {
                    enabled: false
                },
                lineWidth: 2
            },
            line: {
                lineWidth: 2,
                dashStyle: 'Dash',
                marker: {
                    enabled: false
                }
            }
        },
        legend: { enabled: false }, // We'll handle legend separately
        tooltip: {
            ...chartTheme.tooltip,
            shared: true,
            pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>'
        },
        series: buildSeries(),
        credits: { enabled: false }
    };

    // Don't render if we don't have categories
    if (!categories || categories.length === 0) {
        return (
            <div style={{ width: '100%', height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span>No data available</span>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact 
                highcharts={Highcharts} 
                options={options}
                containerProps={{ style: { height: '100%', width: '100%' } }}
            />
        </div>
    );
};

RadarChart.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    yourPerformance: PropTypes.arrayOf(PropTypes.number).isRequired,
    averagePerformance: PropTypes.arrayOf(PropTypes.number).isRequired,
    height: PropTypes.number
};

export default RadarChart;

