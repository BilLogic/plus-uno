import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * ParliamentChart Component
 * Shows proportions using a parliament seating layout (Item Chart).
 * Great for showing seat distribution, voting results, or grouped counts.
 */
const ParliamentChart = ({
    data = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'item',
            height: height
        },
        title: { text: null },
        legend: {
            enabled: true,
            labelFormat: '{name} <span style="opacity: 0.4">{y}</span>'
        },
        series: [{
            name: 'Representatives',
            keys: ['name', 'y', 'color', 'label'],
            data: data.map((item, index) => ([
                item.name,
                item.value,
                item.color || chartTheme.colors[index % chartTheme.colors.length],
                item.name
            ])),
            dataLabels: {
                enabled: true,
                format: '{point.label}',
                style: {
                    textOutline: '3px contrast'
                }
            },
            center: ['50%', '88%'],
            size: '170%',
            startAngle: -100,
            endAngle: 100
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

ParliamentChart.propTypes = {
    /** Array of items {name, value, color} */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        color: PropTypes.string
    })),
    /** Chart height */
    height: PropTypes.number
};

export default ParliamentChart;
