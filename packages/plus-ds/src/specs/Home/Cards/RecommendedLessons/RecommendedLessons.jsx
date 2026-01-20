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
    aiRecommended = false,
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

    const cardClasses = [
        'plus-recommended-lessons',
        `plus-recommended-lessons-${breakpoint.replace(/\s+/g, '-').toLowerCase()}`,
        className
    ].filter(Boolean).join(' ');

    const maxWidth = breakpoint === 'XXL & above' ? '756px' : '444px';
    const minWidth = breakpoint === 'XXL & above' ? '368px' : '218.67px';

    return (
        <Card
            id={id}
            className={cardClasses}
            style={{
                maxWidth,
                minWidth,
                ...style
            }}
            paddingSize="none"
            gapSize="none"
            radiusSize="sm"
            borderSize="sm"
            showBorder={true}
        >
            {/* Image thumbnail */}
            {image && (
                <div className="plus-recommended-lessons-image">
                    {typeof image === 'string' ? (
                        <img src={image} alt={title} />
                    ) : (
                        image
                    )}
                </div>
            )}

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
                <Divider size="1px" style="light" opacity10={true} />

                {/* Bottom section with button and status indicators */}
                <div className="plus-recommended-lessons-bottom">
                    <Button
                        text="Review"
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
    onReviewClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default RecommendedLessons;

