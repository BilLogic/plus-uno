import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * DonutChart Component
 * Displays a donut chart using Highcharts.
 */
import chartTheme from './chartTheme';

// Apply global theme options once or merge them locally.
// Merging locally is safer for component isolation.
// import Highcharts and HighchartsReact are already there.

const DonutChart = ({ size = 228, segments = [], value, label, centerTextSize = 'h1' }) => {
    // Transform segments into Highcharts series data
    const chartData = segments.map(segment => ({
        y: segment.value,
        color: segment.color,
        name: segment.label || 'Segment'
    }));

    const options = {
        ...chartTheme, // Apply theme defaults
        chart: {
            ...chartTheme.chart,
            type: 'pie',
            width: size,
            height: size,
            // Allow override of spacing/margin that might be in theme
            spacing: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        },
        chart: {
            type: 'pie',
            width: size,
            height: size,
            backgroundColor: 'transparent',
            spacing: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        },
        title: {
            text: `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <span style="font-family: var(--font-family-header); font-weight: bold; font-size: ${centerTextSize === 'h1' ? 'var(--font-size-h1)' : 'var(--font-size-h2)'}; line-height: 1; color: var(--color-on-surface);">${value || ''}</span>
                    ${label ? `<span style="font-family: var(--font-family-body); font-size: var(--font-size-body3); color: var(--color-on-surface-variant, #666); margin-top: 4px;">${label}</span>` : ''}
                   </div>`,
            align: 'center',
            verticalAlign: 'middle',
            y: 5, // Optical adjustment
            useHTML: true,
            style: {
                fontFamily: 'inherit',
                color: 'inherit'
            }
        },
        plotOptions: {
            pie: {
                innerSize: '85%', // Donut thickness
                borderWidth: 0,
                allowPointSelect: false,
                cursor: 'default',
                dataLabels: {
                    enabled: false
                },
                states: {
                    hover: {
                        enabled: false,
                        halo: null
                    },
                    inactive: {
                        opacity: 1
                    }
                }
            }
        },
        tooltip: {
            enabled: true,
            pointFormat: '<b>{point.name}</b>: {point.y}'
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Data',
            data: chartData,
            size: '100%',
            innerSize: '85%',
        }]
    };

    return (
        <div style={{ width: size, height: size, position: 'relative' }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

DonutChart.propTypes = {
    /** Diameter of the chart in pixels */
    size: PropTypes.number,
    /** Array of segment objects { value, color, label } */
    segments: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.number.isRequired,
        color: PropTypes.string.isRequired,
        label: PropTypes.string
    })),
    /** Text to display in the center */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Label text below the value */
    label: PropTypes.string,
    /** CSS class for the center value text size */
    centerTextSize: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5'])
};

export default DonutChart;
