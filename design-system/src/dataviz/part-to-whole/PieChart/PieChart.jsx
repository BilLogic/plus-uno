import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { dataLabelFormat, tooltipPointFormat } from '@/dataviz/chartFormat';
import { CATEGORICAL, mostToLeast } from '@/dataviz/palette';

/**
 * PieChart Component
 * Classic pie chart for part-to-whole visualization.
 */
const PieChart = ({
    data = [],
    height = 400,
    showLegend = true,
    sort = true,
}) => {
    const orderedData = useMemo(
        () => (sort ? mostToLeast(data, (item) => item.y) : data),
        [data, sort],
    );

    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'pie',
            height,
        },
        title: { text: null },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: tooltipPointFormat({ value: '{point.percentage:.1f}%' }),
        },
        plotOptions: {
            ...chartTheme.plotOptions,
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                borderRadius: 0,
                dataLabels: {
                    enabled: true,
                    format: dataLabelFormat('{point.percentage:.1f}%', '{point.name}'),
                },
                showInLegend: showLegend,
            },
        },
        series: [{
            name: 'Share',
            colorByPoint: true,
            data: orderedData.map((item, index) => ({
                ...item,
                color: item.color || CATEGORICAL[index % CATEGORICAL.length],
            })),
        }],
    }), [orderedData, height, showLegend]);

    return (
        <div style={{ width: '100%', height }}>
            <PlusChart options={options} />
        </div>
    );
};

PieChart.propTypes = {
    /** Array of { name, y, color? } objects */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        y: PropTypes.number.isRequired,
        color: PropTypes.string,
    })),
    /** Chart height */
    height: PropTypes.number,
    /** Show legend */
    showLegend: PropTypes.bool,
    /** Sort slices from most to least by default; pass false to keep input order. */
    sort: PropTypes.bool,
};

export default PieChart;
