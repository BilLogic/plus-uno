import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button';
import CloseButton from '@/components/forms-and-inputs/CloseButton';
import FooterActions from '@/components/forms-and-inputs/FooterActions';
import Skeleton from '@/components/loading/Skeleton';
import Tabs from '@/components/navigation/Tabs';
import { HeadingLevelContext } from '@/lib/headingLevel';
import './Dialog.scss';

/** Safe CSS length / custom-property patterns for Dialog width. */
const SAFE_WIDTH_RE = /^(?:\d+(?:\.\d+)?(?:px|rem|%)|var\(--[a-zA-Z0-9-]+(?:\s*,\s*[^)]+)?\))$/;

/** The `width` steps, from the screen grid: 4 · 6 · 8 · 10 columns plus the dialog pad. */
export const DIALOG_WIDTHS = ['4-col', '6-col', '8-col', '10-col'];

/** The screens `DIALOG_WIDTH_PX` is read at: 768 and 1024, and 1280, where the grid reaches its cap and the width stops growing. */
export const DIALOG_WIDTH_SCREENS = [768, 1024, 1280];

/** The `height` modes: `hug` grows to the screen cap, `fill` sits at that cap. */
export const DIALOG_HEIGHTS = ['hug', 'fill'];

/**
 * Each `width` step in pixels at `DIALOG_WIDTH_SCREENS`, as Dialog.scss computes
 * it. The docs page shows these; scripts/frame-layer-tokens.test.mjs holds them
 * equal to the `--modal-width-*` tokens.
 */
export const DIALOG_WIDTH_PX = {
    '4-col': [261, 347, 432],
    '6-col': [384, 512, 640],
    '8-col': [507, 677, 848],
    '10-col': [629, 843, 1056],
};

/**
 * Resolves a fixed `width` to CSS lengths, or `null` for a grid width.
 * Numbers (and numeric strings) become px; allowlisted lengths / CSS vars pass through.
 *
 * @param {number|string|undefined} width
 * @returns {{ width: string, minWidth: string, maxWidth: string } | null}
 */
