/**
 * StrategyBadge Component
 * 
 * Badge component showing different file/strategy types: image, video, audio, document, book, website, other.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121913
 */

import React from 'react';
import PropTypes from 'prop-types';
import './StrategyBadge.scss';

const StrategyBadge = ({
    type = 'image',
    showLabel = false,
    className = '',
    ...props
}) => {
    // Map type to icon and label
    const typeConfig = {
        'image': {
            icon: 'fa-file-image',
            label: 'Image'
        },
        'video': {
            icon: 'fa-file-video',
            label: 'Video'
        },
        'audio': {
            icon: 'fa-file-audio',
            label: 'Audio'
        },
        'document': {
            icon: 'fa-file-pdf',
            label: 'Document'
        },
        'book': {
            icon: 'fa-file-lines',
            label: 'Book'
        },
        'website': {
            icon: 'fa-up-right-from-square',
            label: 'Website'
        },
        'other': {
            icon: 'fa-file',
            label: 'Other'
        }
    };

    const config = typeConfig[type] || typeConfig['other'];

    /*
     * ARIA PROHIBITS NAMING A GENERIC ELEMENT. `aria-label` on a bare `div` is
     * dropped by the accessibility tree, so the badge announced nothing at all
     * — twelve stories reported `aria-prohibited-attr` for exactly this. The
     * icon is the whole content when `showLabel` is false, which is what
     * `role="img"` describes: a graphic with a text alternative.
     *
     * With the label VISIBLE there is nothing to add. The text says what the
     * icon says, the icon is already `aria-hidden`, and a second name on the
     * wrapper would have a screen reader read the type twice.
     */
    return (
        <div
            className={`strategy-badge ${className}`}
            role={showLabel ? undefined : 'img'}
            aria-label={showLabel ? undefined : `Content type: ${config.label}`}
            {...props}
        >
            <i className={`fas ${config.icon}`} aria-hidden="true" />
            {showLabel && <span className="strategy-badge__label">{config.label}</span>}
        </div>
    );
};

StrategyBadge.propTypes = {
    /** Badge type: "image", "video", "audio", "document", "book", "website", "other" */
    type: PropTypes.oneOf(['image', 'video', 'audio', 'document', 'book', 'website', 'other']),
    /** Whether to show the label text */
    showLabel: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default StrategyBadge;
