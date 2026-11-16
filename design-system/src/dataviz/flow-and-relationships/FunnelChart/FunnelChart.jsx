import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { dataLabelFormat } from '@/dataviz/chartFormat';
import { BRAND, mostToLeast } from '@/dataviz/palette';

/**
 * FunnelChart Component
 * Displays stages in a process, typically showing conversion rates.
 */
const FunnelChart = ({
    data = [],
    height = 400,
    sort = false
}) => {
    const orderedData = useMemo(
        () => (sort ? mostToLeast(data) : data),
        [data, sort],
    );

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'funnel',
            height: height
        },
        title: { text: null },
        plotOptions: {
            funnel: {
                dataLabels: {
                    ...chartTheme.plotOptions.series.dataLabels,
                    enabled: true,
                    format: dataLabelFormat('{point.y:,.0f}', '{point.name}'),
                    softConnector: true
                },
                center: ['40%', '50%'],
                neckWidth: '30%',
                neckHeight: '25%',
                width: '80%'
            }
        },
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: dataLabelFormat('{point.y:,.0f}', '{point.name}')
        },
        series: [{
            name: 'Funnel',
            color: BRAND,
            colorByPoint: false,
            data: orderedData.map((item) => ({ ...item }))
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
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
    height: PropTypes.number,
    /** Keep sequential stage order by default (`false`); pass `true` to sort stages from most to least. */
    sort: PropTypes.bool
};

export default FunnelChart;
