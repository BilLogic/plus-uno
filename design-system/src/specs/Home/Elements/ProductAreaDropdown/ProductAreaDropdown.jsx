import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@/components';
import './ProductAreaDropdown.scss';

/**
 * ProductAreaDropdown Component
 * The product area a piece of feedback is about: a single Select with its
 * label above it. The areas exclude each other, so it picks one.
 */
export const ProductAreaDropdown = ({
    label = 'Product Area',
    placeholder = 'Select product area',
    options = [
        { value: 'homepage', text: 'Homepage' },
        { value: 'training', text: 'Training' },
        { value: 'toolkit', text: 'Toolkit' },
        { value: 'admin', text: 'Admin' },
        { value: 'other', text: 'Other' }
    ],
    value,
    onChange,
    required = false,
    className = '',
    id,
    defaultOpen = false
}) => (
    <Select
        id={id}
        label={label}
        placeholder={placeholder}
        size="small"
        options={options.map(({ value: optionValue, text }) => ({ value: optionValue, label: text }))}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        defaultOpen={defaultOpen}
        className={`plus-product-area-dropdown ${className}`.trim()}
    />
);

ProductAreaDropdown.propTypes = {
    /** Label text above the field */
    label: PropTypes.string,
    /** Placeholder text when no area is picked */
    placeholder: PropTypes.string,
    /** Areas: `value` is the id, `text` what is shown */
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
    })),
    /** The picked area's id */
    value: PropTypes.string,
    /** `(id)` when the area changes */
    onChange: PropTypes.func,
    /** Marks the field required; a required pick has no clear × */
    required: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Element ID */
    id: PropTypes.string,
    /** Whether the list starts open */
    defaultOpen: PropTypes.bool
};

export default ProductAreaDropdown;
