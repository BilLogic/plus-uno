import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import TextField from '../TextField/TextField';
import Select from '../Select/Select';
import { IconButton } from '../IconButton/IconButton';
import Spinner from '../../loading/Spinner/Spinner';
import { iconClass } from '../../../lib/icon';
import './SearchField.scss';

export const SEARCH_FIELD_SPACINGS = ['default', 'compact'];
export const SEARCH_FIELD_MODES = ['active'];
/** How long typing pauses before `loadResults` is asked. */
export const SEARCH_DEBOUNCE_MS = 250;
/** `loadResults` asks for this many results at a time. */
const PAGE_SIZE = 50;

const ALL = 'all';

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

    const handleKeyDown = (event) => {
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
        if (hasText || !isCollapsible) return;
        if (rootRef.current?.contains(event.relatedTarget)) return;
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
        const timer = setTimeout(() => {
            const ticket = ++request.current;
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
        return () => clearTimeout(timer);
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
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
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
            onBlur={open && isCollapsible ? handleBlur : undefined}
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
    /** `active` filters on each keystroke through `onValueChange`. */
    mode: PropTypes.oneOf(SEARCH_FIELD_MODES),
    /** The search text, when the caller holds it. Pair with `onValueChange`. */
    value: PropTypes.string,
    /** Starting text when the field holds its own. */
    defaultValue: PropTypes.string,
    /** `(text)`: called on every edit, on Esc and on the clear button. */
    onValueChange: PropTypes.func,
    /** `(text, { offset, limit, scope })` → `Promise<{ results, total }>`. Asked on first render and after a short pause in typing; an older answer never replaces a newer one. `scope` is sent when `scopes` is set. */
    loadResults: PropTypes.func,
    /** `({ results, total })`: called with each answer of `loadResults`. */
    onResults: PropTypes.func,
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
