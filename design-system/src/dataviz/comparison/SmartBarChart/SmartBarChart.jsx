import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { dataLabelFormat } from '@/dataviz/chartFormat';
import { BRAND, CHROME, mostToLeast } from '@/dataviz/palette';

/**
 * SmartBarChart Component
 * Visualizes data with a background bar and a foreground value bar.
 * Migrated to Highcharts column chart.
 */
const SmartBarChart = ({ data = [], height = 200, sort = true }) => {
    const orderedData = useMemo(
        () => (sort ? mostToLeast(data, (item) => parseFloat(item.height)) : data),
        [data, sort],
    );

    const categories = orderedData.map(item => item.letter);
    const seriesData = orderedData.map(item => {
        const value = parseFloat(item.height);
        return {
            y: value,
            color: item.color || BRAND,
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
            ...chartTheme.xAxis,
            categories: categories,
            lineWidth: 0,
            tickWidth: 0
        },
        yAxis: {
            ...chartTheme.yAxis,
            min: 0,
            max: 100,
            title: { ...chartTheme.yAxis.title, text: null },
            visible: false,
            gridLineWidth: 0
        },
        plotOptions: {
            column: {
                groupPadding: 0.1,
                pointPadding: 0.2,
                borderWidth: 0,
                borderRadius: CHART_BAR_RADIUS,
                grouping: false,
                shadow: false
            }
        },
        legend: { enabled: false },
        credits: { enabled: false },
        tooltip: {
            ...chartTheme.tooltip,
            enabled: true,
            pointFormat: dataLabelFormat('{point.y}%', '{point.category}')
        },
        series: [
            {
                name: 'Background',
                data: orderedData.map(() => 100),
                color: CHROME.track,
                enableMouseTracking: false,
                pointPadding: 0.3,
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
            <PlusChart options={options} />
        </div>
    );
};

SmartBarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        letter: PropTypes.string.isRequired,
        height: PropTypes.string.isRequired, // e.g. '50%'
        color: PropTypes.string
    })).isRequired,
    height: PropTypes.number,
    /** Sort categories from most to least by default; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool,
};

export default SmartBarChart;
