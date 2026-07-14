import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/layout-and-structure/Card';
import Button from '@/components/actions/Button';
import Divider from '@/components/layout-and-structure/Divider';
import StaticBadgeSmart from '@/components/_internal/StaticBadgeSmart';
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
    /**
     * AI recommended glyph — FA Free has `wand-magic-sparkles` (not `sparkles`).
     * @returns {React.ReactElement|null}
     */
    const renderAIIndicator = () => {
        if (!aiRecommended) return null;

        return (
            <div className="plus-recommended-lessons-ai-indicator" title="AI recommended">
                <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
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

    // Width based on breakpoint — Figma Recommended Lessons frame
    // < XXL: 275.33px · XXL & above: 285px
    const width = breakpoint === 'XXL & above'
        ? '285px'
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
                    <div className="h5 plus-recommended-lessons-title" title={title}>{title}</div>
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
                            <div className="plus-recommended-lessons-status" title="In progress">
                                <i className="fa-solid fa-spinner" aria-hidden="true" />
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

