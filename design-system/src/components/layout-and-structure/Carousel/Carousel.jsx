import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
// The component folder, not the barrel: the barrel exports Carousel itself, so
// importing it from here would read Carousel before it is defined.
import IconButton from '@/components/forms-and-inputs/IconButton';
import { headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './Carousel.scss';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IMAGE_PATH = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

/*
 * Stage geometry. The active slide takes a share of the stage, capped; a
 * neighbor is scaled and turned toward it in perspective, and its near edge
 * sits one gap off the active slide's edge. These live here rather than in the
 * stylesheet because the placement math needs them as numbers.
 */
const GEOMETRY = {
    maxWidth: 1000,
    share: (stage) => (stage < 520 ? 0.86 : stage < 700 ? 0.8 : 0.74),
    neighborScale: 0.65,
    turn: 32,
    perspective: 1500,
    gap: 28,
    gapFrom: 700,
    dim: 0.45,
};
const SWIPE_DISTANCE = 48;
const CAPTION_OUT_MS = 120;

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

// The width of an element, kept current as it resizes.
const useWidth = (ref) => {
    const [width, setWidth] = useState(0);
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return undefined;
        setWidth(element.clientWidth);
        if (typeof ResizeObserver !== 'function') return undefined;
        const observer = new ResizeObserver(() => setWidth(element.clientWidth));
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);
    return width;
};

// Where slide `k` sits relative to the active one: wrapped around the ring
// when there are enough slides for a neighbor on each side, plain otherwise.
const offsetOf = (k, active, count, wraps) => {
    const d = k - active;
    if (!wraps) return d;
    const half = count / 2;
    return ((d + half + count) % count) - half;
};

