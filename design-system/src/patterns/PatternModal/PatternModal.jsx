import React from 'react';
import PropTypes from 'prop-types';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { OVERLAY_HEIGHTS, OVERLAY_WIDTHS } from '../Overlay';
import './PatternModal.scss';

const REPLACEMENTS = {
    padding: 'the modal pads Modal/pad 16 on every side.',
    gap: 'the modal stacks Modal/stack-md 16.',
    maxHeight: 'use height="hug" (grows to the screen less 128) or height="fill".',
};

/** The deprecated props that have warned in this session, so each warns once. */
const warned = new Set();

/**
 * Says once per session, in development, that an old sizing prop is kept only
 * so no caller breaks.
 *
 * @param {Record<string, unknown>} passed - The deprecated props, by name, as the caller passed them.
 */
function useDeprecatedSizing(passed) {
    const names = Object.keys(passed).filter((name) => passed[name] != null).join(',');
    React.useEffect(() => {
        if (!names || process.env.NODE_ENV === 'production') return;
        for (const name of names.split(',')) {
            if (warned.has(name)) continue;
            warned.add(name);
            // eslint-disable-next-line no-console
            console.warn(`[PatternModal] ${name} is deprecated and kept only so no caller breaks; ${REPLACEMENTS[name]}`);
        }
    }, [names]);
}

/**
 * Modal pattern for PLUS design system.
 * Modal shell rendered inline (no portal, focus trap or Escape): header with
 * title and close button, body slot, footer slot. Width is a step of the
 * screen grid (sm · md · lg: 6 · 8 · 10 columns plus the modal pad), and
 * height hugs the content up to the screen less 128 or fills to it, the body
 * scrolling past it. Place it in `Overlay` for the scrim.
 * Baked-in tokens: the overlay pair (`--ds-surface-overlay` with
 * `--ds-shadow-overlay`), as the Modal component draws it, and Modal/pad,
 * Modal/stack-md and Modal/radius.
 * Mirrors "Pattern/Modal" in the Figma design system file.
 * For a real overlay dialog (backdrop, focus trap), use the core Modal component.
 *
 * A dialog is its own page: the title is its h1, at Heading/medium 20, and a
 * section inside it opens at h2.
 */
const PatternModal = ({
    id,
    title,
    onClose,
    footer,
    width = 'sm',
    height = 'hug',
    maxHeight,
    padding,
    gap,
    className = '',
    style,
    children,
    ...props
}) => {
    const reactId = React.useId();
    useDeprecatedSizing({ padding, gap, maxHeight });

    const classes = [
        'plus-pattern-modal',
        `plus-pattern-modal-width-${width}`,
        `plus-pattern-modal-height-${height}`,
        padding ? `plus-pattern-modal-pad-${padding}` : '',
        gap ? `plus-pattern-modal-gap-${gap}` : '',
        className,
    ].filter(Boolean).join(' ');

    const modalStyle = {
        ...style,
        maxHeight: maxHeight ?? style?.maxHeight,
    };

    // A `role="dialog"` needs an accessible name. The header title is the name
    // whenever there is one, so point `aria-labelledby` at it; a caller that
    // renders a title-less modal has to pass its own `aria-label`, which flows
    // through `...props`.
    const titleId = `${reactId}-title`;
    const labelledBy = title ? titleId : undefined;

    // The body scrolls once the modal reaches its cap, and a scrollable region
    // that holds no focusable content is unreachable by keyboard. A fill modal
    // is always at its cap, a hug one when its content outgrows the screen, an
    // old `maxHeight` one past that height: give the body a tab stop then.
    const bodyRef = React.useRef(null);
    const overflows = useOverflows(bodyRef);
    const bodyScrolls = height === 'fill' || (maxHeight ?? style?.maxHeight) != null || overflows;

    return (
        <div
            id={id}
            className={classes}
            style={modalStyle}
            role="dialog"
            aria-modal="false"
            aria-labelledby={labelledBy}
            {...props}
        >
            <div className="plus-pattern-modal-header">
                {title && <h1 id={titleId} className="plus-pattern-modal-title">{title}</h1>}
                {onClose && (
                    <button
                        type="button"
                        className="plus-pattern-modal-close"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                )}
            </div>
            <HeadingLevelContext.Provider value={1}>
                <div ref={bodyRef} className="plus-pattern-modal-body" tabIndex={bodyScrolls ? 0 : undefined}>{children}</div>
            </HeadingLevelContext.Provider>
            {footer && <div className="plus-pattern-modal-footer">{footer}</div>}
        </div>
    );
};

/** True while an element's content is taller than its box. */
function useOverflows(ref) {
    const [overflows, setOverflows] = React.useState(false);
    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [ref]);
    return overflows;
}

PatternModal.propTypes = {
    id: PropTypes.string,
    /** Modal title in the header row: the dialog's h1, at Heading/medium 20, and its name */
    title: PropTypes.node,
    /** Close handler — renders the close button when provided */
    onClose: PropTypes.func,
    /** Footer slot (typically action buttons) */
    footer: PropTypes.node,
    /**
     * `sm` · `md` · `lg`: 6 · 8 · 10 columns of the screen grid plus the modal pad
     * (384 · 507 · 629 at 768, 512 · 677 · 843 at 1024, 640 · 848 · 1056 at 1440).
     * Grows with the screen, never shrinks, ignores the sidebar.
     */
    width: PropTypes.oneOf(OVERLAY_WIDTHS),
    /** `hug` grows with the content to the screen less 128 and then scrolls its body; `fill` sits at that cap. */
    height: PropTypes.oneOf(OVERLAY_HEIGHTS),
    /** Deprecated: a fixed cap. Use `height`. */
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Deprecated: the old Modal/pad-* tokens. The modal pads Modal/pad 16. */
    padding: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Deprecated: the old Modal/gap-* tokens. The modal stacks Modal/stack-md 16. */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    style: PropTypes.object,
    /** Body content slot */
    children: PropTypes.node,
};

export default PatternModal;
