import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import TextField from '../TextField/TextField';
import Select from '../Select/Select';
import { IconButton } from '../IconButton/IconButton';
import Icon from '../../images-and-icons/Icon';
import Spinner from '../../loading/Spinner/Spinner';
import Popup from '../../overlays-and-layering/Popup/Popup';
import OptionRow from '../_internal/OptionRow';
import { iconClass } from '../../../lib/icon';
import './SearchField.scss';

export const SEARCH_FIELD_SPACINGS = ['default', 'compact'];
export const SEARCH_FIELD_MODES = ['active', 'basic', 'focused'];
/** How long typing pauses before `loadResults` is asked, in ms. A typing pause, not a motion value. */
export const SEARCH_DEBOUNCE_MS = 250;
/** `loadResults` asks for this many results at a time. */
const PAGE_SIZE = 50;

const ALL = 'all';

/**
 * The focused panel's last row, an action such as "Create student". Pass it as
 * a child of `SearchField`: it carries `onSelect` and its children are the row's
 * text; the field draws the row and puts it in the keyboard order.
 */
export const SearchFieldAction = () => null;
SearchFieldAction.propTypes = {
    /** Called when the row is chosen. */
    onSelect: PropTypes.func,
    /** The row's text, such as `Create student "Ada"`. */
    children: PropTypes.node,
};

/**
 * Search field: find a record by typing. It is a TextField with a search icon
 * before the text and a clear button after it, and its label is hidden: the
 * placeholder names the scope ("Search students").
 *
 * `mode="active"` reports the text on every keystroke through `onValueChange`.
 * Hold the rows yourself and filter them (sync), or give `loadResults` for a
 * list on a server (async): it is asked after a short pause, and what it
 * returns goes to `onResults`. Results show in the results area, never under
 * the field. While results load, a Spinner takes the search icon's place.
 *
 * `isCollapsible` starts as an icon button that grows into the field and
 * collapses when left empty. Esc clears the text; a second Esc closes the
 * field and returns focus to the icon.
 *
 * `scopes` puts a scope filter before the field, with "All" first and selected.
 *
 * `mode="basic"` runs `onSearch(text)` on Enter and does no work per keystroke.
 *
 * `mode="focused"` opens a panel (a Popup) under the field. On focus with no
 * text it lists `recent` searches; while typing it lists matches grouped by
 * type, then a last "See all" row that acts as a basic search. Arrow keys move
 * through the rows, Enter chooses, Esc closes the panel. A `SearchFieldAction`
 * child is the optional last row.
 */
