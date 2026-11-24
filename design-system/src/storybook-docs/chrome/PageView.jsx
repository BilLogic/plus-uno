import React, { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, SegmentedControl } from '@/components';
import { inDocsPage } from '../lib/use-fit-scale.js';
import './PageView.scss';

/**
 * The view control of a full-page preview: Fit, 50%, 75%, 100% and Full
 * screen. A page always lays out at its real width and is scaled visually, so
 * its breakpoints never change with the zoom. Docs-only; not exported from
 * `@/components`.
 *
 * `always` draws the control on every page (the browser frame). `auto` draws
 * it only when the page is wider than its column, so a page that already fits
 * has nothing to fit. A PageView inside another passes through.
 */

export const ZOOMS = [
    { key: 'fit', label: 'Fit' },
    { key: '50', label: '50%', scale: 0.5 },
    { key: '75', label: '75%', scale: 0.75 },
    { key: '100', label: '100%', scale: 1 },
];

const PageViewContext = createContext(false);

/** True inside a PageView: an inner stage then renders its page bare and lets the outer view scale it. */
export const useInPageView = () => useContext(PageViewContext);
export const PageViewProvider = PageViewContext.Provider;

/** Rounds down to two decimals, so a scaled page is never a pixel wider than its column. */
const floor2 = (n) => Math.floor(n * 100) / 100;

/** Marks every sibling along the path to the layer inert, and returns the undo. */
const inertAround = (layer) => {
    const marked = [];
    for (let node = layer; node && node !== document.body && node.parentNode; node = node.parentNode) {
        for (const sibling of node.parentNode.children) {
            if (sibling !== node && !sibling.hasAttribute('inert')) {
                sibling.setAttribute('inert', '');
                marked.push(sibling);
            }
        }
    }
    return () => marked.forEach((el) => el.removeAttribute('inert'));
};

/**
 * The zoom and the full-screen state of one page, and the width it lays out
 * at: its natural width (what it needs, or the well's width when it fits),
 * measured with the page set to the well's width so a fluid page never reads a
 * stale size. Full screen turns the same layer into a fixed, full-viewport
 * one: siblings are inert, Escape closes it and focus returns to the control.
 */
export const usePageView = (mode = 'always') => {
    // On a docs page the default is Fit; a story's own canvas and the test runner keep the page at real size.
    const [picked, setZoom] = useState(null);
    const [inDocs, setInDocs] = useState(false);
    const [fullScreen, setFullScreen] = useState(false);
    const layerRef = useRef(null);
    const wellRef = useRef(null);
    const pageRef = useRef(null);
    const [wellWidth, setWellWidth] = useState(0);
    const [layoutWidth, setLayoutWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);

    useLayoutEffect(() => {
        setInDocs(inDocsPage(layerRef.current));
    }, []);
    const zoom = picked ?? (inDocs ? 'fit' : '100');

    useLayoutEffect(() => {
        const well = wellRef.current;
        const page = pageRef.current;
        if (!well || !page) return undefined;
        let lastWidth = 0;
        const measure = () => {
            const width = well.clientWidth;
            if (!width) return;
            lastWidth = width;
            page.style.inlineSize = `${width}px`;
            const natural = Math.max(width, page.scrollWidth);
            page.style.inlineSize = `${natural}px`;
            setWellWidth(width);
            setLayoutWidth(natural);
            setPageHeight(page.offsetHeight);
        };
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        // The well is read only when its width changed and the page only for its height, so a
        // read never feeds the observer that triggered it.
        const wellObserver = new ResizeObserver(() => {
            if (well.clientWidth !== lastWidth) measure();
        });
        const pageObserver = new ResizeObserver(() => setPageHeight(page.offsetHeight));
        wellObserver.observe(well);
        pageObserver.observe(page);
        return () => {
            wellObserver.disconnect();
            pageObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!fullScreen) return undefined;
        const layer = layerRef.current;
        const undo = layer ? inertAround(layer) : () => {};
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (event) => {
            if (event.key === 'Escape' && !event.defaultPrevented) setFullScreen(false);
        };
        document.addEventListener('keydown', onKey);
        layer?.querySelector('[data-page-view-exit]')?.focus();
        return () => {
            undo();
            document.body.style.overflow = overflow;
            document.removeEventListener('keydown', onKey);
        };
    }, [fullScreen]);

    // Focus returns to the control that opened it, which the closed bar draws again.
    const wasFull = useRef(false);
    useEffect(() => {
        if (wasFull.current && !fullScreen) layerRef.current?.querySelector('[data-page-view-open]')?.focus();
        wasFull.current = fullScreen;
    }, [fullScreen]);

    const needed = layoutWidth > wellWidth + 1;
    const showBar = mode === 'always' || needed || fullScreen;
    const fitScale = layoutWidth ? Math.min(1, floor2(wellWidth / layoutWidth)) : 1;
    let scale = zoom === 'fit' ? fitScale : ZOOMS.find((z) => z.key === zoom).scale;
    if (fullScreen || !showBar) scale = 1;
    return { zoom, setZoom, fullScreen, setFullScreen, layerRef, wellRef, pageRef, layoutWidth, pageHeight, scale, showBar, needed };
};

