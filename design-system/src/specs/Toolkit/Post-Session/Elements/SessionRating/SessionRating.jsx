import React from 'react';
import PropTypes from 'prop-types';
import Rating from '@/components/forms-and-inputs/Rating';
import { SESSION_RATING_COMMENTS } from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Session Rating element (Figma `10661:10584`).
 * Composes Foundations Rating with session-reflection comment copy.
 *
 * @param {object} props
 * @param {string} [props.id='session-rating']
 * @param {number} [props.value=0]
 * @param {(value: number) => void} [props.onChange]
 * @param {string|null} [props.commentsLabel] - Override; defaults from SESSION_RATING_COMMENTS
 */
const SessionRating = ({
    id = 'session-rating',
    value = 0,
    onChange,
    commentsLabel = null,
}) => {
    const label = commentsLabel ?? SESSION_RATING_COMMENTS[value] ?? null;
    return (
        <Rating
            id={id}
            value={value}
            onChange={onChange}
            icon="thumbs-up"
            variant="comments"
            showCommentsLabel={Boolean(label)}
            commentsLabel={label}
        />
    );
};

SessionRating.propTypes = {
    id: PropTypes.string,
    value: PropTypes.number,
    onChange: PropTypes.func,
    commentsLabel: PropTypes.string,
};

export default SessionRating;
