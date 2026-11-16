import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { tooltipPointFormat } from '@/dataviz/chartFormat';
import { BRAND } from '@/dataviz/palette';

/**
 * VennDiagram Component
 * Shows overlapping sets and their relationships.
 * Great for showing commonalities and differences between groups.
 */
const VennDiagram = ({
    data = [],
    height = 400
}) => {
    const isSingleSet = data.filter((d) => d.sets?.length === 1).length === 1;

    const tooltipFormat = {
        ...chartTheme.tooltip,
        headerFormat: '',
        pointFormat: tooltipPointFormat({ label: '{point.name}', value: '{point.value}' })
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'venn',
            height: height
        },
        title: { text: null },
        tooltip: tooltipFormat,
        plotOptions: {
            venn: {
                colorByPoint: !isSingleSet,
                dataLabels: {
                    ...chartTheme.plotOptions.series.dataLabels
                },
                tooltip: tooltipFormat
            }
        },
        series: [{
            name: 'Groups',
            ...(isSingleSet && { color: BRAND }),
            data: data
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

VennDiagram.propTypes = {
    /** Array of sets {sets: [], value, name} */
    data: PropTypes.arrayOf(PropTypes.shape({
        sets: PropTypes.arrayOf(PropTypes.string).isRequired,
        value: PropTypes.number.isRequired,
        name: PropTypes.string
    })),
    /** Chart height */
    height: PropTypes.number
};

export default VennDiagram;
