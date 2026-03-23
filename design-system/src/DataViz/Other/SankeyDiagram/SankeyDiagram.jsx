import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * SankeyDiagram Component
 * Displays flow and relationships between entities.
 * Width of links represents flow volume.
 */
const SankeyDiagram = ({
    data = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        tooltip: {
            ...chartTheme.tooltip,
            nodeFormat: '{point.name}: <b>{point.sum}</b>',
            pointFormat: '{point.fromNode.name} → {point.toNode.name}: <b>{point.weight}</b>'
        },
        series: [{
            type: 'sankey',
            keys: ['from', 'to', 'weight'],
            data: data,
            nodes: undefined // Let Highcharts auto-generate nodes from data
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

SankeyDiagram.propTypes = {
    /** Array of flow data [from, to, weight] */
    data: PropTypes.arrayOf(PropTypes.array),
    /** Chart height in pixels */
    height: PropTypes.number
};

export default SankeyDiagram;
