import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
// Component folders, not the barrel: the barrel exports Carousel itself, so
// importing it from here would read Carousel before it is defined.
import IconButton from '@/components/forms-and-inputs/IconButton';
import ProgressIndicator from '@/components/status-indicators/ProgressIndicator';
import Heading from '@/components/text-and-data-display/Heading';
import { headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './Carousel.scss';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IMAGE_PATH = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
const SWIPE_DISTANCE = 48;

// Reads the person's motion preference and follows it if it changes.
const usePrefersReducedMotion = () => {
    const [reduced, setReduced] = useState(() => (
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            && window.matchMedia(REDUCED_MOTION_QUERY).matches
    ));
    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return undefined;
        const query = window.matchMedia(REDUCED_MOTION_QUERY);
        const onChange = (event) => setReduced(event.matches);
        setReduced(query.matches);
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);
    return reduced;
};

// Whether the last input on the page was a pointer, so focus that follows a
// click is told apart from focus a keyboard moved there.
let lastInputWasPointer = false;
let modalityListeners = 0;
const onPointerInput = () => { lastInputWasPointer = true; };
const onKeyInput = () => { lastInputWasPointer = false; };
const useInputModality = () => {
    useEffect(() => {
        if (modalityListeners++ === 0) {
            document.addEventListener('pointerdown', onPointerInput, true);
            document.addEventListener('keydown', onKeyInput, true);
        }
        return () => {
            if (--modalityListeners === 0) {
                document.removeEventListener('pointerdown', onPointerInput, true);
                document.removeEventListener('keydown', onKeyInput, true);
            }
        };
    }, []);
};

// Where slide `k` sits relative to the active one: wrapped around the ring
// when there are enough slides for a neighbor on each side, plain otherwise.
const offsetOf = (k, active, count, wraps) => {
    const d = k - active;
    if (!wraps) return d;
    const half = count / 2;
    return ((d + half + count) % count) - half;
};

// How long the caption takes to lift out: the short motion duration, which
// the token layer already sets to 0 under reduced motion.
const captionOutMs = (element) => {
    const value = element ? getComputedStyle(element).getPropertyValue('--motion-duration-short') : '';
    const ms = parseFloat(value);
    return Number.isFinite(ms) ? ms : 0;
};

// The caption lifts out, swaps its text, then rises back in.
const useCaptionSwap = (index, animate, rootRef) => {
    const [shown, setShown] = useState(index);
    const [phase, setPhase] = useState('in');
    const shownRef = useRef(index);
    useEffect(() => {
        if (index === shownRef.current || !animate) {
            shownRef.current = index;
            setShown(index);
            setPhase('in');
            return undefined;
        }
        setPhase('out');
        let frame = 0;
        const timer = setTimeout(() => {
            shownRef.current = index;
            setShown(index);
            setPhase('pre');
            frame = requestAnimationFrame(() => {
                frame = requestAnimationFrame(() => setPhase('in'));
            });
        }, captionOutMs(rootRef.current));
        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(frame);
        };
    }, [index, animate, rootRef]);
    return [shown, phase];
};

const SlideContent = ({ item, index }) => {
    if (typeof item.content === 'string' && IMAGE_PATH.test(item.content)) {
        return (
            <img
                className="plus-carousel-image"
                src={item.content}
                alt={item.alt ?? item.title ?? `Slide ${index + 1}`}
            />
        );
    }
    // A string renders as text, never as markup: `slides` is a public prop, so
    // whatever a caller pipes through it stays escaped. A caller holding
    // trusted HTML passes their own element and owns that decision.
    return <div className="plus-carousel-content">{item.content}</div>;
};

/**
 * Carousel
 * A centered stage of slides: the active one full size, one neighbor on each
 * side in the same flat row, smaller and dimmed. Under it, a play button whose
 * ring fills over the slide's time, a dot per slide, and a caption that
 * changes with the slide. Autoplay holds while the pointer rests on the stage,
 * keyboard focus is inside, the carousel is out of view or the tab is hidden.
 * Under reduced motion it never moves on its own: arrows replace the play
 * button and every move is instant.
 */
