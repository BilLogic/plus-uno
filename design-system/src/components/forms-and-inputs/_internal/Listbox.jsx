import React, {
    useCallback,
    useEffect,
    useId,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Spinner from '@/components/loading/Spinner/Spinner';
import OptionRow from './OptionRow';
import { popupLayerOf, useAnchoredPopup } from './anchorPlacement';
import './Listbox.scss';

/** Past this many options, only the rows on screen are drawn. */
export const VIRTUALIZE_ABOVE = 100;
/** Rows drawn beyond each edge of the visible window while virtualized. */
const OVERSCAN = 6;
/** A row's height before one has been measured. */
const FALLBACK_ROW_HEIGHT = 36;

/**
 * One shape for every option, whether the caller passed a string or an object.
 *
 * @param {string|object} option
 * @param {number} index Its place in the caller's array, which keeps its id stable while filtering.
 * @returns {{ value: *, label: *, text: string, description?: *, disabled: boolean, group?: string, leading?: *, trailing?: *, index: number, source: * }}
 */
const normalize = (option, index) => {
    if (typeof option === 'string' || typeof option === 'number') {
        return { value: option, label: option, text: String(option), disabled: false, index, source: option };
    }
    const label = option.label ?? option.text ?? String(option.value);
    return {
        value: option.value ?? label,
        label,
        text: typeof label === 'string' ? label : String(option.value ?? ''),
        description: option.description,
        disabled: Boolean(option.disabled),
        group: option.group,
        leading: option.leading,
        trailing: option.trailing,
        dragging: Boolean(option.dragging),
        dropIndicator: option.dropIndicator,
        index,
        source: option,
    };
};

/** Text fields keep their own Space, Home and End. */
const isTextEntry = (target) => target instanceof HTMLElement
    && (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && !['checkbox', 'radio', 'button'].includes(target.type)));

/**
 * Listbox — the internal option list (Figma `_Listbox`). It is the panel under
 * a field for picking a value, and it is not exported from the barrel.
 *
 * - **Surface:** `elevation.surface.overlay` with `elevation.shadow.overlay`, as tall as its rows up to 300px, then the body scrolls.
 * - **Slots:** `header` (a hint or a search field), the body of rows, and `footer`.
 * - **Rows:** `OptionRow` for every option, group heading and the Create row.
 *   `rowActions` draws a row's own controls (a drag handle, a "…") over the
 *   highlighted row.
 * - **Placement:** with `anchorRef` it renders in a portal on `document.body`
 *   (or in the modal its field sits in, so it takes the modal's layer)
 *   and follows the popup placement rule through `useAnchoredPopup`: at least
 *   as wide as the anchor, flipped above it when there isn't room below, and
 *   right-aligned when it would run past the viewport. Without one it renders
 *   in place.
 * - **Focus:** without `anchorRef` the list is one tab stop and walks its rows
 *   with `aria-activedescendant`. With one, focus stays in the field: the field
 *   calls `ref.current.handleKeyDown(event)` and sets `aria-activedescendant`
 *   from `onActiveChange`.
 * - **Keys:** ↑ ↓ Home End move; Enter picks (Space too, outside a text field);
 *   Esc clears the typed filter and closes, and leaves the value alone.
 * - **Long lists:** past 100 options only the rows on screen are drawn, with
 *   `aria-setsize` and `aria-posinset` so a screen reader keeps its place.
 *
 * @param {object} props
 * @returns {JSX.Element|null}
 */
