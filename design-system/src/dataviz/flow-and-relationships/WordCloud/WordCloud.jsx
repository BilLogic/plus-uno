import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { dataLabelFormat } from '@/dataviz/chartFormat';
import { BRAND, mostToLeast } from '@/dataviz/palette';

/**
 * WordCloud Component
 * Displays word frequency as sized text.
 */
const WordCloud = ({
    data = [],
    height = 400,
    sort = true
}) => {
    const orderedData = useMemo(
        () => (sort ? mostToLeast(data, (item) => item.weight) : data),
        [data, sort],
    );

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'wordcloud',
            height: height
        },
        title: { text: null },
        series: [{
            type: 'wordcloud',
            color: BRAND,
            colorByPoint: false,
            data: orderedData,
            name: 'Occurrences'
        }],
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: dataLabelFormat('{point.weight}', '{point.name}')
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

WordCloud.propTypes = {
    /** Array of { name, weight } objects */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        weight: PropTypes.number.isRequired
    })),
    /** Chart height */
    height: PropTypes.number,
    /** Sort words from most to least by weight by default; pass false to preserve input order. */
    sort: PropTypes.bool
};

export default WordCloud;