/** The props of the layer that holds the bar and the well: a fixed full-viewport dialog in full screen. */
export const layerProps = (view, ids, base) => ({
    ref: view.layerRef,
    className: [base, view.fullScreen && 'plus-page-view--full'].filter(Boolean).join(' '),
    role: view.fullScreen ? 'dialog' : undefined,
    'aria-modal': view.fullScreen ? 'true' : undefined,
    'aria-labelledby': view.fullScreen ? ids.title : undefined,
    'aria-describedby': view.fullScreen ? ids.hint : undefined,
});

export const usePageViewIds = () => {
    const id = useId();
    return { title: `${id}-title`, hint: `${id}-hint` };
};

/** The control bar: the zoom steps as one segmented control and Full screen as an icon button; in full screen, the way out. */
export const PageViewBar = ({ view, ids }) => {
    if (view.fullScreen) {
        return (
            <div className="plus-page-view__bar plus-page-view__bar--full">
                <span id={ids.title} className="plus-page-view__title">Full screen preview</span>
                <span id={ids.hint} className="plus-page-view__hint">Press Escape to exit.</span>
                <IconButton
                    icon="compress"
                    label="Exit full screen"
                    spacing="compact"
                    data-page-view-exit
                    onClick={() => view.setFullScreen(false)}
                />
            </div>
        );
    }
    return (
        <div className="plus-page-view__bar">
            <SegmentedControl
                label="Page zoom"
                spacing="compact"
                options={ZOOMS.map(({ key, label }) => ({ value: key, label }))}
                value={view.zoom}
                onChange={view.setZoom}
            />
            <IconButton
                icon="expand"
                label="Full screen"
                spacing="compact"
                data-page-view-open
                onClick={() => view.setFullScreen(true)}
            />
        </div>
    );
};
PageViewBar.propTypes = { view: PropTypes.object.isRequired, ids: PropTypes.object.isRequired };

/** The page at its real width, scaled to the zoom; the well's height follows the scaled page. */
export const PageViewWell = ({ view, children }) => {
    const scaled = view.scale < 1 && view.layoutWidth > 0;
    const scrolls = view.fullScreen || (view.needed && view.zoom === '100');
    return (
        <div
            ref={view.wellRef}
            className="plus-page-view__well"
            data-zoom={view.fullScreen ? 'full' : view.zoom}
            data-scale={view.scale}
            // A scroll region the keyboard can reach. No landmark role, as in ScrollBar: a region would nest a page's own main.
            tabIndex={scrolls ? 0 : undefined}
            aria-label={scrolls ? 'Page preview, scrollable' : undefined}
            style={scaled ? { blockSize: Math.ceil(view.pageHeight * view.scale) } : undefined}
        >
            <div
                ref={view.pageRef}
                className="plus-page-view__page"
                style={{
                    inlineSize: view.layoutWidth || undefined,
                    transform: scaled ? `scale(${view.scale})` : undefined,
                }}
            >
                {children}
            </div>
        </div>
    );
};
PageViewWell.propTypes = { view: PropTypes.object.isRequired, children: PropTypes.node };

/**
 * A page of any width with the view control above it. Inside another view it
 * renders the page bare; the outer view scales it.
 */
export const PageView = React.forwardRef(({ mode = 'auto', children }, ref) => {
    const nested = useInPageView();
    return nested ? <>{children}</> : <PageViewRoot mode={mode} rootRef={ref}>{children}</PageViewRoot>;
});
PageView.displayName = 'PageView';
PageView.propTypes = { mode: PropTypes.oneOf(['always', 'auto']), children: PropTypes.node };

const PageViewRoot = ({ mode, rootRef, children }) => {
    const view = usePageView(mode);
    const ids = usePageViewIds();
    const props = layerProps(view, ids, 'plus-page-view');
    const setRef = (el) => {
        view.layerRef.current = el;
        if (typeof rootRef === 'function') rootRef(el);
        else if (rootRef) rootRef.current = el;
    };
    return (
        <PageViewProvider value>
            <div {...props} ref={setRef}>
                {view.showBar && <PageViewBar view={view} ids={ids} />}
                <PageViewWell view={view}>{children}</PageViewWell>
            </div>
        </PageViewProvider>
    );
};
PageViewRoot.propTypes = { mode: PropTypes.string, rootRef: PropTypes.any, children: PropTypes.node };
