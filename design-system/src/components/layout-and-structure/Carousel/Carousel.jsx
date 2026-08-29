import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Carousel as BootstrapCarousel } from 'react-bootstrap';
import './Carousel.scss';

const Carousel = ({
    id,
    slides = [],
    activeIndex,
    onSelect,
    controls = true,
    indicators = true,
    interval = null,
    pause = 'hover',
    wrap = true,
    keyboard = true,
    /** @deprecated Fade transition is not supported; value is ignored. */
    fade: _fadeIgnored,
    slide: slideProp,
    className = '',
    style,
    prevIcon,
    nextIcon,
    children, // Allow manual composition if preferred
    ...props
}) => {
    const slide = slideProp !== undefined ? slideProp : true;

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
    const autoplays = typeof interval === 'number' && interval > 0;
    const [paused, setPaused] = useState(false);
    const effectiveInterval = autoplays && !paused ? interval : null;
    // Custom icons matching legacy
    const defaultPrevIcon = <span aria-hidden="true" className="carousel-control-prev-icon plus-carousel-control-icon"><i className="fas fa-chevron-left"></i></span>;
    const defaultNextIcon = <span aria-hidden="true" className="carousel-control-next-icon plus-carousel-control-icon"><i className="fas fa-chevron-right"></i></span>;

    const content = children || slides.map((slide, index) => (
        <BootstrapCarousel.Item key={index} className="plus-carousel-item" interval={slide.interval}>
            {/* Handle content: string (img url) or node */}
            {typeof slide.content === 'string' && slide.content.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img
                    className="d-block w-100 plus-carousel-image"
                    src={slide.content}
                    alt={slide.alt || `Slide ${index}`}
                />
            ) : (
                <div className="plus-carousel-content">
                    {/*
                      * #316. A non-element `content` renders as TEXT, never as markup.
                      * `slides` is a public prop, so anything a caller pipes through it —
                      * a review body, an API description — used to be written into the DOM
                      * with `dangerouslySetInnerHTML`, which is an injection. React escapes
                      * a string child; a caller who genuinely holds trusted HTML can pass
                      * their own `dangerouslySetInnerHTML` element as `content` and own
                      * that decision explicitly.
                      */}
                    {slide.content}
                </div>
            )}

            {(slide.title || slide.caption) && (
                <BootstrapCarousel.Caption className="plus-carousel-caption">
                    {slide.title && <h5>{slide.title}</h5>}
                    {slide.caption && <p>{slide.caption}</p>}
                </BootstrapCarousel.Caption>
            )}
        </BootstrapCarousel.Item>
    ));

    const carousel = (
        <BootstrapCarousel
            id={id}
            activeIndex={activeIndex}
            onSelect={onSelect}
            controls={controls}
            indicators={indicators}
            interval={effectiveInterval}
            pause={pause}
            wrap={wrap}
            keyboard={keyboard}
            fade={false}
            slide={slide}
            className={`plus-carousel ${className}`}
            style={style}
            prevIcon={prevIcon || defaultPrevIcon}
            nextIcon={nextIcon || defaultNextIcon}
            // Visually-hidden text (react-bootstrap renders it wrapped in a
            // `.visually-hidden` span) so prev/next controls have an
            // accessible name — omitting it fails the "link-name" a11y rule.
            prevLabel="Previous slide"
            nextLabel="Next slide"
            {...props}
        >
            {content}
        </BootstrapCarousel>
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
                aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
                onClick={() => setPaused((wasPaused) => !wasPaused)}
            >
                <i className={`fas ${paused ? 'fa-play' : 'fa-pause'}`} aria-hidden="true" />
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
        caption: PropTypes.string,
        interval: PropTypes.number
    })),
    activeIndex: PropTypes.number,
    onSelect: PropTypes.func,
    controls: PropTypes.bool,
    indicators: PropTypes.bool,
    interval: PropTypes.number,
    pause: PropTypes.oneOf(['hover', false]),
    wrap: PropTypes.bool,
    keyboard: PropTypes.bool,
    slide: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    prevIcon: PropTypes.node,
    nextIcon: PropTypes.node,
    children: PropTypes.node
};

export default Carousel;
