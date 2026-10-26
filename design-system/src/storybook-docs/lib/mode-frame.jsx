import React from 'react';

/**
 * A story shown in its own iframe at a fixed screen width, for docs pages that
 * show a layout mode. The layout tokens switch on `@media (min-width: …)`,
 * which reads the viewport, so a wrapper of that width would show the wrong
 * mode; an iframe of that width is a real viewport.
 *
 * The frame scales down to fit a narrower docs column, and it follows the
 * toolbar's Color mode and Contrast switches through the attributes on <html>.
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
 * @param {string} props.storyId  the story id, such as `foundations-patterns-page-templates--dashboard`
 * @param {number} props.width  the screen width the story is drawn at
 * @param {number} props.height  the screen height
 * @param {string} props.title  the accessible name of the frame
 */
export const ModeFrame = ({ storyId, width, height, title }) => {
    const modes = useModes();
    const wrapRef = React.useRef(null);
    const [scale, setScale] = React.useState(1);
    React.useEffect(() => {
        const el = wrapRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const read = () => setScale(Math.min(1, el.clientWidth / width));
        read();
        const observer = new ResizeObserver(read);
        observer.observe(el);
        return () => observer.disconnect();
    }, [width]);

    const globals = `plusColorMode:${modes.color};plusContrastMode:${modes.contrast}`;
    const src = `iframe.html?id=${storyId}&viewMode=story&globals=${globals}`;
    return (
        <div ref={wrapRef} style={{ width: '100%', height: height * scale }}>
            <iframe
                title={title}
                src={src}
                width={width}
                height={height}
                loading="lazy"
                style={{
                    display: 'block',
                    boxSizing: 'content-box',
                    border: '1px solid var(--ds-border)',
                    borderRadius: 'var(--radius-100)',
                    background: 'var(--ds-surface-sunken)',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                }}
            />
        </div>
    );
};

export default ModeFrame;
