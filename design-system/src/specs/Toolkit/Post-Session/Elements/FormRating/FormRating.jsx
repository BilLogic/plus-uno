import React from 'react';
import PropTypes from 'prop-types';
import Rating from '@/components/forms-and-inputs/Rating';
import { FORM_RATING_COMMENTS } from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Form Rating element (Figma `4556:16198`).
 * Composes Foundations Rating with form-feedback comment copy.
 *
 * @param {object} props
 * @param {string} [props.id='form-rating']
 * @param {number} [props.value=0]
 * @param {(value: number) => void} [props.onChange]
 * @param {string|null} [props.commentsLabel] - Override; defaults from FORM_RATING_COMMENTS
 */
const FormRating = ({
    id = 'form-rating',
    value = 0,
    onChange,
    commentsLabel = null,
}) => {
    const label = commentsLabel ?? (value > 0 ? FORM_RATING_COMMENTS[value] : null);
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

FormRating.propTypes = {
    id: PropTypes.string,
    value: PropTypes.number,
    onChange: PropTypes.func,
    commentsLabel: PropTypes.string,
};

export default FormRating;
