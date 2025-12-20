import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './TagInput.scss';

const TagInput = ({
    id,
    name,
    label,
    required = false,
    tags = [],
    defaultTags = [],
    size = 'medium',
    disabled = false,
    onAdd,
    onRemove,
    onChange,
    className = '',
    style,
    ...props
}) => {
    // Internal state for uncontrolled usage if tags not provided
    const [internalTags, setInternalTags] = useState(defaultTags);
    const isControlled = tags !== undefined && tags !== null && Array.isArray(tags);

    const currentTags = isControlled ? tags : internalTags;

    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    const handleAdd = (tagValue) => {
        if (disabled) return;

        if (!isControlled) {
            setInternalTags([...internalTags, tagValue]);
        }

        if (onAdd) {
            onAdd(tagValue);
        }

        if (onChange) {
            const newTags = [...currentTags, tagValue];
            onChange(newTags);
        }
    };

    const handleRemove = (tagIndex) => {
        if (disabled) return;

        const newTags = currentTags.filter((_, index) => index !== tagIndex);

        if (!isControlled) {
            setInternalTags(newTags);
        }

        if (onRemove) {
            onRemove(tagIndex, currentTags[tagIndex]);
        }

        if (onChange) {
            onChange(newTags);
        }
    };

    return (
        <div className={`plus-form-tag-input-wrapper ${className}`} style={style} {...props}>
            {label && (
                <Form.Label htmlFor={id || name} className="plus-form-tag-input-label">
                    {label}
                    {required && (
                        <span className="plus-form-tag-input-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            <div
                className={`plus-form-tag-input-container plus-form-tag-input-${size} ${sizeClass} ${disabled ? 'plus-form-tag-input-disabled' : ''}`}
                id={id ? `${id}-container` : undefined}
            >
                {currentTags.map((tag, index) => {
                    const tagValue = typeof tag === 'string' ? tag : tag.value || tag.text || '';
                    const tagText = typeof tag === 'string' ? tag : tag.text || tag.value || '';
                    const tagColor = typeof tag === 'object' && tag.color ? tag.color : 'default';

                    return (
                        <div
                            key={index}
                            className={`plus-form-tag-item plus-form-tag-item-${tagColor}`}
                        >
                            <span className="plus-form-tag-icon">
                                <i className="fas fa-plus" aria-hidden="true" />
                            </span>
                            <span className="plus-form-tag-text">{tagText}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

TagInput.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    required: PropTypes.bool,
    tags: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                value: PropTypes.string,
                text: PropTypes.string,
                color: PropTypes.oneOf(['default', 'success', 'danger', 'warning', 'info'])
            })
        ])
    ),
    defaultTags: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                value: PropTypes.string,
                text: PropTypes.string,
                color: PropTypes.oneOf(['default', 'success', 'danger', 'warning', 'info'])
            })
        ])
    ),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onAdd: PropTypes.func,
    onRemove: PropTypes.func,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default TagInput;


