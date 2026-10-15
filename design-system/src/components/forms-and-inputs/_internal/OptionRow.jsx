import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@/components/overlays/Tooltip/Tooltip';
import './OptionRow.scss';

/** The Figma row's Leading slot holds at most this many items. */
const MAX_LEADING = 4;

/**
 * Draws the row's selected mark, check or dot, without being a form control.
 * A real `<input>` inside an option would be a second focusable, unlabelled
 * control inside an interactive element, which ARIA forbids and axe flags.
 *
 * @param {object} props
 * @param {'checkbox'|'radio'} props.type
 * @param {boolean} props.checked
 * @param {boolean} [props.indeterminate] A parent with some children picked.
 * @returns {JSX.Element}
 */
const Mark = ({ type, checked, indeterminate = false }) => (
    <span
        aria-hidden="true"
        className={[
            'plus-option-row-check',
            `plus-option-row-check--${type}`,
            checked ? 'is-checked' : '',
            indeterminate && !checked ? 'is-indeterminate' : '',
        ].filter(Boolean).join(' ')}
    >
        {type === 'checkbox' && checked && <i className="fa-solid fa-check" />}
        {type === 'checkbox' && indeterminate && !checked && <i className="fa-solid fa-minus" />}
    </span>
);

Mark.propTypes = {
    type: PropTypes.oneOf(['checkbox', 'radio']).isRequired,
    checked: PropTypes.bool.isRequired,
    indeterminate: PropTypes.bool,
};

/**
 * A checkbox mark for a multi-select row. `indeterminate` is a tree parent
 * with some, not all, of its children picked.
 *
 * @param {{ checked: boolean, indeterminate?: boolean }} props
 * @returns {JSX.Element}
 */
const RowCheckbox = (props) => <Mark type="checkbox" {...props} />;
RowCheckbox.propTypes = { checked: PropTypes.bool.isRequired, indeterminate: PropTypes.bool };

/**
 * A radio mark for a row in a pick-one list that shows its alternatives.
 *
 * @param {{ checked: boolean }} props
 * @returns {JSX.Element}
 */
const RowRadio = ({ checked }) => <Mark type="radio" checked={checked} />;
RowRadio.propTypes = { checked: PropTypes.bool.isRequired };

/**
 * Tree depth as space, one step per level.
 *
 * @param {{ level: number }} props
 * @returns {JSX.Element}
 */
const RowIndent = ({ level }) => (
    <span
        aria-hidden="true"
        className="plus-option-row-indent"
        style={{ '--plus-option-row-level': level }}
    />
);
RowIndent.propTypes = { level: PropTypes.number.isRequired };

/**
 * The tree caret. A leaf draws an empty cell of the same size so labels line
 * up. Clicking it expands or collapses without choosing the row; the keyboard
 * route is the tree's own arrow keys, so the caret is not a tab stop.
 *
 * @param {object} props
 * @param {'collapsed'|'expanded'|'leaf'} props.state
 * @param {() => void} [props.onToggle]
 * @returns {JSX.Element}
 */
const RowToggle = ({ state, onToggle }) => (
    <span
        aria-hidden="true"
        className={`plus-option-row-toggle plus-option-row-toggle--${state}`}
        onClick={(event) => {
            if (state === 'leaf') return;
            event.stopPropagation();
            if (onToggle) onToggle();
        }}
    >
        {state !== 'leaf' && (
            <i className={`fa-solid ${state === 'expanded' ? 'fa-caret-down' : 'fa-caret-right'}`} />
        )}
    </span>
);
RowToggle.propTypes = {
    state: PropTypes.oneOf(['collapsed', 'expanded', 'leaf']).isRequired,
    onToggle: PropTypes.func,
};

/**
 * The chevron a Cascader row shows when it has a next column.
 *
 * @returns {JSX.Element}
 */
const RowChevron = () => <i aria-hidden="true" className="fa-solid fa-caret-right plus-option-row-chevron" />;

