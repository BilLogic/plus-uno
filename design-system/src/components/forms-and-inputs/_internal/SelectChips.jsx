import React from 'react';
import Badge from '@/components/status-and-loading/Badge';
import Tag from '@/components/status-and-loading/Tag';
import TagGroup from '@/components/status-and-loading/TagGroup';

/**
 * A multi Select's picked values inside the field: Tags in a TagGroup
 * (`displayMode="tags"`), which collapse into "+n" when `collapsed`, or the
 * older Badge chips (`displayMode="badges"`). Any other mode draws nothing.
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
                disabled={disabled}
                onOverflowClick={live ? onOverflowClick : undefined}
            >
                {values.map((v) => (
                    <Tag
                        key={v}
                        color="grey"
                        behavior={live ? 'removable' : 'read-only'}
                        onRemove={live ? () => onRemove(v) : undefined}
                    >
                        {textFor(v)}
                    </Tag>
                ))}
            </TagGroup>
        );
    }

    if (displayMode === 'badges') {
        return (
            <div className="plus-select-badges">
                {values.map((v) => (
                    <Badge
                        key={v}
                        text={textFor(v)}
                        dismissible={live}
                        onDismiss={(event) => {
                            if (event && event.stopPropagation) event.stopPropagation();
                            onRemove(v);
                        }}
                        size="b2"
                        style="secondary"
                    />
                ))}
            </div>
        );
    }

    return null;
}
