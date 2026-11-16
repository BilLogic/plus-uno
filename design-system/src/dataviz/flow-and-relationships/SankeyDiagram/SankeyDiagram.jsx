import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { dataLabelFormat } from '@/dataviz/chartFormat';

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
            type: 'sankey',
            height: height
        },
        title: { text: null },
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            nodeFormat: dataLabelFormat('{point.sum}', '{point.name}'),
            pointFormat: dataLabelFormat('{point.weight}', '{point.fromNode.name} → {point.toNode.name}')
        },
        series: [{
            type: 'sankey',
            keys: ['from', 'to', 'weight'],
            colorByPoint: true,
            data: data,
            nodes: undefined // Let Highcharts auto-generate nodes from data
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
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
