/**
 * @fileoverview Carousel component for PLUS design system.
 * Universal carousel component for displaying a rotating set of content slides.
 * Built on Bootstrap 4.6.2 carousel with PLUS design token customizations.
 * 
 * Bootstrap 4.6.2 Reference: https://getbootstrap.com/docs/4.6/components/carousel/
 */

/**
 * Creates a carousel element styled according to PLUS design system
 * @param {Object} options - Carousel configuration options
 * @param {string} [options.id] - Carousel ID (required for Bootstrap carousel functionality)
 * @param {Array<Object>} options.slides - Array of slide objects: [{content: HTMLElement|string, alt?: string, active?: boolean, title?: string, caption?: string}]
 * @param {boolean} [options.showControls=true] - Whether to show previous/next controls
 * @param {boolean} [options.showIndicators=true] - Whether to show slide indicators
 * @param {boolean} [options.showCaptions=false] - Whether to show captions on slides
 * @param {number} [options.interval=5000] - Auto-advance interval in milliseconds (0 to disable)
 * @param {boolean} [options.pauseOnHover=true] - Whether to pause on hover
 * @param {boolean} [options.wrap=true] - Whether to wrap around when reaching start/end
 * @param {boolean} [options.keyboard=true] - Whether to enable keyboard navigation
 * @param {string} [options.ride="carousel"] - Auto-start behavior ("carousel" for auto-start, false to disable)
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {Object} [options.styles=null] - Additional inline styles
 * @param {Function} [options.onSlide] - Callback when slide changes: (event, slideIndex) => {}
 * @param {Function} [options.onSlid] - Callback after slide transition completes: (event, slideIndex) => {}
 * @returns {HTMLElement} Carousel element
 */
