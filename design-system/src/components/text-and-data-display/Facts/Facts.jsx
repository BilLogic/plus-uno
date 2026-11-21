import React from 'react';
import PropTypes from 'prop-types';
import './Facts.scss';

/**
 * A description list for read-only facts: each label sits beside its value in
 * two aligned columns. Labels are subtle and values default, so a reader scans
 * down the values. It is plain text, not a field: nothing in it takes focus.
 */
const Facts = ({ items = [], className = '' }) => (
    <dl className={['plus-facts', className].filter(Boolean).join(' ')}>
        {items.map(({ label, value }) => (
            <div className="plus-facts__row" key={label}>
                <dt className="plus-facts__label">{label}</dt>
                <dd className="plus-facts__value">{value}</dd>
            </div>
        ))}
    </dl>
);

Facts.propTypes = {
    /** The facts, in reading order. Each label is unique within the list. */
    items: PropTypes.arrayOf(PropTypes.shape({
        /** What the fact is, such as "School". */
        label: PropTypes.string.isRequired,
        /** The fact itself. */
        value: PropTypes.node,
    })),
    /** Extra classes for placement, such as spacing. */
    className: PropTypes.string,
};

export default Facts;
