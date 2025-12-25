import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * WaterfallChart Component
 * Shows running totals, how values increase or decrease sequentially.
 * Great for financial statements and progress tracking.
 */
const WaterfallChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'waterfall',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            type: 'category',
            categories: categories
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { text: yAxisLabel, style: chartTheme.yAxis.labels.style }
        },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: '<b>{point.y:,.0f}</b>'
        },
        legend: { enabled: false },
        series: [{
            name: 'Waterfall',
            upColor: 'var(--color-success)',
            color: 'var(--color-danger)',
            data: data,
            dataLabels: {
                enabled: true,
                formatter: function () {
                    return Highcharts.numberFormat(this.y, 0);
                },
                style: chartTheme.tooltip.style
            },
            pointPadding: 0
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

WaterfallChart.propTypes = {
    /** Array of values, use { isSum: true } for summary bars, { isIntermediateSum: true } for subtotals */
    data: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.shape({
            y: PropTypes.number,
            isSum: PropTypes.bool,
            isIntermediateSum: PropTypes.bool,
            color: PropTypes.string
        })
    ])),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height in pixels */
    height: PropTypes.number
};

export default WaterfallChart;
