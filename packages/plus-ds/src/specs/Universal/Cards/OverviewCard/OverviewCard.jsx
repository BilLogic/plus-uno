/**
 * OverviewCard Component
 * 
 * Displays SMART competency metrics with optional Highcharts sparkline.
 * Figma Spec: node-id=83-125838
 */

import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import PropTypes from 'prop-types';
import './OverviewCard.scss';

/**
 * Sparkline chart configuration
 */
const getSparklineConfig = (data, color) => ({
    chart: {
        type: 'area',
        backgroundColor: 'transparent',
        borderWidth: 0,
        margin: [0, 0, 0, 0],
        width: 100,
        height: 60,
        style: { overflow: 'visible' },
        skipClone: true
    },
    title: { text: '' },
    credits: { enabled: false },
    xAxis: {
        labels: { enabled: false },
        title: { text: null },
        startOnTick: false,
        endOnTick: false,
        tickPositions: [],
        lineWidth: 0
    },
    yAxis: {
        endOnTick: false,
        startOnTick: false,
        labels: { enabled: false },
        title: { text: null },
        tickPositions: [],
        gridLineWidth: 0
    },
    legend: { enabled: false },
    tooltip: {
        backgroundColor: '#fff',
        borderWidth: 1,
        shadow: true,
        useHTML: true,
        hideDelay: 0,
        shared: true,
        padding: 8,
        positioner: function (w, h, point) {
            return { x: point.plotX - w / 2, y: point.plotY - h - 10 };
        }
    },
    plotOptions: {
        series: {
            animation: false,
            lineWidth: 2,
            shadow: false,
            states: { hover: { lineWidth: 2 } },
            marker: { radius: 0, states: { hover: { radius: 3 } } },
            fillOpacity: 0.25
        }
    },
    series: [
        {
            data: data,
            color: color || 'currentColor'
        }
    ]
});

/**
 * Map SMART type to chart color
 */
const getTypeColor = (type) => {
    const colorMap = {
        'socio-emotional': '#674a00',
        'mastering-content': '#673a8b',
        'advocacy': '#00572a',
        'relationships': '#940055',
        'technology-tools': '#0b469d'
    };
    return colorMap[type] || '#3f484a';
};

/**
 * OverviewCard Component
 */
const OverviewCard = ({
    type = 'undefined',
    title = 'Student Need',
    icon,
    value,
    trend,
    subtitle,
    data = [],
    chartOptions = {},
    className = '',
    style,
    ...props
}) => {
    const shouldRenderChart = data && data.length > 0;
    const chartConfig = shouldRenderChart ? {
        ...getSparklineConfig(data, getTypeColor(type)),
        ...chartOptions
    } : null;

    return (
        <div
            className={`plus-overview-card plus-overview-card--${type} ${className}`}
            style={style}
            {...props}
        >
            {/* Header: Title + Icon */}
            <div className="plus-overview-card__header">
                <h5 className="plus-overview-card__title">{title}</h5>
                {icon && <div className="plus-overview-card__icon">{icon}</div>}
            </div>

            {/* Body: Value/Trend + Chart */}
            <div className="plus-overview-card__body">
                <div className="plus-overview-card__content">
                    {value && (
                        <span className="plus-overview-card__value">{value}</span>
                    )}
                    {(trend || subtitle) && (
                        <span className="plus-overview-card__trend">
                            {trend || subtitle}
                        </span>
                    )}
                </div>

                {shouldRenderChart && (
                    <div className="plus-overview-card__chart">
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={chartConfig}
                            containerProps={{ style: { height: '60px', width: '100px' } }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

OverviewCard.propTypes = {
    /** SMART competency type - determines background and text color */
    type: PropTypes.oneOf([
        'socio-emotional',
        'mastering-content',
        'advocacy',
        'relationships',
        'technology-tools',
        'undefined'
    ]),
    /** Card title displayed at top */
    title: PropTypes.string,
    /** Icon element to display next to title */
    icon: PropTypes.node,
    /** Large metric value displayed prominently */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Trend indicator text (e.g., "+5% from last week") */
    trend: PropTypes.string,
    /** Subtitle text (alias for trend) */
    subtitle: PropTypes.string,
    /** Data array for sparkline chart */
    data: PropTypes.arrayOf(PropTypes.number),
    /** Override chart options */
    chartOptions: PropTypes.object,
    /** Additional CSS class names */
    className: PropTypes.string,
    /** Inline styles */
    style: PropTypes.object
};

export default OverviewCard;
