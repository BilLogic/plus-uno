import { useMotionReduced } from '@/lib/motionPreference';
import { useOverlayPresence } from '@/lib/overlayMotion';
import { FlagStackContext, useFlagGroupCoordinator, useFlagQueue, useFlagStack } from '@/lib/flagStackMotion';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LayoutGroup, animate, motion } from 'motion/react';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import CloseButton from '@/components/forms-and-inputs/CloseButton';
import ProgressBar from '@/components/loading/ProgressBar';
import Button from '@/components/forms-and-inputs/Button';
import IconButton from '@/components/forms-and-inputs/IconButton/IconButton';
import { MESSAGE_APPEARANCE_ICONS } from '../messageAppearance';
import Icon from '../../images-and-icons/Icon';
import { modeFor } from '@/sound';
import { playMoment } from '@/sound/moments';
import './Flag.scss';

/**
 * How long a normal, information or success flag stays before it closes itself. Warning and
 * error flags stay until they are dismissed: they ask for something to be done.
 */
export const FLAG_AUTO_CLOSE_MS = 8000;


export { useFlagQueue };

/** Where the flags that stay go when one leaves: `spatial.default`, read from the generated springs. */
const CLOSE_UP = SPRINGS['spatial.default'].productive;
/** Under reduced motion they fade into their new places on `appearance.fast` instead. */
const CLOSE_UP_FADE = SPRINGS['appearance.fast'].productive;

/** The five appearances, as the Figma Flag set names them. */
export const FLAG_APPEARANCES = ['normal', 'information', 'warning', 'error', 'success'];


/**
 * Flag's enter, from its motion registry row: it lands on `spatial.default` and
 * its sound plays as it lands, so the sound starts at that spring's 90% time
 * minus its pickup. Under reduced motion the flag fades in on the reduced spring
 * and the sound still plays, on that landing.
 */
function playOnLand(appearance, token, reduced) {
    const options = { token, mode: modeFor(reduced) };
    if (appearance === 'error') playMoment('Flag', 'failed', options);
    else playMoment('Flag', 'enter', options);
}

/** Warning and error are urgent: they interrupt a screen reader and stay until dismissed. */
const URGENT_APPEARANCES = ['warning', 'error'];

/** A default flag's action: a link when it has an `href`, otherwise a link-styled button. */
const ActionTag = ({ action }) => {
    const Tag = action.href ? 'a' : 'button';
    return (
        <Tag
            type={action.href ? undefined : 'button'}
            className="plus-flag-action"
            href={action.href}
            target={action.target}
            onClick={action.onClick}
        >
            {action.text}
        </Tag>
    );
};

/**
 * The Popups pattern's Flag (Figma Pattern/Flag). One surface, 400 wide,
 * padded 16: a 16 icon on the title's first line, the title and its optional
 * description, actions, and the controls. `appearance` alone decides the kind:
 * `normal` is the default flag (overlay surface, a status icon or an avatar,
 * always the dismiss ×, actions as links); every other appearance is bold
 * (its bold fill, no ×, collapsed to its title behind a chevron, actions as
 * buttons).
 */
