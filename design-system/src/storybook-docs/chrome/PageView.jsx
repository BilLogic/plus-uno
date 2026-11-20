import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@base-ui/react/dialog';
import { Button, ButtonGroup, IconButton } from '@/components';
import './PageView.scss';

/**
 * The view control of a full-page preview: Fit, 50%, 75%, 100% and Full
 * screen. A page always lays out at its real width and is scaled visually, so
 * its breakpoints never change with the zoom. Docs-only; not exported from
 * `@/components`.
 */

export const ZOOMS = [
    { key: 'fit', label: 'Fit' },
    { key: '50', label: '50%', scale: 0.5 },
    { key: '75', label: '75%', scale: 0.75 },
    { key: '100', label: '100%', scale: 1 },
];

/**
 * The zoom, and the width the page lays out at: its natural width (what it
 * needs, or the well's width when it fits), measured with the page set to the
 * well's width so a fluid page never reads a stale size.
 */
export const usePageView = () => {
    const [zoom, setZoom] = useState('fit');
    const [fullScreen, setFullScreen] = useState(false);
    const wellRef = useRef(null);
    const pageRef = useRef(null);
    const [wellWidth, setWellWidth] = useState(0);
    const [layoutWidth, setLayoutWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);

    useLayoutEffect(() => {
        const well = wellRef.current;
        const page = pageRef.current;
        if (!well || !page) return undefined;
        const measure = () => {
            const width = well.clientWidth;
            if (!width) return;
            page.style.inlineSize = `${width}px`;
            const natural = Math.max(width, page.scrollWidth);
            page.style.inlineSize = `${natural}px`;
            setWellWidth(width);
            setLayoutWidth(natural);
            setPageHeight(page.offsetHeight);
        };
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(well);
        observer.observe(page);
        return () => observer.disconnect();
    }, []);

    const fitScale = layoutWidth ? Math.min(1, wellWidth / layoutWidth) : 1;
    const scale = zoom === 'fit' ? fitScale : ZOOMS.find((z) => z.key === zoom).scale;
    return { zoom, setZoom, fullScreen, setFullScreen, wellRef, pageRef, layoutWidth, pageHeight, scale };
};

/** The control bar: the zoom steps as one group, and Full screen as an icon button. */
export const PageViewBar = ({ view }) => (
    <div className="plus-page-view__bar">
        <ButtonGroup label="Page zoom">
            {ZOOMS.map(({ key, label }) => (
                <Button
                    key={key}
                    text={label}
                    spacing="compact"
                    isSelected={view.zoom === key}
                    onClick={() => view.setZoom(key)}
                />
            ))}
        </ButtonGroup>
        <IconButton
            icon="expand"
            label="Full screen"
            spacing="compact"
            onClick={() => view.setFullScreen(true)}
        />
    </div>
);
PageViewBar.propTypes = { view: PropTypes.object.isRequired };

/** The page at its real width, scaled to the zoom; the well's height follows the scaled page. */
export const PageViewWell = ({ view, children }) => {
    const scaled = view.scale < 1 && view.layoutWidth > 0;
    return (
        <div
            ref={view.wellRef}
            className="plus-page-view__well"
            data-zoom={view.zoom}
            data-scale={view.scale}
            style={scaled ? { blockSize: view.pageHeight * view.scale } : undefined}
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

/** The page at real size in a full-viewport overlay on a Base UI dialog: Escape closes it and focus returns. */
export const PageViewFullScreen = ({ view, children }) => {
    const onOpenChange = useCallback((open) => view.setFullScreen(open), [view]);
    return (
        <Dialog.Root open={view.fullScreen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Popup className="plus-page-view__full">
                    <div className="plus-page-view__full-bar">
                        <Dialog.Title className="plus-page-view__full-title">Full screen preview</Dialog.Title>
                        <IconButton
                            icon="compress"
                            label="Exit full screen"
                            spacing="compact"
                            onClick={() => view.setFullScreen(false)}
                        />
                    </div>
                    <div className="plus-page-view__full-body">
                        <div className="plus-page-view__full-page" style={{ inlineSize: view.layoutWidth || undefined }}>
                            {children}
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
PageViewFullScreen.propTypes = { view: PropTypes.object.isRequired, children: PropTypes.node };
