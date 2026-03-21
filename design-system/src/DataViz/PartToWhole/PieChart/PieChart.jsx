import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * PieChart Component
 * Classic pie chart for part-to-whole visualization.
 */
const PieChart = ({
    data = [],
    height = 400,
    showLegend = true
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'pie',
            height: height
        },
        title: { text: null },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                    style: chartTheme.tooltip.style
                },
                showInLegend: showLegend
            }
        },
        series: [{
            name: 'Share',
            colorByPoint: true,
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

PieChart.propTypes = {
    /** Array of { name, y } objects */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        y: PropTypes.number.isRequired,
        color: PropTypes.string
    })),
    /** Chart height */
    height: PropTypes.number,
    /** Show legend */
    showLegend: PropTypes.bool
};

export default PieChart;
