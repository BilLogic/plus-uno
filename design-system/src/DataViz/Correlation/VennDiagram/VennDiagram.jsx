import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * VennDiagram Component
 * Shows overlapping sets and their relationships.
 * Great for showing commonalities and differences between groups.
 */
const VennDiagram = ({
    data = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'venn',
            height: height
        },
        title: { text: null },
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: ''
        },
        series: [{
            name: 'Groups',
            data: data
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
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