const placeSlide = (d, stage, flat) => {
    const width = Math.round(Math.min(GEOMETRY.maxWidth, stage * GEOMETRY.share(stage)));
    const gap = GEOMETRY.gap * Math.min(1, stage / GEOMETRY.gapFrom);
    const theta = (GEOMETRY.turn * Math.PI) / 180;
    const half = (GEOMETRY.neighborScale * width) / 2;
    const step = flat
        ? width + gap
        : width / 2 + gap + (half * Math.cos(theta) * GEOMETRY.perspective) / (GEOMETRY.perspective + half * Math.sin(theta));
    const distance = Math.abs(d);
    const near = Math.min(distance, 1);
    const turn = flat ? 0 : -Math.sign(d) * GEOMETRY.turn * near;
    const scale = flat ? 1 : 1 - (1 - GEOMETRY.neighborScale) * near;
    return {
        width,
        transform: `translate3d(${(d * step).toFixed(1)}px, 0, 0) perspective(${GEOMETRY.perspective}px) rotateY(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        opacity: Math.max(0, Math.min(1, 2 - distance)),
        dim: GEOMETRY.dim * near,
        zIndex: 10 - Math.round(distance),
    };
};

// The caption lifts out, swaps its text, then rises back in.
const useCaptionSwap = (index, animate) => {
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
        }, CAPTION_OUT_MS);
        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(frame);
        };
    }, [index, animate]);
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
 * A centered stage of slides: the active one flat and full size, one neighbor
 * on each side turned toward it and dimmed. Under it, a play button whose ring
 * fills over the slide's time, one progress pill per slide, and a caption that
 * changes with the slide. Autoplay holds while the pointer rests on the stage,
 * keyboard focus is inside, the carousel is out of view or the tab is hidden.
 * Under reduced motion it never moves on its own: arrows replace the play
 * button and the slides sit in a flat row.
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
    const stageRef = useRef(null);
    const stageWidth = useWidth(stageRef);
    const reduced = usePrefersReducedMotion();

    const autoplays = autoplay && !reduced && count > 1 && interval > 0;
    const isStatic = !autoplays;
    const wraps = loop || autoplays;
    // A neighbor wraps round the ends only when the carousel itself wraps and
    // there are enough slides for one on each side.
    const ringWraps = wraps && count >= 4;

    const [index, setIndex] = useState(() => Math.min(Math.max(defaultIndex, 0), Math.max(count - 1, 0)));
    const indexRef = useRef(index);
    indexRef.current = index;

    const [paused, setPaused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focusHeld, setFocusHeld] = useState(false);
    const [inView, setInView] = useState(true);
    const [pageHidden, setPageHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

    const elapsedRef = useRef(0);
    const autoplaysRef = useRef(autoplays);
    autoplaysRef.current = autoplays;
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
        paint(autoplaysRef.current ? 0 : 1);
        if (next === indexRef.current) return;
        indexRef.current = next;
        setIndex(next);
        onIndexChangeRef.current?.(next);
    }, [count, paint, wraps]);

    // The clock: one frame loop writing a single progress value the ring and
    // the active pill both read. It holds, and resumes where it held.
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
        paint(autoplays ? elapsedRef.current / interval : 1);
    }, [autoplays, interval, paint]);

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
    // clicking a pill or the play button never stalls the slide it starts.
    useInputModality();
    const onFocus = () => {
        if (!lastInputWasPointer) setFocusHeld(true);
    };
    const onBlur = (event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setFocusHeld(false);
    };

    const onPressedChange = (nextPaused) => {
        setPaused(nextPaused);
        // Pressing Play is an explicit request to move, so focus on the
        // button no longer holds the clock until it leaves and returns.
        if (!nextPaused) setFocusHeld(false);
    };

    const onKeyDown = (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        // The pills are a tablist that moves on its own arrow keys.
        if (event.target.closest?.('[role="tablist"]')) return;
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

    const [captionIndex, captionPhase] = useCaptionSwap(index, !reduced);
    const caption = slides[captionIndex];
    const hasCaption = slides.some((item) => item.title || item.description);
    const CaptionTitle = headingTag(useHeadingLevel() + 1);

    const measured = stageWidth > 0;
    const placed = slides.map((_, k) => placeSlide(offsetOf(k, index, count, ringWraps), stageWidth, reduced));
    const slideWidth = placed[0]?.width ?? 0;
    const trackHeight = slideWidth / (aspectRatio || 16 / 10);

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
                ref={stageRef}
                className="plus-carousel-stage"
                onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true); }}
                onPointerLeave={(event) => { if (event.pointerType === 'mouse') setHovered(false); }}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div
                    className={`plus-carousel-track${measured ? '' : ' plus-carousel-track--measuring'}`}
                    style={{ '--carousel-slide-width': slideWidth, '--carousel-track-height': trackHeight }}
                >
                    {slides.map((item, k) => {
                        const active = k === index;
                        const place = placed[k];
                        return (
                            <div
                                key={item.id ?? k}
                                className={[
                                    'plus-carousel-slide',
                                    active && 'plus-carousel-slide--active',
                                    place.opacity === 0 && 'plus-carousel-slide--away',
                                ].filter(Boolean).join(' ')}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`${k + 1} of ${count}`}
                                aria-hidden={active ? undefined : true}
                                style={{
                                    transform: place.transform,
                                    opacity: place.opacity,
                                    zIndex: place.zIndex,
                                    '--carousel-dim': place.dim,
                                }}
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
                         * what a press will do, so `aria-pressed` is dropped: a
                         * name that flips and a pressed state would say it twice.
                         */
                        <BaseToggle
                            className="plus-carousel-play"
                            pressed={paused}
                            onPressedChange={onPressedChange}
                            aria-pressed={undefined}
                            aria-label={paused ? 'Play' : 'Pause'}
                        >
                            <svg className="plus-carousel-ring" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
                                <circle className="plus-carousel-ring-track" cx="22" cy="22" r="20" />
                                <circle className="plus-carousel-ring-progress" cx="22" cy="22" r="20" pathLength="1" />
                            </svg>
                            <i className={`fa-solid ${paused ? 'fa-play' : 'fa-pause'} plus-carousel-play-icon`} aria-hidden="true" />
                        </BaseToggle>
                    )}
                    {isStatic && (
                        <IconButton
                            icon="fa-solid fa-chevron-left"
                            label="Previous slide"
                            shape="circle"
                            className="plus-carousel-arrow"
                            isDisabled={!wraps && index === 0}
                            onClick={() => goTo(index - 1)}
                        />
                    )}
                    <BaseTabs.Root
                        className="plus-carousel-dots"
                        value={index}
                        onValueChange={(value) => goTo(value)}
                    >
                        <BaseTabs.List className="plus-carousel-dot-list" activateOnFocus aria-label="Choose a slide">
                            {slides.map((item, k) => (
                                <BaseTabs.Tab
                                    key={item.id ?? k}
                                    value={k}
                                    className={`plus-carousel-dot${k < index ? ' plus-carousel-dot--done' : ''}`}
                                    aria-label={`Slide ${k + 1} of ${count}${item.title ? `: ${item.title}` : ''}`}
                                    onClick={() => { if (k === index) goTo(k); }}
                                >
                                    <span className="plus-carousel-dot-pill">
                                        <span className="plus-carousel-dot-fill" />
                                    </span>
                                </BaseTabs.Tab>
                            ))}
                        </BaseTabs.List>
                    </BaseTabs.Root>
                    {isStatic && (
                        <IconButton
                            icon="fa-solid fa-chevron-right"
                            label="Next slide"
                            shape="circle"
                            className="plus-carousel-arrow"
                            isDisabled={!wraps && index === count - 1}
                            onClick={() => goTo(index + 1)}
                        />
                    )}
                </div>
            )}

            {hasCaption && (
                <div className="plus-carousel-caption" aria-live={isStatic || paused ? 'polite' : 'off'}>
                    <div className={`plus-carousel-caption-inner plus-carousel-caption-inner--${captionPhase}`}>
                        {caption?.title && <CaptionTitle className="plus-carousel-caption-title">{caption.title}</CaptionTitle>}
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
    /** The slides, in order. `content` is the card; `title` and `description` fill the caption and name the pill. A string `content` renders as text, or as an image when it is a path ending in an image extension (`alt` describes it). */
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
