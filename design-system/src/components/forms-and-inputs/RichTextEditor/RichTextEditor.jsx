import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import useFieldId from '@/components/forms-and-inputs/useFieldId';
import DropdownMenu from '@/components/forms-and-inputs/DropdownMenu/DropdownMenu';
import { ButtonItem } from '@/components/navigation/MenuGroup';
import IconButton from '@/components/forms-and-inputs/IconButton/IconButton';
import ButtonGroup from '@/components/forms-and-inputs/ButtonGroup/ButtonGroup';
import './RichTextEditor.scss';
import { iconClass } from '../../../lib/icon';

const FULL_DEFAULT_BUTTONS = [
    'bold', 'italic', 'underline', 'strikethrough',
    'heading', 'list-ul', 'list-ol',
    'link', 'image', 'code', 'quote',
    'align-left', 'align-center', 'align-right',
    'undo', 'redo'
];

const BLOCK_OPTIONS = [
    { value: 'p', label: 'Normal' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' }
];

/** Figma / FA6 free: toolbar “list” glyph uses `fa-list`; command stays unordered list. */
const BUTTON_DEFS = {
    bold: { icon: 'bold', command: 'bold', title: 'Bold' },
    italic: { icon: 'italic', command: 'italic', title: 'Italic' },
    underline: { icon: 'underline', command: 'underline', title: 'Underline' },
    strikethrough: { icon: 'strikethrough', command: 'strikeThrough', title: 'Strikethrough' },
    heading: { icon: 'heading', command: 'formatBlock', value: 'h3', title: 'Heading' },
    'list-ul': { icon: 'list-ul', command: 'insertUnorderedList', title: 'Bullet List' },
    'list-ol': { icon: 'list-ol', command: 'insertOrderedList', title: 'Numbered List' },
    link: { icon: 'link', command: 'createLink', title: 'Insert Link' },
    image: { icon: 'image', command: 'insertImage', title: 'Insert Image' },
    code: { icon: 'code', command: 'formatBlock', value: 'pre', title: 'Code Block' },
    quote: { icon: 'quote-right', command: 'formatBlock', value: 'blockquote', title: 'Quote' },
    'align-left': { icon: 'align-left', command: 'justifyLeft', title: 'Align Left' },
    'align-center': { icon: 'align-center', command: 'justifyCenter', title: 'Align Center' },
    'align-right': { icon: 'align-right', command: 'justifyRight', title: 'Align Right' },
    undo: { icon: 'arrow-rotate-left', command: 'undo', title: 'Undo' },
    redo: { icon: 'arrow-rotate-right', command: 'redo', title: 'Redo' }
};

/** Compact toolbar (Figma 10010:37927): `fa-list` matches design file icon name “list”. */
const COMPACT_LIST_ICON = 'list';

function normalizeBlockTag(raw) {
    if (!raw) return 'p';
    const t = String(raw).replace(/[<>]/g, '').toLowerCase().trim();
    if (t === 'div' || t === '') return 'p';
    if (BLOCK_OPTIONS.some(o => o.value === t)) return t;
    return 'p';
}

const RichTextEditor = ({
    id,
    name,
    /**
     * #329. The editor's name. The editable region was a bare
     * `contentEditable` div: no role, no name, and `id` applied to the outer
     * container, so a `label` pointing at it named a `div`. Someone hearing the
     * page reached an editable area that did not say what it was for.
     */
    label,
    placeholder,
    value,
    defaultValue = '',
    spacing = 'default',
    readOnly = false,
    disabled = false,
    minHeight,
    toolbarButtons,
    toolbarPreset = 'compact',
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    ...props
}) => {
    const fieldId = useFieldId(id);
    const editorId = `${fieldId}-editor`;
    const labelId = label ? `${fieldId}-label` : undefined;
    const editorRef = useRef(null);
    const containerRef = useRef(null);
    const [toolbarState, setToolbarState] = useState({});
    const [blockFormat, setBlockFormat] = useState('p');

    const useFullToolbar = toolbarPreset === 'full' || toolbarButtons != null;
    const toolbarBtnSpacing = useFullToolbar ? 'default' : 'compact';

    const updateToolbarState = useCallback(() => {
        const fmt = normalizeBlockTag(document.queryCommandValue('formatBlock'));
        setBlockFormat(fmt);

        const keys = useFullToolbar
            ? (toolbarButtons || FULL_DEFAULT_BUTTONS)
            : ['bold', 'italic', 'underline', 'link', 'list-ul'];
        const newState = {};
        keys.forEach((btn) => {
            const def = BUTTON_DEFS[btn];
            if (def) {
                try {
                    newState[btn] = document.queryCommandState(def.command);
                } catch {
                    newState[btn] = false;
                }
            }
        });
        setToolbarState(newState);
    }, [useFullToolbar, toolbarButtons]);

    const execCommand = (command, val) => {
        if (disabled || readOnly) return;

        if (command === 'createLink' && !val) {
            const url = prompt('Enter URL:');
            if (url) document.execCommand(command, false, url);
        } else if (command === 'insertImage' && !val) {
            const url = prompt('Enter image URL:');
            if (url) document.execCommand(command, false, url);
        } else {
            document.execCommand(command, false, val);
        }

        if (editorRef.current) {
            editorRef.current.focus();
            handleInput();
            updateToolbarState();
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            const hasContent = html.trim().length > 0 || editorRef.current.textContent.trim().length > 0;

            if (containerRef.current) {
                containerRef.current.classList.toggle('plus-rich-text-editor-has-value', hasContent);
            }

            if (onChange) {
                onChange(html);
            }
        }
    };

    useEffect(() => {
        if (editorRef.current) {
            const initialContent = value !== undefined ? value : defaultValue;
            if (editorRef.current.innerHTML !== initialContent) {
                editorRef.current.innerHTML = initialContent;
                const hasContent = initialContent.trim().length > 0 || editorRef.current.textContent.trim().length > 0;
                if (containerRef.current) {
                    containerRef.current.classList.toggle('plus-rich-text-editor-has-value', hasContent);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (value !== undefined && editorRef.current && editorRef.current.innerHTML !== value) {
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value;
                const hasContent = value.trim().length > 0 || editorRef.current.textContent.trim().length > 0;
                if (containerRef.current) {
                    containerRef.current.classList.toggle('plus-rich-text-editor-has-value', hasContent);
                }
            }
        }
    }, [value]);

    const containerClasses = [
        'plus-rich-text-editor',
        spacing === 'compact' ? 'plus-rich-text-editor--compact' : '',
        useFullToolbar ? 'plus-rich-text-editor--full' : '',
        readOnly ? 'plus-rich-text-editor-readonly' : '',
        disabled ? 'plus-rich-text-editor-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    const blockLabel = BLOCK_OPTIONS.find((o) => o.value === blockFormat)?.label || 'Normal';

    const renderFormatButton = (btnKey, iconOverride) => {
        const def = BUTTON_DEFS[btnKey];
        if (!def) return null;
        const icon = iconOverride || def.icon;
        return (
            <IconButton
                key={btnKey}
                type="button"
                spacing={toolbarBtnSpacing}
                appearance="subtle"
                icon={icon}
                label={def.title}
                isSelected={Boolean(toolbarState[btnKey])}
                onClick={(e) => {
                    e.preventDefault();
                    execCommand(def.command, def.value);
                }}
                isDisabled={disabled || readOnly}
            />
        );
    };

    const renderFullToolbar = () => (
        <ButtonGroup
            label="Rich text formatting"
            className="plus-rich-text-editor-full-group"
        >
            {(toolbarButtons || FULL_DEFAULT_BUTTONS).map((btnKey) => {
                const def = BUTTON_DEFS[btnKey];
                if (!def) return null;
                return (
                    <IconButton
                        key={btnKey}
                        type="button"
                        spacing={toolbarBtnSpacing}
                        icon={def.icon}
                        label={def.title}
                        isSelected={Boolean(toolbarState[btnKey])}
                        onClick={(e) => {
                            e.preventDefault();
                            execCommand(def.command, def.value);
                        }}
                        isDisabled={disabled || readOnly}
                    />
                );
            })}
        </ButtonGroup>
    );

    return (
        <div id={fieldId} ref={containerRef} className={containerClasses} style={style} {...props}>
            {/*
              * #329. A `span`, not a `label`. `contentEditable` is not a form
              * control, so `htmlFor` has nothing to bind to — the same reason
              * `Rating` names its group with `aria-labelledby`
              * (#206). The editor points back at this id.
              */}
            {label && (
                <span id={labelId} className="plus-rich-text-editor-label">
                    {label}
                </span>
            )}
            <div className="plus-rich-text-editor-toolbar">
                {useFullToolbar ? (
                    renderFullToolbar()
                ) : (
                    <>
                        <DropdownMenu
                            spacing="compact"
                            minWidth="10rem"
                            trigger={(
                                <button
                                    type="button"
                                    id={`${fieldId}-block-format`}
                                    className="plus-rich-text-editor-block-toggle"
                                    disabled={disabled || readOnly}
                                >
                                    <span className="plus-rich-text-editor-block-toggle-label">{blockLabel}</span>
                                    <span className="plus-rich-text-editor-block-toggle-caret" aria-hidden>
                                        <i className={iconClass('arrows-up-down')} />
                                    </span>
                                </button>
                            )}
                        >
                            {BLOCK_OPTIONS.map((opt) => (
                                <ButtonItem
                                    key={opt.value}
                                    isSelected={blockFormat === opt.value}
                                    onClick={() => execCommand('formatBlock', opt.value)}
                                >
                                    {opt.label}
                                </ButtonItem>
                            ))}
                        </DropdownMenu>
                        <div
                            className="plus-rich-text-editor-biu-cluster"
                            role="group"
                            aria-label="Bold, italic, and underline"
                        >
                            {renderFormatButton('bold')}
                            {renderFormatButton('italic')}
                            {renderFormatButton('underline')}
                        </div>
                        <div className="plus-rich-text-editor-ghost-tools">
                            {renderFormatButton('link')}
                            {renderFormatButton('list-ul', COMPACT_LIST_ICON)}
                        </div>
                    </>
                )}
            </div>

            <div
                ref={editorRef}
                id={editorId}
                className="plus-rich-text-editor-content"
                contentEditable={!readOnly && !disabled}
                /*
                 * #329. `textbox` with `aria-multiline` is what a contentEditable
                 * region has to say about itself; without it, it is announced as
                 * a group of whatever happens to be inside. `aria-readonly`
                 * tracks the same flag that turns editing off, so the two cannot
                 * drift.
                 */
                role="textbox"
                aria-multiline="true"
                aria-labelledby={labelId}
                aria-readonly={readOnly || disabled || undefined}
                data-placeholder={placeholder}
                style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
                onInput={handleInput}
                onFocus={(e) => {
                    updateToolbarState();
                    if (onFocus) onFocus(e);
                }}
                onBlur={(e) => {
                    if (onBlur) onBlur(e);
                }}
                onKeyUp={updateToolbarState}
                onMouseUp={updateToolbarState}
            />
            {name && <input type="hidden" name={name} value={value || (editorRef.current?.innerHTML || '')} />}
        </div>
    );
};

RichTextEditor.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    /** The editor's name, rendered above it and pointed at by the region. */
    label: PropTypes.node,
    /** Hint text shown while the editor is empty. */
    placeholder: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    /** `default` or `compact`. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Shows the content without letting the user edit it, and disables the toolbar. */
    readOnly: PropTypes.bool,
    /** Prevents interaction, disables the toolbar and dims the editor. */
    disabled: PropTypes.bool,
    /** Minimum height of the editing area, in pixels. */
    minHeight: PropTypes.number,
    toolbarButtons: PropTypes.arrayOf(PropTypes.string),
    /** `compact` (default) is the short toolbar for messages; `full` is the extended set of formatting controls. Passing `toolbarButtons` uses the full toolbar with those buttons. */
    toolbarPreset: PropTypes.oneOf(['compact', 'full']),
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
};

export default RichTextEditor;
