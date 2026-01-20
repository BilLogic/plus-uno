import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const RichTextEditor = ({
    id,
    name,
    placeholder,
    value,
    defaultValue = '',
    size = 'medium',
    readOnly = false,
    disabled = false,
    minHeight,
    toolbarButtons,
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    ...props
}) => {
    const editorRef = useRef(null);
    const containerRef = useRef(null);
    const [toolbarState, setToolbarState] = useState({});

    // Default toolbar buttons
    const defaultButtons = [
        "bold", "italic", "underline", "strikethrough",
        "heading", "list-ul", "list-ol",
        "link", "image", "code", "quote",
        "align-left", "align-center", "align-right",
        "undo", "redo"
    ];

    const buttons = toolbarButtons || defaultButtons;

    const buttonDefs = {
        "bold": { icon: "bold", command: "bold", title: "Bold" },
        "italic": { icon: "italic", command: "italic", title: "Italic" },
        "underline": { icon: "underline", command: "underline", title: "Underline" },
        "strikethrough": { icon: "strikethrough", command: "strikeThrough", title: "Strikethrough" },
        "heading": { icon: "heading", command: "formatBlock", value: "h3", title: "Heading" },
        "list-ul": { icon: "list-ul", command: "insertUnorderedList", title: "Bullet List" },
        "list-ol": { icon: "list-ol", command: "insertOrderedList", title: "Numbered List" },
        "link": { icon: "link", command: "createLink", title: "Insert Link" },
        "image": { icon: "image", command: "insertImage", title: "Insert Image" },
        "code": { icon: "code", command: "formatBlock", value: "pre", title: "Code Block" },
        "quote": { icon: "quote-right", command: "formatBlock", value: "blockquote", title: "Quote" },
        "align-left": { icon: "align-left", command: "justifyLeft", title: "Align Left" },
        "align-center": { icon: "align-center", command: "justifyCenter", title: "Align Center" },
        "align-right": { icon: "align-right", command: "justifyRight", title: "Align Right" },
        "undo": { icon: "undo", command: "undo", title: "Undo" },
        "redo": { icon: "redo", command: "redo", title: "Redo" }
    };

    const execCommand = (command, val) => {
        if (disabled || readOnly) return;

        // Handle special cases
        if (command === 'createLink' && !val) {
            const url = prompt("Enter URL:");
            if (url) document.execCommand(command, false, url);
        } else if (command === 'insertImage' && !val) {
            const url = prompt("Enter image URL:");
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

    const updateToolbarState = () => {
        const newState = {};
        buttons.forEach(btn => {
            const def = buttonDefs[btn];
            if (def) {
                newState[btn] = document.queryCommandState(def.command);
            }
        });
        setToolbarState(newState);
    };

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            const hasContent = html.trim().length > 0 || editorRef.current.textContent.trim().length > 0;

            if (containerRef.current) {
                containerRef.current.classList.toggle("plus-rich-text-editor-has-value", hasContent);
            }

            if (onChange) {
                onChange(html);
            }
        }
    };

    // Initial value setup
    useEffect(() => {
        if (editorRef.current) {
            // If value is provided (controlled), use it. Otherwise use defaultValue (uncontrolled)
            const initialContent = value !== undefined ? value : defaultValue;
            if (editorRef.current.innerHTML !== initialContent) {
                editorRef.current.innerHTML = initialContent;
                // Manually trigger has-value check
                const hasContent = initialContent.trim().length > 0 || editorRef.current.textContent.trim().length > 0;
                if (containerRef.current) {
                    containerRef.current.classList.toggle("plus-rich-text-editor-has-value", hasContent);
                }
            }
        }
    }, []); // Only on mount/dependencies if we want strict controlled behavior, but contenteditable is tricky with React controlled inputs.
    // For true controlled input, we'd need to compare innerHTML with value prop on every render and update if different, avoiding cursor jumps. 
    // Implementing "loosely controlled" here where we update if incoming prop changes significantly.

    useEffect(() => {
        if (value !== undefined && editorRef.current && editorRef.current.innerHTML !== value) {
            // Only update if significantly different to avoid cursor jumping issues
            // Simple comparison for now
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value;
                const hasContent = value.trim().length > 0 || editorRef.current.textContent.trim().length > 0;
                if (containerRef.current) {
                    containerRef.current.classList.toggle("plus-rich-text-editor-has-value", hasContent);
                }
            }
        }
    }, [value]);

    const containerClasses = [
        'plus-rich-text-editor',
        `plus-rich-text-editor-${size}`,
        readOnly ? 'plus-rich-text-editor-readonly' : '',
        disabled ? 'plus-rich-text-editor-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    const editorClasses = [
        'plus-rich-text-editor-content',
        size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt'),
        readOnly ? 'plus-rich-text-editor-readonly' : '',
        disabled ? 'plus-rich-text-editor-disabled' : ''
    ].filter(Boolean).join(' ');

    return (
        <div id={id} ref={containerRef} className={containerClasses} style={style} {...props}>
            <div className="plus-rich-text-editor-toolbar">
                {buttons.map(btnKey => {
                    const def = buttonDefs[btnKey];
                    if (!def) return null;

                    return (
                        <button
                            key={btnKey}
                            type="button"
                            className={`plus-rich-text-editor-toolbar-button ${toolbarState[btnKey] ? 'active' : ''}`}
                            title={def.title}
                            aria-label={def.title}
                            onClick={(e) => { e.preventDefault(); execCommand(def.command, def.value); }}
                            disabled={disabled || readOnly}
                        >
                            <i className={`fas fa-${def.icon}`} />
                        </button>
                    );
                })}
            </div>

            <div
                ref={editorRef}
                className={editorClasses}
                contentEditable={!readOnly && !disabled}
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
    placeholder: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    readOnly: PropTypes.bool,
    disabled: PropTypes.bool,
    minHeight: PropTypes.number,
    toolbarButtons: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
};

export default RichTextEditor;
