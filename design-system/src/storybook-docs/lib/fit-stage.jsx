import React from 'react';
import PropTypes from 'prop-types';
import { STAGE_FLOOR, inTypeThumb, useStageLayout } from './use-fit-scale.js';

/** True when rendered inside a TypeCard thumbnail, keeping the thumbnail stage unscrollable as on main. */
export const TypeThumbContext = React.createContext(false);

const useInTypeThumb = (active) => {
    const thumbCtx = React.useContext(TypeThumbContext);
    const probeRef = React.useRef(null);
    const [inThumb, setInThumb] = React.useState(false);
    React.useLayoutEffect(() => {
        if (!active || thumbCtx) return;
        setInThumb(inTypeThumb(probeRef.current));
    }, [active, thumbCtx]);
    return [probeRef, thumbCtx || inThumb];
};

/** The height of the box `ref` points at, kept current as it changes. */
const useMeasuredHeight = () => {
    const ref = React.useRef(null);
    const [height, setHeight] = React.useState(0);
    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const read = () => setHeight(el.offsetHeight);
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, height];
};

/**
 * The one stage both wrappers draw: `children(layout, reflow)` laid out at the
 * width `useStageLayout` gives and scaled to fit. With `scaleOutside` false a
 * stage outside the docs renders as it is, unscaled, at its own width.
 */
const Stage = ({ width, allowReflow, scaleOutside, children }) => {
    const [ref, layout, scale, reflow] = useStageLayout(width, allowReflow);
    const [inner, height] = useMeasuredHeight();
    if (!reflow && !scaleOutside) return <div ref={ref}><div ref={inner}>{children(width, false)}</div></div>;
    return (
        <div ref={ref} data-fit-stage style={{ inlineSize: '100%', blockSize: height * scale, overflow: 'hidden' }}>
            <div ref={inner} data-stage-layout={layout} style={{ inlineSize: layout, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                {children(layout, reflow)}
            </div>
        </div>
    );
};

/**
 * A live story at its own `width` inside a horizontally scrollable box: it
 * takes its container's width and scrolls sideways when wider, never scaling.
 */
export const ScrollStage = React.forwardRef(({ width, height, children, ...props }, ref) => (
    <div ref={ref} style={{ overflowX: 'auto' }}>
        <div style={{ inlineSize: width, blockSize: height }} {...props}>
            {children}
        </div>
    </div>
));

ScrollStage.displayName = 'ScrollStage';

ScrollStage.propTypes = {
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    children: PropTypes.node,
};

/**
 * A live story laid out at a stage `width` and drawn to fit its canvas: the
 * stage is never wider than the box it sits in, so the picture has equal
 * insets on both sides. Unlike `ScaledStory` it stays interactive (no `inert`),
 * so a story's play can still click and read it; measure its parts with
 * `offsetWidth` / `offsetHeight` (layout size) when a value must match a token.
 *
 * On a docs page a stage wider than its canvas reflows instead: it lays out at
 * the canvas's width, down to the Page's floor, and only scales below that, so
 * a whole screen responds to the page and never shrinks to an unreadable
 * picture. A story's own canvas and the test runner keep the fixed stage.
 *
 * With `scrollable` set, the stage never scales and instead scrolls
 * horizontally inside its own box when wider than the docs column (unless
 * inside a `TypeCard` thumbnail, which keeps the unscrollable main stage).
 *
 * @param {object} props
 * @param {number} props.width  the stage width the story lays out at
 * @param {boolean} [props.reflow]  false keeps the stage at its own width on a docs page too, only scaling it
 * @param {boolean} [props.scrollable]  render at scale 1 and scroll horizontally when wider than the container
 * @param {boolean} [props.fluid]  fill the container at scale 1 without forcing `width` outside a thumbnail
 */
export const FitStage = ({ width, reflow = true, scrollable = false, fluid = false, children }) => {
    const [probeRef, inThumb] = useInTypeThumb(scrollable);
    if (scrollable && !inThumb) {
        if (fluid) return <div ref={probeRef} style={{ inlineSize: '100%' }} data-fit-stage>{children}</div>;
        return <ScrollStage ref={probeRef} width={width} data-fit-stage>{children}</ScrollStage>;
    }
    return <Stage width={width} allowReflow={reflow} scaleOutside>{() => children}</Stage>;
};

FitStage.propTypes = {
    width: PropTypes.number.isRequired,
    /** False keeps the stage at its own width on a docs page too, only scaling it: for a picture of one fixed width. */
    reflow: PropTypes.bool,
    /** Render at scale 1 inside a horizontally scrollable box instead of scaling down. */
    scrollable: PropTypes.bool,
    /** Fill the container at scale 1 without forcing `width` outside a TypeCard thumbnail. */
    fluid: PropTypes.bool,
    children: PropTypes.node,
};

/**
 * A screen that sets its own width, reflowed on a docs page: `children` is a
 * function of the width to lay out at. On a docs page it gets the canvas's
 * width (down to the Page's floor, scaled below it); anywhere else it gets
 * `width` and renders as it is, unscaled, so a story's play measures the real
 * stage.
 *
 * @param {object} props
 * @param {number} props.width  the stage width the screen lays out at
 * @param {(layout: number, reflow: boolean) => React.ReactNode} props.children
 */
export const ReflowStage = ({ width, children }) => (
    <Stage width={width} allowReflow scaleOutside={false}>{children}</Stage>
);

ReflowStage.propTypes = {
    width: PropTypes.number.isRequired,
    children: PropTypes.func.isRequired,
};

/**
 * A screen box `width` wide, reflowed on a docs page: `ReflowStage` around one
 * plain box. A `fluid` screen fills its canvas outside the docs, as it did
 * before, and only takes the reflowed width on a docs page. With `scrollable`,
 * the stage never applies a scale transform and scrolls sideways below `STAGE_FLOOR`
 * (except inside a `TypeCard` thumbnail, which keeps the unscrollable main stage).
 */
export const ScreenStage = ({ width, fluid = false, scrollable = false, children }) => {
    const [probeRef, inThumb] = useInTypeThumb(scrollable);
    if (scrollable && !inThumb) {
        return (
            <div ref={probeRef} style={{ overflowX: 'auto' }}>
                <div style={{ inlineSize: fluid ? '100%' : width, minInlineSize: fluid ? Math.min(width, STAGE_FLOOR) : undefined }}>
                    {children}
                </div>
            </div>
        );
    }
    return (
        <ReflowStage width={width}>
            {(layout, reflow) => <div style={{ inlineSize: fluid && !reflow ? undefined : layout }}>{children}</div>}
        </ReflowStage>
    );
};

ScreenStage.propTypes = { width: PropTypes.number.isRequired, fluid: PropTypes.bool, scrollable: PropTypes.bool, children: PropTypes.node };

export default FitStage;
