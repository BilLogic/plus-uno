import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import Tag, { TAG_ACCEPTED_COLORS, resolveTagColor } from '@/components/status-and-loading/Tag';
import TagGroup from '@/components/status-and-loading/TagGroup';
import useFieldId from './useFieldId';
import './TagInput.scss';

/**
 * The chips are Tags in a TagGroup, so a picked value looks like every other
 * category in the product and a disabled field disables its tags through the
 * group. A tag's `color` is a Tag color. The status names the chips used to
 * take are deprecated aliases for the Tag color nearest their hue: a tag is a
 * category, and its color never carries a meaning.
 */
const TAG_INPUT_COLOR_ALIASES = {
    default: 'grey',
    success: 'green',
    danger: 'magenta',
    warning: 'yellow',
    info: 'teal',
};

/** Every name a tag's `color` accepts: what Tag accepts, then TagInput's own aliases. */
const ACCEPTED_COLORS = [...TAG_ACCEPTED_COLORS, ...Object.keys(TAG_INPUT_COLOR_ALIASES)];

const warn = (message) => {
    if (process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.warn(`[TagInput] ${message}`);
};

/**
 * The color to hand Tag. A Tag name, including Tag's own deprecated ones, goes
 * through as given, so Tag decides and warns about its own aliases. TagInput's
 * aliases resolve here, and anything else falls back to grey, each with a
 * development warning.
 */
const tagColorOf = (color) => {
    if (color === undefined || color === null || color === '') return 'grey';
    if (Object.hasOwn(TAG_INPUT_COLOR_ALIASES, color)) {
        warn(`color "${color}" is deprecated; use "${TAG_INPUT_COLOR_ALIASES[color]}".`);
        return TAG_INPUT_COLOR_ALIASES[color];
    }
    if (resolveTagColor(color)) return color;
    warn(`color "${color}" is not a Tag color; it falls back to grey.`);
    return 'grey';
};

const TagInput = ({
    id,
    name,
    label,
    required = false,
    tags,
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
    // Controlled only when `tags` is passed. It used to default to an empty
    // list, which made every TagInput controlled and left `defaultTags` unread.
    const isControlled = tags !== undefined && tags !== null && Array.isArray(tags);

    const currentTags = isControlled ? tags : internalTags;

    /**
     * TagInput renders tags, not an input (#206). The label had nowhere to
     * point — `htmlFor` was `id || name` while the only id in the tree was
     * `${id}-container`, which never matched either. The container keeps that
     * `-container` id, unchanged for callers who pass `id`, and is now the
     * named `group` the label describes.
     */
    const fieldId = useFieldId(id);
    const hasLabel = Boolean(label);
    const labelId = hasLabel ? `${fieldId}-label` : undefined;

    // A × is offered only where pressing it can remove something: a list
    // TagInput keeps itself, or a controlled one with a handler. A disabled
    // field has none; TagGroup takes the × away from its tags.
    const canRemove = !disabled && (!isControlled || Boolean(onRemove || onChange));

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
            {hasLabel && (
                <Form.Label as="span" id={labelId} className="plus-form-tag-input-label">
                    {label}
                    {required && (
                        <span className="plus-form-tag-input-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            <div
                className={`plus-form-tag-input-container plus-form-tag-input-${size} ${disabled ? 'plus-form-tag-input-disabled' : ''}`}
                id={`${fieldId}-container`}
                role={hasLabel ? 'group' : undefined}
                aria-labelledby={labelId}
            >
                {currentTags.length > 0 && (
                    <TagGroup disabled={disabled}>
                        {currentTags.map((tag, index) => {
                            const tagText = typeof tag === 'string' ? tag : tag.text || tag.value || '';
                            return (
                                <Tag
                                    // Values can repeat, so the position is part of the key.
                                    key={`${index}-${tagText}`}
                                    color={tagColorOf(typeof tag === 'object' ? tag.color : undefined)}
                                    behavior={canRemove ? 'removable' : 'read-only'}
                                    onRemove={canRemove ? () => handleRemove(index) : undefined}
                                >
                                    {tagText}
                                </Tag>
                            );
                        })}
                    </TagGroup>
                )}
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
                color: PropTypes.oneOf(ACCEPTED_COLORS)
            })
        ])
    ),
    defaultTags: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                value: PropTypes.string,
                text: PropTypes.string,
                color: PropTypes.oneOf(ACCEPTED_COLORS)
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
