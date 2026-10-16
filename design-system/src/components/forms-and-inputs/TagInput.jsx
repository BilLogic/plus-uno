import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Tag, { TAG_ACCEPTED_COLORS, TAG_COLORS, resolveTagColor } from '@/components/status-and-loading/Tag';
import TagGroup from '@/components/status-and-loading/TagGroup';
import Button from '@/components/actions/Button';
import Input from './Input';
import useFieldId from './useFieldId';
import Field, { FieldCaption, FieldLabel, FieldStack, fieldDescription, toneProps } from './_internal/Field';
import Listbox, { ListboxMessage } from './_internal/Listbox';
import './TagInput.scss';

/**
 * The status names the chips used to take, kept as deprecated aliases for the
 * Tag color nearest their hue: a tag is a category, and its color never
 * carries a meaning.
 */
const TAG_INPUT_COLOR_ALIASES = {
    default: 'gray',
    success: 'green',
    danger: 'magenta',
    warning: 'yellow',
    info: 'teal',
};

/** Every name a tag's `color` accepts: what Tag accepts, then TagInput's own aliases. */
const ACCEPTED_COLORS = [...TAG_ACCEPTED_COLORS, ...Object.keys(TAG_INPUT_COLOR_ALIASES)];

/** Tag's seven colors as the option menu names them. */
const COLOR_NAMES = {
    gray: 'Gray',
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    magenta: 'Magenta',
    yellow: 'Yellow',
    teal: 'Teal',
};

/** The option menu's Delete row; no Tag color has this name. */
const DELETE = '__delete';

/** The list's hint while a row moves, as Figma's reordering state words it. */
const REORDER_HINT = '↑ ↓ move · Space drops · Esc cancels';
/** The same keys, for a screen reader. */
const REORDER_KEYS_SPOKEN = 'Space or Enter picks the row up. Up and down arrows move it, Space or Enter drops it and Escape cancels.';

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
 * else falls back to gray, each with a development warning.
 */
const tagColorOf = (color) => {
    if (color === undefined || color === null || color === '') return 'gray';
    if (Object.hasOwn(TAG_INPUT_COLOR_ALIASES, color)) {
        warn(`color "${color}" is deprecated; use "${TAG_INPUT_COLOR_ALIASES[color]}".`);
        return TAG_INPUT_COLOR_ALIASES[color];
    }
    if (resolveTagColor(color)) return color;
    warn(`color "${color}" is not a Tag color; it falls back to gray.`);
    return 'gray';
};

