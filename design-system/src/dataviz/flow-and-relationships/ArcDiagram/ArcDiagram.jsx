import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '@/dataviz/highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '@/dataviz/chartTheme';

/**
 * ArcDiagram Component
 * Shows nodes and links along a single axis.
 * Great for visualizing connections and flows between linear entities.
 */
const ArcDiagram = ({
    data = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'arcdiagram',
            height: height
        },
        title: { text: null },
        series: [{
            keys: ['from', 'to', 'weight'],
            data: data,
            centeredLinks: true,
            colorByPoint: true,
            // Node names only. A link has no name of its own, so its default label is an internal id
            // that lands on top of the nodes; the weight is in the tooltip.
            dataLabels: {
                enabled: true,
                nodeFormat: '{point.name}',
                format: '',
                linkTextPath: { enabled: false },
                style: { textOutline: 'none' }
            }
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

ArcDiagram.propTypes = {
    /** Array of [from, to, weight] arrays */
    data: PropTypes.arrayOf(PropTypes.array),
    /** Chart height */
    height: PropTypes.number
};

export default ArcDiagram;
