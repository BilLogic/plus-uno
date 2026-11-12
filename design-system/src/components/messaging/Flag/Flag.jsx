import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { animate, motion, useReducedMotion } from 'motion/react';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import CloseButton from '@/components/forms-and-inputs/CloseButton';
import IconButton from '@/components/forms-and-inputs/IconButton/IconButton';
import { MESSAGE_APPEARANCE_ICONS } from '../messageAppearance';
import Icon from '../../images-and-icons/Icon';
import { modeFor, playSound, soundStartFor } from '@/sound';
import './Flag.scss';

/**
 * How long a normal, information or success flag stays before it closes itself. Warning and
 * error flags stay until they are dismissed: they ask for something to be done.
 */
export const FLAG_AUTO_CLOSE_MS = 8000;

/** Longest an exiting flag stays mounted if `animationend` never fires. */
const FLAG_EXIT_FALLBACK_MS = 800;

/** Where the flags that stay go when one leaves: `spatial.default`, read from the generated springs. */
const CLOSE_UP = SPRINGS['spatial.default'].productive;
/** Under reduced motion they fade into their new places on `appearance.fast` instead. */
const CLOSE_UP_FADE = SPRINGS['appearance.fast'].productive;

/** The group's reduced-motion setting, for the flags inside it. */
const FlagGroupContext = createContext(undefined);

/** The five appearances, as the Figma Flag set names them. */
export const FLAG_APPEARANCES = ['normal', 'information', 'warning', 'error', 'success'];


/**
 * Flag's enter, from its motion registry row: it lands on `spatial.default` and
 * its sound plays as it lands, so the sound starts at that spring's 90% time
 * minus its pickup. Under reduced motion the flag fades in on the reduced spring
 * and the sound still plays, on that landing.
 */
function playOnLand(token, reduced) {
    playSound(token, { at: soundStartFor('spatial.default', token, { mode: modeFor(reduced) }) });
}

/** The sound a Flag plays by default: an error appearance sounds Error, every other one Notify. */
const defaultSound = (appearance) => (appearance === 'error' ? 'error' : 'notify');

/** Warning and error are urgent: they interrupt a screen reader and stay until dismissed. */
const URGENT_APPEARANCES = ['warning', 'error'];

/**
 * The Popups pattern's Flag (Figma Pattern/Flag). One surface, 400 wide,
 * padded 16: a 16 icon in the appearance's icon color on the title's first
 * line, the title and its optional description, actions, and the dismiss
 * button. `bold` expands the surface to the appearance's bold fill.
 */
