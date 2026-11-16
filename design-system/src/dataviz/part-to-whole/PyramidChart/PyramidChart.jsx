import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { dataLabelFormat, tooltipPointFormat } from '@/dataviz/chartFormat';
import { CATEGORICAL, mostToLeast } from '@/dataviz/palette';

/**
 * PyramidChart Component
 * Shows hierarchical quantities from largest at the base to smallest at the top.
 */
const PyramidChart = ({
    data = [],
    height = 400,
    sort = false,
}) => {
    const orderedData = useMemo(
        () => (sort ? mostToLeast(data, (item) => item.value) : data),
        [data, sort],
    );

    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'pyramid',
            height,
        },
        title: { text: null },
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: tooltipPointFormat({ label: '{point.name}', value: '{point.y:,.0f}' }),
        },
        plotOptions: {
            ...chartTheme.plotOptions,
            pyramid: {
                center: ['50%', '50%'],
                width: '80%',
                dataLabels: {
                    enabled: true,
                    format: dataLabelFormat('{point.y:,.0f}', '{point.name}'),
                    softConnector: true,
                },
            },
        },
        legend: { enabled: false },
        series: [{
            name: 'Value',
            data: orderedData.map((item, index) => ({
                name: item.name,
                y: item.value,
                color: item.color || CATEGORICAL[index % CATEGORICAL.length],
            })),
        }],
    }), [orderedData, height]);

    return (
        <div style={{ width: '100%', height }}>
            <PlusChart options={options} />
        </div>
    );
};

PyramidChart.propTypes = {
    /** Array of objects with { name, value, color? } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        color: PropTypes.string,
    })),
    /** Chart height */
    height: PropTypes.number,
    /** Keep input stage order by default; pass true to sort bands from most to least. */
    sort: PropTypes.bool,
};

export default PyramidChart;
