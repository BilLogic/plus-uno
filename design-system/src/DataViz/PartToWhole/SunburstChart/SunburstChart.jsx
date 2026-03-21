import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * SunburstChart Component
 * Displays hierarchical data as concentric rings.
 * Great for showing nested categories.
 */
const SunburstChart = ({
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
        series: [{
            type: 'sunburst',
            data: data,
            allowTraversingTree: true,
            cursor: 'pointer',
            dataLabels: {
                format: '{point.name}',
                style: chartTheme.tooltip.style
            },
            levels: [{
                level: 1,
                levelSize: { unit: 'percentage', value: 33 },
                dataLabels: { enabled: true }
            }, {
                level: 2,
                levelSize: { unit: 'percentage', value: 33 }
            }, {
                level: 3,
                levelSize: { unit: 'percentage', value: 34 }
            }]
        }],
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: '<b>{point.name}</b>: {point.value}'
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

SunburstChart.propTypes = {
    /** Hierarchical data array { id, parent, name, value } */
    data: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        parent: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.number
    })),
    /** Chart height in pixels */
    height: PropTypes.number
};

export default SunburstChart;
