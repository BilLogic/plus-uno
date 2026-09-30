import React from 'react';
import PropTypes from 'prop-types';
import Tag, { TAG_COLOR_OF_CURRICULUM } from '@/components/status-and-loading/Tag';
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

/** Each area's curriculum hue, by the token name the hue is stored under. */
const CURRICULUM_OF = {
    'socio-emotional': 'social-emotional',
    'mastering-content': 'mastering-content',
    advocacy: 'advocacy',
    relationships: 'relationship',
    'technology-tools': 'technology-tools',
};

/** Each area's Tag color: the color that borrows the area's curriculum hue. */
export const SMART_TAG_COLORS = Object.freeze(Object.fromEntries(
    Object.entries(CURRICULUM_OF).map(([area, hue]) => [area, TAG_COLOR_OF_CURRICULUM[hue]]),
));

/**
 * The area key for a SMART area as it is keyed or written: "Mastering Content"
 * and `mastering-content` are the same area. An unknown one is socio-emotional,
 * as it always has been. `type` takes the key; CompetencyBadge, which takes the
 * written form, runs its value through this first.
 */
export const smartAreaOf = (type) => {
    const normalized = String(type ?? '').trim().replace(/\s+/g, '-').toLowerCase();
    return Object.hasOwn(TEXT_OF, normalized) ? normalized : 'socio-emotional';
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
    const area = smartAreaOf(type);

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
    /** The SMART area, by its key. For the area as people write it ("Mastering Content"), use CompetencyBadge. */
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