/** A new tag's color: one of Tag's seven, gray included, picked at random. */
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
 * TagInput — a field of Tags with a text entry after them, modeled on
 * Notion's multi-select.
 *
 * Focusing the field opens a list of the options. Typing filters it and
 * highlights the first match; Enter or a click adds the highlighted option. A
 * "Create *text*" row is offered when no option matches the text exactly,
 * ignoring case. It previews the new tag as the Tag it will be, in the random
 * Tag color it will get, and creating reports that color once through
 * `onCreate`. Backspace in an empty entry removes the last tag, and Esc
 * closes the list and clears only the typed text.
 *
 * People can tidy the options where they pick them, as in Notion. With
 * `onRename`, `onDelete` or `onColorChange`, the highlighted row shows a "…"
 * that opens the option's menu: its name, Delete, and Tag's seven colors.
 * With `onReorder`, each row has a handle to drag, or to pick up with Space
 * and move with the arrows. Without these handlers neither appears.
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
    onRename,
    onDelete,
    onColorChange,
    onReorder,
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
    /** The color the next created tag gets, picked ahead so the Create row can show it. */
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

    /* ---------- tidying the options: the "…" menu and reordering ---------- */
    // Each appears only when the caller passed a handler for it.
    const hasMenu = editable && Boolean(onRename || onDelete || onColorChange);
    // Reordering moves rows of the whole list, so it waits until the filter is clear.
    const canReorder = editable && Boolean(onReorder) && !filter.trim();
    /** The option whose menu is open: `{ index }`, its place in `options`. */
    const [menu, setMenu] = useState(null);
    /** A row being moved: `{ from, to, pointer }`, places in `options`. */
    const [reorder, setReorder] = useState(null);
    const reorderRef = useRef(null);
    reorderRef.current = reorder;
    const moreRef = useRef(null);
    const gripRef = useRef(null);
    const returnFocusTo = useRef(null);

    /** Where the drop line goes while a row moves, as the row it sits on and which edge. */
    const dropAt = useMemo(() => {
        if (!reorder || reorder.to === reorder.from) return null;
        const row = reorder.to < reorder.from ? reorder.to : reorder.to + 1;
        return row < options.length ? { row, edge: 'before' } : { row: options.length - 1, edge: 'after' };
    }, [reorder, options.length]);

    /* ---------- the list: the caller's options, and any tag not among them ---------- */
    const listOptions = useMemo(() => {
        const known = options.map((option, index) => ({
            source: option, text: textOf(option), color: option.color, index,
        }));
        currentTags.forEach((tag) => {
            if (!known.some((option) => same(option.text, textOf(tag)))) {
                known.push({ source: tag, text: textOf(tag), color: tag.color });
            }
        });
        // An exact match, ignoring case, comes first so it is the one Enter picks.
        const query = filter.trim();
        const exact = query ? known.findIndex((option) => same(option.text, query)) : -1;
        if (exact > 0) known.unshift(...known.splice(exact, 1));
        // The row the handle button is laid over: the pinned one, else the highlighted one.
        const pinned = menu?.index ?? reorder?.from;
        const activeRow = activeId?.startsWith(`${listId}-option-`) ? Number(activeId.slice(listId.length + 8)) : -1;
        // The Listbox filters by `value`, so the row's value is its text and its
        // label is the Tag the person will get.
        return known.map((option, row) => ({
            value: option.text,
            label: (
                <Tag color={tagColorOf(typeof option.source === 'object' ? option.color : undefined)}>
                    {option.text}
                </Tag>
            ),
            source: option.source,
            // The handle, drawn on every option row; the one under the pointer is a button.
            leading: canReorder && option.index !== undefined
                ? (
                    <i
                        aria-hidden="true"
                        className={`fa-solid fa-grip-vertical plus-tag-input__grip-mark${
                            (pinned !== undefined ? option.index === pinned : row === activeRow) ? ' is-covered' : ''
                        }`}
                    />
                )
                : undefined,
            dragging: reorder !== null && option.index === reorder.from,
            dropIndicator: dropAt && option.index === dropAt.row ? dropAt.edge : undefined,
            optionIndex: option.index,
        }));
    }, [options, currentTags, filter, canReorder, reorder, dropAt, menu, activeId, listId]);

    /** The list row, by its place in the Listbox's options, of an option by its place in `options`. */
    const rowOf = (index) => listOptions.findIndex((option) => option.optionIndex === index);

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

    /* ---------- the "…" menu: rename, delete, color ---------- */
    const menuOption = menu ? options[menu.index] : undefined;
    const menuListId = `${fieldId}-option-menu`;
    const menuListRef = useRef(null);
    const renameRef = useRef(null);
    const [renameDraft, setRenameDraft] = useState('');
    /** Whether the arrows have walked the menu, so Enter picks a row rather than renaming. */
    const [menuNavigated, setMenuNavigated] = useState(false);
    const [menuActiveId, setMenuActiveId] = useState();

    const openMenu = (index) => {
        setMenu({ index });
        setRenameDraft(textOf(options[index]));
        setMenuNavigated(false);
    };

    /** Closes the menu. `focus` is where focus goes after: the "…", the entry, or nowhere. */
    const closeMenu = (focus = 'more') => {
        returnFocusTo.current = focus;
        setMenu(null);
    };

    // Focus moves into the menu when it opens and back when it closes. A frame
    // later, so the menu has been placed and shown before it takes focus.
    useEffect(() => {
        let target = null;
        if (menu) {
            target = () => renameRef.current ?? document.getElementById(menuListId)?.closest('.plus-listbox-body');
        } else if (returnFocusTo.current === 'more') {
            target = () => moreRef.current;
        } else if (returnFocusTo.current === 'entry') {
            target = () => inputRef.current;
        }
        returnFocusTo.current = null;
        if (!target) return undefined;
        const frame = requestAnimationFrame(() => target()?.focus());
        return () => cancelAnimationFrame(frame);
    }, [menu, menuListId]);

    /** Applies a change to every picked tag made from the option with this value or text. */
    const updatePicked = (option, change) => {
        const value = valueOf(option);
        const text = textOf(option);
        const matches = (tag) => valueOf(tag) === value || same(textOf(tag), text);
        if (!latestTags.current.some(matches)) return;
        commit(latestTags.current.flatMap((tag) => (matches(tag) ? change(tag) : [tag])));
    };

    const rename = () => {
        const option = menuOption;
        const old = textOf(option);
        const next = (maxLength !== undefined ? renameDraft.slice(0, maxLength) : renameDraft).trim();
        if (next && next !== old) {
            onRename(valueOf(option), next);
            updatePicked(option, (tag) => {
                if (typeof tag !== 'object') return [next];
                return [tag.label !== undefined ? { ...tag, label: next } : { ...tag, text: next }];
            });
            announce(`${old} renamed to ${next}`);
        }
        closeMenu('more');
    };

    const remove = () => {
        const option = menuOption;
        const value = valueOf(option);
        const text = textOf(option);
        onDelete(value);
        // A picked tag made from the deleted option goes with it.
        const removed = latestTags.current
            .map((tag, index) => ({ tag, index }))
            .filter(({ tag }) => valueOf(tag) === value || same(textOf(tag), text));
        if (removed.length) {
            commit(latestTags.current.filter((_, index) => !removed.some((r) => r.index === index)));
            if (onRemove) removed.reverse().forEach(({ tag, index }) => onRemove(index, tag));
        }
        announce(`${text} deleted`);
        closeMenu('entry');
    };

    const recolor = (color) => {
        const option = menuOption;
        onColorChange(valueOf(option), color);
        updatePicked(option, (tag) => [typeof tag === 'object' ? { ...tag, color } : { value: tag, text: tag, color }]);
        announce(`${textOf(option)} is now ${COLOR_NAMES[color]}`);
        closeMenu('more');
    };

    const menuOptions = useMemo(() => {
        const rows = [];
        if (onDelete) {
            rows.push({
                value: DELETE,
                label: 'Delete',
                leading: <i aria-hidden="true" className="fa-solid fa-trash" />,
            });
        }
        if (onColorChange) {
            TAG_COLORS.forEach((color) => rows.push({
                value: color,
                label: <Tag color={color}>{COLOR_NAMES[color]}</Tag>,
                group: 'Color',
            }));
        }
        return rows;
    }, [onDelete, onColorChange]);

    const handleRenameKeyDown = (event) => {
        const list = menuListRef.current;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!menuNavigated) {
                // The cursor starts on the current color; the first arrow starts from an end instead.
                setMenuNavigated(true);
                list?.highlight(event.key === 'ArrowDown' ? 0 : menuOptions.length - 1);
            } else {
                list?.handleKeyDown(event);
            }
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            if (menuNavigated && list) list.handleKeyDown(event);
            else if (onRename) rename();
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu('more');
        }
    };

    /* ---------- reordering: by the handle's drag, or by its keys ---------- */
    const reorderText = (index) => textOf(options[index]);
    const position = (index) => `position ${index + 1} of ${options.length}`;

    const pickUp = (index, pointer = false) => {
        const next = { from: index, to: index, pointer };
        reorderRef.current = next;
        setReorder(next);
        if (!pointer) announce(`${reorderText(index)} picked up, ${position(index)}. ${REORDER_KEYS_SPOKEN}`);
    };

    const moveTo = (to) => {
        const current = reorderRef.current;
        if (!current) return;
        const clamped = Math.min(Math.max(to, 0), options.length - 1);
        if (clamped === current.to) return;
        const next = { ...current, to: clamped };
        reorderRef.current = next;
        setReorder(next);
        if (!current.pointer) announce(`${reorderText(current.from)}, ${position(clamped)}`);
    };

    const drop = () => {
        const current = reorderRef.current;
        if (!current) return;
        reorderRef.current = null;
        setReorder(null);
        const text = reorderText(current.from);
        if (current.to !== current.from) onReorder(current.from, current.to);
        announce(`${text} dropped, ${position(current.to)}`);
        // The cursor follows the row to its new place, so it can be moved again.
        listRef.current?.highlight(current.to);
    };

    const cancelReorder = () => {
        const current = reorderRef.current;
        if (!current) return;
        reorderRef.current = null;
        setReorder(null);
        announce(`Reorder canceled. ${reorderText(current.from)} is back at ${position(current.from)}`);
    };

    const handleGripKeyDown = (index, event) => {
        if (reorderRef.current) {
            const { to } = reorderRef.current;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveTo(to + (event.key === 'ArrowDown' ? 1 : -1));
            } else if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                drop();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                cancelReorder();
            } else if (event.key === 'Tab') {
                cancelReorder();
            }
            return;
        }
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            pickUp(index);
        } else if (event.key === 'Escape' || (event.key === 'Tab' && event.shiftKey)) {
            event.preventDefault();
            inputRef.current?.focus();
        }
    };

    /** The slot under the pointer: before the first row whose middle is below it. */
    const slotAt = (clientY) => {
        for (let index = 0; index < options.length; index += 1) {
            const row = document.getElementById(`${listId}-option-${rowOf(index)}`);
            if (row) {
                const box = row.getBoundingClientRect();
                if (clientY < box.top + box.height / 2) return index;
            }
        }
        return options.length;
    };

    const handleGripPointerDown = (index, event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        pickUp(index, true);
        const onMove = (move) => {
            const slot = slotAt(move.clientY);
            moveTo(slot > index ? slot - 1 : slot);
        };
        const stop = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onCancel);
            window.removeEventListener('keydown', onKey, true);
        };
        const onUp = () => { stop(); drop(); };
        const onCancel = () => { stop(); cancelReorder(); };
        const onKey = (key) => {
            if (key.key !== 'Escape') return;
            key.preventDefault();
            key.stopPropagation();
            onCancel();
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onCancel);
        window.addEventListener('keydown', onKey, true);
    };

    /** A row's handle and "…", drawn by the Listbox over the highlighted row. */
    const rowActions = (hasMenu || canReorder) ? (row) => {
        const index = row.optionIndex;
        if (index === undefined) return null;
        const text = textOf(options[index]);
        return (
            <>
                {canReorder && (
                    <Button
                        ref={gripRef}
                        style="default"
                        fill="ghost"
                        size="small"
                        leadingVisual="grip-vertical"
                        aria-label={`Reorder ${text}`}
                        aria-describedby={`${fieldId}-reorder-keys`}
                        className="plus-tag-input__row-action plus-tag-input__grip"
                        onKeyDown={(event) => handleGripKeyDown(index, event)}
                        onPointerDown={(event) => handleGripPointerDown(index, event)}
                        onBlur={(event) => { cancelReorder(); handleBlur(event); }}
                    />
                )}
                {hasMenu && (
                    <Button
                        ref={moreRef}
                        style="default"
                        fill="ghost"
                        size="small"
                        leadingVisual="ellipsis"
                        aria-label={`Options for ${text}`}
                        aria-haspopup="listbox"
                        aria-expanded={Boolean(menu)}
                        aria-controls={menu ? menuListId : undefined}
                        className="plus-tag-input__row-action plus-tag-input__more"
                        onClick={() => (menu ? closeMenu('more') : openMenu(index))}
                        onKeyDown={(event) => {
                            if (event.key === 'Tab' && event.shiftKey && !canReorder) {
                                event.preventDefault();
                                inputRef.current?.focus();
                            }
                        }}
                        onBlur={handleBlur}
                    />
                )}
            </>
        );
    } : undefined;

    /* ---------- the entry ---------- */
    const handleKeyDown = (event) => {
        if (!editable) return;
        // Tab from the entry reaches the highlighted row's handle or "…".
        if (event.key === 'Tab' && !event.shiftKey && open && (gripRef.current || moreRef.current)) {
            event.preventDefault();
            (gripRef.current ?? moreRef.current).focus();
            return;
        }
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
        text.split(PASTE_SEPARATOR).map((part) => part.trim()).filter(Boolean).forEach((part) => create(part));
        setFilter('');
    };

    /* ---------- focus: the field expands while it has it ---------- */
    const insideMenu = (node) => Boolean(node)
        && Boolean(document.getElementById(menuListId)?.closest('.plus-listbox')?.contains(node));
    const inside = (node) => Boolean(node) && (
        anchorRef.current?.contains(node)
        || document.getElementById(listId)?.closest('.plus-listbox')?.contains(node)
        || insideMenu(node)
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

    const handleClose = (reason, event) => {
        // A pick keeps the list open, so several can be added in a row.
        if (reason === 'select') return;
        // A press in an option's menu is not outside the field's list.
        if (reason === 'outside' && insideMenu(event?.target)) return;
        setOpen(false);
    };

    useEffect(() => {
        if (!editable) setOpen(false);
    }, [editable]);

    // Closing the list closes what was open over it.
    useEffect(() => {
        if (open && editable) return;
        setMenu(null);
        reorderRef.current = null;
        setReorder(null);
    }, [open, editable]);

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
                    {...toneProps(tone).field}
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
                            {...toneProps(tone).control}
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
                header={(
                    <div className="plus-tag-input__hint">
                        {reorder ? REORDER_HINT : 'Select an option or create one'}
                    </div>
                )}
                footer={atLimit ? <ListboxMessage kind="limit">{`You can pick up to ${maxTags}`}</ListboxMessage> : undefined}
                rowActions={rowActions}
                // The handle and "…" stay on their row while its menu is open or it is moving.
                rowActionsIndex={(() => {
                    const pinned = menu?.index ?? reorder?.from;
                    if (pinned === undefined) return undefined;
                    const row = rowOf(pinned);
                    return row < 0 ? undefined : row;
                })()}
            />
            {menuOption && listOpen && (
                <Listbox
                    ref={menuListRef}
                    id={menuListId}
                    aria-label={`Options for ${textOf(menuOption)}`}
                    className="plus-tag-input__menu"
                    open
                    anchorRef={moreRef}
                    align="right"
                    options={menuOptions}
                    value={onColorChange ? tagColorOf(typeof menuOption === 'object' ? menuOption.color : undefined) : null}
                    onChange={(next) => (next === DELETE ? remove() : recolor(next))}
                    onActiveChange={setMenuActiveId}
                    onClose={(reason) => {
                        if (reason !== 'select') closeMenu(reason === 'outside' ? null : 'more');
                    }}
                    header={onRename ? (
                        <div className="plus-tag-input__rename">
                            <Input
                                label="Name"
                                showLabel={false}
                                size="small"
                                value={renameDraft}
                                inputRef={renameRef}
                                aria-controls={menuListId}
                                aria-activedescendant={menuNavigated ? menuActiveId : undefined}
                                onChange={(event) => { setRenameDraft(event.target.value); setMenuNavigated(false); }}
                                onKeyDown={handleRenameKeyDown}
                                onBlur={handleBlur}
                            />
                        </div>
                    ) : undefined}
                />
            )}
            {canReorder && (
                <div id={`${fieldId}-reorder-keys`} className="visually-hidden">{REORDER_KEYS_SPOKEN}</div>
            )}
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
     * `({ value, color })`: a new value was created, with the color it was
     * given. Store both on the option. Return a promise of the stored id to
     * hold the tag on a temporary id, saving, until it resolves; a rejection
     * removes the tag and puts the text back.
     */
    onCreate: PropTypes.func,
    /** `(index, tag)`: a tag was removed. */
    onRemove: PropTypes.func,
    /** `(tags)`: the new list, after any add or remove. */
    onChange: PropTypes.func,
    /**
     * `(value, name)`: an option was renamed from its "…" menu. Store the new
     * name on the option. A picked tag made from it takes the name too.
     */
    onRename: PropTypes.func,
    /**
     * `(value)`: an option was deleted from its "…" menu. Remove it from
     * `options`; a picked tag made from it is removed with it.
     */
    onDelete: PropTypes.func,
    /**
     * `(value, color)`: an option was given another of Tag's seven colors
     * from its "…" menu. Store it on the option.
     */
    onColorChange: PropTypes.func,
    /**
     * `(fromIndex, toIndex)`: an option was moved by its handle, by drag or
     * by the keyboard. Both are places in `options`; move the option there.
     */
    onReorder: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default TagInput;
