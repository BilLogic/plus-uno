import React from 'react';
import PropTypes from 'prop-types';

import Tag, { TAG_COLOR_OF_CURRICULUM } from '../Tag/Tag';
import './SmartTag.scss';
import { iconClass } from '../../../lib/icon';

/**
 * `SmartTag` — a SMART competency area.
 *
 * A THIN WRAPPER ON TAG. A SMART subject is a category, not a condition that
 * changes, so it is a Tag: `subject` fixes the color and the leading icon,
 * everything else (`isSelected`, `isRemovable`, `href`, `maxWidth`, ...) is
 * Tag's own prop, passed straight through.
 */

export const SMART_TAG_SUBJECTS = ['social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools'];

/** Spellings carried over from the area as it used to be written. */
const SUBJECT_ALIASES = {
    'socio-emotional': 'social-emotional',
    relationships: 'relationship',
};

/** The label shown when the caller passes neither `children` nor `text`. */
const SUBJECT_LABELS = {
    'social-emotional': 'Social-emotional',
    'mastering-content': 'Mastering content',
    advocacy: 'Advocacy',
    relationship: 'Relationship',
    'technology-tools': 'Technology tools',
};

/** The fixed Font Awesome Free glyph per subject. */
const SUBJECT_ICONS = {
    'social-emotional': 'heart',
    'mastering-content': 'book',
    advocacy: 'bullhorn',
    relationship: 'handshake',
    'technology-tools': 'laptop-code',
};

const warn = (message) => {
    if (process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.warn(`[SmartTag] ${message}`);
};

/** A tag for one of the five SMART competency areas. The `subject` fixes its color and leading icon, and the rest is passed to Tag. */
export const SmartTag = ({ subject, children, text, ...rest }) => {
    const normalized = SUBJECT_ALIASES[subject] || subject;
    let effectiveSubject = normalized;
    if (!SMART_TAG_SUBJECTS.includes(effectiveSubject)) {
        warn(`subject="${subject}" is not one of ${SMART_TAG_SUBJECTS.join(', ')}; it falls back to social-emotional.`);
        effectiveSubject = 'social-emotional';
    }

    const label = children ?? text ?? SUBJECT_LABELS[effectiveSubject];

    return (
        <Tag
            {...rest}
            color={TAG_COLOR_OF_CURRICULUM[effectiveSubject]}
            elemBefore={<i className={`plus-smart-tag__icon ${iconClass(SUBJECT_ICONS[effectiveSubject])}`} aria-hidden="true" />}
        >
            {label}
        </Tag>
    );
};

SmartTag.propTypes = {
    /** The SMART subject. Fixes the Tag color and the leading icon. */
    subject: PropTypes.oneOf([
        'social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools',
        'socio-emotional', 'relationships',
    ]).isRequired,
    /** The label (alternative to `text`). Defaults to the subject's own name. */
    children: PropTypes.node,
    /** The label (alternative to `children`). Defaults to the subject's own name. */
    text: PropTypes.string,
};

export default SmartTag;
