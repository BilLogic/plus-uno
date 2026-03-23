import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * PackedBubbleChart Component
 * Shows grouped bubbles representing categories and their values.
 * Great for grouped comparisons and hierarchical data visualization.
 */
const PackedBubbleChart = ({
    data = [],
    height = 500,
    splitSeries = true
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'packedbubble',
            height: height
        },
        title: { text: null },
        tooltip: {
            ...chartTheme.tooltip,
            useHTML: true,
            pointFormat: '<b>{point.name}:</b> {point.value}'
        },
        plotOptions: {
            packedbubble: {
                minSize: '30%',
                maxSize: '80%',
                zMin: 0,
                zMax: 1000,
                layoutAlgorithm: {
                    splitSeries: splitSeries,
                    gravitationalConstant: 0.02
                },
                dataLabels: {
                    enabled: true,
                    format: '{point.name}',
                    filter: {
                        property: 'y',
                        operator: '>',
                        value: 50
                    },
                    style: {
                        color: 'black',
                        textOutline: 'none',
                        fontWeight: 'normal'
                    }
                }
            }
        },
        series: data
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

PackedBubbleChart.propTypes = {
    /** Array of series with name and data [{name, data: [{name, value}]}] */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        data: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            value: PropTypes.number
        }))
    })),
    /** Chart height */
    height: PropTypes.number,
    /** Split series into separate clusters */
    splitSeries: PropTypes.bool
};

export default PackedBubbleChart;
