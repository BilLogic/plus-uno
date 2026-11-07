import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './Carousel.scss';
import { iconClass } from '../../../lib/icon';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

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

const normalizeIndex = (index, length) => ((index % length) + length) % length;

/**
 * Carousel Component
 * Rotates through a set of slides, with controls, indicators, captions, and
 * a pausable autoplay that stays off under reduced motion. Hand-built: Base UI
 * has no carousel part.
 */
const Carousel = ({
    id,
    slides = [],
    activeIndex: activeIndexProp,
    onSelect,
    controls = true,
    indicators = true,
    interval = null,
    pause = 'hover',
    wrap = true,
    keyboard = true,
    slide: slideProp,
    className = '',
    style,
    prevIcon,
    nextIcon,
    children, // Allow manual composition if preferred
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...props
}) => {
    // A landmark with no accessible name is worse than no landmark: two
    // unnamed carousels on one page collide under "landmark-unique". Only
    // callers who name theirs get the region semantics.
    const isLandmark = Boolean(ariaLabel || ariaLabelledBy);
    const slide = slideProp !== undefined ? slideProp : true;
    const slideCount = children ? React.Children.count(children) : slides.length;

    const isControlled = activeIndexProp !== undefined;
    const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
    const activeIndex = isControlled ? activeIndexProp : uncontrolledIndex;

    const goTo = useCallback((nextIndex, direction) => {
        if (slideCount === 0) return;
        const bounded = wrap
            ? normalizeIndex(nextIndex, slideCount)
            : Math.min(Math.max(nextIndex, 0), slideCount - 1);
        if (bounded === activeIndex) return;
        if (!isControlled) setUncontrolledIndex(bounded);
        onSelect?.(bounded, { direction });
    }, [activeIndex, isControlled, onSelect, slideCount, wrap]);

    const goPrev = useCallback(() => goTo(activeIndex - 1, 'prev'), [activeIndex, goTo]);
    const goNext = useCallback(() => goTo(activeIndex + 1, 'next'), [activeIndex, goTo]);

    /*
     * #333. Autoplay needs a way to stop it.
     *
     * WCAG 2.2.2 is not a preference: anything that moves, blinks or scrolls
     * automatically for more than five seconds has to be pausable. `pause`
     * covers a mouse hovering, which is not a mechanism for a keyboard or a
     * touch user, and there was no other one — an `interval` was a carousel
     * nobody could stop.
     *
     * The control appears ONLY when there is autoplay to pause. A play/pause
     * button on a carousel that never advances is a control that lies about
     * what the component does.
     */
    // Reduced motion is a request not to move on its own: autoplay stays off,
    // so there is nothing to pause and no control is drawn.
    const prefersReducedMotion = usePrefersReducedMotion();
    const autoplays = typeof interval === 'number' && interval > 0 && !prefersReducedMotion;
    const [manuallyPaused, setManuallyPaused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const effectivelyPaused = manuallyPaused || (pause === 'hover' && hovered);

    useEffect(() => {
        if (!autoplays || effectivelyPaused || slideCount < 2) return undefined;
        const timer = setInterval(() => {
            goTo(activeIndex + 1, 'next');
        }, interval);
        return () => clearInterval(timer);
    }, [autoplays, effectivelyPaused, interval, activeIndex, goTo, slideCount]);

    const handleKeyDown = (event) => {
        if (!keyboard) return;
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goPrev();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            goNext();
        }
    };

    // Default icons matching legacy
    const defaultPrevIcon = <span aria-hidden="true" className="plus-carousel-control-icon"><i className="fa-solid fa-chevron-left"></i></span>;
    const defaultNextIcon = <span aria-hidden="true" className="plus-carousel-control-icon"><i className="fa-solid fa-chevron-right"></i></span>;

    // A slide's title is one level below the section the carousel sits in.
    const SlideTitle = headingTag(useHeadingLevel() + 1);

    const renderItemContent = (item, index) => {
        // Handle content: string (img url) or node
        if (typeof item.content === 'string' && item.content.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return (
                <img
                    className="plus-carousel-image"
                    src={item.content}
                    alt={item.alt || `Slide ${index}`}
                />
            );
        }
        return (
            /*
              * #316. A non-element `content` renders as TEXT, never as markup.
              * `slides` is a public prop, so anything a caller pipes through it —
              * a review body, an API description — used to be written into the DOM
              * with `dangerouslySetInnerHTML`, which is an injection. React escapes
              * a string child; a caller who genuinely holds trusted HTML can pass
              * their own `dangerouslySetInnerHTML` element as `content` and own
              * that decision explicitly.
              */
            <div className="plus-carousel-content">
                {item.content}
            </div>
        );
    };

    const renderSlide = (content, index, caption) => (
        <div
            key={index}
            className={[
                'plus-carousel-item',
                index === activeIndex ? 'plus-carousel-item--active' : ''
            ].filter(Boolean).join(' ')}
            aria-hidden={index === activeIndex ? undefined : true}
        >
            {content}
            {caption}
        </div>
    );

    const content = children
        ? React.Children.map(children, (child, index) => renderSlide(child, index))
        : slides.map((item, index) => renderSlide(
            renderItemContent(item, index),
            index,
            (item.title || item.caption) && (
                <div className="plus-carousel-caption">
                    {item.title && <SlideTitle className="plus-carousel-title">{item.title}</SlideTitle>}
                    {item.caption && <p>{item.caption}</p>}
                </div>
            )
        ));

    const carouselClasses = [
        'plus-carousel',
        slide ? 'plus-carousel--slide' : '',
        className
    ].filter(Boolean).join(' ');

    const carousel = (
        <div
            id={id}
            className={carouselClasses}
            style={style}
            role={isLandmark ? 'region' : undefined}
            aria-roledescription={isLandmark ? 'carousel' : undefined}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            onMouseEnter={pause === 'hover' ? () => setHovered(true) : undefined}
            onMouseLeave={pause === 'hover' ? () => setHovered(false) : undefined}
            onKeyDown={handleKeyDown}
            {...props}
        >
            <div
                className="plus-carousel-track"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
                {content}
            </div>

            {controls && slideCount > 1 && (
                <>
                    <button
                        type="button"
                        className="plus-carousel-control plus-carousel-control-prev"
                        aria-label="Previous slide"
                        onClick={goPrev}
                        disabled={!wrap && activeIndex === 0}
                    >
                        {prevIcon || defaultPrevIcon}
                    </button>
                    <button
                        type="button"
                        className="plus-carousel-control plus-carousel-control-next"
                        aria-label="Next slide"
                        onClick={goNext}
                        disabled={!wrap && activeIndex === slideCount - 1}
                    >
                        {nextIcon || defaultNextIcon}
                    </button>
                </>
            )}

            {indicators && slideCount > 1 && (
                <div className="plus-carousel-indicators">
                    {Array.from({ length: slideCount }, (_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={[
                                'plus-carousel-indicator',
                                index === activeIndex ? 'active' : ''
                            ].filter(Boolean).join(' ')}
                            aria-label={`Slide ${index + 1}`}
                            aria-current={index === activeIndex ? 'true' : undefined}
                            onClick={() => goTo(index, index > activeIndex ? 'next' : 'prev')}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    if (!autoplays) return carousel;

    return (
        <div className="plus-carousel-shell">
            {carousel}
            {/*
              * Outside the carousel, not inside a slide: a control that lives in
              * a slide is a control that scrolls away from the person trying to
              * press it. Its name says what the press will DO, which is the
              * convention for a toggle rendered as one button rather than two.
              */}
            <button
                type="button"
                className="plus-carousel-playpause"
                aria-label={manuallyPaused ? 'Play slideshow' : 'Pause slideshow'}
                onClick={() => setManuallyPaused((wasPaused) => !wasPaused)}
            >
                <i className={iconClass(manuallyPaused ? 'play' : 'pause')} aria-hidden="true" />
            </button>
        </div>
    );
};

Carousel.propTypes = {
    id: PropTypes.string,
    slides: PropTypes.arrayOf(PropTypes.shape({
        content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
        alt: PropTypes.string,
        title: PropTypes.string,
        caption: PropTypes.string
    })),
    activeIndex: PropTypes.number,
    onSelect: PropTypes.func,
    /** Shows the previous and next buttons. They appear only when there is more than one slide. Defaults to `true`. */
    controls: PropTypes.bool,
    /** Shows a position indicator for each slide. It appears only when there is more than one slide. Defaults to `true`. */
    indicators: PropTypes.bool,
    /** Milliseconds between automatic advances. Leave it out, or use 0, to turn autoplay off; autoplay is also off when the viewer prefers reduced motion. */
    interval: PropTypes.number,
    pause: PropTypes.oneOf(['hover', false]),
    wrap: PropTypes.bool,
    keyboard: PropTypes.bool,
    slide: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    prevIcon: PropTypes.node,
    nextIcon: PropTypes.node,
    children: PropTypes.node,
    /** Names the carousel as an `aria-roledescription="carousel"` region. */
    'aria-label': PropTypes.string,
    'aria-labelledby': PropTypes.string
};

export default Carousel;
