import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BAR_RADIUS, CHART_GRID_WIDTH_NUMBER } from '@/dataviz/chartTheme';
import { dataLabelFormat, valueSpan } from '@/dataviz/chartFormat';
import { BRAND, CHROME, mostToLeast } from '@/dataviz/palette';

/**
 * VariwidthChart Component
 * Column chart where column width is variable (Variwide).
 * Great for visualizing a second dimension like importance or weight.
 */
const VariwidthChart = ({
    data = [],
    xAxisLabel = 'Category',
    yAxisLabel = 'Value',
    height = 400,
    sort = true
}) => {
    const orderedData = useMemo(
        () => (sort ? mostToLeast(data, (d) => d.y) : data),
        [data, sort],
    );

    const tooltipFormat = {
        ...chartTheme.tooltip,
        pointFormat: `Value: ${valueSpan('{point.y}')}<br/>Weight: ${valueSpan('{point.z}')}`
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'variwide',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            type: 'category',
            title: { ...chartTheme.xAxis.title, text: xAxisLabel }
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel }
        },
        tooltip: tooltipFormat,
        legend: { enabled: false },
        plotOptions: {
            variwide: {
                borderColor: CHROME.separator,
                borderWidth: CHART_GRID_WIDTH_NUMBER,
                borderRadius: CHART_BAR_RADIUS,
                tooltip: tooltipFormat
            }
        },
        series: [{
            name: 'Data',
            color: BRAND,
            data: orderedData,
            dataLabels: {
                ...chartTheme.plotOptions.series.dataLabels,
                enabled: true,
                format: dataLabelFormat('{point.y:.0f}')
            }
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

VariwidthChart.propTypes = {
    /** Array of points {name, y, z} where z is width */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        y: PropTypes.number.isRequired, // height
        z: PropTypes.number.isRequired, // width
        color: PropTypes.string
    })),
    /** X-axis label */
    xAxisLabel: PropTypes.string,
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number,
    /** Sort categories from most to least by value; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool
};

export default VariwidthChart;
