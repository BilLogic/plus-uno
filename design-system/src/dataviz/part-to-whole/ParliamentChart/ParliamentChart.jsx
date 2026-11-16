import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { tooltipPointFormat, valueSpan } from '@/dataviz/chartFormat';
import { CATEGORICAL, mostToLeast } from '@/dataviz/palette';

/**
 * ParliamentChart Component
 * Shows proportions using a parliament seating layout (Item Chart).
 */
const ParliamentChart = ({
    data = [],
    height = 400,
    sort = true,
}) => {
    const orderedData = useMemo(
        () => (sort ? mostToLeast(data, (item) => item.value) : data),
        [data, sort],
    );

    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'item',
            height,
        },
        title: { text: null },
        legend: {
            ...chartTheme.legend,
            enabled: true,
            labelFormat: `{name} ${valueSpan('{y}')}`,
        },
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: tooltipPointFormat({ label: '{point.name}', value: '{point.y}' }),
        },
        series: [{
            name: 'Representatives',
            keys: ['name', 'y', 'color', 'label'],
            data: orderedData.map((item, index) => ([
                item.name,
                item.value,
                item.color || CATEGORICAL[index % CATEGORICAL.length],
                item.name,
            ])),
            dataLabels: {
                enabled: true,
                format: '{point.label}',
            },
            center: ['50%', '88%'],
            size: '170%',
            startAngle: -100,
            endAngle: 100,
        }],
    }), [orderedData, height]);

    return (
        <div style={{ width: '100%', height }}>
            <PlusChart options={options} />
        </div>
    );
};

ParliamentChart.propTypes = {
    /** Array of items { name, value, color } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        color: PropTypes.string,
    })),
    /** Chart height */
    height: PropTypes.number,
    /** Sort groups from most to least by default; pass false to keep input order. */
    sort: PropTypes.bool,
};

export default ParliamentChart;
