import React from 'react';
import PropTypes from 'prop-types';
import Tag from '@/components/status-and-loading/Tag';
import { SMART_CONSTANTS } from '@/components/constants';

/**
 * SmartBadges Component
 *
 * A SMART competency area, as a read-only Tag in the area's curriculum color.
 * An area is a category, so it is outlined like every other Tag rather than
 * filled like a Status.
 *
 * Types:
 * - socio-emotional (S)
 * - mastering-content (M)
 * - advocacy (A)
 * - relationships (R)
 * - technology-tools (T)
 */

/** Each area's label. */
const TEXT_OF = {
    'socio-emotional': SMART_CONSTANTS.CA_SE_FULL,
    'mastering-content': SMART_CONSTANTS.CA_MC,
    advocacy: SMART_CONSTANTS.CA_ADV,
    relationships: SMART_CONSTANTS.CA_RELN,
    'technology-tools': SMART_CONSTANTS.CA_TT,
};

/** Each area's Tag color: the color whose curriculum hue is that area's. */
export const SMART_TAG_COLORS = {
    'socio-emotional': 'yellow',
    'mastering-content': 'purple',
    advocacy: 'green',
    relationships: 'magenta',
    'technology-tools': 'blue',
};

/** "Mastering Content" and "mastering-content" name the same area; an unknown one is socio-emotional, as before. */
const areaOf = (type) => {
    const normalized = String(type ?? '').replace(/\s+/g, '-').toLowerCase();
    return TEXT_OF[normalized] ? normalized : 'socio-emotional';
};

const SmartBadges = ({
    type,
    size,
    id,
    className = '',
    ...rest
}) => {
    if (size !== undefined && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[StaticBadgeSmart] `size` is deprecated and ignored: a SMART area is a Tag, and a Tag has one size.');
    }
    const area = areaOf(type);

    return (
        <Tag
            id={id}
            color={SMART_TAG_COLORS[area]}
            className={`plus-smart-badge ${className}`.trim()}
            {...rest}
        >
            {TEXT_OF[area]}
        </Tag>
    );
};

SmartBadges.propTypes = {
    /** SMART competency area type */
    type: PropTypes.oneOf([
        'socio-emotional',
        'mastering-content',
        'advocacy',
        'relationships',
        'technology-tools'
    ]).isRequired,
    /** Deprecated and ignored: a SMART area is a Tag, which has one size (22). */
    size: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3']),
    /** HTML id attribute */
    id: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string
};

export default SmartBadges;

// Also export as StaticBadgeSmart for backwards compatibility
export { SmartBadges as StaticBadgeSmart };
