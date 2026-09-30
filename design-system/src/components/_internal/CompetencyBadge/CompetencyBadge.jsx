import React from 'react';
import PropTypes from 'prop-types';
import StaticBadgeSmart, { smartAreaOf } from '@/components/_internal/StaticBadgeSmart';

/**
 * A competency, which is a SMART area: the same read-only Tag
 * `StaticBadgeSmart` renders, taking the area as people write it
 * ("Mastering Content") as well as its key.
 */
const CompetencyBadge = ({ competencyArea, size, id, className = '', ...rest }) => {
    if (size !== undefined && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[CompetencyBadge] `size` is deprecated and ignored: a competency is a Tag, and a Tag has one size.');
    }
    return (
        <StaticBadgeSmart
            type={smartAreaOf(competencyArea)}
            id={id}
            className={`plus-competency-badge ${className}`.trim()}
            {...rest}
        />
    );
};

CompetencyBadge.propTypes = {
    /** The SMART area, as a key (`mastering-content`) or as written ("Mastering Content"). */
    competencyArea: PropTypes.string.isRequired,
    /** Deprecated and ignored: a competency is a Tag, which has one size (22). */
    size: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
};

export default CompetencyBadge;
