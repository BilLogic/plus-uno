import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '@/dataviz/highchartsModules';
import PlusChart from '@/dataviz/PlusChart';
import { valueSpan } from '@/dataviz/chartFormat';
import chartTheme, { CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { CHROME, STATUS } from '@/dataviz/palette';

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
            title: {
                ...chartTheme.yAxis.title,
                text: yAxisLabel
            }
        },
        plotOptions: {
            waterfall: {
                borderRadius: CHART_BAR_RADIUS,
            },
        },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: valueSpan('{point.y:,.0f}')
        },
        legend: { enabled: false },
        series: [{
            name: 'Waterfall',
            // A gain or a loss is a status; the signed value label says which, so color is never alone.
            upColor: STATUS.success,
            color: STATUS.danger,
            borderColor: CHROME.separator,
            // The connector between bars is chrome, not data.
            lineColor: CHROME.grid,
            data: data,
            dataLabels: {
                enabled: true,
                formatter: function() {
                    return Highcharts.numberFormat(this.y, 0);
                }
            },
            pointPadding: 0
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
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
