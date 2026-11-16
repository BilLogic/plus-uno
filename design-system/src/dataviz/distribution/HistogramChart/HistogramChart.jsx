import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { tooltipPointFormat, valueSpan } from '@/dataviz/chartFormat';
import { BRAND, CHROME } from '@/dataviz/palette';

/**
 * HistogramChart Component
 * Displays frequency distribution of numerical data.
 */
const HistogramChart = ({
    data = [],
    xAxisLabel = 'Value',
    yAxisLabel = 'Frequency',
    height = 400,
    binWidth
}) => {
    const tooltipFormat = {
        ...chartTheme.tooltip,
        headerFormat: '',
        pointFormat: `${valueSpan('{point.x} – {point.x2}')}<br/>${tooltipPointFormat({ label: '{series.name}', value: '{point.y}' })}`
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        legend: { enabled: false },
        xAxis: [{
            ...chartTheme.xAxis,
            title: { ...chartTheme.xAxis.title, text: xAxisLabel },
            alignTicks: false
        }, {
            ...chartTheme.xAxis,
            title: { ...chartTheme.xAxis.title, text: yAxisLabel },
            alignTicks: false,
            opposite: true
        }],
        yAxis: [{
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: 'Count' }
        }, {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: 'Probability' },
            opposite: true
        }],
        plotOptions: {
            histogram: {
                accessibility: {
                    point: {
                        valueDescriptionFormat: '{index}. {point.x:.3f} to {point.x2:.3f}, {point.y}.'
                    }
                },
                color: BRAND,
                // Adjacent bins stand apart, as Atlassian separates adjacent chart colors.
                borderColor: CHROME.separator,
                borderRadius: CHART_BAR_RADIUS,
                tooltip: tooltipFormat,
                ...(binWidth && { binWidth })
            }
        },
        series: [{
            name: 'Histogram',
            type: 'histogram',
            xAxis: 1,
            yAxis: 0,
            baseSeries: 's1',
            zIndex: -1
        }, {
            name: 'Data',
            type: 'scatter',
            data: data,
            id: 's1',
            visible: false,
            showInLegend: false
        }],
        tooltip: tooltipFormat
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

HistogramChart.propTypes = {
    /** Array of numerical values */
    data: PropTypes.arrayOf(PropTypes.number),
    /** Label for X axis */
    xAxisLabel: PropTypes.string,
    /** Label for Y axis */
    yAxisLabel: PropTypes.string,
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Optional bin width */
    binWidth: PropTypes.number
};

export default HistogramChart;
