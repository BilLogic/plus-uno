import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button/Button';
import PatternCard from '@/patterns/PatternCard';
import { HeadingLevelContext } from '@/lib/headingLevel';
import './Jumbotron.scss';

/*
 * The deprecated props each say so once per session in development, however
 * many Jumbotrons render them. The set is module state; tests clear it.
 */
const warned = new Set();

const warnOnce = (key, message) => {
    if (process.env.NODE_ENV === 'production' || warned.has(key)) return;
    warned.add(key);
    // eslint-disable-next-line no-console
    console.warn(`[Jumbotron] ${message}`);
};

/** Clears the once-per-session record of deprecation warnings. For tests. */
export const resetJumbotronDeprecationWarnings = () => warned.clear();

const DEPRECATIONS = {
    subtitle: '`subtitle` is deprecated; use `description`.',
    fluid: '`fluid` is deprecated; use `container="band"`.',
    primaryButton: '`primaryButton` is deprecated; put a filled Button in `actions`.',
    secondaryButton: '`secondaryButton` is deprecated; put an outlined Button in `actions`, after the filled one.',
    paddingSize: '`paddingSize` is deprecated; the card pads at Card/pad-lg. It still sets the card padding for now.',
    gapSize: '`gapSize` is deprecated and has no effect; the spacing comes from the Section tokens.',
    radiusSize: '`radiusSize` is deprecated and has no effect; the card takes Card/radius and the band is square.',
    children: '`children` is deprecated; a Jumbotron is a title, one `description` line and `actions`.',
};

/**
 * Jumbotron: the one hero block at the top of a landing or overview page.
 * Mirrors Figma `Jumbotron`: a page-level `_Section header` (the title is the
 * page's h1 at Heading/large 24, one Body/default description line), an
 * actions slot and an optional media slot, in one of two containers.
 *
 * - **container** `card` is a PatternCard on the raised pair at Card/pad-lg;
 *   `band` is a full-bleed band on the surface container, padded
 *   Surface/stack-lg top and bottom and Screen/pad-x-screen at the sides.
 * - **align** `start` or `center`. Side media keeps the text start-aligned.
 * - **media** with `mediaPosition` `top` (16:9; full bleed in a card) or
 *   `side` (4:3 at Size/Width/2500). Side media needs 896 inside the padding —
 *   480 of text, 16 of gutter and 400 of image, so 944 with Card/pad-lg — and
 *   below that the media moves on top, inside the padding.
 * - One state: the buttons carry their own. No loading state.
 *
 * `subtitle`, `fluid`, `primaryButton`, `secondaryButton`, `paddingSize`,
 * `gapSize`, `radiusSize` and `children` still work and warn once in
 * development; where a new prop and its old one are both given, the new one
 * wins.
 */