const resolveDialogWidth = (width) => {
    if (width === undefined || width === null || DIALOG_WIDTHS.includes(width)) return null;

    const fixed = (length) => ({ width: length, minWidth: length, maxWidth: length });

    if (typeof width === 'number' && Number.isFinite(width)) return fixed(`${width}px`);

    if (typeof width === 'string') {
        const trimmed = width.trim();
        if (/^\d+(\.\d+)?$/.test(trimmed)) return fixed(`${trimmed}px`);
        if (SAFE_WIDTH_RE.test(trimmed)) return fixed(trimmed);
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[Dialog] Rejected unsafe width "${trimmed}"; falling back to the 6-col width.`);
        }
    }

    return null;
};

/**
 * True while an element's content is taller than its box.
 * A body that scrolls has to be a tab stop so a keyboard can scroll it.
 */
function useOverflows(el, loading, tabKey) {
    const [overflows, setOverflows] = useState(false);
    useLayoutEffect(() => {
        if (!el) return undefined;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [el, loading, tabKey]);
    return overflows;
}

/**
 * Controlled/uncontrolled tab state when `tabs` is supplied.
 */
function useDialogTabs(tabs, { activeTab, defaultActiveTab, onTabChange }) {
    const [held, setHeld] = useState(defaultActiveTab);
    if (!tabs || tabs.length === 0) return null;
    const controlled = activeTab !== undefined;
    const wanted = controlled ? activeTab : held;
    const enabled = tabs.filter((tab) => !tab.disabled);
    const current = (enabled.find((tab) => tab.key === wanted) ?? enabled[0] ?? tabs[0]).key;
    return {
        current,
        content: (tabs.find((tab) => tab.key === current) ?? tabs[0]).content,
        select: (key) => {
            if (key === current) return;
            if (!controlled) setHeld(key);
            onTabChange?.(key);
        },
    };
}

/**
 * Dialog component for PLUS design system.
 * The dialog panel itself: header (title, optional description, header actions,
 * close button, or custom header / tabs), scrolling body, and optional footer
 * slots. Sizes from the screen grid (`4-col · 6-col · 8-col · 10-col`) and
 * renders inline with no Blanket and no modal behavior. For a blocking overlay
 * dialog with Blanket, portal, focus trap, Escape and scroll lock, use the
 * `Modal` template from `@/patterns`.
 */
const Dialog = React.forwardRef(({
    id,
    title,
    description,
    ariaLabel,
    header,
    headerActions,
    showCloseButton = true,
    tabs,
    activeTab,
    defaultActiveTab,
    onTabChange,
    body,
    height = 'hug',
    showBottomButtons = true,
    footer,
    primaryButton,
    secondaryButton,
    dividers = false,
    loading = false,
    onClose,
    width = '6-col',
    className = '',
    style,
    children,
    'data-testid': dataTestId,
    ...rest
}, ref) => {
    const reactId = useId();
    const titleId = `${reactId}-title`;
    const descriptionId = `${reactId}-description`;
    const bodyRef = useRef(null);
    const [bodyEl, setBodyEl] = useState(null);
    const tabState = useDialogTabs(tabs, { activeTab, defaultActiveTab, onTabChange });

    const setRefs = (node) => {
        bodyRef.current = node;
        setBodyEl(node);
    };

    useLayoutEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }, [tabState?.current]);

    const hasFooter = showBottomButtons && Boolean(footer || primaryButton || secondaryButton);
    const bodyOnly = !header && !title && !description && !headerActions && !tabState && !showBottomButtons;
    const overflows = useOverflows(bodyEl, loading, tabState?.current);
    const bodyScrolls = height === 'fill' || overflows;

    const classes = [
        'plus-dialog',
        'plus-dialog-default',
        DIALOG_WIDTHS.includes(width) ? `plus-dialog-width-${width}` : '',
        `plus-dialog-height-${height}`,
        showBottomButtons ? 'plus-dialog-with-buttons' : 'plus-dialog-no-buttons',
        bodyOnly ? 'plus-dialog-body-only' : '',
        className,
        rest.className,
    ].filter(Boolean).join(' ');

    const dialogStyle = {
        ...(style || {}),
        ...(rest.style || {}),
        ...(resolveDialogWidth(width) || {}),
    };

    const tabId = (key) => `${reactId}-tab-${tabs.findIndex((tab) => tab.key === key)}`;
    const panelId = `${reactId}-panel`;

    const labelledBy = rest['aria-labelledby'] ?? (title && !header ? titleId : undefined);
    const describedBy = rest['aria-describedby'] ?? (description && !header ? descriptionId : undefined);
    const resolvedAriaLabel = rest['aria-label'] ?? ((!title || header) ? ariaLabel : undefined);

    const bodyAriaProps = tabState
        ? { role: 'tabpanel', id: panelId, 'aria-labelledby': tabId(tabState.current), tabIndex: 0 }
        : { tabIndex: bodyScrolls ? 0 : undefined };

    const headerRow = header ? (
        <div className="plus-dialog-header plus-dialog-header-custom">{header}</div>
    ) : (
        <div className="plus-dialog-header">
            {(title || description) && (
                <div className="plus-dialog-heading">
                    {title && <h1 id={titleId} className="plus-dialog-title">{title}</h1>}
                    {description && <div id={descriptionId} className="plus-dialog-description">{description}</div>}
                </div>
            )}
            {headerActions && <div className="plus-dialog-header-actions">{headerActions}</div>}
            {showCloseButton && (
                <CloseButton
                    label="Close"
                    isTooltipDisabled
                    className="plus-dialog-close-btn"
                    onClick={onClose}
                />
            )}
        </div>
    );

    const footerContent = footer || (
        <FooterActions>
            {secondaryButton && (
                <Button
                    text={secondaryButton.text || 'Discard'}
                    appearance={secondaryButton.appearance || 'default'}
                    spacing={secondaryButton.spacing}
                    onClick={secondaryButton.onClick}
                    iconBefore={secondaryButton.icon}
                    className="plus-dialog-button plus-dialog-button-secondary"
                />
            )}
            {primaryButton && (
                <Button
                    text={primaryButton.text || 'Confirm'}
                    appearance={primaryButton.appearance || 'primary'}
                    spacing={primaryButton.spacing}
                    onClick={primaryButton.onClick}
                    iconBefore={primaryButton.icon}
                    className="plus-dialog-button plus-dialog-button-primary"
                />
            )}
        </FooterActions>
    );

    return (
        <HeadingLevelContext.Provider value={1}>
            <div
                {...rest}
                ref={ref}
                id={id ?? rest.id}
                className={classes}
                style={dialogStyle}
                data-testid={dataTestId ?? rest['data-testid']}
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                aria-label={resolvedAriaLabel}
            >
                {!bodyOnly && (
                    <>
                        {tabState ? (
                            <div className="plus-dialog-header-group">
                                {headerRow}
                                <Tabs
                                    className="plus-dialog-tabs"
                                    activeKey={tabState.current}
                                    onSelect={tabState.select}
                                    aria-labelledby={labelledBy}
                                >
                                    {tabs.map((tab) => (
                                        <Tabs.Tab
                                            key={tab.key}
                                            eventKey={tab.key}
                                            isDisabled={tab.disabled}
                                            id={tabId(tab.key)}
                                            {...(tab.key === tabState.current ? { 'aria-controls': panelId } : {})}
                                        >
                                            {tab.label}
                                        </Tabs.Tab>
                                    ))}
                                </Tabs>
                            </div>
                        ) : headerRow}
                        {dividers && <div className="plus-dialog-divider" aria-hidden="true" />}
                    </>
                )}

                <div
                    ref={setRefs}
                    className="plus-dialog-body"
                    aria-busy={loading ? 'true' : undefined}
                    {...bodyAriaProps}
                >
                    {loading ? (
                        <div className="plus-dialog-skeleton">
                            <Skeleton shape="rect" width="100%" height={20} radius="element-radius-md" />
                            <Skeleton shape="rect" width="100%" height={20} radius="element-radius-md" />
                            <Skeleton shape="rect" width="60%" height={20} radius="element-radius-md" />
                        </div>
                    ) : (
                        <div className="plus-dialog-content">
                            {tabState ? (
                                tabState.content
                            ) : (
                                <>
                                    {body && (typeof body === 'string' ? <div className="plus-dialog-body-text">{body}</div> : body)}
                                    {children}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {hasFooter && (
                    <>
                        {dividers && <div className="plus-dialog-divider" aria-hidden="true" />}
                        <div className="plus-dialog-footer">
                            {footerContent}
                        </div>
                    </>
                )}
            </div>
        </HeadingLevelContext.Provider>
    );
});

Dialog.displayName = 'Dialog';

const buttonShape = PropTypes.shape({
    text: PropTypes.string,
    onClick: PropTypes.func,
    appearance: PropTypes.string,
    spacing: PropTypes.string,
    icon: PropTypes.string,
    iconPosition: PropTypes.string,
});

const tabShape = PropTypes.shape({
    key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.node.isRequired,
    content: PropTypes.node.isRequired,
    disabled: PropTypes.bool,
});

Dialog.propTypes = {
    /** The `id` attribute of the dialog panel. */
    id: PropTypes.string,
    /** The dialog's h1, and its accessible name. */
    title: PropTypes.node,
    /** A line under the title, read as the dialog's description. */
    description: PropTypes.node,
    /** The dialog's accessible name when it has no visible `title` or uses a custom `header`. */
    ariaLabel: PropTypes.string,
    /** Custom header slot replacing the title row (title and close button), so the caller owns both and names the dialog with `ariaLabel`. */
    header: PropTypes.node,
    /** Icon buttons in the header, before the close button. */
    headerActions: PropTypes.node,
    /** The header's close button. Off for a dialog that has to be answered. */
    showCloseButton: PropTypes.bool,
    /** Tab group under the title (`{ key, label, content, disabled? }`). The body becomes the tab panel and shows the selected tab's `content`. */
    tabs: PropTypes.arrayOf(tabShape),
    /** Selected tab's key when controlled; update from `onTabChange`. */
    activeTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Initial tab key when uncontrolled; defaults to the first enabled tab. */
    defaultActiveTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Called with the key of the selected tab. */
    onTabChange: PropTypes.func,
    /** The main content of the dialog. A string is drawn as body text; a node is drawn as given. `children` is rendered after it. */
    body: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** `hug` grows with the content to the cap and then scrolls its body; `fill` sits at that cap. */
    height: PropTypes.oneOf(DIALOG_HEIGHTS),
    /** Show the footer: `footer`, or the secondary and primary buttons. */
    showBottomButtons: PropTypes.bool,
    /** Custom footer content in place of the built-in pair, such as a three-button or leading-text FooterActions layout. */
    footer: PropTypes.node,
    /** The confirming footer button, drawn on the right. Takes `text` (default "Confirm"), `onClick`, `appearance` (default `primary`), `spacing` and `icon`. */
    primaryButton: buttonShape,
    /** The secondary footer button, drawn in the left half when a primary button is also given. Takes `text` (default "Discard"), `onClick`, `appearance` (default `default`), `spacing` and `icon`. */
    secondaryButton: buttonShape,
    /** A rule under the header and over the footer. */
    dividers: PropTypes.bool,
    /** Skeleton bars in place of the body while its content loads. */
    loading: PropTypes.bool,
    /** Called when the close button is clicked. */
    onClose: PropTypes.func,
    /**
     * `4-col` · `6-col` · `8-col` · `10-col`: 4 · 6 · 8 · 10 columns of the screen grid plus the dialog pad.
     * Grows with the screen, never shrinks, ignores the sidebar. A number or a length sets a fixed width.
     */
    width: PropTypes.oneOfType([PropTypes.oneOf(DIALOG_WIDTHS), PropTypes.number, PropTypes.string]),
    /** Extra class names added to the dialog panel beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the dialog panel. A fixed `width` is applied after them. */
    style: PropTypes.object,
    /** More content rendered in the body after `body`, for composing the dialog contents directly. */
    children: PropTypes.node,
};

export default Dialog;
