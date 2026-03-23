import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * FunnelChart Component
 * Displays stages in a process, typically showing conversion rates.
 */
const FunnelChart = ({
    data = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'funnel',
            height: height
        },
        title: { text: null },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b> ({point.y:,.0f})',
                    softConnector: true,
                    style: chartTheme.tooltip.style
                },
                center: ['40%', '50%'],
                neckWidth: '30%',
                neckHeight: '25%',
                width: '80%'
            }
        },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: '{point.name}: <b>{point.y:,.0f}</b>'
        },
        series: [{
            name: 'Funnel',
            data: data.map((item, i) => ({
                ...item,
                color: item.color || chartTheme.colors[i % chartTheme.colors.length]
            }))
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

FunnelChart.propTypes = {
    /** Array of stage objects { name, y } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        y: PropTypes.number.isRequired,
        color: PropTypes.string
    })),
    /** Chart height in pixels */
    height: PropTypes.number
};

export default FunnelChart;
