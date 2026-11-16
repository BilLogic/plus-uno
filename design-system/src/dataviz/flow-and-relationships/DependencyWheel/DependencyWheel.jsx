import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_SPACING_COMPACT } from '@/dataviz/chartTheme';
import { dataLabelFormat } from '@/dataviz/chartFormat';

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
            type: 'dependencywheel',
            height: height
        },
        title: { text: null },
        series: [{
            type: 'dependencywheel',
            keys: ['from', 'to', 'weight'],
            colorByPoint: true,
            data: data,
            dataLabels: {
                textPath: {
                    enabled: true,
                    attributes: { dy: 5 }
                },
                distance: CHART_SPACING_COMPACT
            }
        }],
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            nodeFormat: dataLabelFormat('{point.sum}', '{point.name}'),
            pointFormat: dataLabelFormat('{point.weight}', '{point.fromNode.name} → {point.toNode.name}')
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
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