/**
 * OptionRow — the one row every option list draws: Select, TagInput, the
 * Cascader's columns and TreeSelect's levels. Figma calls it Dropdown list Item.
 *
 * Kinds:
 * - `option`: a value to pick (`role="option"`, or `treeitem` in a tree).
 * - `create`: "Create *text*", picked like an option.
 * - `group`: a heading over the options that follow it. Not focusable.
 *
 * The row fills its list's width, and its highlight spans the whole row.
 *
 * Focus works two ways. In a list that keeps focus itself and points at the
 * highlighted row with `aria-activedescendant`, leave `tabbable` unset: the row
 * takes no tab stop and `highlighted` draws the cursor. In a list where focus
 * moves row to row (roving tab stop), pass `tabbable` true to the one row at
 * the cursor and false to the rest; the row then chooses on Enter and Space.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
const OptionRow = ({
    kind = 'option',
    label,
    children,
    value,
    description,
    selected = false,
    disabled = false,
    highlighted = false,
    check = true,
    leading,
    trailing,
    tabbable,
    role,
    onSelect,
    onClick,
    onKeyDown,
    className = '',
    ref,
    ...props
}) => {
    const [truncated, setTruncated] = useState(false);
    const text = label ?? children;

    const leadingItems = React.Children.toArray(leading);
    if (leadingItems.length > MAX_LEADING && process.env.NODE_ENV !== 'production') {
        console.warn(`OptionRow: Leading holds at most ${MAX_LEADING} items; got ${leadingItems.length}.`);
    }

    const classes = [
        'plus-option-row',
        `plus-option-row--${kind}`,
        selected ? 'is-selected' : '',
        highlighted ? 'is-highlighted' : '',
        disabled ? 'is-disabled' : '',
        className,
    ].filter(Boolean).join(' ');

    if (kind === 'group') {
        return (
            <div ref={ref} className={classes} role="presentation" {...props}>
                <span className="plus-option-row-label">{text}</span>
            </div>
        );
    }

    const choose = () => {
        if (!disabled && onSelect) onSelect(value);
    };

    let tabIndex;
    if (tabbable !== undefined) tabIndex = tabbable && !disabled ? 0 : -1;

    const labelNode = (
        <span
            className="plus-option-row-label"
            onMouseEnter={(event) => {
                const node = event.currentTarget;
                setTruncated(node.scrollWidth > node.clientWidth);
            }}
            onMouseLeave={() => setTruncated(false)}
        >
            {kind === 'create' && <><span className="plus-option-row-create-verb">Create</span>{' '}</>}
            {text}
        </span>
    );

    return (
        <div
            ref={ref}
            className={classes}
            role={role || 'option'}
            aria-selected={selected}
            aria-disabled={disabled || undefined}
            tabIndex={tabIndex}
            onClick={(event) => {
                if (onClick) onClick(event);
                choose();
            }}
            onKeyDown={(event) => {
                if (onKeyDown) onKeyDown(event);
                if (event.defaultPrevented || tabbable === undefined) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    choose();
                }
            }}
            {...props}
        >
            {kind === 'create' && (
                <span className="plus-option-row-leading">
                    <i aria-hidden="true" className="fa-solid fa-plus" />
                </span>
            )}
            {kind === 'option' && leadingItems.length > 0 && (
                <span className="plus-option-row-leading">{leadingItems}</span>
            )}
            <span className="plus-option-row-content">
                <Tooltip text={text} show={truncated}>
                    {labelNode}
                </Tooltip>
                {description && <span className="plus-option-row-description">{description}</span>}
            </span>
            {(trailing || (kind === 'option' && selected && check)) && (
                <span className="plus-option-row-trailing">
                    {trailing}
                    {kind === 'option' && selected && check && (
                        <i aria-hidden="true" className="fa-solid fa-check plus-option-row-selected-mark" />
                    )}
                </span>
            )}
        </div>
    );
};

OptionRow.propTypes = {
    /** `option` picks a value, `create` makes one, `group` heads the rows after it. */
    kind: PropTypes.oneOf(['option', 'create', 'group']),
    /** The row's text. `children` is read when `label` is missing. */
    label: PropTypes.node,
    children: PropTypes.node,
    /** Passed to `onSelect`. */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** A second line, such as an email or a school, to tell two rows apart. */
    description: PropTypes.node,
    selected: PropTypes.bool,
    disabled: PropTypes.bool,
    /** The keyboard cursor in a list that uses `aria-activedescendant`. */
    highlighted: PropTypes.bool,
    /** Draws a check at the end of a selected row. Multi-select lists turn it off and use a checkbox. */
    check: PropTypes.bool,
    /** Up to 4 items: `OptionRow.Indent`, `.Toggle`, `.Checkbox`, `.Radio`, an icon, an avatar or a drag handle. */
    leading: PropTypes.node,
    /** One item: a Count, a "…" menu, or `OptionRow.Chevron`. */
    trailing: PropTypes.node,
    /** Roving tab stop: true on the row at the cursor, false on the rest. Unset under `aria-activedescendant`. */
    tabbable: PropTypes.bool,
    /** `option` by default; `treeitem` inside a tree. */
    role: PropTypes.oneOf(['option', 'treeitem']),
    /** Called with `value` on click, and on Enter or Space when the row holds focus. */
    onSelect: PropTypes.func,
    onClick: PropTypes.func,
    onKeyDown: PropTypes.func,
    className: PropTypes.string,
    ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

OptionRow.Checkbox = RowCheckbox;
OptionRow.Radio = RowRadio;
OptionRow.Indent = RowIndent;
OptionRow.Toggle = RowToggle;
OptionRow.Chevron = RowChevron;

export default OptionRow;
