import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/layout-and-structure/Card';
import Button from '@/components/actions/Button';
import Tooltip from '@/components/overlays/Tooltip';
import CertifiedTutorBadge from '@/specs/Home/Elements/CertifiedTutorBadge';
import './BadgeCard.scss';

/**
 * BadgeCard — Home “My Badge” overview card (Figma Overview Card / Training Progress badge variants).
 * Layout: title + body row (copy | 90px thumbnail badge) + tonal CTA.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {'>M'|'M'} [props.size='>M'] Figma size prop — >M = col-4, M = col-3
 * @param {string} [props.title='My Badge']
 * @param {string} [props.headline] Bold line (e.g. "Certified Tutor" or "20/20")
 * @param {string} [props.subline] Supporting line under the headline
 * @param {'unclaimed'|'claimed-v1'|'claimed-v2'} [props.badgeType='unclaimed']
 * @param {string} [props.buttonText]
 * @param {string} [props.tooltipText]
 * @param {() => void} [props.onButtonClick]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
const BadgeCard = ({
    id,
    size = '>M',
    title = 'My Badge',
    headline,
    subline,
    badgeType = 'unclaimed',
    buttonText,
    tooltipText,
    onButtonClick,
    className = '',
    style,
}) => {
    const sizeClass = size === 'M' ? 'plus-badge-card--m' : 'plus-badge-card--gt-m';

    return (
        <Card
            id={id}
            className={`plus-badge-card ${sizeClass} ${className}`.trim()}
            style={style}
            paddingSize={null}
            gapSize={null}
            radiusSize="md"
            showBorder={false}
        >
            <div className="plus-badge-card__inner">
                <div className="plus-badge-card__title">
                    <h6 className="h6 font-weight-semibold plus-badge-card__title-text">{title}</h6>
                    {tooltipText ? (
                        <Tooltip text={tooltipText} placement="top" size="default">
                            <button type="button" className="plus-badge-card__info" aria-label="More information">
                                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                            </button>
                        </Tooltip>
                    ) : (
                        <span className="plus-badge-card__info" aria-hidden="true">
                            <i className="fa-solid fa-circle-info" />
                        </span>
                    )}
                </div>

                <div className="plus-badge-card__body">
                    <div className="plus-badge-card__copy">
                        {(headline || subline) && (
                            <div className="plus-badge-card__text">
                                {headline && (
                                    <div className="body2-txt font-weight-bold plus-badge-card__headline">
                                        {headline}
                                    </div>
                                )}
                                {subline && (
                                    <p className="body3-txt plus-badge-card__subline">{subline}</p>
                                )}
                            </div>
                        )}
                        {buttonText && (
                            <Button
                                text={buttonText}
                                style="primary"
                                fill="tonal"
                                size="medium"
                                onClick={onButtonClick}
                            />
                        )}
                    </div>

                    <div className="plus-badge-card__badge">
                        <CertifiedTutorBadge type={badgeType} size="thumbnail" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

BadgeCard.propTypes = {
    id: PropTypes.string,
    size: PropTypes.oneOf(['>M', 'M']),
    title: PropTypes.string,
    headline: PropTypes.string,
    subline: PropTypes.string,
    badgeType: PropTypes.oneOf(['unclaimed', 'claimed-v1', 'claimed-v2']),
    buttonText: PropTypes.string,
    tooltipText: PropTypes.string,
    onButtonClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default BadgeCard;
