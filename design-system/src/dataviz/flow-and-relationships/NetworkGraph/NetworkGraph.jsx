import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { BRAND, CHROME } from '@/dataviz/palette';

/**
 * NetworkGraph Component
 * Force-directed graph showing relationships between nodes.
 * Great for showing connections and dependencies.
 */
const NetworkGraph = ({
    data = [],
    nodes = [],
    height = 500
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'networkgraph',
            height: height
        },
        title: { text: null },
        plotOptions: {
            networkgraph: {
                keys: ['from', 'to'],
                // A link is a connector, drawn in the bold border like other chart chrome.
                link: { color: CHROME.link },
                layoutAlgorithm: {
                    enableSimulation: true,
                    linkLength: 100
                }
            }
        },
        series: [{
            color: BRAND,
            dataLabels: {
                enabled: true,
                linkFormat: ''
            },
            data: data,
            nodes: nodes.length > 0 ? nodes : undefined
        }],
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: '{point.name}'
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

NetworkGraph.propTypes = {
    /** Array of connections [from, to] */
    data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    /** Optional node definitions { id, color, marker } */
    nodes: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        color: PropTypes.string
    })),
    /** Chart height */
    height: PropTypes.number
};

export default NetworkGraph;
