import React from 'react';
import PropTypes from 'prop-types';
import './CertifiedTutorBadge.scss';

// Import all badge images
// Unclaimed badges
import unclaimedThumbnail from '@/assets/images/tutor-badges/unclaimed-v1-thumbnail.png';
import unclaimedModal from '@/assets/images/tutor-badges/unclaimed-v1-modal.png';
import unclaimedFull from '@/assets/images/tutor-badges/unclaimed-v1-full.png';

// Claimed V1 badges
import claimedV1Thumbnail from '@/assets/images/tutor-badges/claimed-v1-thumbnail.png';
import claimedV1Modal from '@/assets/images/tutor-badges/claimed-v1-modal.png';
import claimedV1Full from '@/assets/images/tutor-badges/claimed-v1-full.png';

// Claimed V2 badges
import claimedV2Thumbnail from '@/assets/images/tutor-badges/claimed-v2-thumbnail.png';
import claimedV2Modal from '@/assets/images/tutor-badges/claimed-v2-modal.png';
import claimedV2Full from '@/assets/images/tutor-badges/claimed-v2-full.png';

/**
 * CertifiedTutorBadge Component
 * Displays a hexagonal badge for certified tutors
 * 
 * @param {string} type - Badge type: 'unclaimed', 'claimed-v1', or 'claimed-v2'
 * @param {string} variant - Legacy prop: 'red' maps to 'claimed-v1', 'teal' maps to 'claimed-v2'
 * @param {string} size - Size variant: 'thumbnail', 'modal', or 'full' (also supports 'small'/'large' for backward compatibility)
 * @param {string} className - Additional CSS classes
 * @param {string} id - Element ID
 * @param {React.ReactNode} children - Optional content to replace badge image
 */
export const CertifiedTutorBadge = ({
    type,
    variant,
    size = 'full',
    className = '',
    id,
    children
}) => {
    // Support legacy variant prop for backward compatibility
    let badgeType = type;
    if (!badgeType && variant) {
        badgeType = variant === 'red' ? 'claimed-v1' : variant === 'teal' ? 'claimed-v2' : 'claimed-v1';
    }
    badgeType = badgeType || 'claimed-v1';
    
    // Map size to image key
    const sizeMap = {
        'thumbnail': 'thumbnail',
        'modal': 'modal',
        'full': 'full',
        // Legacy size support
        'small': 'thumbnail',
        'large': 'full'
    };
    
    const sizeKey = sizeMap[size] || 'full';
    
    // Get the appropriate badge image based on type and size
    let badgeImage;
    if (badgeType === 'unclaimed') {
        badgeImage = sizeKey === 'thumbnail' ? unclaimedThumbnail 
            : sizeKey === 'modal' ? unclaimedModal 
            : unclaimedFull;
    } else if (badgeType === 'claimed-v1') {
        badgeImage = sizeKey === 'thumbnail' ? claimedV1Thumbnail 
            : sizeKey === 'modal' ? claimedV1Modal 
            : claimedV1Full;
    } else if (badgeType === 'claimed-v2') {
        badgeImage = sizeKey === 'thumbnail' ? claimedV2Thumbnail 
            : sizeKey === 'modal' ? claimedV2Modal 
            : claimedV2Full;
    } else {
        // Default to claimed-v1
        badgeImage = sizeKey === 'thumbnail' ? claimedV1Thumbnail 
            : sizeKey === 'modal' ? claimedV1Modal 
            : claimedV1Full;
    }

    return (
        <div
            id={id}
            className={`plus-certified-tutor-badge plus-certified-tutor-badge--${badgeType} plus-certified-tutor-badge--${size} ${variant ? `plus-certified-tutor-badge--${variant}` : ''} ${className}`}
            aria-label={`Certified Tutor Badge - ${badgeType} - ${size}`}
        >
            {children || (
                <img 
                    src={badgeImage} 
                    alt={`Certified Tutor Badge - ${badgeType} - ${size}`}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block'
                    }}
                />
            )}
        </div>
    );
};

CertifiedTutorBadge.propTypes = {
    /** Badge type */
    type: PropTypes.oneOf(['unclaimed', 'claimed-v1', 'claimed-v2']),
    /** Legacy color variant (for backward compatibility: 'red' maps to 'claimed-v1', 'teal' maps to 'claimed-v2') */
    variant: PropTypes.oneOf(['red', 'teal']),
    /** Size variant of the badge */
    size: PropTypes.oneOf(['thumbnail', 'modal', 'full', 'small', 'large']),
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Element ID */
    id: PropTypes.string,
    /** Custom content to replace badge image */
    children: PropTypes.node
};

export default CertifiedTutorBadge;
