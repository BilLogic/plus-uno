import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { tooltipHeaderFormat, tooltipPointFormat } from '@/dataviz/chartFormat';
import { mostToLeast, seriesColor } from '@/dataviz/palette';
import { inkFor, resolveColor, textInks, useColorModeKey } from '@/dataviz/colorMode';

/**
 * PackedBubbleChart Component
 * Shows grouped bubbles representing categories and their values.
 * Great for grouped comparisons and hierarchical data visualization.
 */
const PackedBubbleChart = ({
    data = [],
    height = 500,
    splitSeries = true,
    sort = true
}) => {
    // A label sits on its bubble, so it takes whichever text ink reads on that fill; the key re-renders on a color-mode change.
    useColorModeKey();
    const inks = textInks();

    const orderedSeries = useMemo(() => {
        const groups = sort
            ? mostToLeast(data, (group) =>
                  (group.data ?? []).reduce((sum, item) => sum + (item.value ?? item.y ?? 0), 0),
              ).map((group) => ({
                  ...group,
                  data: Array.isArray(group.data)
                      ? mostToLeast(group.data, (item) => item.value ?? item.y ?? 0)
                      : group.data,
              }))
            : data;
        return groups.map((s, i, all) => ({
            ...s,
            color: s.color || seriesColor(i, all.length),
        }));
    }, [data, sort]);

    const tooltipFormat = {
        ...chartTheme.tooltip,
        headerFormat: tooltipHeaderFormat('{series.name}'),
        pointFormat: tooltipPointFormat({ label: '{point.name}', value: '{point.value}' })
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'packedbubble',
            height: height
        },
        title: { text: null },
        tooltip: tooltipFormat,
        plotOptions: {
            packedbubble: {
                minSize: '30%',
                maxSize: '120%',
                zMin: 0,
                zMax: 1000,
                layoutAlgorithm: {
                    splitSeries: splitSeries,
                    gravitationalConstant: 0.02
                },
                tooltip: tooltipFormat,
                dataLabels: {
                    ...chartTheme.plotOptions.packedbubble.dataLabels,
                    enabled: true,
                    filter: {
                        property: 'y',
                        operator: '>',
                        value: 50
                    },
                    formatter: function () {
                        return `<span style="color: ${inkFor(resolveColor(this.point.color), inks)}">${this.point.name}</span>`;
                    }
                }
            }
        },
        series: orderedSeries
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

PackedBubbleChart.propTypes = {
    /** Array of series with name and data [{name, data: [{name, value}]}] */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        color: PropTypes.string,
        data: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            value: PropTypes.number
        }))
    })),
    /** Chart height */
    height: PropTypes.number,
    /** Split series into separate clusters */
    splitSeries: PropTypes.bool,
    /** Sort groups by total value and bubbles by value; pass false to keep input order. */
    sort: PropTypes.bool
};

export default PackedBubbleChart;
