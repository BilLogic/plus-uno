import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import { RadarChart } from '@/DataViz';
import './DataVisualization.scss';

/**
 * DataVisualizationTrainingProgress component for Home page
 * Displays training progress with radar chart showing completion percentages
 * Alternative visualization for training progress data
 */
const DataVisualizationTrainingProgress = ({
    id,
    title = 'Training Progress',
    tooltip,
    trainingProgressData,
    className = '',
    style
}) => {
    // Default training progress data if not provided
    const categories = trainingProgressData?.categories || [
        'Social Emotional Learning',
        'Mastering Content',
        'Advocacy',
        'Relationships',
        'Technology Tools'
    ];

    const completionPercentages = trainingProgressData?.completionPercentages || [25, 50, 80, 55, 90];

    // Category colors using design system tokens
    const categoryColors = {
        'Social Emotional Learning': 'var(--color-social-emotional, #8c6600)',
        'Mastering Content': 'var(--color-mastering-content, #8659a9)',
        'Advocacy': 'var(--color-advocacy, #167745)',
        'Relationships': 'var(--color-relationship, #c70b77)',
        'Technology Tools': 'var(--color-technology-tools, #005cbd)'
    };

    const radarSeries = [
        { 
            name: 'Your completion percentages', 
            data: completionPercentages,
            color: '#61b5cf' // light blue/teal
        }
    ];

    return (
        <Card
            id={id}
            className={`plus-data-viz-card plus-data-viz-training-progress ${className}`}
            style={style}
            paddingSize="sm"
            gapSize="lg"
            radiusSize="sm"
            borderSize="sm"
            showBorder={true}
        >
            {/* Header with title and info icon */}
            <div className="plus-data-viz-header">
                <h4 className="h4 plus-data-viz-title">{title}</h4>
                {tooltip && (
                    <button
                        className="plus-data-viz-info-btn"
                        aria-label="Info"
                        title={tooltip}
                        type="button"
                    >
                        <i className="fas fa-circle-info" aria-hidden="true"></i>
                    </button>
                )}
            </div>

            <div className="plus-data-viz-content">
                <div className="plus-data-viz-overview">
                    <div className="plus-data-viz-radar-container">
                        <RadarChart
                            categories={categories}
                            series={radarSeries}
                            height={290}
                            yAxisMax={100}
                            filled={true}
                            showLegend={false}
                            categoryColors={categoryColors}
                            showDataLabels={true}
                            chartSpacing={[0, 0, 0, 0]} // Remove chart internal spacing to match Figma
                        />
                    </div>
                    <div className="plus-data-viz-legend">
                        <div className="plus-data-viz-legend-item">
                            <div className="plus-data-viz-legend-color" style={{ backgroundColor: '#61b5cf' }}></div>
                            <span className="body3-txt">Your completion percentages</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

DataVisualizationTrainingProgress.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    tooltip: PropTypes.string,
    trainingProgressData: PropTypes.shape({
        categories: PropTypes.arrayOf(PropTypes.string),
        completionPercentages: PropTypes.arrayOf(PropTypes.number)
    }),
    className: PropTypes.string,
    style: PropTypes.object
};

export default DataVisualizationTrainingProgress;
