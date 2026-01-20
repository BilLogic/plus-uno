import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * TreemapChart Component
 * Displays hierarchical data as nested rectangles.
 * Size represents value, color can represent categories or a metric.
 */
const TreemapChart = ({
    data = [],
    height = 400,
    colorByPoint = true
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        colorAxis: colorByPoint ? undefined : {
            minColor: chartTheme.colors[0],
            maxColor: chartTheme.colors[1]
        },
        series: [{
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            data: data.map((item, i) => ({
                ...item,
                color: item.color || chartTheme.colors[i % chartTheme.colors.length]
            })),
            dataLabels: {
                enabled: true,
                style: {
                    ...chartTheme.tooltip.style,
                    textOutline: 'none'
                }
            }
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

TreemapChart.propTypes = {
    /** Array of data objects { name, value, color? } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        color: PropTypes.string
    })),
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Whether each point has a unique color */
    colorByPoint: PropTypes.bool
};

export default TreemapChart;
