import React from 'react';
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
    fade = false,
    className = '',
    style,
    prevIcon,
    nextIcon,
    children, // Allow manual composition if preferred
    ...props
}) => {
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
                    {/* if content is HTML string, we might need dangerouslySetInnerHTML or just render if it's node */}
                    {React.isValidElement(slide.content) ? slide.content : <div dangerouslySetInnerHTML={{ __html: slide.content }} />}
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

    return (
        <BootstrapCarousel
            id={id}
            activeIndex={activeIndex}
            onSelect={onSelect}
            controls={controls}
            indicators={indicators}
            interval={interval}
            pause={pause}
            wrap={wrap}
            keyboard={keyboard}
            fade={fade}
            className={`plus-carousel ${className}`}
            style={style}
            prevIcon={prevIcon || defaultPrevIcon}
            nextIcon={nextIcon || defaultNextIcon}
            prevLabel={null}
            nextLabel={null}
            {...props}
        >
            {content}
        </BootstrapCarousel>
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
    fade: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    prevIcon: PropTypes.node,
    nextIcon: PropTypes.node,
    children: PropTypes.node
};

export default Carousel;
