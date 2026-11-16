import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { tooltipPointFormat } from '@/dataviz/chartFormat';
import { BRAND, mostToLeast } from '@/dataviz/palette';

/**
 * VennDiagram Component
 * Shows overlapping sets and their relationships.
 */
const VennDiagram = ({
    data = [],
    height = 400,
    sort = true,
}) => {
    const { orderedData, singleSetCount } = useMemo(() => {
        const singles = data.filter((d) => d.sets?.length === 1);
        const overlaps = data.filter((d) => (d.sets?.length ?? 0) !== 1);
        if (!sort) {
            return { orderedData: data, singleSetCount: singles.length };
        }
        return {
            orderedData: [
                ...mostToLeast(singles, (d) => d.value),
                ...mostToLeast(overlaps, (d) => d.value),
            ],
            singleSetCount: singles.length,
        };
    }, [data, sort]);

    const tooltipFormat = {
        ...chartTheme.tooltip,
        headerFormat: '',
        pointFormat: tooltipPointFormat({ label: '{point.name}', value: '{point.value}' }),
    };

    const isSingleSet = singleSetCount === 1;

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'venn',
            height,
        },
        title: { text: null },
        tooltip: tooltipFormat,
        plotOptions: {
            venn: {
                colorByPoint: !isSingleSet,
                dataLabels: {
                    ...chartTheme.plotOptions.series.dataLabels,
                },
                tooltip: tooltipFormat,
            },
        },
        series: [
            {
                name: 'Groups',
                ...(isSingleSet && { color: BRAND }),
                data: orderedData,
            },
        ],
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

VennDiagram.propTypes = {
    /** Array of { sets: ['A', 'B'], value: number, name?: string } */
    data: PropTypes.arrayOf(
        PropTypes.shape({
            sets: PropTypes.arrayOf(PropTypes.string).isRequired,
            value: PropTypes.number.isRequired,
            name: PropTypes.string,
        }),
    ),
    /** Chart height */
    height: PropTypes.number,
    /** Sort single-set circles and overlaps from most to least; pass false to keep input order. */
    sort: PropTypes.bool,
};

export default VennDiagram;
