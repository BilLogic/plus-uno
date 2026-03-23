import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * TimelineChart Component
 * Shows events or milestones along a timeline.
 * Great for project milestones, historical events, and progress tracking.
 */
const TimelineChart = ({
    data = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'timeline',
            height: height
        },
        title: { text: null },
        xAxis: {
            visible: false
        },
        yAxis: {
            visible: false
        },
        tooltip: {
            ...chartTheme.tooltip,
            style: { width: 300 }
        },
        series: [{
            data: data.map((item, index) => ({
                name: item.name,
                label: item.label || item.name,
                description: item.description || '',
                color: chartTheme.colors[index % chartTheme.colors.length]
            })),
            dataLabels: {
                allowOverlap: false,
                format: '<span style="font-weight: bold;">{point.label}</span><br/>{point.description}'
            }
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

TimelineChart.propTypes = {
    /** Array of events {name, label, description} */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string,
        description: PropTypes.string
    })),
    /** Chart height */
    height: PropTypes.number
};

export default TimelineChart;
