import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_NODE_HEIGHT, CHART_NODE_RADIUS } from '@/dataviz/chartTheme';
import { CHROME } from '@/dataviz/palette';

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
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: '{point.name}'
        },
        series: [{
            type: 'treegraph',
            link: { color: CHROME.link },
            data: data.map(item => ({
                id: item.id,
                parent: item.parent,
                name: item.name
            })),
            marker: {
                symbol: 'rect',
                width: '25%',
                // Node height from `--size-200` (32px); corner radius from `--radius-lg` (8px).
                height: CHART_NODE_HEIGHT
            },
            borderRadius: CHART_NODE_RADIUS,
            dataLabels: {
                enabled: true
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
            <PlusChart options={options} />
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
