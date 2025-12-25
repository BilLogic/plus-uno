import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

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
                layoutAlgorithm: {
                    enableSimulation: true,
                    linkLength: 100
                }
            }
        },
        series: [{
            dataLabels: {
                enabled: true,
                linkFormat: '',
                style: chartTheme.tooltip.style
            },
            data: data,
            nodes: nodes.length > 0 ? nodes : undefined
        }],
        tooltip: {
            ...chartTheme.tooltip
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
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
