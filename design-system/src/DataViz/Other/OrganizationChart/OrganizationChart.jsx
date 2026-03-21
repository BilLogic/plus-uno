import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * OrganizationChart Component
 * Shows hierarchical organizational structure.
 * Great for team structures, reporting lines, and hierarchies.
 */
const OrganizationChart = ({
    data = [],
    height = 500
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'organization',
            height: height,
            inverted: true
        },
        title: { text: null },
        series: [{
            name: 'Organization',
            keys: ['from', 'to'],
            data: data,
            levels: [{
                level: 0,
                color: chartTheme.colors[0],
                dataLabels: { color: 'white' }
            }, {
                level: 1,
                color: chartTheme.colors[1]
            }, {
                level: 2,
                color: chartTheme.colors[2]
            }],
            nodes: data.flatMap(d => [d[0], d[1]]).filter((v, i, a) => a.indexOf(v) === i).map(name => ({
                id: name,
                name: name
            })),
            colorByPoint: false,
            borderColor: chartTheme.colors[0]
        }],
        tooltip: {
            ...chartTheme.tooltip,
            outside: true
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

OrganizationChart.propTypes = {
    /** Array of [from, to] relationship pairs */
    data: PropTypes.arrayOf(PropTypes.array),
    /** Chart height */
    height: PropTypes.number
};

export default OrganizationChart;
