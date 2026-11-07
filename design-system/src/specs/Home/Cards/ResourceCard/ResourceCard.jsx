import React from 'react';
import PropTypes from 'prop-types';
import PatternCard from '@/patterns/PatternCard';
import Button from '@/components/forms-and-inputs/Button';
import SmartTag from '@/components/labels/SmartTag';
import './ResourceCard.scss';
import { iconClass } from '../../../../lib/icon';

/**
 * ResourceCard component for Home page
 * Displays a resource with type icon, title, description, duration, status, and action button
 */
const ResourceCard = ({
    id,
    type = 'pdf', // 'pdf', 'link', 'video', 'image', 'slides'
    subtitle,
    title,
    duration,
    status = 'completed', // 'completed', 'in-progress', 'not-started'
    badgeType, // SMART badge type (e.g., 'mastering-content')
    actionButtonText = 'get started',
    onActionClick,
    className = '',
    style
}) => {
    const getTypeIcon = () => {
        const iconMap = {
            'pdf': 'file-pdf',
            'link': 'link',
            'video': 'video',
            'image': 'image',
            'slides': 'file-powerpoint'
        };
        return iconMap[type] || 'file-pdf';
    };

    const getStatusIcon = () => {
        if (status === 'completed') {
            return 'circle-check';
        }
        return null;
    };

    const cardContent = (
        <div className="plus-resource-card-content">
            {/* Subtitle with type icon */}
            {subtitle && (
                <div className="plus-resource-card-subtitle">
                    <i className={iconClass(getTypeIcon())} aria-hidden="true"></i>
                    <span className="body3-txt">{subtitle}</span>
                </div>
            )}

            {/* Title and duration */}
            <div className="plus-resource-card-main">
                <div className="plus-resource-card-text">
                    <h5 className="plus-resource-card-title">{title}</h5>
                    {duration && (
                        <p className="body3-txt plus-resource-card-duration">{duration}</p>
                    )}
                </div>
                {status === 'completed' && (
                    <div className="plus-resource-card-status">
                        <i className={iconClass(getStatusIcon())} aria-hidden="true"></i>
                    </div>
                )}
            </div>

            {/* Footer with badge and button */}
            <div className="plus-resource-card-footer">
                {badgeType && (
                    <SmartTag subject={badgeType} />
                )}
                <Button
                    text={actionButtonText}
                    spacing="compact"
                    onClick={onActionClick}
                />
            </div>
        </div>
    );

    return (
        <PatternCard
            id={id}
            className={`plus-resource-card ${className}`}
            style={style}
            padding="sm"
            gap="md"
        >
            {cardContent}
        </PatternCard>
    );
};

ResourceCard.propTypes = {
    id: PropTypes.string,
    type: PropTypes.oneOf(['pdf', 'link', 'video', 'image', 'slides']),
    subtitle: PropTypes.string,
    title: PropTypes.string.isRequired,
    duration: PropTypes.string,
    status: PropTypes.oneOf(['completed', 'in-progress', 'not-started']),
    badgeType: PropTypes.oneOf(['social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools']),
    actionButtonText: PropTypes.string,
    onActionClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default ResourceCard;

