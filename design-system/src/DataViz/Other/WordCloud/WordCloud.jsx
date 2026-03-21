import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * WordCloud Component
 * Displays word frequency as sized text.
 */
const WordCloud = ({
    data = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        series: [{
            type: 'wordcloud',
            data: data,
            name: 'Occurrences'
        }],
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: '<b>{point.name}</b>: {point.weight}'
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
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
    height: PropTypes.number
};

export default WordCloud;