const SearchField = ({
    placeholder,
    label,
    mode = 'active',
    value: valueProp,
    defaultValue = '',
    onValueChange,
    loadResults,
    onResults,
    onSearch,
    results,
    recent,
    onSelect,
    children,
    isLoading = false,
    isCollapsible = false,
    defaultOpen = false,
    scopes,
    scope: scopeProp,
    defaultScope = ALL,
    onScopeChange,
    spacing = 'default',
    isDisabled = false,
    clearLabel = 'Clear search',
    panelLabel = 'Suggestions',
    recentLabel = 'Recent searches',
    noMatchesLabel = 'No matches for',
    seeAllLabel = 'See all results for',
    defaultPanelOpen = false,
    panelContainer,
    scopeLabel = 'Search scope',
    inputRef: inputRefProp,
    className = '',
    testId,
    ...props
}) => {
    const controlled = valueProp !== undefined;
    const [ownValue, setOwnValue] = useState(defaultValue);
    const value = controlled ? valueProp : ownValue;
    const hasText = value !== '';

    const scopeControlled = scopeProp !== undefined;
    const [ownScope, setOwnScope] = useState(defaultScope);
    const scope = scopeControlled ? scopeProp : ownScope;

    /* ---------- collapsed or open ---------- */
    const [expanded, setExpanded] = useState(defaultOpen || hasText);
    const open = !isCollapsible || expanded || hasText;
    // Which way it last moved; neither on first render.
    const [motion, setMotion] = useState(null);

    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const iconRef = useRef(null);
    const focusNext = useRef(null);

    useEffect(() => {
        if (focusNext.current === 'field') inputRef.current?.focus();
        if (focusNext.current === 'icon') iconRef.current?.querySelector('button')?.focus();
        focusNext.current = null;
    });

    const setValue = (next) => {
        if (!controlled) setOwnValue(next);
        if (onValueChange) onValueChange(next);
    };

    const collapse = () => {
        setExpanded(false);
        setMotion('shrink');
    };
    const openField = () => {
        focusNext.current = 'field';
        setMotion('grow');
        setExpanded(true);
    };
    const clear = () => {
        setExpanded(true);
        setValue('');
        focusNext.current = 'field';
    };
    const close = () => {
        focusNext.current = 'icon';
        collapse();
    };

    // Text cleared from outside (Reset filters) while focus is elsewhere: back to the icon.
    const hadText = useRef(hasText);
    useEffect(() => {
        const cleared = hadText.current && !hasText;
        hadText.current = hasText;
        if (isCollapsible && cleared && !rootRef.current?.contains(document.activeElement)) collapse();
    }, [hasText]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ---------- the focused panel ---------- */
    const focusedMode = mode === 'focused';
    const trimmed = value.trim();
    const [panelOpen, setPanelOpen] = useState(defaultPanelOpen);
    const [cursor, setCursor] = useState(-1);
    const listId = useId();
    const actions = React.Children.toArray(children).filter((child) => child?.type === SearchFieldAction);
    const groups = (results || []).filter((group) => group.items?.length > 0);
    const rows = [];
    if (focusedMode) {
        if (!trimmed) {
            (recent || []).forEach((text) => rows.push({ kind: 'recent', text }));
        } else {
            groups.forEach((group) => group.items.forEach((item) => rows.push({ kind: 'result', group, item })));
            rows.push({ kind: 'seeAll' });
            actions.forEach((action) => rows.push({ kind: 'action', action }));
        }
    }
    const panelShown = focusedMode && panelOpen && !isDisabled && (trimmed ? true : rows.length > 0);
    const rowId = (index) => `${listId}-row-${index}`;
    const activeId = panelShown && cursor >= 0 && cursor < rows.length ? rowId(cursor) : undefined;

    // The rows change under the cursor (a later answer arrives): the cursor starts over.
    const rowKey = rows.map((row) => row.text ?? row.item?.value ?? row.kind).join('\u0000');
    useEffect(() => { setCursor(-1); }, [rowKey]);
    // The row under the cursor stays in view in a long panel.
    useEffect(() => {
        if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
    }, [activeId]);

    const closePanel = () => {
        setPanelOpen(false);
        setCursor(-1);
    };
    const runSearch = () => {
        if (onSearch) onSearch(value);
        closePanel();
    };
    const choose = (row) => {
        if (row.kind === 'recent') {
            setValue(row.text);
            setCursor(-1);
            inputRef.current?.focus();
            return;
        }
        if (row.kind === 'result' && onSelect) onSelect(row.item, row.group);
        if (row.kind === 'seeAll') {
            runSearch();
            return;
        }
        if (row.kind === 'action' && row.action.props.onSelect) row.action.props.onSelect(value);
        closePanel();
    };

    const handleKeyDown = (event) => {
        if (mode === 'basic' && event.key === 'Enter') {
            event.preventDefault();
            if (onSearch) onSearch(value);
            return;
        }
        if (focusedMode) {
            // Tab leaves the field: the panel is not a stop in the order, so it closes.
            if (event.key === 'Tab') {
                closePanel();
                return;
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (!panelShown) {
                    setPanelOpen(true);
                    return;
                }
                const step = event.key === 'ArrowDown' ? 1 : -1;
                setCursor((now) => (rows.length === 0 ? -1 : (now + step + rows.length + (now < 0 && step < 0 ? 1 : 0)) % rows.length));
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                if (!panelShown) {
                    if (trimmed) runSearch();
                    return;
                }
                if (cursor >= 0 && rows[cursor]) choose(rows[cursor]);
                else if (trimmed) runSearch();
                return;
            }
            // Esc closes the open panel first; the next one clears, as in active mode.
            if (event.key === 'Escape' && panelShown) {
                event.preventDefault();
                event.stopPropagation();
                closePanel();
                return;
            }
        }
        if (event.key !== 'Escape') return;
        // The browser's own Esc on a search input would clear without telling us.
        event.preventDefault();
        if (hasText) {
            event.stopPropagation();
            clear();
        } else if (isCollapsible) {
            event.stopPropagation();
            close();
        }
    };

    const handleBlur = (event) => {
        if (event.relatedTarget?.closest?.('.plus-search-field__panel')) return;
        if (focusedMode && !rootRef.current?.contains(event.relatedTarget)) closePanel();
        if (hasText || !isCollapsible) return;
        if (rootRef.current?.contains(event.relatedTarget)) return;
        // The scope list renders in a popup layer outside the root; focus inside it is not leaving.
        if (event.relatedTarget?.closest?.('.plus-listbox')) return;
        collapse();
    };

    /* ---------- loadResults ---------- */
    const [busy, setBusy] = useState(false);
    const request = useRef(0);
    const loadRef = useRef(loadResults);
    loadRef.current = loadResults;
    const resultsRef = useRef(onResults);
    resultsRef.current = onResults;
    const hasLoader = Boolean(loadResults);
    const first = useRef(true);
    useEffect(() => {
        if (!hasLoader) return undefined;
        // The first request goes at once; later ones wait for a pause in typing.
        const wait = first.current ? 0 : SEARCH_DEBOUNCE_MS;
        first.current = false;
        // A new keystroke retires any request still in flight.
        const ticket = ++request.current;
        const timer = setTimeout(() => {
            setBusy(true);
            const options = { offset: 0, limit: PAGE_SIZE, ...(scopes ? { scope } : {}) };
            Promise.resolve(loadRef.current(value, options)).then((result) => {
                if (ticket !== request.current) return;
                setBusy(false);
                if (resultsRef.current) resultsRef.current(result);
            }, () => {
                if (ticket === request.current) setBusy(false);
            });
        }, wait);
        return () => {
            clearTimeout(timer);
            // Unmount: a late answer must not set state or call `onResults`.
            request.current += 1;
        };
    }, [value, scope, hasLoader, Boolean(scopes)]); // eslint-disable-line react-hooks/exhaustive-deps

    const loading = isLoading || busy;
    const name = label ?? placeholder;

    /* ---------- parts ---------- */
    const scopeOptions = scopes
        ? [
            ...(scopes.some((item) => item.value === ALL) ? [] : [{ value: ALL, label: 'All' }]),
            ...scopes,
        ].map((item) => ({
            value: item.value,
            label: item.count === undefined ? item.label : `${item.label} (${item.count})`,
            text: item.count === undefined ? item.label : `${item.label} (${item.count})`,
        }))
        : null;
    // "All" leads, wherever the caller put it.
    if (scopeOptions) scopeOptions.sort((a, b) => (b.value === ALL) - (a.value === ALL));

    const renderRows = () => {
        let index = -1;
        const rowFor = (row, props) => {
            index += 1;
            const at = index;
            return (
                <OptionRow
                    key={at}
                    id={rowId(at)}
                    highlighted={cursor === at}
                    spacing="compact"
                    onMouseEnter={() => setCursor(at)}
                    onSelect={() => choose(row)}
                    {...props}
                />
            );
        };
        if (!trimmed) {
            return [
                <OptionRow key="head" kind="group" label={recentLabel} />,
                ...rows.map((row) => rowFor(row, { label: row.text, elemBefore: <Icon name="clock-rotate-left" /> })),
            ];
        }
        const out = [];
        if (groups.length === 0) {
            out.push(<div key="none" className="plus-search-field__none">{`${noMatchesLabel} \u201C${trimmed}\u201D`}</div>);
        }
        groups.forEach((group) => {
            out.push(
                <OptionRow
                    key={`g-${group.value}`}
                    kind="group"
                    label={group.count === undefined ? group.label : `${group.label} (${group.count})`}
                />,
            );
            group.items.forEach((item) => {
                out.push(rowFor(
                    { kind: 'result', group, item },
                    { label: item.label, description: item.description, elemBefore: item.icon ? <Icon name={item.icon} /> : undefined },
                ));
            });
        });
        out.push(rowFor({ kind: 'seeAll' }, { label: `${seeAllLabel} \u201C${trimmed}\u201D`, elemBefore: <Icon name="magnifying-glass" /> }));
        actions.forEach((action) => out.push(rowFor({ kind: 'action', action }, { label: action.props.children })));
        return out;
    };

    const field = (
        <TextField
            label={name}
            isLabelHidden
            placeholder={placeholder}
            type="search"
            spacing={spacing}
            isDisabled={isDisabled}
            className="plus-search-field__field"
            inputRef={(node) => {
                inputRef.current = node;
                if (typeof inputRefProp === 'function') inputRefProp(node);
                else if (inputRefProp) inputRefProp.current = node;
            }}
            value={value}
            onChange={(event) => {
                setValue(event.target.value);
                if (focusedMode) {
                    setPanelOpen(true);
                    setCursor(-1);
                }
            }}
            onFocus={focusedMode ? () => setPanelOpen(true) : undefined}
            onClick={focusedMode ? () => setPanelOpen(true) : undefined}
            onKeyDown={handleKeyDown}
            {...(focusedMode ? {
                role: 'combobox',
                'aria-expanded': panelShown,
                'aria-controls': panelShown ? listId : undefined,
                'aria-activedescendant': activeId,
                'aria-autocomplete': 'list',
                autoComplete: 'off',
            } : {})}
            testId={testId}
            elemBeforeInput={loading
                ? <Spinner size={16} label="Searching" className="plus-search-field__spinner" />
                : <i className={iconClass('magnifying-glass')} aria-hidden="true" />}
            elemAfterInput={hasText && !isDisabled ? (
                <IconButton
                    icon="xmark"
                    label={clearLabel}
                    appearance="subtle"
                    spacing="compact"
                    className="plus-search-field__clear"
                    onClick={clear}
                />
            ) : null}
        />
    );

    return (
        <div
            ref={rootRef}
            className={clsx(
                'plus-search-field',
                `plus-search-field--${spacing}`,
                open ? 'plus-search-field--open' : 'plus-search-field--closed',
                motion && `plus-search-field--${motion}`,
                className,
            )}
            onBlur={open && (isCollapsible || focusedMode) ? handleBlur : undefined}
            data-mode={mode}
            {...props}
        >
            {open ? (
                <>
                    {scopeOptions && (
                        <Select
                            aria-label={scopeLabel}
                            className="plus-search-field__scope"
                            spacing={spacing}
                            isSearchable={false}
                            isDisabled={isDisabled}
                            options={scopeOptions}
                            value={scope}
                            onChange={(next) => {
                                if (!scopeControlled) setOwnScope(next);
                                if (onScopeChange) onScopeChange(next);
                            }}
                        />
                    )}
                    {field}
                    {focusedMode && (
                        <Popup
                            anchor={rootRef}
                            show={panelShown}
                            triggerType="manual"
                            placement="bottom-start"
                            label={panelLabel}
                            initialFocus={false}
                            container={panelContainer}
                            className="plus-search-field__popup"
                        >
                            <div
                                id={listId}
                                role="listbox"
                                aria-label={panelLabel}
                                className="plus-search-field__panel"
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseLeave={() => setCursor(-1)}
                            >
                                {renderRows()}
                            </div>
                        </Popup>
                    )}
                </>
            ) : (
                <span ref={iconRef} className="plus-search-field__icon">
                    <IconButton
                        icon="magnifying-glass"
                        label={name}
                        tooltip={name}
                        appearance="subtle"
                        isDisabled={isDisabled}
                        onClick={openField}
                    />
                </span>
            )}
        </div>
    );
};

SearchField.propTypes = {
    /** Names the scope ("Search students"). Required: the label is hidden, so this is what a sighted person reads, and it names the collapsed icon and its tooltip. */
    placeholder: PropTypes.string.isRequired,
    /** The accessible name, when it should differ from the placeholder. */
    label: PropTypes.string,
    /** `active` filters on each keystroke through `onValueChange`. `basic` runs `onSearch` on Enter and nothing per keystroke. `focused` adds the results panel. */
    mode: PropTypes.oneOf(SEARCH_FIELD_MODES),
    /** The search text, when the caller holds it. Pair with `onValueChange`. */
    value: PropTypes.string,
    /** Starting text when the field holds its own. */
    defaultValue: PropTypes.string,
    /** `(text)`: called on every edit, on Esc and on the clear button. */
    onValueChange: PropTypes.func,
    /** `(text, { offset, limit, scope })` → `Promise<{ results, total }>`. Asked on first render (so `onResults` fires without typing) and after a short pause in typing; an older answer never replaces a newer one. `scope` is sent when `scopes` is set. */
    loadResults: PropTypes.func,
    /** `({ results, total })`: called with each answer of `loadResults`. */
    onResults: PropTypes.func,
    /** `(text)`: the search to run. Called on Enter in `basic`, and on Enter or the "See all" row in `focused`. */
    onSearch: PropTypes.func,
    /** `focused` panel: groups of matches, `{ value, label, count?, items: [{ value, label, description?, icon? }] }`. Feed it from `onResults`, or filter your own rows. */
    results: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.string,
        count: PropTypes.number,
        items: PropTypes.arrayOf(PropTypes.object),
    })),
    /** `focused` panel: recent searches shown when the field is focused and empty. */
    recent: PropTypes.arrayOf(PropTypes.string),
    /** `focused` panel: `(item, group)` called when a match is chosen. */
    onSelect: PropTypes.func,
    /** `focused` panel: the optional last row, as `<SearchFieldAction onSelect>`. It is a slot, not a prop. */
    children: PropTypes.node,
    /** A search is running. A Spinner takes the search icon's place. `loadResults` sets this by itself. */
    isLoading: PropTypes.bool,
    /** Starts as an icon button that grows into the field and collapses when left empty. */
    isCollapsible: PropTypes.bool,
    /** With `isCollapsible`, starts open. */
    defaultOpen: PropTypes.bool,
    /** Scope filter before the field: `{ value, label, count? }`. "All" is added first and selected unless given. */
    scopes: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        count: PropTypes.number,
    })),
    /** The chosen scope value, when the caller holds it. Pair with `onScopeChange`. */
    scope: PropTypes.string,
    /** Starting scope when the field holds its own. `all` by default. */
    defaultScope: PropTypes.string,
    /** `(value)`: called when another scope is chosen. */
    onScopeChange: PropTypes.func,
    /** `default` draws 40; `compact` draws 32. Bars pass `compact`. */
    spacing: PropTypes.oneOf(SEARCH_FIELD_SPACINGS),
    /** Dims the field and blocks typing. */
    isDisabled: PropTypes.bool,
    /** The clear button's name. */
    clearLabel: PropTypes.string,
    /** The focused panel's accessible name. */
    panelLabel: PropTypes.string,
    /** The group heading over recent searches. */
    recentLabel: PropTypes.string,
    /** Starts the empty-results line; the typed text follows in quotes. */
    noMatchesLabel: PropTypes.string,
    /** Starts the last row's label; the typed text follows in quotes. */
    seeAllLabel: PropTypes.string,
    /** `focused` panel: starts open without focus, for a picture of the open panel. */
    defaultPanelOpen: PropTypes.bool,
    /** `focused` panel: the element the panel mounts in instead of the page, so a picture keeps it inside its frame. */
    panelContainer: PropTypes.object,
    /** The scope filter's accessible name. */
    scopeLabel: PropTypes.string,
    /** Ref to the underlying `<input>`. */
    inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    /** Extra class on the outer wrapper. */
    className: PropTypes.string,
    /** Maps to `data-testid` on the input. */
    testId: PropTypes.string,
};

export default SearchField;
