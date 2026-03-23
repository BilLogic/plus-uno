import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * PyramidChart Component
 * Shows hierarchical quantities from largest to smallest.
 * Great for population pyramids, sales funnels, and hierarchical data.
 */
const PyramidChart = ({
    data = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'pyramid',
            height: height
        },
        title: { text: null },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b> ({point.y:,.0f})',
                    softConnector: true,
                    style: {
                        ...chartTheme.title?.style,
                        fontWeight: 'normal'
                    }
                },
                center: ['50%', '50%'],
                width: '80%'
            }
        },
        legend: { enabled: false },
        series: [{
            name: 'Value',
            data: data.map(item => ({
                name: item.name,
                y: item.value
            }))
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

PyramidChart.propTypes = {
    /** Array of objects with { name, value } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired
    })),
    /** Chart height */
    height: PropTypes.number
};

export default PyramidChart;
