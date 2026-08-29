import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Tag from '../Tag';
import './TagGroup.scss';

/**
 * The container for a set of tags (#276).
 *
 * IT EXISTS TO OWN WHAT A SINGLE TAG CANNOT DECIDE: the gaps between tags, and
 * whether a long set wraps or collapses. Both are properties of the set, not of
 * any member of it.
 *
 * THE GAP LIVES HERE, NOT ON THE TAG. Atlassian's tag carries its own margin,
 * which then has to be switched off with a `hasMargin` escape hatch whenever a
 * parent uses `gap` — an API that exists only to undo a decision made in the
 * wrong place. `Tag` sets `margin: 0` and this sets `gap`, so there is nothing
 * to undo and nothing to double up.
 */
export const TagGroup = ({
    children,
    label,
    overflow = 'wrap',
    maxVisible = 5,
    overflowLabel,
    onOverflowClick,
    className = '',
    id,
    ...rest
}) => {
    const [expanded, setExpanded] = useState(false);

    // `null`/`false` children are ordinary in JSX (`{cond && <Tag/>}`), and
    // counting them would make `+n` claim tags that do not exist.
    const items = React.Children.toArray(children).filter(Boolean);

    const collapses = overflow === 'collapse' && !expanded && items.length > maxVisible;
    const visible = collapses ? items.slice(0, maxVisible) : items;
    const hidden = items.length - visible.length;

    const handleOverflow = (e) => {
        if (onOverflowClick) {
            onOverflowClick(e);
            return;
        }
        // The default has to REVEAL. An overflow tag that only reports a number
        // tells a person that values exist and gives them no way to reach them,
        // which is worse than not showing the count at all.
        setExpanded(true);
    };

    return (
        <div
            id={id}
            // A set of tags is a list, and saying so is what lets a screen reader
            // announce "5 items" instead of reading five unrelated words. The
            // items are wrapped rather than rendered as `<li>` so that `Tag`
            // stays usable on its own, outside any group.
            role="list"
            aria-label={label}
            className={['plus-tag-group', `plus-tag-group--${overflow}`, className].filter(Boolean).join(' ')}
            {...rest}
        >
            {visible.map((child, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div role="listitem" className="plus-tag-group__item" key={child.key ?? i}>
                    {child}
                </div>
            ))}
            {collapses && (
                <div role="listitem" className="plus-tag-group__item">
                    <Tag
                        variant="operational"
                        color="grey"
                        onClick={handleOverflow}
                        className="plus-tag-group__overflow"
                    >
                        {overflowLabel ? overflowLabel(hidden) : `+${hidden}`}
                    </Tag>
                </div>
            )}
        </div>
    );
};

TagGroup.propTypes = {
    /** The tags. `null` and `false` are skipped rather than counted. */
    children: PropTypes.node,
    /** The group's accessible name — what this set of tags is. */
    label: PropTypes.string,
    /** `wrap` flows onto more lines; `collapse` keeps one line and shows `+n`. */
    overflow: PropTypes.oneOf(['wrap', 'collapse']),
    /** `collapse` only: how many tags to show before the `+n`. */
    maxVisible: PropTypes.number,
    /** Formats the overflow tag's label. Defaults to `+n`. */
    overflowLabel: PropTypes.func,
    /** Replaces the default reveal — for opening a picker or a popover instead. */
    onOverflowClick: PropTypes.func,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default TagGroup;
