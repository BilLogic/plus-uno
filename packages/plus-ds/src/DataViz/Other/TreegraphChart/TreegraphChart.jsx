import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * TreegraphChart Component
 * Shows hierarchical data structures.
 * Great for family trees, decision trees, and organizational structures.
 */
const TreegraphChart = ({
    data = [],
    height = 500
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'treegraph',
            height: height
        },
        title: { text: null },
        series: [{
            type: 'treegraph',
            data: data.map(item => ({
                id: item.id,
                parent: item.parent,
                name: item.name
            })),
            tooltip: {
                pointFormat: '{point.name}'
            },
            marker: {
                symbol: 'rect',
                width: '25%',
                height: 30
            },
            borderRadius: 10,
            dataLabels: {
                enabled: true,
                style: {
                    color: '#000000',
                    textOutline: 'none'
                }
            },
            levels: [{
                level: 0,
                color: chartTheme.colors[0]
            }, {
                level: 1,
                color: chartTheme.colors[1]
            }, {
                level: 2,
                color: chartTheme.colors[2]
            }]
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

TreegraphChart.propTypes = {
    /** Array of nodes {id, parent, name} */
    data: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        parent: PropTypes.string,
        name: PropTypes.string
    })),
    /** Chart height */
    height: PropTypes.number
};

export default TreegraphChart;
