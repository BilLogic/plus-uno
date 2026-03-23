import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tooltip from '@/components/Tooltip';
import CertifiedTutorBadge from '@/specs/Home/Elements/CertifiedTutorBadge';
import './BadgeCard.scss';

/**
 * BadgeCard component for Home page
 * Displays a badge card with title, description, badge graphic, and action button
 */
const BadgeCard = ({
    id,
    description,
    badgeType = 'unclaimed', // 'unclaimed', 'claimed-v1', 'claimed-v2'
    badgeSize = 'full', // 'thumbnail', 'modal', 'full'
    buttonText,
    tooltipText,
    onButtonClick,
    className = '',
    style
}) => {
    // Parse description for "20/20 Lessons completed" format
    const parseDescription = (desc) => {
        if (!desc) return null;
        // Check if it matches "20/20 Lessons completed" pattern
        const match = desc.match(/^(\d+\/\d+)\s+(.+)$/);
        if (match) {
            return {
                progress: match[1],
                label: match[2]
            };
        }
        return { progress: null, label: desc };
    };

    const parsedDesc = parseDescription(description);

    const cardContent = (
        <div className={`plus-badge-card-content plus-badge-card-content--${badgeSize}`}>
            {/* Left side: Text content */}
            <div className="plus-badge-card-left">
                {/* Title with info icon */}
                <div className="plus-badge-card-title">
                    <h5 className="h5">My Badge</h5>
                    {tooltipText ? (
                        <Tooltip text={tooltipText} placement="top" size="default">
                            <i className="fas fa-circle-info plus-badge-card-info-icon" aria-hidden="true"></i>
                        </Tooltip>
                    ) : (
                        <i className="fas fa-circle-info plus-badge-card-info-icon" aria-hidden="true"></i>
                    )}
                </div>

                {/* Description text */}
                {parsedDesc && (
                    <div className="plus-badge-card-description">
                        {parsedDesc.progress ? (
                            <>
                                <div className="plus-badge-card-progress">{parsedDesc.progress}</div>
                                <p className="body2-txt plus-badge-card-label">{parsedDesc.label}</p>
                            </>
                        ) : (
                            <p className="body2-txt">{parsedDesc.label}</p>
                        )}
                    </div>
                )}

                {/* Action button */}
                {buttonText && (
                    <div className="plus-badge-card-button">
                        <Button
                            text={buttonText}
                            style="primary"
                            fill="filled"
                            size="small"
                            onClick={onButtonClick}
                        />
                    </div>
                )}
            </div>

            {/* Right side: Badge graphic */}
            <div className={`plus-badge-card-badge plus-badge-card-badge--${badgeSize}`}>
                {badgeType === 'unclaimed' ? (
                    <CertifiedTutorBadge type="unclaimed" size={badgeSize} />
                ) : badgeType === 'claimed-v1' ? (
                    <CertifiedTutorBadge type="claimed-v1" size={badgeSize} />
                ) : (
                    <CertifiedTutorBadge type="claimed-v2" size={badgeSize} />
                )}
            </div>
        </div>
    );

    return (
        <Card
            id={id}
            className={`plus-badge-card ${className}`}
            style={style}
            paddingSize="md"
            gapSize="md"
            radiusSize="sm"
            borderSize="sm"
            showBorder={true}
        >
            {cardContent}
        </Card>
    );
};

BadgeCard.propTypes = {
    id: PropTypes.string,
    description: PropTypes.string,
    badgeType: PropTypes.oneOf(['unclaimed', 'claimed-v1', 'claimed-v2']),
    badgeSize: PropTypes.oneOf(['thumbnail', 'modal', 'full']),
    buttonText: PropTypes.string.isRequired,
    tooltipText: PropTypes.string,
    onButtonClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default BadgeCard;