export const Flag = ({
    id,
    appearance = 'normal', // 'normal' (default), 'information', 'warning', 'error', 'success'
    title,
    children, // Description
    actions,
    icon,
    defaultExpanded = false,
    show = true,
    onDismiss,
    delay = FLAG_AUTO_CLOSE_MS,
    autohide,
    timer = false,
    className = '',
    headerClass = '',
    bodyClass = '',
    timestamp, // '11 mins ago' etc
    sound,
    reducedMotion,
    staggerDelayMs,
    onExited,
    style,
    ...props
}) => {
    // An appearance outside the list falls back to the default, normal.
    const flagAppearance = FLAG_APPEARANCES.includes(appearance) ? appearance : 'normal';
    const bold = flagAppearance !== 'normal';
    const glyph = MESSAGE_APPEARANCE_ICONS[flagAppearance];
    const hasDetails = Boolean(children) || (actions?.length > 0);
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
     * warning and error never close themselves, whatever `autohide` says: they
     * ask for something to be done. A caller's `delay` sets the wait.
     */
    const closesItself = !isUrgent && (autohide ?? true);

    // A bold flag collapses to its title and expands to the description and actions.
    const [expanded, setExpanded] = useState(defaultExpanded);
    const showDetails = !bold || (hasDetails && expanded);

    // Only the latest onDismiss fires; changing it mid-countdown does not
    // restart the timer, matching the previous react-bootstrap Toast timing.
    const onDismissRef = useRef(onDismiss);
    useEffect(() => {
        onDismissRef.current = onDismiss;
    }, [onDismiss]);

    // How the flag is leaving: 'timeout' flies out the way it came, 'hand' fades in place.
    const exitKind = useRef('timeout');
    useEffect(() => { if (show) exitKind.current = 'timeout'; }, [show]);
    const dismissByHand = (event) => {
        exitKind.current = 'hand';
        onDismiss?.(event);
    };

    /*
     * The wait pauses while the flag is hovered or holds focus, so reading it never costs the
     * chance to act, and resumes with the time that was left. Hover and focus are tracked apart:
     * leaving one while the other holds keeps it paused.
     */
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const paused = hovered || focused;
    const remaining = useRef(delay);
    useEffect(() => {
        remaining.current = delay;
        // A flag removed under the pointer or the focus gets no leave or blur: clear both with it.
        if (!show) {
            setHovered(false);
            setFocused(false);
        }
    }, [delay, show]);

    /*
     * The bar. Only a flag that closes itself counts down. Driven with `animate` rather than a CSS
     * animation, so the app-wide reduced-motion rule (which turns CSS animations off) leaves the
     * countdown running: it is information, not movement. It pauses with the wait.
     */
    const barRef = useRef(null);
    const countdown = useRef(null);
    const counts = timer && closesItself && delay > 0;
    useEffect(() => {
        const fill = barRef.current?.querySelector('.plus-progressbar-fill');
        if (!show || !counts || !fill) return undefined;
        const controls = animate(fill, { transform: ['scaleX(1)', 'scaleX(0)'] }, { duration: delay / 1000, ease: 'linear' });
        countdown.current = controls;
        return () => { controls.stop(); countdown.current = null; };
    }, [show, counts, delay]);
    useEffect(() => {
        if (paused) countdown.current?.pause();
        else countdown.current?.play();
    }, [paused, show, counts, delay]);

    useEffect(() => {
        if (!show || !closesItself || !(delay > 0) || paused) return undefined;
        const startedAt = Date.now();
        const timeout = setTimeout(() => {
            exitKind.current = 'timeout';
            onDismissRef.current?.();
        }, remaining.current);
        return () => {
            clearTimeout(timeout);
            remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
        };
    }, [show, closesItself, delay, paused]);

    /*
     * Leaving. A flag that was showing keeps its place until its exit animation ends, then
     * unmounts, in every motion setting. Timed out, it flies toward the top-right on
     * `spatial.exit`; closed by hand, it fades in place on `appearance.fast`. Under reduced
     * motion the shared Reduced policy removes CSS movement. Removal waits for finite exit animations.
     */
    /*
     * The stack closes up. A leaving flag drops out of the flow at once, held where it stood,
     * so the gap closes as it goes. The flags that stay glide to their new places on
     * `spatial.default` (a layout animation); under reduced motion they stay put in time and
     * fade into the new place on `appearance.fast`, never a cut.
     */
    const stack = useFlagStack();
    const osReduced = useMotionReduced();
    const reduced = reducedMotion ?? stack?.reducedMotion ?? osReduced;
    const surface = useRef(null);
    const present = useOverlayPresence(show, surface);
    const wasPresentRef = useRef(present);
    const lastTop = useRef(null);
    const [arrivalSlot, setArrivalSlot] = useState({ delayMs: 0, playSound: true });

    useEffect(() => {
        if (wasPresentRef.current && !present) {
            onExited?.();
        }
        wasPresentRef.current = present;
    }, [present, onExited]);

    useLayoutEffect(() => {
        const el = surface.current;
        if (!el) return;
        if (!show) {
            Object.assign(el.style, {
                position: 'absolute',
                top: `${el.offsetTop}px`,
                left: `${el.offsetLeft}px`,
                width: `${el.offsetWidth}px`,
                margin: '0',
            });
            lastTop.current = null;
            return;
        }
        Object.assign(el.style, { position: '', top: '', left: '', width: '', margin: '' });
        if (reduced && lastTop.current !== null && lastTop.current !== el.offsetTop) {
            animate(el, { opacity: [0, 1] }, CLOSE_UP_FADE);
        }
        lastTop.current = el.offsetTop;
    });

    /*
     * Its sound plays once as the flag lands, when it is shown, through the one
     * sound setting (off plays nothing): Error for an error appearance, Notify
     * for the rest, or the token the app passes. Flags that arrive together play
     * once (coalesced through FlagGroup's coordinator).
     */
    const landing = useRef({});
    landing.current = { sound, appearance: flagAppearance, reduced, stack, staggerDelayMs };
    useEffect(() => {
        const {
            sound: token,
            appearance: currentAppearance,
            reduced: isReduced,
            stack: groupStack,
            staggerDelayMs: explicitDelay,
        } = landing.current;
        if (!show) return;
        const slot = groupStack ? groupStack.claimArrivalSlot() : { delayMs: 0, playSound: true };
        const resolvedDelay = explicitDelay ?? slot.delayMs;
        if (resolvedDelay > 0) {
            setArrivalSlot({ delayMs: resolvedDelay, playSound: slot.playSound });
        }
        if (token !== false && token !== '' && slot.playSound) {
            playOnLand(currentAppearance, token, isReduced);
        }
    }, [show]);

    if (!present) return null;

    const effectiveDelay = show && !reduced ? (staggerDelayMs ?? arrivalSlot.delayMs) : 0;
    const mergedStyle = effectiveDelay > 0
        ? { animationDelay: `${effectiveDelay}ms`, ...style }
        : style;

    return (
        <motion.div
            ref={surface}
            layout={show && !reduced ? 'position' : false}
            transition={CLOSE_UP}
            id={id}
            data-reduced={reduced ? 'true' : 'false'}
            data-leaving={!show ? exitKind.current : undefined}
            className={`plus-flag plus-flag--${flagAppearance}${bold ? ' plus-flag--bold' : ''}${timer ? ' plus-flag--timer' : ''} ${className}`}
            data-paused={paused ? 'true' : undefined}
            style={mergedStyle}
            role={liveRole}
            aria-live={livePoliteness}
            aria-atomic="true"
            {...props}
            onMouseEnter={(event) => { setHovered(true); props.onMouseEnter?.(event); }}
            onMouseLeave={(event) => { setHovered(false); props.onMouseLeave?.(event); }}
            onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
            onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        >
            {timer && (
                // The top cap, decorative: it counts down over `delay` (linear) and pauses with the wait.
                <div className="plus-flag-timer" ref={barRef} aria-hidden="true" data-counting={counts ? 'true' : undefined}>
                    <ProgressBar value={100} ariaLabel="Time left" />
                </div>
            )}
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
                {bold || !icon
                    ? <Icon name={glyph} />
                    : (typeof icon === 'string' ? <Icon name={icon} /> : icon)}
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
                        {actions.map((action) => (bold ? (
                            // Buttons on a bold flag: the PLUS Button, compact, restyled for the fill in Flag.scss.
                            <Button
                                key={action.text}
                                appearance="subtle"
                                spacing="compact"
                                className="plus-flag-action"
                                text={action.text}
                                href={action.href}
                                target={action.target}
                                onClick={action.onClick}
                            />
                        ) : (
                            // Links on a default flag.
                            <ActionTag key={action.text} action={action} />
                        )))}
                    </div>
                )}
            </div>
            {/*
              * The controls share one row, centered on the title's first line,
              * compact (24) as a flag's controls are. On a bold fill both take
              * the inverse tone, so the chevron reads on the fill as the × does.
              */}
            {(bold ? hasDetails : true) && (
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
                    {!bold && <CloseButton label="Dismiss flag" spacing="compact" onClick={dismissByHand} />}
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
    /** Actions under the description, in the order given, at most two. Links on a default flag, buttons on a bold one. An action with an `href` on a bold flag draws a button that navigates. */
    actions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        target: PropTypes.string,
        onClick: PropTypes.func,
    })),
    /** The default flag's leading icon: a status icon name, or an element such as an Avatar. Unset, the information icon in the subtle icon color. Ignored on a bold flag, which shows its appearance's icon. */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** Whether a bold flag starts expanded. */
    defaultExpanded: PropTypes.bool,
    /** Whether the flag renders. Defaults to true; false renders nothing and stops the auto-close timer. */
    show: PropTypes.bool,
    /** Called with no arguments when the dismiss button is pressed and when the auto-close timer ends. The caller sets `show` to false. */
    onDismiss: PropTypes.func,
    /** How long it stays before closing itself, in ms. 8000 by default; keep it at 8000 or more so a slow reader is not cut off. */
    delay: PropTypes.number,
    /** Close itself after `delay`. Defaults to true for normal, information and success; warning and error never close themselves. */
    autohide: PropTypes.bool,
    /** Draws a 4 px countdown bar as the flag's top cap, emptying over `delay`, and steps the corners from 12 to 4. For a timed action such as Undo: the first action undoes, `onDismiss` commits. The bar and the wait pause while the flag is hovered or focused. */
    timer: PropTypes.bool,
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
    reducedMotion: PropTypes.bool,
    /** Optional entrance stagger delay in ms when arriving as part of a burst. */
    staggerDelayMs: PropTypes.number,
    /** Called once the leaving flag's exit animation finishes and it unmounts. */
    onExited: PropTypes.func,
    /** Inline styles applied to the flag surface. */
    style: PropTypes.object,
};

