import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * BubbleChart Component
 * A scatter chart where point size represents a third variable.
 * Useful for showing relationships between three variables.
 */
const BubbleChart = ({
    xAxisLabel = 'X Axis',
    yAxisLabel = 'Y Axis',
    zAxisLabel = 'Size',
    data = [],
    height = 400
}) => {
    // Merge theme colors into series if not provided
    const seriesWithTheme = data.map((s, i) => ({
        ...s,
        color: s.color || chartTheme.colors[i % chartTheme.colors.length]
    }));

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'bubble',
            height: height,
            zoomType: 'xy'
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: { text: xAxisLabel, style: chartTheme.xAxis.labels.style },
            gridLineWidth: 1
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { text: yAxisLabel, style: chartTheme.yAxis.labels.style }
        },
        tooltip: {
            ...chartTheme.tooltip,
            useHTML: true,
            pointFormat: `<b>{series.name}</b><br/>
                ${xAxisLabel}: {point.x}<br/>
                ${yAxisLabel}: {point.y}<br/>
                ${zAxisLabel}: {point.z}`
        },
        plotOptions: {
            bubble: {
                minSize: 10,
                maxSize: 60,
                marker: {
                    fillOpacity: 0.7
                }
            }
        },
        series: seriesWithTheme
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

BubbleChart.propTypes = {
    /** Label for X axis */
    xAxisLabel: PropTypes.string,
    /** Label for Y axis */
    yAxisLabel: PropTypes.string,
    /** Label for bubble size (Z axis) */
    zAxisLabel: PropTypes.string,
    /** Array of series objects { name, data: [[x, y, z], ...] } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
        color: PropTypes.string
    })),
    /** Chart height in pixels */
    height: PropTypes.number
};

export default BubbleChart;
