import React from 'react';
import PropTypes from 'prop-types';
import { ClippedTooltip } from '@/lib/ClippedTooltip';
import VisuallyHidden from '@/components/text-and-data-display/VisuallyHidden';
import { alignName } from './TableParts';
import Icon from '../../images-and-icons/Icon';
import './Table.scss';

const classes = (...names) => names.filter(Boolean).join(' ');

/** What a press asks for next: ascending, then descending, then no sort. */
const NEXT_SORT = { none: 'ascending', ascending: 'descending', descending: 'none' };

const SORT_GLYPH = {
    none: 'sort',
    ascending: 'sort-up',
    descending: 'sort-down',
};

const SORT_STATE_TEXT = {
    none: 'not sorted',
    ascending: 'sorted ascending',
    descending: 'sorted descending',
};

const SORT_ACTION_TEXT = {
    ascending: 'Sort ascending',
    descending: 'Sort descending',
    none: 'Remove sort',
};

/**
 * `_Table head cell`. A column header: a label, an optional type icon, and
 * when `isSortable` a real button that follows the WAI-ARIA sortable table
 * pattern (`aria-sort` on the `th`, the button inside it).
 *
 * - `label`: the column name. Required, since it names the column for
 *   assistive technology even when `isIconOnlyHeader` hides it.
 * - `icon`: Font Awesome Free name for the column's data type, such as
 *   `calendar`. Drawn at the small icon size.
 * - `isSortable`: renders the sort button. `sort` is `none` | `ascending` |
 *   `descending`; the page owns it and gets the requested direction from
 *   `onSort`. The unsorted arrow shows on hover and focus; a sorted column
 *   keeps its arrow.
 * - `shouldTruncate`: one line with an ellipsis, and a tooltip with the full
 *   label while it is clipped. Pass `width` (or fix the column elsewhere) so
 *   there is a width to clip against.
 * - `align`: `text` | `number` | `icon`
 * - `isIconOnlyHeader`: draws the icon alone; the label rides in
 *   VisuallyHidden.
 *
 * Header links and buttons other than the sort button are not allowed.
 */
const HeadCell = ({
    label,
    icon,
    isSortable = false,
    sort = 'none',
    onSort,
    shouldTruncate = true,
    align = 'text',
    width,
    isIconOnlyHeader = false,
    className = '',
    style,
    ...props
}) => {
    const sortState = SORT_GLYPH[sort] ? sort : 'none';
    const showLabel = !isIconOnlyHeader;
    const truncate = shouldTruncate && showLabel;

    const cellStyle = {
        width,
        // A clipped label needs a width to clip against.
        maxWidth: truncate ? width : undefined,
        ...style,
    };

    const typeIcon = icon ? (
        <Icon name={icon} className="plus-table-head-cell-type" />
    ) : null;

    const cellClass = classes(
        'plus-table-head-cell',
        `plus-table-cell--align-${alignName(align)}`,
        truncate && 'plus-table-head-cell--truncate',
        isSortable && 'plus-table-head-cell--sortable',
        className
    );

    // The tooltip goes on whatever takes focus: the sort button, or, on a
    // header with nothing to press, the label's own box while it is clipped.
    const action = SORT_ACTION_TEXT[NEXT_SORT[sortState]];
    const clippedText = truncate ? label : '';

    const inner = (
        <ClippedTooltip
            text={isSortable && clippedText ? `${label}. ${action}` : clippedText}
            textWhenFits={isSortable ? action : undefined}
            deps={[truncate]}
        >
            {({ measureRef, truncated }) => {
                const body = (
                    <>
                        {typeIcon}
                        {showLabel ? (
                            <span
                                ref={measureRef}
                                className={classes('plus-table-head-cell-label', truncate && 'plus-table-head-cell-label--truncate')}
                            >
                                {label}
                            </span>
                        ) : (
                            <VisuallyHidden>{label}</VisuallyHidden>
                        )}
                        {isSortable && (
                            <>
                                <Icon name={SORT_GLYPH[sortState]} className="plus-table-head-cell-sort" />
                                <VisuallyHidden>{`, ${SORT_STATE_TEXT[sortState]}`}</VisuallyHidden>
                            </>
                        )}
                    </>
                );
                if (isSortable) {
                    return (
                        <button
                            type="button"
                            className={classes(
                                'plus-table-head-cell-button',
                                sortState !== 'none' && 'plus-table-head-cell-button--sorted'
                            )}
                            onClick={() => onSort && onSort(NEXT_SORT[sortState])}
                        >
                            {body}
                        </button>
                    );
                }
                return (
                    <div className="plus-table-head-cell-inner" tabIndex={truncated ? 0 : undefined}>
                        {body}
                    </div>
                );
            }}
        </ClippedTooltip>
    );

    return (
        <th
            scope="col"
            className={cellClass}
            style={cellStyle}
            aria-sort={isSortable ? sortState : undefined}
            {...props}
        >
            {inner}
        </th>
    );
};

HeadCell.propTypes = {
    /** The column name. Read by assistive technology even when only the icon shows. */
    label: PropTypes.string.isRequired,
    /** Font Awesome Free name for the column's data type, such as `calendar`. */
    icon: PropTypes.string,
    /** Renders the sort button and sets `aria-sort` on the header. */
    isSortable: PropTypes.bool,
    /** The column's current sort, owned by the page. */
    sort: PropTypes.oneOf(['none', 'ascending', 'descending']),
    /** Called with the direction a press asks for: `ascending`, `descending` or `none`. */
    onSort: PropTypes.func,
    /** One line with an ellipsis and a tooltip while clipped. */
    shouldTruncate: PropTypes.bool,
    /** `text`, `number` or `icon`; the older `left`, `right`, `center`, `start`, `end` still map. */
    align: PropTypes.oneOf(['text', 'number', 'icon', 'left', 'right', 'center', 'start', 'end']),
    /** Column width as a CSS length; the label clips against it. */
    width: PropTypes.string,
    /** Draw the icon alone and keep the label for screen readers. */
    isIconOnlyHeader: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default HeadCell;
