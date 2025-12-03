/**
 * @fileoverview Rich text editor component for PLUS design system.
 * Universal element component for creating rich text editors with formatting toolbar.
 * Matches Figma design system specifications.
 */

/**
 * Creates a rich text editor element styled according to PLUS design system.
 * @param {Object} options - Rich text editor configuration options.
 * @param {string} [options.id] - Editor ID.
 * @param {string} [options.name] - Editor name attribute (for hidden input).
 * @param {string} [options.placeholder] - Placeholder text.
 * @param {string} [options.value] - Initial HTML value.
 * @param {"small"|"medium"|"large"} [options.size="medium"] - Editor size.
 * @param {boolean} [options.readonly=false] - Whether the editor is read-only.
 * @param {boolean} [options.disabled=false] - Whether the editor is disabled.
 * @param {number} [options.minHeight] - Minimum height in pixels.
 * @param {Array<string>} [options.toolbarButtons] - Array of toolbar button types to include.
 *   Available: "bold", "italic", "underline", "strikethrough", "heading", "list-ul", "list-ol", 
 *   "link", "image", "code", "quote", "align-left", "align-center", "align-right", "undo", "redo".
 *   If not provided, includes all buttons.
 * @param {Array<string>} [options.classes] - Additional CSS classes.
 * @param {Object} [options.styles] - Additional inline styles.
 * @param {Function} [options.onChange] - Change handler (receives HTML content).
 * @param {Function} [options.onFocus] - Focus handler.
 * @param {Function} [options.onBlur] - Blur handler.
 * @returns {HTMLElement} Rich text editor container element.
 */