const Jumbotron = ({
    title,
    description,
    actions,
    media,
    mediaPosition = 'top',
    container,
    align = 'start',
    // Deprecated
    subtitle,
    fluid,
    primaryButton,
    secondaryButton,
    paddingSize,
    gapSize,
    radiusSize,
    children,
    className = '',
    id,
    style,
    ...props
}) => {
    const legacy = { subtitle, fluid, primaryButton, secondaryButton, paddingSize, gapSize, radiusSize, children };
    const used = Object.keys(legacy).filter((key) => legacy[key] != null && legacy[key] !== false);
    const usedKey = used.join(',');

    const placement = media ? (mediaPosition === 'side' ? 'side' : 'top') : 'none';
    const sideForcesStart = placement === 'side' && align === 'center';
    const resolvedAlign = sideForcesStart ? 'start' : align === 'center' ? 'center' : 'start';
    const resolvedContainer = container ?? (fluid ? 'band' : 'card');
    const resolvedDescription = description ?? subtitle;

    useEffect(() => {
        if (!usedKey) return;
        usedKey.split(',').forEach((key) => warnOnce(key, DEPRECATIONS[key]));
    }, [usedKey]);

    useEffect(() => {
        if (sideForcesStart) {
            warnOnce('align-side', '`align="center"` does not go with side media; the text stays start-aligned.');
        }
    }, [sideForcesStart]);

    let resolvedActions = actions;
    if (resolvedActions == null && (primaryButton || secondaryButton)) {
        // `size="medium"` is Button's own default and a size its stylesheet
        // defines. It is spread first, so a caller's `size` still wins.
        resolvedActions = (
            <>
                {primaryButton && (
                    <Button text="Primary Action" style="primary" fill="filled" size="medium" {...primaryButton} />
                )}
                {secondaryButton && (
                    <Button text="Secondary Action" style="secondary" fill="outline" size="medium" {...secondaryButton} />
                )}
            </>
        );
    }

    const content = (
        <div className="plus-jumbotron-content">
            {(title || resolvedDescription) && (
                <div className="plus-jumbotron-header">
                    {title && <h1 className="plus-jumbotron-title">{title}</h1>}
                    {resolvedDescription && <p className="plus-jumbotron-description">{resolvedDescription}</p>}
                </div>
            )}
            {children != null && <div className="plus-jumbotron-body">{children}</div>}
            {resolvedActions && <div className="plus-jumbotron-actions">{resolvedActions}</div>}
        </div>
    );

    const mediaNode = media && (
        <div className={`plus-jumbotron-media plus-jumbotron-media--${placement}`}>{media}</div>
    );

    // A card's top media is its full-bleed image slot; everywhere else the
    // media sits in the layout with the content.
    const cardImage = resolvedContainer === 'card' && placement === 'top';
    const layout = (
        <div className="plus-jumbotron-layout">
            {!cardImage && placement === 'top' && mediaNode}
            {content}
            {placement === 'side' && mediaNode}
        </div>
    );

    const classes = [
        'plus-jumbotron',
        `plus-jumbotron--${resolvedContainer}`,
        `plus-jumbotron--align-${resolvedAlign}`,
        `plus-jumbotron--media-${placement}`,
        className,
    ].filter(Boolean).join(' ');

    // The title is the page's h1, so what the Jumbotron holds sits one level in.
    // The frame is the box inside the padding: side media measures it.
    const body = (
        <HeadingLevelContext.Provider value={1}>
            <div className="plus-jumbotron-frame">{layout}</div>
        </HeadingLevelContext.Provider>
    );

    if (resolvedContainer === 'band') {
        return (
            <div id={id} className={classes} style={style} {...props}>
                {body}
            </div>
        );
    }

    return (
        <PatternCard
            id={id}
            className={classes}
            style={style}
            padding={paddingSize ?? 'lg'}
            image={cardImage ? mediaNode : undefined}
            {...props}
        >
            {body}
        </PatternCard>
    );
};

const buttonShape = PropTypes.shape({
    text: PropTypes.string,
    onClick: PropTypes.func,
    style: PropTypes.string,
    fill: PropTypes.string,
    size: PropTypes.string,
    icon: PropTypes.string,
    iconPosition: PropTypes.string,
});

Jumbotron.propTypes = {
    /** The page's title, rendered as its one h1 at Heading/large 24: a page with a Jumbotron gives its Surface no `title`. */
    title: PropTypes.node,
    /** One supporting line under the title, Body/default */
    description: PropTypes.node,
    /** Actions slot: one filled primary Button, then an optional outlined one */
    actions: PropTypes.node,
    /** Media slot: an image that fills the slot at its ratio, 16:9 on top or 4:3 at the side */
    media: PropTypes.node,
    /** Where the media sits: `top`, or `side` at Size/Width/2500 (moves on top below 944 wide) */
    mediaPosition: PropTypes.oneOf(['top', 'side']),
    /** `card` sits in the content column on the raised pair; `band` runs edge to edge at the top of the page */
    container: PropTypes.oneOf(['card', 'band']),
    /** Text alignment; side media keeps it `start` */
    align: PropTypes.oneOf(['start', 'center']),
    /** Deprecated: use `description` */
    subtitle: PropTypes.node,
    /** Deprecated: body content; a Jumbotron is a title, a description and actions */
    children: PropTypes.node,
    /** Deprecated: put a filled Button in `actions` */
    primaryButton: buttonShape,
    /** Deprecated: put an outlined Button in `actions` */
    secondaryButton: buttonShape,
    /** Deprecated: use `container="band"` */
    fluid: PropTypes.bool,
    /** Deprecated: still sets the card padding (Card/pad-sm · md · lg) */
    paddingSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Deprecated: no effect */
    gapSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Deprecated: no effect */
    radiusSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    id: PropTypes.string,
    style: PropTypes.object,
};

export default Jumbotron;
