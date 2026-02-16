import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * StreamgraphChart Component
 * Shows how composition changes over time with flowing shapes.
 * Great for showing trends and relative proportions.
 */
const StreamgraphChart = ({
    series = [],
    categories = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'streamgraph',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: categories,
            maxPadding: 0,
            type: 'category'
        },
        yAxis: {
            visible: false,
            startOnTick: false,
            endOnTick: false
        },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        plotOptions: {
            series: {
                label: { enabled: false }
            }
        },
        legend: {
            enabled: true
        },
        series: series.map((s, i) => ({
            name: s.name,
            data: s.data,
            color: chartTheme.colors[i % chartTheme.colors.length]
        }))
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

StreamgraphChart.propTypes = {
    /** Array of series {name, data: []} */
    series: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.number).isRequired
    })),
    /** X-axis categories */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Chart height */
    height: PropTypes.number
};

export default StreamgraphChart;
