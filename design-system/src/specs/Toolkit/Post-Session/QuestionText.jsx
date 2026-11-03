import React from 'react';
import PropTypes from 'prop-types';

/**
 * The text a question carries above its answer: the question itself, with the
 * required mark. Used where no field of the library draws its own label (a
 * group of chips, an upload, a date).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.isRequired=false]
 * @param {string} [props.htmlFor] - Renders a `<label>` for this field id.
 * @param {'question'|'field'} [props.rank='field'] - `question` reads at Body/default semibold; `field` at Body/small semibold.
 */
export const QuestionLabel = ({ children, isRequired = false, htmlFor, rank = 'field' }) => {
    const Element = htmlFor ? 'label' : 'p';
    return (
        <Element
            htmlFor={htmlFor}
            className={`${rank === 'question' ? 'body1-txt' : 'body3-txt'} font-weight-semibold m-0`}
            style={{ color: 'var(--ds-text)' }}
        >
            {children}
            {isRequired && <span style={{ color: 'var(--ds-text-danger)' }}> *</span>}
        </Element>
    );
};

QuestionLabel.propTypes = {
    children: PropTypes.node,
    isRequired: PropTypes.bool,
    htmlFor: PropTypes.string,
    rank: PropTypes.oneOf(['question', 'field']),
};

/**
 * A caption line under a question.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'subtle'|'danger'} [props.tone='subtle'] - `danger` is the privacy warning.
 */
export const QuestionCaption = ({ children, tone = 'subtle' }) => (
    <p
        className="body3-txt m-0"
        style={{ color: tone === 'danger' ? 'var(--ds-text-danger)' : 'var(--ds-text-subtle)' }}
    >
        {children}
    </p>
);

QuestionCaption.propTypes = {
    children: PropTypes.node,
    tone: PropTypes.oneOf(['subtle', 'danger']),
};
