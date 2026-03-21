import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * GaugeChart Component
 * Displays a single value on a dial/gauge.
 * Useful for KPIs and progress indicators.
 */

const GaugeChart = ({
    value = 0,
    min = 0,
    max = 100,
    label = '',
    height = 300,
    color
}) => {
    const options = {
        chart: {
            type: 'solidgauge',
            height: height,
            backgroundColor: 'transparent'
        },
        title: { text: null },
        pane: {
            center: ['50%', '78%'],
            size: '120%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: 'var(--color-surface-container-high)',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        yAxis: {
            min: min,
            max: max,
            stops: [
                [0.1, color || chartTheme.colors[0]],
                [0.5, color || chartTheme.colors[0]],
                [0.9, color || chartTheme.colors[0]]
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            labels: {
                y: 16,
                style: chartTheme.yAxis.labels.style
            }
        },
        plotOptions: {
            solidgauge: {
                animation: {
                    duration: 1200
                },
                dataLabels: {
                    y: 5,
                    borderWidth: 0,
                    useHTML: true,
                    format: `<div style="text-align:center">
                        <span style="font-size:24px;font-weight:bold;color:var(--color-on-surface)">{y}</span>
                        <br/>
                        <span style="font-size:12px;color:var(--color-on-surface-variant)">${label}</span>
                    </div>`
                }
            }
        },
        credits: { enabled: false },
        series: [{
            name: label,
            data: [value],
            innerRadius: '60%',
            radius: '100%'
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

GaugeChart.propTypes = {
    /** Current value to display */
    value: PropTypes.number,
    /** Minimum scale value */
    min: PropTypes.number,
    /** Maximum scale value */
    max: PropTypes.number,
    /** Label text below the value */
    label: PropTypes.string,
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Gauge color */
    color: PropTypes.string
};

export default GaugeChart;
