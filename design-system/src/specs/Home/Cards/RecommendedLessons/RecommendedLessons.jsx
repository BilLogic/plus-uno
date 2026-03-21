import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Divider from '@/components/Divider';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';
import './RecommendedLessons.scss';

/**
 * RecommendedLessons component for Home page
 * Displays a recommended lesson card with thumbnail, badge, title, and action button
 */
const RecommendedLessons = ({
    id,
    breakpoint = '< XXL', // '< XXL' or 'XXL & above'
    image,
    badgeType,
    title,
    duration,
    status = 'in-progress', // 'in-progress', 'completed', 'not-started'
    aiRecommended = true,
    actionLabel = 'Review',
    onReviewClick,
    className = '',
    style
}) => {
    const renderStatusIcon = () => {
        if (status === 'in-progress') {
            return <i className="fas fa-spinner" aria-hidden="true"></i>;
        }
        return null;
    };

    const renderAIIndicator = () => {
        if (!aiRecommended) return null;

        return (
            <div className="plus-recommended-lessons-ai-indicator">
                <i className="fas fa-star" aria-hidden="true"></i>
            </div>
        );
    };

    // Normalize breakpoint for class name (handle "XXL & above" -> "xxl-above")
    // Remove special characters and normalize spacing
    const breakpointClass = breakpoint === 'XXL & above'
        ? 'xxl-above'
        : breakpoint.replace(/[&\s]+/g, '-').toLowerCase();

    const cardClasses = [
        'plus-recommended-lessons',
        `plus-recommended-lessons-${breakpointClass}`,
        className
    ].filter(Boolean).join(' ');

    // Width based on breakpoint - fixed widths per Figma spec
    // < XXL: 275.33px (fixed width to match Figma)
    // XXL & above: 368px (fixed width per Figma spec)
    const width = breakpoint === 'XXL & above'
        ? '368px'
        : '275.33px';

    return (
        <Card
            id={id}
            className={cardClasses}
            style={{
                width: width,
                maxWidth: width, // Ensure it doesn't exceed the set width
                flexShrink: 0, // Prevent shrinking in flex containers (carousel)
                ...style // Allow style prop to override if needed
            }}
            paddingSize={null}
            gapSize={null}
            radiusSize="sm"
            borderSize="sm"
            showBorder={true}
        >
            {/* Image thumbnail (placeholder if no image provided) */}
            <div className="plus-recommended-lessons-image">
                {image
                    ? (typeof image === 'string'
                        ? <img src={image} alt={title} />
                        : image)
                    : <div className="plus-recommended-lessons-image-placeholder" aria-hidden="true" />}
            </div>

            {/* Content */}
            <div className="plus-recommended-lessons-content">
                {/* Top section with badge, duration, and title */}
                <div className="plus-recommended-lessons-top">
                    <div className="plus-recommended-lessons-tags">
                        {badgeType && (
                            <StaticBadgeSmart type={badgeType} size="b2" />
                        )}
                        {duration && (
                            <>
                                <span className="plus-recommended-lessons-separator">•</span>
                                <span className="body3-txt plus-recommended-lessons-duration">{duration}</span>
                            </>
                        )}
                    </div>
                    <h5 className="plus-recommended-lessons-title">{title}</h5>
                </div>

                {/* Divider */}
                <Divider
                    size="1px"
                    style="light"
                    className="plus-recommended-lessons-divider"
                />

                {/* Bottom section with button and status indicators */}
                <div className="plus-recommended-lessons-bottom">
                    <Button
                        text={actionLabel}
                        style="primary"
                        fill="filled"
                        size="small"
                        onClick={onReviewClick}
                    />
                    <div className="plus-recommended-lessons-indicators">
                        {status === 'in-progress' && (
                            <div className="plus-recommended-lessons-status">
                                <i className="fas fa-spinner" aria-hidden="true"></i>
                            </div>
                        )}
                        {renderAIIndicator()}
                    </div>
                </div>
            </div>
        </Card>
    );
};

RecommendedLessons.propTypes = {
    id: PropTypes.string,
    breakpoint: PropTypes.oneOf(['< XXL', 'XXL & above']),
    image: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    badgeType: PropTypes.oneOf(['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools']),
    title: PropTypes.string.isRequired,
    duration: PropTypes.string,
    status: PropTypes.oneOf(['in-progress', 'completed', 'not-started']),
    aiRecommended: PropTypes.bool,
    actionLabel: PropTypes.string,
    onReviewClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default RecommendedLessons;