const Carousel = ({
    slides = [],
    autoplay = true,
    interval = 6000,
    loop = true,
    aspectRatio = 16 / 10,
    defaultIndex = 0,
    onIndexChange,
    className,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...props
}) => {
    const count = slides.length;
    const rootRef = useRef(null);
    const reduced = usePrefersReducedMotion();

    const autoplays = autoplay && !reduced && count > 1 && interval > 0;
    const isStatic = !autoplays;
    const wraps = loop || autoplays;
    // A neighbor wraps round the ends only when the carousel itself wraps and
    // there are enough slides for one on each side.
    const ringWraps = wraps && count >= 3;

    const [index, setIndex] = useState(() => Math.min(Math.max(defaultIndex, 0), Math.max(count - 1, 0)));
    const indexRef = useRef(index);
    indexRef.current = index;

    const [paused, setPaused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focusHeld, setFocusHeld] = useState(false);
    const [inView, setInView] = useState(true);
    const [pageHidden, setPageHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

    const elapsedRef = useRef(0);
    const paint = useCallback((progress) => {
        rootRef.current?.style.setProperty('--carousel-progress', progress.toFixed(4));
    }, []);

    const onIndexChangeRef = useRef(onIndexChange);
    onIndexChangeRef.current = onIndexChange;

    const goTo = useCallback((target) => {
        if (count === 0) return;
        const next = wraps
            ? ((target % count) + count) % count
            : Math.min(Math.max(target, 0), count - 1);
        elapsedRef.current = 0;
        paint(0);
        if (next === indexRef.current) return;
        indexRef.current = next;
        setIndex(next);
        onIndexChangeRef.current?.(next);
    }, [count, paint, wraps]);

    // The clock: one frame loop writing a single progress value the ring
    // reads. It holds, and resumes where it held.
    const running = autoplays && !paused && !hovered && !focusHeld && inView && !pageHidden;
    useEffect(() => {
        if (!running) return undefined;
        let frame = 0;
        let last = 0;
        const tick = (now) => {
            const dt = last ? Math.min(64, now - last) : 0;
            last = now;
            elapsedRef.current += dt;
            if (elapsedRef.current >= interval) {
                goTo(indexRef.current + 1);
                last = 0;
            } else {
                paint(elapsedRef.current / interval);
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [running, interval, goTo, paint]);

    useEffect(() => {
        const onVisibility = () => setPageHidden(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    useEffect(() => {
        const element = rootRef.current;
        if (!element || typeof IntersectionObserver !== 'function') return undefined;
        const observer = new IntersectionObserver(([entry]) => {
            setInView(entry.isIntersecting
                && (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height > window.innerHeight * 0.5));
        }, { threshold: [0, 0.5, 1] });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // Keyboard focus inside holds the clock; a pointer press does not, so
    // clicking a dot or the play button never stalls the slide it starts.
    useInputModality();
    const onFocus = () => {
        if (!lastInputWasPointer) setFocusHeld(true);
    };
    const onBlur = (event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setFocusHeld(false);
    };

    const togglePaused = () => {
        const nextPaused = !paused;
        setPaused(nextPaused);
        // Pressing Play is an explicit request to move, so focus on the
        // button no longer holds the clock until it leaves and returns.
        if (!nextPaused) setFocusHeld(false);
    };

    const onKeyDown = (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        goTo(indexRef.current + (event.key === 'ArrowRight' ? 1 : -1));
    };

    // Swipe: a sideways drag past a threshold moves one slide.
    const swipeRef = useRef(null);
    const onPointerDown = (event) => {
        if (event.button !== 0) return;
        swipeRef.current = { x: event.clientX, y: event.clientY, moved: false };
    };
    const onPointerUp = (event) => {
        const swipe = swipeRef.current;
        if (!swipe) return;
        const dx = event.clientX - swipe.x;
        if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(event.clientY - swipe.y)) {
            swipe.moved = true;
            goTo(indexRef.current + (dx < 0 ? 1 : -1));
        }
    };
    const onPointerCancel = () => { swipeRef.current = null; };

    const [captionIndex, captionPhase] = useCaptionSwap(index, !reduced, rootRef);
    const caption = slides[captionIndex];
    const hasCaption = slides.some((item) => item.title || item.description);
    const captionTag = headingTag(useHeadingLevel() + 1);

    const classes = [
        'plus-carousel',
        paused && 'plus-carousel--paused',
        reduced && 'plus-carousel--reduced',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={rootRef}
            className={classes}
            style={style}
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
        >
            <div
                className="plus-carousel-stage"
                onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true); }}
                onPointerLeave={(event) => { if (event.pointerType === 'mouse') setHovered(false); }}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div className="plus-carousel-track" style={{ '--carousel-aspect': aspectRatio }}>
                    {slides.map((item, k) => {
                        const active = k === index;
                        const offset = offsetOf(k, index, count, ringWraps);
                        return (
                            <div
                                key={item.id ?? k}
                                className={[
                                    'plus-carousel-slide',
                                    active && 'plus-carousel-slide--active',
                                    Math.abs(offset) >= 2 && 'plus-carousel-slide--away',
                                ].filter(Boolean).join(' ')}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`${k + 1} of ${count}`}
                                aria-hidden={active ? undefined : true}
                                style={{ '--carousel-offset': offset }}
                                onClick={active ? undefined : () => {
                                    // The click that ends a swipe is not a choice.
                                    const swiped = swipeRef.current?.moved;
                                    swipeRef.current = null;
                                    if (!swiped) goTo(k);
                                }}
                            >
                                <div className="plus-carousel-card" inert={!active}>
                                    <SlideContent item={item} index={k} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {count > 1 && (
                <div className="plus-carousel-controls">
                    {autoplays && (
                        /*
                         * The pause control comes first (WCAG 2.2.2). Its name says
                         * what a press will do; the ring around it is the slide's
                         * clock.
                         */
                        <span className="plus-carousel-play">
                            <svg className="plus-carousel-ring" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
                                <circle className="plus-carousel-ring-track" cx="22" cy="22" r="20" />
                                <circle className="plus-carousel-ring-progress" cx="22" cy="22" r="20" pathLength="1" />
                            </svg>
                            <IconButton
                                icon={paused ? 'fa-solid fa-play' : 'fa-solid fa-pause'}
                                label={paused ? 'Play' : 'Pause'}
                                appearance="subtle"
                                shape="circle"
                                onClick={togglePaused}
                            />
                        </span>
                    )}
                    {isStatic && (
                        <IconButton
                            icon="fa-solid fa-chevron-left"
                            label="Previous slide"
                            shape="circle"
                            isDisabled={!wraps && index === 0}
                            onClick={() => goTo(index - 1)}
                        />
                    )}
                    <ProgressIndicator
                        values={slides.map((item, k) => `Slide ${k + 1} of ${count}${item.title ? `: ${item.title}` : ''}`)}
                        selectedIndex={index}
                        appearance="primary"
                        label="Choose a slide"
                        onSelect={({ index: chosen }) => goTo(chosen)}
                    />
                    {isStatic && (
                        <IconButton
                            icon="fa-solid fa-chevron-right"
                            label="Next slide"
                            shape="circle"
                            isDisabled={!wraps && index === count - 1}
                            onClick={() => goTo(index + 1)}
                        />
                    )}
                </div>
            )}

            {hasCaption && (
                <div className="plus-carousel-caption" aria-live={isStatic || paused ? 'polite' : 'off'}>
                    <div className={`plus-carousel-caption-inner plus-carousel-caption-inner--${captionPhase}`}>
                        {caption?.title && <Heading as={captionTag} size="small">{caption.title}</Heading>}
                        {caption?.description && <p className="plus-carousel-caption-description">{caption.description}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const requireName = (props, propName, componentName) => {
    if (!props['aria-label'] && !props['aria-labelledby']) {
        return new Error(`${componentName} needs an accessible name: pass \`aria-label\` or \`aria-labelledby\`.`);
    }
    if (props[propName] != null && typeof props[propName] !== 'string') {
        return new Error(`\`${propName}\` on ${componentName} must be a string.`);
    }
    return null;
};

Carousel.propTypes = {
    /** The slides, in order. `content` is the card; `title` and `description` fill the caption and name the dot. A string `content` renders as text, or as an image when it is a path ending in an image extension (`alt` describes it). */
    slides: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
        title: PropTypes.string,
        description: PropTypes.string,
        alt: PropTypes.string,
    })),
    /** Moves to the next slide on its own, with a play button to stop it. Off under reduced motion, where arrows show instead. Defaults to `true`. */
    autoplay: PropTypes.bool,
    /** Milliseconds each slide shows before the next. Defaults to `6000`. */
    interval: PropTypes.number,
    /** Lets the arrows and arrow keys wrap from the last slide to the first. Autoplay always wraps. Defaults to `true`. */
    loop: PropTypes.bool,
    /** Width over height of a slide. Defaults to `16 / 10`. */
    aspectRatio: PropTypes.number,
    /** The slide shown first. Defaults to `0`. */
    defaultIndex: PropTypes.number,
    /** Called with the new index whenever the slide changes. */
    onIndexChange: PropTypes.func,
    /** Extra class names on the root, beside `plus-carousel`. */
    className: PropTypes.string,
    /** Inline styles on the root. */
    style: PropTypes.object,
    /** Names the carousel region. This or `aria-labelledby` is required. */
    'aria-label': requireName,
    /** Names the carousel region by another element's id. This or `aria-label` is required. */
    'aria-labelledby': requireName,
};

export default Carousel;
