import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '@/dataviz/highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '@/dataviz/chartTheme';
import { CATEGORICAL, HUES, rampStops, sequentialRamp } from '@/dataviz/palette';
import { resolveColor, useColorModeKey } from '@/dataviz/colorMode';

/**
 * TreemapChart Component
 * Displays hierarchical data as nested rectangles.
 * Size represents value, color can represent categories or a metric.
 *
 * With `colorByPoint`, each rectangle is a categorical series in order. Without
 * it, color encodes the value on one hue's sequential ramp, the strongest tone
 * on the biggest rectangle; the ramp is resolved per color mode, because a
 * color axis interpolates.
 */
const TreemapChart = ({
    data = [],
    height = 400,
    colorByPoint = true,
    /** The ramp's hue when color encodes the value */
    hue = 'blue'
}) => {
    useColorModeKey();
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        colorAxis: colorByPoint ? undefined : {
            startOnTick: false,
            endOnTick: false,
            stops: rampStops(sequentialRamp(hue), resolveColor)
        },
        series: [{
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            data: data.map((item, i) => ({
                ...item,
                ...(colorByPoint
                    ? { color: item.color || CATEGORICAL[i % CATEGORICAL.length] }
                    : { colorValue: item.value })
            })),
            dataLabels: {
                enabled: true,
                style: {
                    ...chartTheme.tooltip.style,
                    textOutline: 'none'
                }
            }
        }],
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: '<b>{point.name}</b>: {point.value}'
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

TreemapChart.propTypes = {
    /** Array of data objects { name, value, color? } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        color: PropTypes.string
    })),
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Whether each point has a unique color; otherwise color encodes the value */
    colorByPoint: PropTypes.bool,
    /** The sequential ramp's hue when `colorByPoint` is false */
    hue: PropTypes.oneOf(HUES)
};

export default TreemapChart;
