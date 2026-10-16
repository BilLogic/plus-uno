import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Tag, { TAG_ACCEPTED_COLORS, TAG_COLORS, resolveTagColor } from '@/components/status-and-loading/Tag';
import TagGroup from '@/components/status-and-loading/TagGroup';
import useFieldId from './useFieldId';
import Field, { FieldCaption, FieldLabel, FieldStack, fieldDescription } from './_internal/Field';
import Listbox, { ListboxMessage } from './_internal/Listbox';
import './TagInput.scss';

/**
 * The status names the chips used to take, kept as deprecated aliases for the
 * Tag color nearest their hue: a tag is a category, and its color never
 * carries a meaning.
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

/** Pasted text splits into tags on commas and line breaks. */
const PASTE_SEPARATOR = /[,\n\r]+/;

const warn = (message) => {
    if (process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.warn(`[TagInput] ${message}`);
};

/**
 * The color to hand Tag. A Tag name goes through as given, so Tag decides and
 * warns about its own aliases. TagInput's aliases resolve here, and anything
 * else falls back to grey, each with a development warning.
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

/** A new tag's colour: one of Tag's seven, grey included, picked at random. */
const randomColor = () => TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];

/** The text a tag or an option shows. */
const textOf = (item) => {
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    const label = item.label ?? item.text;
    return typeof label === 'string' ? label : String(item.value ?? '');
};

/** What identifies a tag or an option. */
const valueOf = (item) => (typeof item === 'object' && item !== null ? item.value ?? textOf(item) : item);

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

let temporaryIds = 0;

/**
 * TagInput — a field of Tags with a text entry after them, modelled on
 * Notion's multi-select.
 *
 * Focusing the field opens a list of the options. Typing filters it and
 * highlights the first match; Enter or a click adds the highlighted option. A
 * "Create *text*" row is offered when no option matches the text exactly,
 * ignoring case. It previews the new tag as the Tag it will be, in the random
 * Tag colour it will get, and creating reports that colour once through
 * `onCreate`. Backspace in an empty entry removes the last tag, and Esc
 * closes the list and clears only the typed text.
 *
 * Built on the shared parts: `_Field` is the box, `Listbox` the list and its
 * rows, and the chips are Tags in a TagGroup. Without focus the tags collapse
 * into "+n"; with focus they wrap, up to three rows, then scroll.
 */
