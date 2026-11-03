import React from 'react';
import Tag from '@/components/labels/Tag';
import TagGroup from '@/components/labels/TagGroup';

/**
 * A multi Select's picked values inside the field: Tags in a TagGroup
 * (`displayMode="tags"`), which collapse into "+n" when `collapsed`. Any other
 * mode draws nothing.
 *
 * `live` false makes every chip read-only.
 */
export default function SelectChips({
    displayMode,
    values,
    textFor,
    onRemove,
    live,
    disabled,
    label,
    collapsed,
    onOverflowClick,
}) {
    if (!values.length) return null;

    if (displayMode === 'tags') {
        return (
            <TagGroup
                className="plus-select-tags"
                label={label}
                overflow={collapsed ? 'collapse' : 'wrap'}
                isDisabled={disabled}
                onOverflowClick={live ? onOverflowClick : undefined}
            >
                {values.map((v) => (
                    <Tag
                        key={v}
                        color="gray"
                        isRemovable={live}
                        onAfterRemoveAction={live ? () => onRemove(v) : undefined}
                    >
                        {textFor(v)}
                    </Tag>
                ))}
            </TagGroup>
        );
    }

    return null;
}