export const Flag = ({
    id,
    appearance = 'normal', // 'normal' (default), 'information', 'warning', 'error', 'success'
    title,
    children, // Description
    actions,
    bold = false,
    defaultExpanded = false,
    dismissible = true,
    show = true,
    onDismiss,
    delay = FLAG_AUTO_CLOSE_MS,
    autohide,
    className = '',
    headerClass = '',
    bodyClass = '',
    timestamp, // '11 mins ago' etc
    sound,
    reducedMotion,
    ...props
}) => {
    // An appearance outside the list falls back to the default, normal.
    const flagAppearance = FLAG_APPEARANCES.includes(appearance) ? appearance : 'normal';
    const glyph = MESSAGE_APPEARANCE_ICONS[flagAppearance];
    const isUrgent = URGENT_APPEARANCES.includes(flagAppearance);

    /*
     * #325. Politeness follows the message. Every toast used to be
     * `role="alert"` with `aria-live="assertive"`, so "Saved" cut across
     * whatever a screen reader was in the middle of saying. Assertive is for
     * something that has gone wrong and changes what the user should do next;
     * everything else waits its turn. `role` and `aria-live` are set together
     * because a mismatched pair is worse than either alone.
     */
    const liveRole = isUrgent ? 'alert' : 'status';
    const livePoliteness = isUrgent ? 'assertive' : 'polite';

    /*
     * Normal, information and success close themselves after 8 seconds;
     * warning and error stay until they are dismissed. A caller's `autohide`
     * or `delay` wins.
     */
    const closesItself = autohide ?? !isUrgent;

    // A bold flag collapses to its title and expands to the description and actions.
    const [expanded, setExpanded] = useState(defaultExpanded);
    const showDetails = !bold || expanded;

    // Only the latest onDismiss fires; changing it mid-countdown does not
    // restart the timer, matching the previous react-bootstrap Toast timing.
    const onDismissRef = useRef(onDismiss);
    useEffect(() => {
        onDismissRef.current = onDismiss;
    }, [onDismiss]);

    // How the flag is leaving: 'timeout' flies out the way it came, 'hand' fades in place.
    const exitKind = useRef('timeout');
    const dismissByHand = (event) => {
        exitKind.current = 'hand';
        onDismiss?.(event);
    };

    useEffect(() => {
        if (!show || !closesItself || !(delay > 0)) return undefined;
        const timer = setTimeout(() => {
            exitKind.current = 'timeout';
            onDismissRef.current?.();
        }, delay);
        return () => clearTimeout(timer);
    }, [show, closesItself, delay]);

    /*
     * Leaving. A flag that was showing keeps its place until its exit animation ends, then
     * unmounts, in every motion setting. Timed out, it flies toward the top-right on
     * `spatial.exit`; closed by hand, it fades in place on `appearance.fast`. Under reduced
     * motion the tokens and Flag.scss turn both into that fade. The timer backs up `animationend`.
     */
    const [leaving, setLeaving] = useState(false);
    const wasShown = useRef(show);
    useEffect(() => {
        if (show) {
            wasShown.current = true;
            exitKind.current = 'timeout';
            setLeaving(false);
            return undefined;
        }
        if (!wasShown.current) return undefined;
        wasShown.current = false;
        setLeaving(true);
        const timer = setTimeout(() => setLeaving(false), FLAG_EXIT_FALLBACK_MS);
        return () => clearTimeout(timer);
    }, [show]);

    /*
     * The stack closes up. A leaving flag drops out of the flow at once, held where it stood,
     * so the gap closes as it goes. The flags that stay glide to their new places on
     * `spatial.default` (a layout animation); under reduced motion they stay put in time and
     * fade into the new place on `appearance.fast`, never a cut.
     */
    const group = useContext(FlagGroupContext);
    const osReduced = useReducedMotion();
    const reduced = reducedMotion ?? group ?? osReduced;
    const surface = useRef(null);
    const lastTop = useRef(null);

    useLayoutEffect(() => {
        const el = surface.current;
        if (!el) return;
        if (!show) {
            Object.assign(el.style, { position: 'absolute', top: `${el.offsetTop}px`, left: `${el.offsetLeft}px`, margin: '0' });
            lastTop.current = null;
            return;
        }
        Object.assign(el.style, { position: '', top: '', left: '', margin: '' });
        if (reduced && lastTop.current !== null && lastTop.current !== el.offsetTop) {
            animate(el, { opacity: [0, 1] }, CLOSE_UP_FADE);
        }
        lastTop.current = el.offsetTop;
    });

    /*
     * Its sound plays once as the flag lands, when it is shown, through the one
     * sound setting (off plays nothing): Error for an error appearance, Notify
     * for the rest, or the token the app passes. When a flag should stay quiet,
     * such as during a session, the app passes `sound={false}`. The effect reads
     * both through refs, so only `show` re-runs it: a flag's arrival sounds,
     * never another prop change.
     */
    const landing = useRef({});
    landing.current = { sound: sound === undefined || sound === true ? defaultSound(flagAppearance) : sound, reduced };
    useEffect(() => {
        const { sound: token, reduced: isReduced } = landing.current;
        if (show && token) playOnLand(token, isReduced);
    }, [show]);

    if (!show && !leaving) return null;

    return (
        <motion.div
            ref={surface}
            layout={show && !reduced ? 'position' : false}
            transition={CLOSE_UP}
            id={id}
            data-reduced={reduced ? 'true' : 'false'}
            data-leaving={!show ? exitKind.current : undefined}
            onAnimationEnd={!show ? () => setLeaving(false) : undefined}
            className={`plus-flag plus-flag--${flagAppearance}${bold ? ' plus-flag--bold' : ''} ${className}`}
            role={liveRole}
            aria-live={livePoliteness}
            aria-atomic="true"
            {...props}
        >
            {/*
              * The icon sits on the title's first line: a box one title line
              * tall, so a wrapping title keeps it on line 1.
              */}
            <div className="plus-flag-icon">
                {/*
                  * #325. Decorative, and marked so — every other icon in
                  * these components is `aria-hidden`. The title beside it
                  * carries the meaning.
                  */}
                <Icon name={glyph} />
            </div>
            <div className="plus-flag-content">
                <div className={`plus-flag-header ${headerClass}`}>
                    <strong className="plus-flag-title">{title}</strong>
                    {timestamp && <small className="plus-flag-timestamp">{timestamp}</small>}
                </div>
                {showDetails && children && (
                    <div className={`plus-flag-body ${bodyClass}`}>
                        {children}
                    </div>
                )}
                {showDetails && actions && actions.length > 0 && (
                    <div className="plus-flag-actions">
                        {actions.map((action) => {
                            const ActionTag = action.href ? 'a' : 'button';
                            return (
                                <ActionTag
                                    key={action.text}
                                    type={action.href ? undefined : 'button'}
                                    className="plus-flag-action"
                                    href={action.href}
                                    target={action.target}
                                    onClick={action.onClick}
                                >
                                    {action.text}
                                </ActionTag>
                            );
                        })}
                    </div>
                )}
            </div>
            {/*
              * The controls share one row, centered on the title's first line,
              * compact (24) as a flag's controls are. On a bold fill both take
              * the inverse tone, so the chevron reads on the fill as the × does.
              */}
            {(bold || dismissible) && (
                <div className="plus-flag-controls">
                    {bold && (
                        <IconButton
                            icon={expanded ? 'chevron-up' : 'chevron-down'}
                            label={expanded ? 'Collapse' : 'Expand'}
                            appearance="subtle"
                            spacing="compact"
                            className="plus-flag-expand"
                            aria-expanded={expanded}
                            onClick={() => setExpanded((open) => !open)}
                        />
                    )}
                    {/* The shared CloseButton, default tone on the flag's surface, or
                        inverse on a bold one. A message is dismissed, not closed. */}
                    {dismissible && <CloseButton label="Dismiss flag" spacing="compact" tone={bold ? 'inverse' : 'default'} onClick={dismissByHand} />}
                </div>
            )}
        </motion.div>
    );
};