export function createRichTextEditor({
    id,
    name,
    placeholder,
    value,
    size = "medium",
    readonly = false,
    disabled = false,
    minHeight,
    toolbarButtons,
    classes = [],
    styles = null,
    onChange = null,
    onFocus = null,
    onBlur = null
}) {
    // Default toolbar buttons if not specified
    const defaultToolbarButtons = [
        "bold", "italic", "underline", "strikethrough",
        "heading", "list-ul", "list-ol",
        "link", "image", "code", "quote",
        "align-left", "align-center", "align-right",
        "undo", "redo"
    ];
    
    const buttons = toolbarButtons || defaultToolbarButtons;
    
    // Create container
    const container = document.createElement("div");
    container.classList.add("plus-rich-text-editor");
    container.classList.add(`plus-rich-text-editor-${size}`);
    
    if (id) {
        container.id = id;
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }
    
    // Create toolbar
    const toolbar = document.createElement("div");
    toolbar.classList.add("plus-rich-text-editor-toolbar");
    
    // Toolbar button definitions
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
    
    // Create toolbar buttons
    buttons.forEach((buttonType) => {
        if (buttonDefs[buttonType]) {
            const def = buttonDefs[buttonType];
            const button = document.createElement("button");
            button.type = "button";
            button.classList.add("plus-rich-text-editor-toolbar-button");
            button.setAttribute("data-command", def.command);
            if (def.value) {
                button.setAttribute("data-value", def.value);
            }
            button.setAttribute("title", def.title);
            button.setAttribute("aria-label", def.title);
            
            // Add icon
            const icon = document.createElement("i");
            icon.classList.add("fas", `fa-${def.icon}`);
            button.appendChild(icon);
            
            // Add click handler
            button.addEventListener("click", (e) => {
                e.preventDefault();
                if (!disabled && !readonly) {
                    executeCommand(def.command, def.value);
                    updateToolbarState();
                }
            });
            
            toolbar.appendChild(button);
        }
    });
    
    // Create editor content area
    const editor = document.createElement("div");
    editor.classList.add("plus-rich-text-editor-content");
    editor.setAttribute("contenteditable", !readonly && !disabled ? "true" : "false");
    
    if (placeholder) {
        editor.setAttribute("data-placeholder", placeholder);
    }
    
    // Add typography class based on size
    if (size === "small") {
        editor.classList.add("body3-txt");
    } else if (size === "large") {
        editor.classList.add("body1-txt");
    } else {
        editor.classList.add("body2-txt");
    }
    
    // Hidden input for form submission
    let hiddenInput = null;
    if (name) {
        hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = name;
        hiddenInput.value = value || "";
    }
    
    // Update has-value class
    function updateHasValueClass() {
        const hasContent = editor.textContent.trim().length > 0 || editor.innerHTML.trim().length > 0;
        container.classList.toggle("plus-rich-text-editor-has-value", hasContent);
    }
    
    // Execute command function
    function executeCommand(command, value) {
        document.execCommand(command, false, value);
        editor.focus();
        
        // Update hidden input
        if (hiddenInput) {
            hiddenInput.value = editor.innerHTML;
        }
        
        // Update has-value class
        updateHasValueClass();
        
        // Trigger change event
        if (onChange) {
            onChange(editor.innerHTML);
        }
    }
    
    // Update toolbar button states
    function updateToolbarState() {
        const toolbarButtons = toolbar.querySelectorAll(".plus-rich-text-editor-toolbar-button");
        toolbarButtons.forEach((btn) => {
            const command = btn.getAttribute("data-command");
            const isActive = document.queryCommandState(command);
            btn.classList.toggle("active", isActive);
        });
    }
    
    // Set initial value
    if (value) {
        editor.innerHTML = value;
    }
    
    // Initial check for has-value class
    updateHasValueClass();
    
    // Set minimum height
    if (minHeight) {
        editor.style.minHeight = `${minHeight}px`;
    }
    
    // State classes
    if (readonly) {
        editor.classList.add("plus-rich-text-editor-readonly");
        container.classList.add("plus-rich-text-editor-readonly");
    }
    
    if (disabled) {
        editor.classList.add("plus-rich-text-editor-disabled");
        container.classList.add("plus-rich-text-editor-disabled");
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(container.style, styles);
    }
    
    // Editor event handlers
    editor.addEventListener("input", () => {
        updateHasValueClass();
        if (hiddenInput) {
            hiddenInput.value = editor.innerHTML;
        }
        if (onChange) {
            onChange(editor.innerHTML);
        }
    });
    
    editor.addEventListener("focus", (e) => {
        updateToolbarState();
        if (onFocus) {
            onFocus(e);
        }
    });
    
    editor.addEventListener("blur", (e) => {
        if (onBlur) {
            onBlur(e);
        }
    });
    
    // Handle selection changes for toolbar state
    editor.addEventListener("keyup", updateToolbarState);
    editor.addEventListener("mouseup", updateToolbarState);
    
    // Link/image insertion handlers
    const linkButton = toolbar.querySelector('[data-command="createLink"]');
    if (linkButton) {
        linkButton.addEventListener("click", (e) => {
            e.preventDefault();
            const url = prompt("Enter URL:");
            if (url) {
                executeCommand("createLink", url);
            }
        });
    }
    
    const imageButton = toolbar.querySelector('[data-command="insertImage"]');
    if (imageButton) {
        imageButton.addEventListener("click", (e) => {
            e.preventDefault();
            const url = prompt("Enter image URL:");
            if (url) {
                executeCommand("insertImage", url);
            }
        });
    }
    
    // Assemble container
    container.appendChild(toolbar);
    container.appendChild(editor);
    if (hiddenInput) {
        container.appendChild(hiddenInput);
    }
    
    // Expose methods
    container.getContent = () => editor.innerHTML;
    container.setContent = (html) => {
        editor.innerHTML = html;
        updateHasValueClass();
        if (hiddenInput) {
            hiddenInput.value = html;
        }
    };
    container.getText = () => editor.textContent || editor.innerText;
    container.focus = () => editor.focus();
    container.blur = () => editor.blur();
    
    return container;
}