/**
 * FlagGroup: where flags sit: top-right by default, fixed to the screen,
 * Popover/gap-screen 8 from its edges, stacking Popover/stack-flag 16 apart.
 * Accepts either `<Flag>` children or a `flags` queue list (`useFlagQueue`) with `onDismiss`.
 */
export const FlagGroup = ({
    position = 'top-end', // 'top-start', 'top-center', 'top-end', 'middle-start', etc.
    containerPosition = 'fixed',
    className = '',
    reducedMotion,
    flags,
    onDismiss,
    children,
    ...props
}) => {
    const coordinator = useFlagGroupCoordinator(reducedMotion);
    const prevFlagsRef = useRef(flags ?? []);
    const [leavingFlags, setLeavingFlags] = useState([]);

    if (Array.isArray(flags)) {
        const prev = prevFlagsRef.current;
        if (prev !== flags) {
            const nextIds = new Set(flags.map((item) => item.id));
            const newlyRemoved = prev
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => item?.id && !nextIds.has(item.id));
            prevFlagsRef.current = flags;
            if (newlyRemoved.length > 0) {
                setLeavingFlags((existing) => {
                    const seen = new Set(existing.map((entry) => entry.item.id));
                    const additions = newlyRemoved.filter(({ item }) => !seen.has(item.id));
                    return additions.length > 0 ? [...existing, ...additions] : existing;
                });
            }
        }
    }

    const renderQueueItems = () => {
        if (!Array.isArray(flags)) return children;
        const activeIds = new Set(flags.map((item) => item.id));
        const merged = flags.map((item) => ({ item, show: true }));
        const pending = leavingFlags
            .filter(({ item }) => !activeIds.has(item.id))
            .sort((a, b) => a.index - b.index);
        for (const entry of pending) {
            const insertAt = Math.min(entry.index, merged.length);
            merged.splice(insertAt, 0, { item: entry.item, show: false });
        }
        return merged.map(({ item, show }) => {
            const { id: flagId, children: description, description: altDescription, onDismiss: itemDismiss, ...rest } = item;
            return (
                <Flag
                    key={flagId}
                    id={flagId}
                    show={show}
                    onDismiss={() => {
                        itemDismiss?.(flagId);
                        onDismiss?.(flagId);
                    }}
                    onExited={() => {
                        setLeavingFlags((current) => current.filter((entry) => entry.item.id !== flagId));
                    }}
                    {...rest}
                >
                    {description ?? altDescription}
                </Flag>
            );
        });
    };

    return (
        <FlagStackContext.Provider value={coordinator}>
            <LayoutGroup id={coordinator.groupId}>
                <div
                    data-position={position}
                    data-container-position={containerPosition}
                    className={`plus-flag-container ${className}`}
                    {...props}
                >
                    {renderQueueItems()}
                </div>
            </LayoutGroup>
        </FlagStackContext.Provider>
    );
};

FlagGroup.propTypes = {
    /** Where the stack sits: `top-end` (default), `top-start`, `top-center`, `middle-*` or `bottom-*`. */
    position: PropTypes.string,
    /** `fixed` (default) holds the stack to the screen; `absolute` or `static` to a parent. */
    containerPosition: PropTypes.string,
    /** Hold reduced motion on or off for every flag inside. Unset, flags follow the person's setting. */
    reducedMotion: PropTypes.bool,
    /** Optional visible flag items from `useFlagQueue`; dismissed items stay mounted for their exit before unmounting. */
    flags: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.node.isRequired,
    })),
    /** Called with `flag.id` when an item in `flags` is dismissed or times out. */
    onDismiss: PropTypes.func,
    className: PropTypes.string,
    children: PropTypes.node
};

export default Flag;
