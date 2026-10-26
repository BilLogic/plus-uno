import React from 'react';
import PropTypes from 'prop-types';
import Tag, { TAG_COLOR_OF_CURRICULUM } from '@/components/labels/Tag';
import { SMART_CONSTANTS } from '@/components/constants';
import './StaticBadgeSmart.scss';

/**
 * SmartBadges Component
 *
 * A SMART competency area, as a read-only Tag filled in the area's SMART
 * subject colors: `background.smart.{subject}` for the ground,
 * `text.smart.{subject}` for the words and `icon.smart.{subject}` for the
 * swatch. Each subject aliases an accent no role uses, so the fill never reads
 * as a Status. The fill lives in `StaticBadgeSmart.scss`.
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

/** Each area's SMART subject, by the token name the subject is stored under. */
const CURRICULUM_OF = {
    'socio-emotional': 'social-emotional',
    'mastering-content': 'mastering-content',
    advocacy: 'advocacy',
    relationships: 'relationship',
    'technology-tools': 'technology-tools',
};

/**
 * Each area's Tag color: the accent the area's SMART tokens alias, for a plain
 * outlined Tag in the area's hue. The area itself passes no Tag color: its
 * stylesheet sets every color it shows from the SMART layer, so a passed hue
 * would only feed states a read-only area never reaches.
 */
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
            className={`plus-smart-badge plus-smart-badge--${CURRICULUM_OF[area]} ${className}`.trim()}
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