const Listbox = ({
    id,
    options = [],
    mode = 'single',
    value,
    defaultValue,
    onChange,
    filter = '',
    onFilterChange,
    onCreate,
    createLabel,
    open = true,
    onClose,
    anchorRef,
    align = 'left',
    header,
    footer,
    rowActions,
    rowActionsIndex,
    loading = false,
    error,
    emptyMessage = 'No results',
    embedded = false,
    onActiveChange,
    className = '',
    style,
    ref,
    ...props
}) => {
    const autoId = useId();
    const baseId = id || `plus-listbox-${autoId.replace(/:/g, '')}`;
    const multi = mode === 'multi';

    const [internal, setInternal] = useState(defaultValue !== undefined ? defaultValue : (multi ? [] : null));
    const controlled = value !== undefined;
    const current = controlled ? value : internal;
    const isSelected = useCallback(
        (optionValue) => (multi ? Array.isArray(current) && current.includes(optionValue) : current === optionValue),
        [multi, current]
    );

    /* ---------- the rows: filtered options, then the Create row ---------- */
    const all = useMemo(() => options.map(normalize), [options]);
    const query = filter.trim().toLowerCase();
    const shown = useMemo(
        () => (query ? all.filter((option) => option.text.toLowerCase().includes(query)) : all),
        [all, query]
    );
    const canCreate = Boolean(onCreate) && query.length > 0
        && !all.some((option) => option.text.trim().toLowerCase() === query);
    const createId = `${baseId}-create`;
    const optionId = (option) => `${baseId}-option-${option.index}`;

    /** What the cursor can land on, in order: enabled options, then Create. */
    const stops = useMemo(() => {
        const list = shown.filter((option) => !option.disabled).map((option) => ({ id: optionId(option), option }));
        if (canCreate) list.push({ id: createId, create: true });
        return list;
    }, [shown, canCreate, createId, baseId]);

    /* ---------- the cursor ---------- */
    const [activeId, setActiveId] = useState(null);
    const scrollOnMove = useRef(false);
    const firstSelected = shown.find((option) => !option.disabled && isSelected(option.value));
    const resolvedActive = stops.some((stop) => stop.id === activeId)
        ? activeId
        : (firstSelected && !query ? optionId(firstSelected) : stops[0]?.id ?? null);

    // A new filter puts the cursor back on the first match.
    // So does opening the list again: it starts at the value, or at the top.
    useEffect(() => { setActiveId(null); }, [query, open]);
    useEffect(() => { if (onActiveChange) onActiveChange(open ? resolvedActive ?? undefined : undefined); }, [resolvedActive, open, onActiveChange]);

    const move = (index) => {
        if (!stops.length) return;
        const next = Math.min(Math.max(index, 0), stops.length - 1);
        scrollOnMove.current = true;
        setActiveId(stops[next].id);
    };

    /* ---------- choosing ---------- */
    const choose = (option) => {
        if (!option || option.disabled) return;
        let next;
        if (multi) {
            const list = Array.isArray(current) ? current : [];
            next = list.includes(option.value) ? list.filter((v) => v !== option.value) : [...list, option.value];
        } else {
            next = option.value;
        }
        if (!controlled) setInternal(next);
        if (onChange) onChange(next, option.source);
        if (!multi && onClose) onClose('select');
    };

    const create = () => {
        if (canCreate) onCreate(filter.trim());
    };

    const pick = (stopId) => {
        const stop = stops.find((s) => s.id === stopId);
        if (!stop) return;
        if (stop.create) create();
        else choose(stop.option);
    };

    /**
     * The listbox keyboard contract. Returns true when it used the key, so a
     * field forwarding its keys knows to leave them alone.
     *
     * @param {React.KeyboardEvent|KeyboardEvent} event
     * @returns {boolean}
     */
    const handleKeyDown = (event) => {
        const at = stops.findIndex((stop) => stop.id === resolvedActive);
        const typing = isTextEntry(event.target);
        const done = () => { event.preventDefault(); return true; };
        switch (event.key) {
            case 'ArrowDown': move(at + 1); return done();
            case 'ArrowUp': move(at - 1); return done();
            case 'Home':
                if (typing && event.target.value) return false;
                move(0); return done();
            case 'End':
                if (typing && event.target.value) return false;
                move(stops.length - 1); return done();
            case 'Enter':
                if (!resolvedActive) return false;
                pick(resolvedActive); return done();
            case ' ':
                if (typing || !resolvedActive) return false;
                pick(resolvedActive); return done();
            case 'Escape':
                if (onFilterChange && filter) onFilterChange('');
                if (onClose) onClose('escape');
                return done();
            default:
                return false;
        }
    };

    /**
     * Puts the cursor on an option by its place in `options`, as a field does
     * after it moves or reveals one.
     *
     * @param {number} index
     */
    const highlight = (index) => {
        const stop = stops.find((s) => s.option && s.option.index === index);
        if (!stop) return;
        scrollOnMove.current = true;
        setActiveId(stop.id);
    };

    useImperativeHandle(ref, () => ({ handleKeyDown, highlight }));

    /* ---------- placement ---------- */
    const surfaceRef = useRef(null);
    const bodyRef = useRef(null);
    // Placed against the field; a press outside the field and the list closes it.
    const place = useAnchoredPopup({ open, anchorRef, popupRef: surfaceRef, align, onClose });

    /* ---------- the row's own controls ---------- */
    // Drawn over one row, beside the listbox rather than inside it: an option's
    // children are presentational, so a button in one would be lost to a
    // screen reader (axe: nested-interactive).
    const actionsOption = rowActions
        ? (rowActionsIndex !== undefined
            ? shown.find((option) => option.index === rowActionsIndex)
            : shown.find((option) => optionId(option) === resolvedActive))
        : undefined;
    const actions = actionsOption ? rowActions(actionsOption.source, actionsOption.index) : null;
    const actionsRowId = actions ? optionId(actionsOption) : null;
    const [actionsBox, setActionsBox] = useState(null);
    useLayoutEffect(() => {
        const rowNode = actionsRowId ? bodyRef.current?.querySelector(`#${CSS.escape(actionsRowId)}`) : null;
        const next = rowNode ? { top: rowNode.offsetTop, height: rowNode.offsetHeight } : null;
        setActionsBox((prev) => (
            prev && next && prev.top === next.top && prev.height === next.height ? prev : next
        ));
    });

    /* ---------- virtualization ---------- */
    const virtual = shown.length > VIRTUALIZE_ABOVE;
    const [rowHeight, setRowHeight] = useState(FALLBACK_ROW_HEIGHT);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewport, setViewport] = useState(300);

    useLayoutEffect(() => {
        if (!virtual || !bodyRef.current) return;
        const row = bodyRef.current.querySelector('.plus-option-row--option');
        if (row && row.offsetHeight && row.offsetHeight !== rowHeight) setRowHeight(row.offsetHeight);
        if (bodyRef.current.clientHeight) setViewport(bodyRef.current.clientHeight);
    });

    // Keep the cursor's row on screen after a keyboard move.
    useLayoutEffect(() => {
        if (!scrollOnMove.current || !bodyRef.current || !resolvedActive) return;
        scrollOnMove.current = false;
        const body = bodyRef.current;
        if (virtual) {
            const at = shown.findIndex((option) => optionId(option) === resolvedActive);
            if (at < 0) return;
            const top = at * rowHeight;
            if (top < body.scrollTop) body.scrollTop = top;
            else if (top + rowHeight > body.scrollTop + body.clientHeight) body.scrollTop = top + rowHeight - body.clientHeight;
            setScrollTop(body.scrollTop);
            return;
        }
        const row = surfaceRef.current?.querySelector(`#${CSS.escape(resolvedActive)}`);
        if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
    });

    /* ---------- live announcements ---------- */
    let announcement = '';
    if (loading) announcement = 'Loading';
    else if (error) announcement = typeof error === 'string' ? error : 'Failed to load';
    else if (query) announcement = `${shown.length} ${shown.length === 1 ? 'result' : 'results'}`;

    /* ---------- rendering ---------- */
    const row = (option, extra = {}) => {
        const rowId = optionId(option);
        const selected = isSelected(option.value);
        const leading = [];
        if (option.leading) leading.push(...React.Children.toArray(option.leading));
        if (multi) leading.unshift(<OptionRow.Checkbox key="__check" checked={selected} />);
        return (
            <OptionRow
                key={rowId}
                id={rowId}
                value={option.value}
                label={option.label}
                description={option.description}
                selected={selected}
                disabled={option.disabled}
                highlighted={rowId === resolvedActive}
                check={!multi}
                dragging={option.dragging}
                dropIndicator={option.dropIndicator}
                leading={leading.length ? leading : undefined}
                trailing={option.trailing}
                onSelect={() => choose(option)}
                onMouseMove={() => { if (!option.disabled && rowId !== resolvedActive) setActiveId(rowId); }}
                {...extra}
            />
        );
    };

    let message = null;
    let rows = null;
    if (loading) {
        message = <ListboxMessage kind="loading">Loading…</ListboxMessage>;
    } else if (error) {
        message = <ListboxMessage kind="error">{error}</ListboxMessage>;
    } else if (shown.length === 0) {
        message = <ListboxMessage kind="empty">{emptyMessage}</ListboxMessage>;
    } else if (virtual) {
        const first = Math.max(Math.floor(scrollTop / rowHeight) - OVERSCAN, 0);
        const last = Math.min(Math.ceil((scrollTop + viewport) / rowHeight) + OVERSCAN, shown.length);
        rows = (
            <>
                <div aria-hidden="true" style={{ height: first * rowHeight }} />
                {shown.slice(first, last).map((option, offset) => row(option, {
                    'aria-setsize': shown.length,
                    'aria-posinset': first + offset + 1,
                }))}
                <div aria-hidden="true" style={{ height: (shown.length - last) * rowHeight }} />
            </>
        );
    } else {
        // Consecutive options with the same `group` sit under one heading.
        const runs = [];
        shown.forEach((option) => {
            const last = runs[runs.length - 1];
            if (last && last.group === option.group) last.options.push(option);
            else runs.push({ group: option.group, options: [option] });
        });
        rows = runs.map((run, index) => {
            if (!run.group) return run.options.map((option) => row(option));
            const headingId = `${baseId}-group-${index}`;
            return (
                <div key={headingId} role="group" aria-labelledby={headingId}>
                    <OptionRow kind="group" id={headingId} label={run.group} />
                    {run.options.map((option) => row(option))}
                </div>
            );
        });
    }

    const standalone = !anchorRef;
    const surfaceClasses = [
        'plus-listbox',
        embedded ? 'plus-listbox--embedded' : '',
        anchorRef ? 'plus-listbox--floating' : '',
        className,
    ].filter(Boolean).join(' ');

    const surface = (
        <div
            ref={surfaceRef}
            className={surfaceClasses}
            data-placement={anchorRef ? place?.placement ?? 'bottom' : undefined}
            style={anchorRef ? {
                top: place?.top ?? 0,
                left: place?.left ?? 0,
                minWidth: place?.minWidth,
                visibility: place ? undefined : 'hidden',
                ...style,
            } : style}
            // Keep focus in the field while a row is pressed.
            onMouseDown={anchorRef ? (event) => event.preventDefault() : undefined}
        >
            {header && <div className="plus-listbox-header">{header}</div>}
            <div
                ref={bodyRef}
                className="plus-listbox-body"
                // The field keeps focus and scrolls the list with the arrow
                // keys. A scroll area with no focusable content must still be
                // reachable (axe: scrollable-region-focusable), as Modal's
                // body is; in a portal at the end of the page it is the last
                // tab stop, and it answers the same keys as the field.
                tabIndex={standalone ? undefined : 0}
                onKeyDown={standalone ? undefined : handleKeyDown}
                onScroll={virtual ? (event) => setScrollTop(event.currentTarget.scrollTop) : undefined}
            >
                {/* A message is not an option, so it sits beside the listbox, above any Create row. */}
                {message}
                <div
                    id={baseId}
                    className="plus-listbox-options"
                    role="listbox"
                    aria-multiselectable={multi || undefined}
                    aria-busy={loading || undefined}
                    aria-activedescendant={standalone ? resolvedActive ?? undefined : undefined}
                    tabIndex={standalone ? 0 : -1}
                    onKeyDown={standalone ? handleKeyDown : undefined}
                    {...props}
                >
                    {rows}
                    {canCreate && (
                        <OptionRow
                            kind="create"
                            id={createId}
                            label={createLabel ? createLabel(filter.trim()) : filter.trim()}
                            highlighted={createId === resolvedActive}
                            onSelect={create}
                            onMouseMove={() => { if (createId !== resolvedActive) setActiveId(createId); }}
                        />
                    )}
                </div>
                {actions && (
                    <div
                        className="plus-listbox-row-actions"
                        style={actionsBox ? { top: actionsBox.top, height: actionsBox.height } : { visibility: 'hidden' }}
                        // The controls answer their own keys; the list's must not see them.
                        onKeyDown={(event) => event.stopPropagation()}
                    >
                        {actions}
                    </div>
                )}
            </div>
            {footer && <div className="plus-listbox-footer">{footer}</div>}
        </div>
    );

    return (
        <>
            {open && (anchorRef ? createPortal(surface, popupLayerOf(anchorRef)) : surface)}
            <div className="visually-hidden" role="status" aria-live="polite">{open ? announcement : ''}</div>
        </>
    );
};

