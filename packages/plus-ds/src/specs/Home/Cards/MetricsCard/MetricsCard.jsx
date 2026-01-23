import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import './MetricsCard.scss';

/**
 * MetricsCard component for Home page
 * Displays metrics (4 page variants)
 */
const MetricsCard = ({
    id,
    page: controlledPage,
    onPageChange,
    className = '',
    style
}) => {
    const [internalPage, setInternalPage] = useState(1);
    const currentPage = controlledPage !== undefined ? controlledPage : internalPage;

    const handlePageChange = (newPage) => {
        if (controlledPage === undefined) {
            setInternalPage(newPage);
        }
        if (onPageChange) {
            onPageChange(newPage);
        }
    };

    const renderPage1 = () => (
        <div className="plus-metrics-card-page">
            <div className="plus-metrics-card-progress">
                <div className="plus-metrics-card-progress-text">
                    <h3 className="plus-metrics-card-progress-value">2/3</h3>
                    <p className="body3-txt">Sessions Completed This Week</p>
                </div>
                <div className="plus-metrics-card-progress-chart">
                    {/* Circular progress visualization - simplified for now */}
                    <div className="plus-metrics-card-progress-circle">
                        <svg viewBox="0 0 180 180" className="plus-metrics-card-progress-svg">
                            <circle
                                cx="90"
                                cy="90"
                                r="80"
                                fill="none"
                                stroke="var(--color-surface-container)"
                                strokeWidth="12"
                            />
                            <circle
                                cx="90"
                                cy="90"
                                r="80"
                                fill="none"
                                stroke="var(--color-primary)"
                                strokeWidth="12"
                                strokeDasharray={`${(2/3) * 502.65} 502.65`}
                                transform="rotate(-90 90 90)"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPage2 = () => (
        <div className="plus-metrics-card-page">
            <div className="plus-metrics-card-metrics">
                <MetricItem
                    value="100"
                    label="Total Sessions Completed"
                />
                <MetricItem
                    value="75 hr"
                    label="Total Tutoring Time"
                />
                <MetricItem
                    value="95%"
                    label="Reflection Completion"
                    showBadge={true}
                    badgeState="increase"
                />
            </div>
        </div>
    );

    const renderPage3 = () => (
        <div className="plus-metrics-card-page">
            <div className="plus-metrics-card-metrics">
                <MetricItem
                    value="4.8"
                    label="Student Interaction Rating"
                    showBadge={true}
                    badgeState="increase"
                />
                <MetricItem
                    value="4.8"
                    label="Session Rating"
                    showBadge={true}
                    badgeState="increase"
                />
                <MetricItem
                    value="4.8"
                    label="Self Performance Rating"
                    showBadge={true}
                    badgeState="increase"
                />
            </div>
        </div>
    );

    const renderAlternative = () => (
        <div className="plus-metrics-card-page plus-metrics-card-page-alternative">
            <div className="plus-metrics-card-stacked">
                <StackedMetricCard
                    value="25%"
                    label="overall lesson completion"
                    showBadge={true}
                    badgeState="increase"
                />
                <StackedMetricCard
                    value="73%"
                    label="average lesson accuracy"
                    showBadge={true}
                    badgeState="increase"
                />
                <StackedMetricCard
                    value="226"
                    label="minutes spent on lessons"
                    showBadge={true}
                    badgeState="increase"
                />
            </div>
        </div>
    );

    const renderContent = () => {
        switch (currentPage) {
            case 2:
                return renderPage2();
            case 3:
                return renderPage3();
            case 4:
                return renderAlternative();
            default:
                return renderPage1();
        }
    };

    // Alternative page (4) renders multiple cards, so don't wrap in a single Card
    if (currentPage === 4) {
        return (
            <div
                id={id}
                className={`plus-metrics-card-container plus-metrics-card-page-alternative ${className}`}
                style={style}
            >
                {renderContent()}
            </div>
        );
    }

    return (
        <Card
            id={id}
            className={`plus-metrics-card plus-metrics-card-page-${currentPage} ${className}`}
            style={style}
            paddingSize="sm"
            gapSize="sm"
            radiusSize="md"
            borderSize="sm"
            showBorder={true}
        >
            {renderContent()}
        </Card>
    );
};

const MetricItem = ({ value, label, showBadge = false, badgeState = 'increase' }) => {
    const renderBadge = () => {
        if (!showBadge) return null;
        
        const icon = badgeState === 'increase' ? 'arrow-up' : 'arrow-down';
        const badgeText = badgeState === 'increase' ? '+{#}% since last week' : '-{#}% since last week';
        
        return (
            <Badge
                style="success"
                size="b2"
                leadingVisual={<i className={`fas fa-${icon}`}></i>}
                text={badgeText}
            />
        );
    };

    return (
        <div className="plus-metrics-card-item">
            <div className="plus-metrics-card-item-content">
                <h4 className="plus-metrics-card-item-value">{value}</h4>
                <p className="body2-txt plus-metrics-card-item-label">{label}</p>
                {renderBadge()}
            </div>
        </div>
    );
};

const StackedMetricCard = ({ value, label, showBadge = false, badgeState = 'increase' }) => {
    const renderBadge = () => {
        if (!showBadge) return null;
        
        const icon = badgeState === 'increase' ? 'arrow-up' : 'arrow-down';
        const badgeText = badgeState === 'increase' ? '+{#}% since last week' : '-{#}% since last week';
        
        return (
            <Badge
                style="success"
                size="b2"
                leadingVisual={<i className={`fas fa-${icon}`}></i>}
                text={badgeText}
            />
        );
    };

    return (
        <Card
            className="plus-metrics-stacked-card"
            paddingSize="sm"
            gapSize="sm"
            radiusSize="md"
            borderSize="sm"
            showBorder={true}
        >
            <div className="plus-metrics-stacked-card-content">
                <h3 className="plus-metrics-stacked-card-value">{value}</h3>
                <p className="body2-txt plus-metrics-stacked-card-label">{label}</p>
                {renderBadge()}
            </div>
        </Card>
    );
};

StackedMetricCard.propTypes = {
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    showBadge: PropTypes.bool,
    badgeState: PropTypes.oneOf(['increase', 'decrease'])
};

MetricItem.propTypes = {
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    showBadge: PropTypes.bool,
    badgeState: PropTypes.oneOf(['increase', 'decrease'])
};

MetricsCard.propTypes = {
    id: PropTypes.string,
    page: PropTypes.oneOf([1, 2, 3, 4]), // Controlled page prop (4 = Alternative)
    onPageChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default MetricsCard;

