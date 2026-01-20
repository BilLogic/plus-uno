import React from 'react';
import PropTypes from 'prop-types';
import './ResourceType.scss';

/**
 * ResourceType Component
 * Displays an icon representing a resource type (pdf, link, video, image, slides)
 */
export const ResourceType = ({
    type = 'pdf',
    className = '',
    id
}) => {
    const iconMap = {
        'pdf': 'file-pdf',
        'link': 'arrow-up-right-from-square',
        'video': 'video',
        'image': 'image',
        'slides': 'file-powerpoint'
    };

    const iconName = iconMap[type] || iconMap['pdf'];

    return (
        <div 
            id={id}
            className={`plus-resource-type plus-resource-type--${type} ${className}`}
            aria-label={`Resource type: ${type}`}
        >
            <div className="plus-resource-type-icon">
                <i className={`fa-solid fa-${iconName}`} aria-hidden="true"></i>
            </div>
        </div>
    );
};

ResourceType.propTypes = {
    /** Resource type to display */
    type: PropTypes.oneOf(['pdf', 'link', 'video', 'image', 'slides']),
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Element ID */
    id: PropTypes.string
};

export default ResourceType;