/**
 * A message row in the list's body or footer: loading, no results, failed to
 * load, a count ("Showing 50 of 312") or a limit ("You can pick up to 5").
 *
 * @param {object} props
 * @param {'loading'|'empty'|'error'|'count'|'limit'} props.kind
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const ListboxMessage = ({ kind, children }) => (
    <div className={`plus-listbox-message plus-listbox-message--${kind}`} role="presentation">
        {kind === 'loading' && <Spinner size="sm" role="presentation" />}
        {kind === 'error' && <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />}
        <span>{children}</span>
    </div>
);

ListboxMessage.propTypes = {
    kind: PropTypes.oneOf(['loading', 'empty', 'error', 'count', 'limit']).isRequired,
    children: PropTypes.node,
};

Listbox.Message = ListboxMessage;

Listbox.propTypes = {
    /** The listbox element's id; a field points `aria-controls` at it. */
    id: PropTypes.string,
    /**
     * Strings, or objects with `value`, `label` (or `text`), `description`,
     * `disabled`, `group` (consecutive options with one group share a heading),
     * `leading` and `trailing`.
     */
    options: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            label: PropTypes.node,
            text: PropTypes.string,
            description: PropTypes.node,
            disabled: PropTypes.bool,
            group: PropTypes.string,
            leading: PropTypes.node,
            trailing: PropTypes.node,
            dragging: PropTypes.bool,
            dropIndicator: PropTypes.oneOf(['before', 'after']),
        }),
    ])),
    /** `multi` draws a checkbox on each row and keeps the list open on a pick. */
    mode: PropTypes.oneOf(['single', 'multi']),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
    /** `(next, option)`; `next` is an array in multi mode. */
    onChange: PropTypes.func,
    /** The text typed in the field; rows whose label contains it are shown. */
    filter: PropTypes.string,
    /** Esc calls it with '' to clear the typed text. */
    onFilterChange: PropTypes.func,
    /** Offers a "Create *text*" row when nothing matches the filter exactly, ignoring case. */
    onCreate: PropTypes.func,
    /** `(text)`: what the Create row shows after "Create". Defaults to the text. */
    createLabel: PropTypes.func,
    open: PropTypes.bool,
    /** `(reason, event)`: 'select', 'escape' or 'outside'; an outside press passes its pointer event. */
    onClose: PropTypes.func,
    /** The field to place against. Renders in a portal when set. */
    anchorRef: PropTypes.shape({ current: PropTypes.any }),
    /** Which edge meets the anchor's: `right` for a menu opened from a button at a row's end. */
    align: PropTypes.oneOf(['left', 'center', 'right']),
    header: PropTypes.node,
    footer: PropTypes.node,
    /**
     * `(option, index)`: controls for one row, such as a drag handle and a "…"
     * button. They are drawn over the highlighted row, beside the listbox
     * rather than inside the option, so they stay real buttons.
     */
    rowActions: PropTypes.func,
    /** Keeps `rowActions` on the option at this place in `options`, as while its menu is open. */
    rowActionsIndex: PropTypes.number,
    loading: PropTypes.bool,
    error: PropTypes.node,
    emptyMessage: PropTypes.node,
    /** Draws no surface of its own, for a list inside another menu. */
    embedded: PropTypes.bool,
    /** `(id)` of the highlighted row, for the field's `aria-activedescendant`. */
    onActiveChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

export default Listbox;