Flag.propTypes = {
    /** Id set on the flag surface. */
    id: PropTypes.string,
    /** `normal` (default), `information`, `warning`, `error` or `success`. */
    appearance: PropTypes.oneOf(FLAG_APPEARANCES),
    /** What happened, in a few words. */
    title: PropTypes.node.isRequired,
    /** An optional description under the title. */
    children: PropTypes.node,
    /** Link-button actions under the description, in the order given. Avoid more than two. */
    actions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        target: PropTypes.string,
        onClick: PropTypes.func,
    })),
    /** The appearance's bold fill. A bold flag starts collapsed to its title, with a toggle that expands the description and actions. */
    bold: PropTypes.bool,
    /** Whether a bold flag starts expanded. */
    defaultExpanded: PropTypes.bool,
    /** Shows the dismiss button. Defaults to true; set false to leave it out. */
    dismissible: PropTypes.bool,
    /** Whether the flag renders. Defaults to true; false renders nothing and stops the auto-close timer. */
    show: PropTypes.bool,
    /** Called with no arguments when the dismiss button is pressed and when the auto-close timer ends. The caller sets `show` to false. */
    onDismiss: PropTypes.func,
    /** How long it stays before closing itself, in ms. 8000 by default. */
    delay: PropTypes.number,
    /** Close itself after `delay`. Defaults to true for normal, information and success, false for warning and error. */
    autohide: PropTypes.bool,
    /** Extra class on the flag surface. */
    className: PropTypes.string,
    /** Extra class on the header row that holds the title and timestamp. */
    headerClass: PropTypes.string,
    /** Extra class on the description container. */
    bodyClass: PropTypes.string,
    /** Small text beside the title, such as "11 mins ago". */
    timestamp: PropTypes.node,
    /** The sound token it plays as it lands, through the app's sound setting, or `false` for none. Unset, an `error` flag plays `error` and every other appearance plays `notify`. Pass `false` when a flag should stay quiet, such as during a session. */
    sound: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([false])]),
    /** Hold reduced motion on or off for this flag. Unset, it follows its FlagGroup, then the person's setting. */
    reducedMotion: PropTypes.bool
};

/**
 * FlagGroup: where flags sit: bottom-left by default, fixed to the screen,
 * Popover/gap-screen 8 from its edges, stacking Popover/stack-flag 16 apart.
 */
export const FlagGroup = ({
    position = 'bottom-start', // 'top-start', 'top-center', 'top-end', 'middle-start', etc.
    containerPosition = 'fixed',
    className = '',
    reducedMotion,
    children,
    ...props
}) => (
    <FlagGroupContext.Provider value={reducedMotion}>
        <div
            data-position={position}
            data-container-position={containerPosition}
            className={`plus-flag-container ${className}`}
            {...props}
        >
            {children}
        </div>
    </FlagGroupContext.Provider>
);

FlagGroup.propTypes = {
    position: PropTypes.string,
    /** `fixed` (default) holds the stack to the screen; `absolute` or `static` to a parent. */
    containerPosition: PropTypes.string,
    /** Hold reduced motion on or off for every flag inside. Unset, flags follow the person's setting. */
    reducedMotion: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node
};

export default Flag;
