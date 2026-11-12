import React from 'react';
import { DocsCanvasShell } from '../ds-docs-layout.jsx';
import { useFitScale } from './use-fit-scale.js';

/**
 * A story shown in its own iframe at a fixed screen width, for docs pages that
 * show a layout mode. The layout tokens switch on `@media (min-width: …)`,
 * which reads the viewport, so a wrapper of that width would show the wrong
 * mode; an iframe of that width is a real viewport.
 *
 * The frame scales down to fit a narrower docs column, and it follows the
 * toolbar's Color mode and Contrast switches through the attributes on <html>.
 * Put it in a `DocsCanvasShell` so it takes the page's example chrome.
 */

const readModes = () => {
    if (typeof document === 'undefined') return { color: 'light', contrast: 'no-preference' };
    const root = document.documentElement;
    return {
        color: root.getAttribute('data-color-mode') || 'light',
        contrast: root.getAttribute('data-contrast-mode') || 'no-preference',
    };
};

/** The color and contrast modes now on <html>, kept current as the toolbar changes them. */
const useModes = () => {
    const [modes, setModes] = React.useState(readModes);
    React.useEffect(() => {
        const observer = new MutationObserver(() => setModes(readModes()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode', 'data-contrast-mode'] });
        return () => observer.disconnect();
    }, []);
    return modes;
};

/**
 * @param {object} props
 * @param {string} props.storyId  the story id, such as `templates-page-templates--dashboard`
 * @param {number} props.width  the screen width the story is drawn at
 * @param {number} props.height  the screen height
 * @param {string} props.title  the accessible name of the frame
 */
export const ModeFrame = ({ storyId, width, height, title }) => {
    const modes = useModes();
    // Read the column width before the first paint, so the frame never shows unscaled.
    const [wrapRef, scale] = useFitScale(width);

    const globals = `plusColorMode:${modes.color};plusContrastMode:${modes.contrast}`;
    const src = `iframe.html?id=${storyId}&viewMode=story&globals=${globals}`;
    return (
        // The scaled iframe keeps its layout width, so the wrapper clips it to the column.
        <div ref={wrapRef} style={{ width: '100%', height: height * scale, overflow: 'hidden' }}>
            <iframe
                title={title}
                src={src}
                width={width}
                height={height}
                loading="lazy"
                style={{
                    display: 'block',
                    boxSizing: 'border-box',
                    border: 0,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                }}
            />
        </div>
    );
};

/**
 * One example of a layout-mode page: an h3 and a one-line description over a
 * story drawn at a real screen width. The `ComponentExample` of a shell whose
 * point is the width it is drawn at, which an inline canvas cannot show.
 *
 * @param {object} props
 * @param {string} props.title  the mode or state the frame shows
 * @param {React.ReactNode} [props.description]  in one sentence
 * @param {string} props.storyId
 * @param {number} props.width
 * @param {number} props.height
 */
export const ModeExample = ({ title, description, storyId, width, height }) => (
    <>
        <h3>{title}</h3>
        <DocsCanvasShell attachSourceBelow={false} description={description}>
            <ModeFrame storyId={storyId} width={width} height={height} title={`${title}, ${width} wide`} />
        </DocsCanvasShell>
    </>
);

export default ModeFrame;
