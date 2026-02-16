import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * DependencyWheel Component
 * Circular diagram showing dependencies between items.
 */
const DependencyWheel = ({
    data = [],
    height = 500
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        series: [{
            type: 'dependencywheel',
            keys: ['from', 'to', 'weight'],
            data: data,
            dataLabels: {
                color: 'var(--color-on-surface)',
                style: chartTheme.tooltip.style,
                textPath: {
                    enabled: true,
                    attributes: { dy: 5 }
                },
                distance: 10
            }
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

DependencyWheel.propTypes = {
    /** Array of [from, to, weight] */
    data: PropTypes.arrayOf(PropTypes.array),
    /** Chart height */
    height: PropTypes.number
};

export default DependencyWheel;
