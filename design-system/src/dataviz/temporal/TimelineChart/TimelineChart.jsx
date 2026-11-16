import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import { valueSpan } from '@/dataviz/chartFormat';
import chartTheme from '@/dataviz/chartTheme';
import { seriesColor } from '@/dataviz/palette';

/**
 * TimelineChart Component
 * Shows events or milestones along a timeline.
 * Great for project milestones, historical events, and progress tracking.
 */
const TimelineChart = ({
    data = [],
    height = 400,
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'timeline',
            height: height,
        },
        title: { text: null },
        xAxis: {
            visible: false,
        },
        yAxis: {
            visible: false,
        },
        series: [
            {
                data: data.map((item, index, all) => ({
                    name: item.name,
                    label: item.label || item.name,
                    description: item.description || '',
                    color: item.color || seriesColor(index, all.length),
                })),
                dataLabels: {
                    allowOverlap: false,
                    format: `${valueSpan('{point.label}')}<br/>{point.description}`,
                },
            },
        ],
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

TimelineChart.propTypes = {
    /** Array of events {name, label, description, color} */
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            label: PropTypes.string,
            description: PropTypes.string,
            color: PropTypes.string,
        }),
    ),
    /** Chart height */
    height: PropTypes.number,
};

export default TimelineChart;