const TagInput = ({
    id,
    name,
    label,
    required = false,
    info,
    caption,
    placeholder = 'Select or create a tag',
    // Required (PropTypes says so); an empty list keeps a field that forgot it
    // working, with only the Create row to offer.
    options = [],
    tags,
    defaultTags = [],
    size = 'medium',
    disabled = false,
    readOnly = false,
    validation = 'none',
    validationMessage,
    maxLength,
    maxTags,
    onAdd,
    onCreate,
    onRemove,
    onChange,
    className = '',
    style,
    ...props
}) => {
    const [internalTags, setInternalTags] = useState(defaultTags);
    const isControlled = Array.isArray(tags);
    const currentTags = isControlled ? tags : internalTags;
    /** The latest list, for a create that settles after a re-render. */
    const latestTags = useRef(currentTags);
    latestTags.current = currentTags;

    const fieldId = useFieldId(id);
    const listId = `${fieldId}-listbox`;
    const labelText = typeof label === 'string' ? label : 'Tags';

    const inputRef = useRef(null);
    const anchorRef = useRef(null);
    const listRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [filter, setFilter] = useState('');
    const [activeId, setActiveId] = useState();
    const [announcement, setAnnouncement] = useState('');
    /** The colour the next created tag gets, picked ahead so the Create row can show it. */
    const [nextColor, setNextColor] = useState(randomColor);

    const editable = !disabled && !readOnly;
    // A × is offered only where pressing it can remove something: a list
    // TagInput keeps itself, or a controlled one with a handler.
    const canRemove = editable && (!isControlled || Boolean(onRemove || onChange));
    const atLimit = maxTags !== undefined && currentTags.length >= maxTags;

    const announce = (message) => {
        // Cleared first, so the same message twice is still announced twice.
        setAnnouncement('');
        requestAnimationFrame(() => setAnnouncement(message));
    };

    const commit = (next) => {
        latestTags.current = next;
        if (!isControlled) setInternalTags(next);
        if (onChange) onChange(next);
    };

    const hasTag = (text) => latestTags.current.some((tag) => same(textOf(tag), text));

    /* ---------- the list: the caller's options, and any tag not among them ---------- */
    const listOptions = useMemo(() => {
        const known = options.map((option) => ({ source: option, text: textOf(option), color: option.color }));
        currentTags.forEach((tag) => {
            if (!known.some((option) => same(option.text, textOf(tag)))) {
                known.push({ source: tag, text: textOf(tag), color: tag.color });
            }
        });
        // An exact match, ignoring case, comes first so it is the one Enter picks.
        const query = filter.trim();
        const exact = query ? known.findIndex((option) => same(option.text, query)) : -1;
        if (exact > 0) known.unshift(...known.splice(exact, 1));
        // The Listbox filters by `value`, so the row's value is its text and its
        // label is the Tag the person will get.
        return known.map((option) => ({
            value: option.text,
            label: (
                <Tag color={tagColorOf(typeof option.source === 'object' ? option.color : undefined)}>
                    {option.text}
                </Tag>
            ),
            source: option.source,
        }));
    }, [options, currentTags, filter]);

    /* ---------- adding ---------- */
    const add = (tag) => {
        const text = textOf(tag);
        if (hasTag(text) || (maxTags !== undefined && latestTags.current.length >= maxTags)) return false;
        commit([...latestTags.current, tag]);
        if (onAdd) onAdd(tag);
        announce(`${text} added`);
        return true;
    };

    const pickOption = (option) => {
        const tag = typeof option === 'object'
            ? { value: valueOf(option), text: textOf(option), ...(option.color ? { color: option.color } : {}) }
            : option;
        return add(tag);
    };

    const create = (raw, color = randomColor()) => {
        const text = maxLength !== undefined ? raw.trim().slice(0, maxLength) : raw.trim();
        if (!text) return;
        const existing = options.find((option) => same(textOf(option), text));
        if (existing) { pickOption(existing); return; }
        if (hasTag(text)) return;

        temporaryIds += 1;
        const temporaryId = `new-${temporaryIds}`;
        const result = onCreate ? onCreate({ value: text, color }) : undefined;

        if (result && typeof result.then === 'function') {
            // Pending: the tag holds a temporary id and shows saving until the
            // caller confirms it with the id it stored.
            if (!add({ value: temporaryId, text, color, pending: true })) return;
            result.then(
                (confirmed) => commit(latestTags.current.map((tag) => (
                    tag.value === temporaryId ? { value: confirmed ?? text, text, color } : tag
                ))),
                () => {
                    commit(latestTags.current.filter((tag) => tag.value !== temporaryId));
                    setFilter(text);
                    announce(`Could not add ${text}`);
                }
            );
            return;
        }
        add({ value: result ?? text, text, color });
    };

    const removeAt = (index) => {
        if (!canRemove) return;
        const removed = latestTags.current[index];
        commit(latestTags.current.filter((_, i) => i !== index));
        if (onRemove) onRemove(index, removed);
        announce(`${textOf(removed)} removed`);
    };

    /* ---------- the entry ---------- */
    const handleKeyDown = (event) => {
        if (!editable) return;
        if (event.key === 'Backspace' && !filter && latestTags.current.length > 0) {
            event.preventDefault();
            removeAt(latestTags.current.length - 1);
            return;
        }
        if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            setOpen(true);
            return;
        }
        if (open && listRef.current) listRef.current.handleKeyDown(event);
    };

    const handlePaste = (event) => {
        if (!editable) return;
        const text = event.clipboardData.getData('text');
        if (!PASTE_SEPARATOR.test(text)) return;
        event.preventDefault();
        text.split(PASTE_SEPARATOR).map((part) => part.trim()).filter(Boolean).forEach(create);
        setFilter('');
    };

    /* ---------- focus: the field expands while it has it ---------- */
    const inside = (node) => Boolean(node) && (
        anchorRef.current?.contains(node)
        || document.getElementById(listId)?.closest('.plus-listbox')?.contains(node)
    );

    const handleFocus = () => {
        setFocused(true);
        if (editable) setOpen(true);
    };

    const handleBlur = (event) => {
        if (inside(event.relatedTarget)) return;
        setFocused(false);
        setOpen(false);
    };

    const handleClose = (reason) => {
        // A pick keeps the list open, so several can be added in a row.
        if (reason === 'select') return;
        setOpen(false);
    };

    useEffect(() => {
        if (!editable) setOpen(false);
    }, [editable]);

    /* ---------- validation and description ---------- */
    const tone = validation === 'invalid' ? 'invalid' : 'help';
    const message = (validation === 'invalid' && validationMessage) || caption;
    const { messageId, describedBy } = fieldDescription({
        fieldId,
        message,
        describedBy: props['aria-describedby'],
    });

    const expanded = focused;
    const contentClasses = [
        'plus-tag-input__content',
        expanded ? 'plus-tag-input__content--expanded' : 'plus-tag-input__content--collapsed',
        currentTags.length > 0 ? 'plus-tag-input__content--has-tags' : '',
    ].filter(Boolean).join(' ');

    const listOpen = open && editable;

    return (
        <FieldStack disabled={disabled} className={`plus-tag-input ${className}`.trim()} style={style}>
            <FieldLabel htmlFor={fieldId} required={required} info={info}>
                {label}
            </FieldLabel>
            <div
                ref={anchorRef}
                // Public since the field was a container of tags; kept for callers who pass `id`.
                id={`${fieldId}-container`}
                className="plus-tag-input__anchor"
                onFocus={handleFocus}
                onBlur={handleBlur}
            >
                <Field
                    size={size}
                    disabled={disabled}
                    readOnly={readOnly}
                    invalid={tone === 'invalid'}
                    className="plus-tag-input__field"
                >
                    <div
                        className={contentClasses}
                        onMouseDown={(event) => {
                            /*
                             * A press anywhere in the field but a tag's × puts the
                             * caret in the entry. That includes "+n": focus expands
                             * the field, which shows every tag and drops the "+n"
                             * before its click could land.
                             */
                            const onOverflow = Boolean(event.target.closest('.plus-tag-group__overflow'));
                            if (event.target.closest('button') && !onOverflow) return;
                            if (event.target === inputRef.current || !inputRef.current) return;
                            event.preventDefault();
                            inputRef.current.focus();
                            if (editable) setOpen(true);
                        }}
                    >
                        {currentTags.length > 0 && (
                            <TagGroup
                                label={`Selected: ${labelText}`}
                                disabled={disabled}
                                overflow={expanded ? 'wrap' : 'collapse'}
                                onOverflowClick={() => inputRef.current?.focus()}
                                className="plus-tag-input__tags"
                            >
                                {currentTags.map((tag, index) => {
                                    const text = textOf(tag);
                                    return (
                                        <Tag
                                            // Values can repeat, so the position is part of the key.
                                            key={`${index}-${text}`}
                                            color={tagColorOf(typeof tag === 'object' ? tag.color : undefined)}
                                            behavior={canRemove ? 'removable' : 'read-only'}
                                            isLoading={typeof tag === 'object' && Boolean(tag.pending)}
                                            onRemove={canRemove ? () => removeAt(index) : undefined}
                                        >
                                            {text}
                                        </Tag>
                                    );
                                })}
                            </TagGroup>
                        )}
                        <input
                            ref={inputRef}
                            id={fieldId}
                            name={name}
                            type="text"
                            className="plus-field__control plus-tag-input__entry"
                            role="combobox"
                            aria-expanded={listOpen}
                            aria-controls={listId}
                            aria-autocomplete="list"
                            aria-activedescendant={listOpen ? activeId : undefined}
                            aria-required={required || undefined}
                            aria-invalid={tone === 'invalid' || undefined}
                            aria-describedby={describedBy}
                            autoComplete="off"
                            spellCheck={false}
                            placeholder={currentTags.length === 0 ? placeholder : undefined}
                            value={filter}
                            maxLength={maxLength}
                            disabled={disabled}
                            readOnly={readOnly}
                            onChange={(event) => { setFilter(event.target.value); setOpen(true); }}
                            onClick={() => { if (editable) setOpen(true); }}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            {...props}
                        />
                    </div>
                </Field>
            </div>
            <FieldCaption messageId={messageId} message={message} tone={tone} />
            <Listbox
                ref={listRef}
                id={listId}
                aria-label={`${labelText} options`}
                open={listOpen}
                anchorRef={anchorRef}
                options={listOptions}
                value={null}
                onChange={(_, option) => {
                    pickOption(option.source);
                    setFilter('');
                }}
                filter={filter}
                onFilterChange={setFilter}
                onCreate={atLimit ? undefined : (text) => {
                    create(text, nextColor);
                    setNextColor(randomColor());
                    setFilter('');
                }}
                createLabel={(text) => <Tag color={nextColor}>{text}</Tag>}
                onActiveChange={setActiveId}
                onClose={handleClose}
                header={<div className="plus-tag-input__hint">Select an option or create one</div>}
                footer={atLimit ? <ListboxMessage kind="limit">{`You can pick up to ${maxTags}`}</ListboxMessage> : undefined}
            />
            <div className="visually-hidden plus-tag-input__announcer" role="status" aria-live="polite">{announcement}</div>
        </FieldStack>
    );
};

