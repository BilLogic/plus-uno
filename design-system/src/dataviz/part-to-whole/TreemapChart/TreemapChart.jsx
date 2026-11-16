import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { tooltipPointFormat } from '@/dataviz/chartFormat';
import { CATEGORICAL, HUES, mostToLeast, rampStops, sequentialRamp } from '@/dataviz/palette';
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
    hue = 'blue',
    sort = true,
}) => {
    const modeKey = useColorModeKey();

    const orderedData = useMemo(
        () => (sort ? mostToLeast(data, (item) => item.value ?? 0) : data),
        [data, sort],
    );

    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height,
        },
        title: { text: null },
        colorAxis: colorByPoint ? undefined : {
            startOnTick: false,
            endOnTick: false,
            stops: rampStops(sequentialRamp(hue), resolveColor),
        },
        series: [{
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            data: orderedData.map((item, index) => ({
                ...item,
                ...(colorByPoint
                    ? { color: item.color || CATEGORICAL[index % CATEGORICAL.length] }
                    : { colorValue: item.value }),
            })),
            dataLabels: {
                enabled: true,
            },
        }],
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: tooltipPointFormat({ label: '{point.name}', value: '{point.value}' }),
        },
    }), [orderedData, height, colorByPoint, hue, modeKey]);

    return (
        <div style={{ width: '100%', height }}>
            <PlusChart options={options} />
        </div>
    );
};

TreemapChart.propTypes = {
    /** Array of data objects { name, value, color? } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        color: PropTypes.string,
    })),
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Whether each point has a unique color; otherwise color encodes the value */
    colorByPoint: PropTypes.bool,
    /** The sequential ramp's hue when `colorByPoint` is false */
    hue: PropTypes.oneOf(HUES),
    /** Sort tiles from most to least by default; pass false to keep input order. */
    sort: PropTypes.bool,
};

export default TreemapChart;
