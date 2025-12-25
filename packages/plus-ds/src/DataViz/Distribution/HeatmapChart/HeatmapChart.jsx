import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * HeatmapChart Component
 * Displays data as a matrix of colored cells.
 * Color intensity represents magnitude.
 */
const HeatmapChart = ({
    xCategories = [],
    yCategories = [],
    data = [],
    height = 400,
    minColor = '#c3e8ff',
    maxColor = '#0066cc'
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'heatmap',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: xCategories
        },
        yAxis: {
            ...chartTheme.yAxis,
            categories: yCategories,
            title: null,
            reversed: true
        },
        colorAxis: {
            min: 0,
            minColor: minColor,
            maxColor: maxColor
        },
        legend: {
            ...chartTheme.legend,
            align: 'right',
            layout: 'vertical',
            margin: 0,
            verticalAlign: 'top',
            y: 25,
            symbolHeight: 280
        },
        tooltip: {
            ...chartTheme.tooltip,
            formatter: function () {
                return `<b>${this.series.xAxis.categories[this.point.x]}</b><br/>
                        <b>${this.series.yAxis.categories[this.point.y]}</b>: ${this.point.value}`;
            }
        },
        series: [{
            name: 'Heatmap',
            borderWidth: 1,
            borderColor: 'var(--color-outline-variant)',
            data: data,
            dataLabels: {
                enabled: true,
                color: '#000000',
                style: {
                    textOutline: 'none'
                }
            }
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

HeatmapChart.propTypes = {
    /** Categories for X axis */
    xCategories: PropTypes.arrayOf(PropTypes.string),
    /** Categories for Y axis */
    yCategories: PropTypes.arrayOf(PropTypes.string),
    /** Array of [x, y, value] data points */
    data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Color for minimum values */
    minColor: PropTypes.string,
    /** Color for maximum values */
    maxColor: PropTypes.string
};

export default HeatmapChart;