const tagShape = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
        value: PropTypes.string,
        text: PropTypes.string,
        color: PropTypes.oneOf(ACCEPTED_COLORS),
    }),
]);

TagInput.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    /** Names the field. Give every TagInput one. */
    label: PropTypes.node,
    /** Shows an asterisk and sets `aria-required`. */
    required: PropTypes.bool,
    /** Text for an info tooltip beside the label. */
    info: PropTypes.node,
    /** Standing help under the field. A validation message takes its place. */
    caption: PropTypes.node,
    /** Shown in the entry while there are no tags. */
    placeholder: PropTypes.string,
    /**
     * The options the list offers: strings, or objects with `value`, `label`
     * (or `text`) and a Tag `color`. Required; the caller owns the list and
     * adds what `onCreate` reports to it.
     */
    options: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
            value: PropTypes.string,
            label: PropTypes.string,
            text: PropTypes.string,
            color: PropTypes.oneOf(ACCEPTED_COLORS),
        }),
    ])).isRequired,
    /** The picked tags, controlled. Pass `onChange` with it. */
    tags: PropTypes.arrayOf(tagShape),
    /** The picked tags at first, uncontrolled. */
    defaultTags: PropTypes.arrayOf(tagShape),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    /** Disables every tag and the entry. */
    disabled: PropTypes.bool,
    /** Shows the tags with no × and no entry, on the read-only fill. */
    readOnly: PropTypes.bool,
    validation: PropTypes.oneOf(['none', 'invalid']),
    /** Shown under the field, and announced, while `validation` is `invalid`. */
    validationMessage: PropTypes.node,
    /** The longest a new value can be. */
    maxLength: PropTypes.number,
    /** The most tags the field holds. At the limit, Create hides and the list says so. */
    maxTags: PropTypes.number,
    /** `(tag)`: a tag was added, picked or created. */
    onAdd: PropTypes.func,
    /**
     * `({ value, color })`: a new value was created, with the colour it was
     * given. Store both on the option. Return a promise of the stored id to
     * hold the tag on a temporary id, saving, until it resolves; a rejection
     * removes the tag and puts the text back.
     */
    onCreate: PropTypes.func,
    /** `(index, tag)`: a tag was removed. */
    onRemove: PropTypes.func,
    /** `(tags)`: the new list, after any add or remove. */
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default TagInput;
