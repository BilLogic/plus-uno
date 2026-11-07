import React from 'react';
import PropTypes from 'prop-types';

/**
 * A whole shell (a Frame, a template, a Blanket at a stand-in screen) drawn at
 * a fixed stage size and scaled down to fit a do or don't card. The shell
 * lays itself out at `width`, so a Frame docks and a Blanket pads as they do
 * at that size; only the picture shrinks.
 *
 * It is a picture, not a second working page: the box is `inert` and hidden
 * from assistive technology, so the docs page gains no tab stops and no
 * duplicate landmarks. A `position: fixed` part inside it (the AI chat's
 * floating popup) is held to the box, since the scaled box is its
 * containing block.
 *
 * `width` and `height` are stage geometry for the docs, like `ModeFrame`'s,
 * not design values.
 *
 * @param {object} props
 * @param {number} props.width  the stage width the shell lays out at
 * @param {number} props.height  the stage height
 * @param {React.ReactNode} props.children
 */
export const ScaledPreview = ({ width, height, children }) => {
    const ref = React.useRef(null);
    const [scale, setScale] = React.useState(1);
    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const read = () => setScale(Math.min(1, el.clientWidth / width));
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(el);
        return () => observer.disconnect();
    }, [width]);

    return (
        <div ref={ref} className="not-prose sb-unstyled" inert aria-hidden="true" style={{ width: '100%', height: height * scale, overflow: 'hidden' }}>
            <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                {children}
            </div>
        </div>
    );
};

ScaledPreview.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    children: PropTypes.node,
};

export default ScaledPreview;
