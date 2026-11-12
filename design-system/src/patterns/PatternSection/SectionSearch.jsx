import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, TextField } from '@/components';
import { iconClass } from '../../lib/icon';

/**
 * `_Section search`: the view bar's Search icon, which grows into a field.
 *
 * Pressing the icon opens the field and moves focus into it; the field grows
 * left from where the icon sat. Esc clears the text, and a second Esc closes
 * the field and returns focus to the icon. The field stays open while it holds
 * text, and closes when focus leaves it empty. "Clear search" empties it and
 * keeps focus in it.
 *
 * `label` names the scope ("Search students"): it is the icon's name, the
 * field's hidden label and its placeholder. The text can be held by the caller
 * (`value` + `onValueChange`), so Reset filters can clear it with the rest.
 */
const SectionSearch = ({
    label,
    value: valueProp,
    defaultValue = '',
    onValueChange,
    defaultOpen = false,
    clearLabel = 'Clear search',
    className = '',
    ...props
}) => {
    const controlled = valueProp !== undefined;
    const [ownValue, setOwnValue] = useState(defaultValue);
    const value = controlled ? valueProp : ownValue;
    const hasText = value !== '';

    const [expanded, setExpanded] = useState(defaultOpen || hasText);
    const open = expanded || hasText;
    // Which way it last moved: `grow` when the icon opens into the field, `shrink`
    // when the field closes back into the icon. Neither on first render.
    const [motion, setMotion] = useState(null);

    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const iconRef = useRef(null);
    // Where focus goes on the next render: into the field, or back to the icon.
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
        // Emptied, the field stays open until a second Esc or an empty blur.
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
        if (cleared && !rootRef.current?.contains(document.activeElement)) collapse();
    }, [hasText]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleKeyDown = (event) => {
        if (event.key !== 'Escape') return;
        // The browser's own Esc on a search input would clear without telling us.
        event.preventDefault();
        event.stopPropagation();
        if (hasText) clear();
        else close();
    };

    const handleBlur = (event) => {
        if (hasText) return;
        if (rootRef.current?.contains(event.relatedTarget)) return;
        collapse();
    };

    const classes = [
        'plus-section-search',
        open ? 'plus-section-search--open' : 'plus-section-search--closed',
        motion && `plus-section-search--${motion}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <div ref={rootRef} className={classes} onBlur={open ? handleBlur : undefined} {...props}>
            {open ? (
                <TextField
                    label={label}
                    isLabelHidden
                    placeholder={label}
                    type="search"
                    spacing="compact"
                    className="plus-section-search__field"
                    inputRef={inputRef}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    elemBeforeInput={<i className={iconClass('magnifying-glass')} aria-hidden="true" />}
                    elemAfterInput={hasText ? (
                        <IconButton
                            icon="xmark"
                            label={clearLabel}
                            appearance="subtle"
                            spacing="compact"
                            className="plus-section-search__clear"
                            onClick={clear}
                        />
                    ) : null}
                />
            ) : (
                <span ref={iconRef} className="plus-section-search__icon">
                    <IconButton icon="magnifying-glass" label={label} appearance="subtle" onClick={openField} />
                </span>
            )}
        </div>
    );
};

SectionSearch.propTypes = {
    /** Names the scope, such as "Search students": the icon's name, the field's hidden label and its placeholder */
    label: PropTypes.string.isRequired,
    /** The search text, when the caller holds it. Pair with `onValueChange` */
    value: PropTypes.string,
    /** Starting text when the field holds its own */
    defaultValue: PropTypes.string,
    /** Called with the new text on every edit, on Esc and on "Clear search" */
    onValueChange: PropTypes.func,
    /** Starts with the field open */
    defaultOpen: PropTypes.bool,
    /** The clear button's name */
    clearLabel: PropTypes.string,
    className: PropTypes.string,
};

export default SectionSearch;
