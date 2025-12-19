import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * SmartBarChart Component
 * Visualizes data with a background bar and a foreground value bar.
 * Migrated to Highcharts column chart.
 */
import chartTheme from './chartTheme';

/**
 * SmartBarChart Component
 * Visualizes data with a background bar and a foreground value bar.
 * Migrated to Highcharts column chart.
 */
const SmartBarChart = ({ data, height = 200 }) => {
    // data: Array of { letter, height (string like '50%'), color }

    // Transform data for Highcharts
    const categories = data.map(item => item.letter);
    const seriesData = data.map(item => {
        const value = parseFloat(item.height);
        return {
            y: value,
            color: item.color,
        };
    });

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'column',
            height: height,
            spacingLeft: 0,
            spacingRight: 0
        },
        title: { text: null },
        xAxis: {
            categories: categories,
            labels: {
                style: {
                    fontSize: '10px',
                    color: '#666' // muted text
                }
            },
            lineWidth: 0,
            tickWidth: 0
        },
        yAxis: {
            min: 0,
            max: 100, // Assuming percentage inputs
            title: { text: null },
            visible: false, // Hide y-axis as per simple visual design
            gridLineWidth: 0
        },
        plotOptions: {
            column: {
                groupPadding: 0.1,
                pointPadding: 0.2, // Adjust for bar width
                borderWidth: 0,
                borderRadius: '50%', // rounded-pill effect
                // Background bars using plotBands or a separate series is complex in Highcharts for exact "pill" look 
                // overlapping perfectly. A simpler way for "background pill" in Highcharts is using a background series
                // or just using the column itself.
                // 
                // To achieve strict visual parity (gray background pill behind colored bar):
                // We'll use grouping: false (overlapping columns) 
                // Series 1: Background (100% gray)
                // Series 2: value (colored)
                grouping: false,
                shadow: false
            }
        },
        legend: { enabled: false },
        credits: { enabled: false },
        tooltip: {
            enabled: true,
            format: '<b>{x}</b>: {y}%'
        },
        series: [
            {
                name: 'Background',
                data: data.map(() => 100),
                color: 'var(--color-surface-neutral-tertiary)', // bg-light equivalent
                enableMouseTracking: false,
                pointPadding: 0.3, // Match width of foreground
            },
            {
                name: 'Value',
                data: seriesData,
                pointPadding: 0.3
            }
        ]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

SmartBarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        letter: PropTypes.string.isRequired,
        height: PropTypes.string.isRequired, // e.g. '50%'
        color: PropTypes.string.isRequired
    })).isRequired,
    height: PropTypes.number
};

export default SmartBarChart;