export function createCarousel({
    id,
    slides = [],
    showControls = true,
    showIndicators = true,
    showCaptions = false,
    interval = 5000,
    pauseOnHover = true,
    wrap = true,
    keyboard = true,
    ride = "carousel",
    classes = [],
    styles = null,
    onSlide = null,
    onSlid = null
} = {}) {
    if (!id) {
        throw new Error("Carousel requires an id attribute for Bootstrap functionality");
    }
    
    if (!slides || slides.length === 0) {
        throw new Error("Carousel requires at least one slide");
    }
    
    // Bootstrap 4.6.2 carousel container
    const carousel = document.createElement("div");
    carousel.id = id;
    carousel.classList.add("carousel", "slide", "plus-carousel");
    
    // Add data attributes for Bootstrap carousel
    if (ride) {
        carousel.setAttribute("data-ride", ride);
    }
    if (interval > 0) {
        carousel.setAttribute("data-interval", interval);
    }
    if (pauseOnHover) {
        carousel.setAttribute("data-pause", "hover");
    }
    if (!wrap) {
        carousel.setAttribute("data-wrap", "false");
    }
    if (!keyboard) {
        carousel.setAttribute("data-keyboard", "false");
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        carousel.classList.add(...classes);
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(carousel.style, styles);
    }
    
    // Carousel indicators (dots at bottom)
    if (showIndicators && slides.length > 1) {
        const indicators = document.createElement("ol");
        indicators.classList.add("carousel-indicators", "plus-carousel-indicators");
        
        slides.forEach((slide, index) => {
            const indicator = document.createElement("li");
            indicator.setAttribute("data-target", `#${id}`);
            indicator.setAttribute("data-slide-to", index);
            if (slide.active || (index === 0 && !slides.some(s => s.active))) {
                indicator.classList.add("active");
            }
            indicators.appendChild(indicator);
        });
        
        carousel.appendChild(indicators);
    }
    
    // Carousel inner (contains slides)
    const carouselInner = document.createElement("div");
    carouselInner.classList.add("carousel-inner", "plus-carousel-inner");
    
    slides.forEach((slide, index) => {
        const carouselItem = document.createElement("div");
        carouselItem.classList.add("carousel-item", "plus-carousel-item");
        
        // Mark first slide as active if no slide is explicitly marked active
        if (slide.active || (index === 0 && !slides.some(s => s.active))) {
            carouselItem.classList.add("active");
        }
        
        // Handle slide content
        if (slide.content) {
            if (typeof slide.content === "string") {
                // If string, check if it's an image URL or HTML
                if (slide.content.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                    // Image URL
                    const img = document.createElement("img");
                    img.src = slide.content;
                    img.alt = slide.alt || `Slide ${index + 1}`;
                    img.classList.add("d-block", "w-100", "plus-carousel-image");
                    carouselItem.appendChild(img);
                } else {
                    // HTML string
                    carouselItem.innerHTML = slide.content;
                }
            } else if (slide.content instanceof HTMLElement) {
                // HTMLElement
                carouselItem.appendChild(slide.content);
            }
        }
        
        // Add caption if showCaptions is true and slide has caption data
        if (showCaptions && (slide.title || slide.caption)) {
            const caption = document.createElement("div");
            caption.classList.add("carousel-caption", "plus-carousel-caption");
            
            if (slide.title) {
                const title = document.createElement("h5");
                title.textContent = slide.title;
                caption.appendChild(title);
            }
            
            if (slide.caption) {
                const captionText = document.createElement("p");
                captionText.textContent = slide.caption;
                caption.appendChild(captionText);
            }
            
            carouselItem.appendChild(caption);
        }
        
        carouselInner.appendChild(carouselItem);
    });
    
    carousel.appendChild(carouselInner);
    
    // Previous/Next controls
    if (showControls && slides.length > 1) {
        // Previous control
        const prevControl = document.createElement("a");
        prevControl.classList.add("carousel-control-prev", "plus-carousel-control-prev");
        prevControl.href = `#${id}`;
        prevControl.setAttribute("role", "button");
        prevControl.setAttribute("data-slide", "prev");
        
        const prevIcon = document.createElement("span");
        prevIcon.classList.add("carousel-control-prev-icon", "plus-carousel-control-icon");
        prevIcon.setAttribute("aria-hidden", "true");
        // Use Font Awesome chevron-left icon
        const prevIconElement = document.createElement("i");
        prevIconElement.classList.add("fas", "fa-chevron-left");
        prevIcon.appendChild(prevIconElement);
        prevControl.appendChild(prevIcon);
        
        const prevSrOnly = document.createElement("span");
        prevSrOnly.classList.add("sr-only");
        prevSrOnly.textContent = "Previous";
        prevControl.appendChild(prevSrOnly);
        
        carousel.appendChild(prevControl);
        
        // Next control
        const nextControl = document.createElement("a");
        nextControl.classList.add("carousel-control-next", "plus-carousel-control-next");
        nextControl.href = `#${id}`;
        nextControl.setAttribute("role", "button");
        nextControl.setAttribute("data-slide", "next");
        
        const nextIcon = document.createElement("span");
        nextIcon.classList.add("carousel-control-next-icon", "plus-carousel-control-icon");
        nextIcon.setAttribute("aria-hidden", "true");
        // Use Font Awesome chevron-right icon
        const nextIconElement = document.createElement("i");
        nextIconElement.classList.add("fas", "fa-chevron-right");
        nextIcon.appendChild(nextIconElement);
        nextControl.appendChild(nextIcon);
        
        const nextSrOnly = document.createElement("span");
        nextSrOnly.classList.add("sr-only");
        nextSrOnly.textContent = "Next";
        nextControl.appendChild(nextSrOnly);
        
        carousel.appendChild(nextControl);
    }
    
    // Initialize Bootstrap carousel after DOM is ready
    // Use setTimeout to ensure jQuery and Bootstrap are loaded
    setTimeout(() => {
        if (typeof $ !== 'undefined' && $.fn.carousel) {
            const $carousel = $(`#${id}`);
            
            // Initialize carousel
            $carousel.carousel({
                interval: interval > 0 ? interval : false,
                pause: pauseOnHover ? 'hover' : false,
                wrap: wrap,
                keyboard: keyboard
            });
            
            // Attach event listeners
            if (onSlide) {
                $carousel.on('slide.bs.carousel', function(event) {
                    const slideIndex = $(event.relatedTarget).index();
                    onSlide(event, slideIndex);
                });
            }
            
            if (onSlid) {
                $carousel.on('slid.bs.carousel', function(event) {
                    const slideIndex = $(event.relatedTarget).index();
                    onSlid(event, slideIndex);
                });
            }
        }
    }, 0);
    
    return carousel;
}

