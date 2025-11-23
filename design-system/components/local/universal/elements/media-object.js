/**
 * @fileoverview Media Object component for PLUS design system.
 * Universal element component for creating media objects with image/icon and content.
 * Built on Bootstrap 4.6.2 media object pattern with PLUS design token customizations.
 * 
 * Bootstrap 4.6.2 Reference: https://getbootstrap.com/docs/4.6/components/media-object/
 * 
 * Component Type: Element (uses `element-*` tokens)
 */

/**
 * Creates a media object element styled according to PLUS design system
 * @param {Object} options - Media object configuration options
 * @param {string} [options.id] - Media object ID
 * @param {HTMLElement|string} options.media - Media element (image, icon, or HTML element)
 * @param {HTMLElement|string} options.body - Body content (HTML element or string)
 * @param {string} [options.heading] - Optional heading text (uses .h6 typography)
 * @param {string} [options.alignment="left"] - Media alignment ("left", "right", "top", "center")
 * @param {string} [options.mediaSize="default"] - Media size ("small", "default", "large")
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {Object} [options.styles=null] - Additional inline styles
 * @param {Function} [options.onClick=null] - Click handler function
 * @returns {HTMLElement} Media object element
 */
export function createMediaObject({
    id,
    media,
    body,
    heading,
    alignment = "left",
    mediaSize = "default",
    classes = [],
    styles = null,
    onClick = null
} = {}) {
    if (!media || !body) {
        throw new Error("Media object requires both media and body content");
    }
    
    // Bootstrap 4.6.2 media container
    const mediaObject = document.createElement("div");
    mediaObject.classList.add("media", "plus-media");
    
    if (id) {
        mediaObject.id = id;
    }
    
    // Add alignment class
    if (alignment === "right") {
        mediaObject.classList.add("plus-media-right");
    } else if (alignment === "top") {
        mediaObject.classList.add("plus-media-top");
    } else if (alignment === "center") {
        mediaObject.classList.add("plus-media-center");
    }
    // Default is "left" - no additional class needed
    
    // Add media size class
    if (mediaSize) {
        mediaObject.classList.add(`plus-media-${mediaSize}`);
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        mediaObject.classList.add(...classes);
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(mediaObject.style, styles);
    }
    
    // Add click handler if provided
    if (onClick) {
        mediaObject.style.cursor = "pointer";
        mediaObject.addEventListener("click", onClick);
    }
    
    // Media element (image, icon, etc.)
    const mediaEl = document.createElement("div");
    mediaEl.classList.add("plus-media-object");
    
    // Handle different media types
    if (typeof media === "string") {
        // If it's a string, assume it's an image URL
        const img = document.createElement("img");
        img.src = media;
        img.alt = heading || "Media";
        img.classList.add("plus-media-image");
        mediaEl.appendChild(img);
    } else if (media instanceof HTMLElement) {
        // If it's an HTML element, append it directly
        if (media.tagName === "IMG") {
            media.classList.add("plus-media-image");
        } else {
            media.classList.add("plus-media-icon");
        }
        mediaEl.appendChild(media);
    }
    
    // Media body container
    const mediaBody = document.createElement("div");
    mediaBody.classList.add("media-body", "plus-media-body");
    
    // Optional heading
    if (heading) {
        const headingEl = document.createElement("h6");
        headingEl.classList.add("mt-0", "plus-media-heading");
        headingEl.textContent = heading;
        mediaBody.appendChild(headingEl);
    }
    
    // Body content
    if (typeof body === "string") {
        const bodyEl = document.createElement("div");
        bodyEl.classList.add("plus-media-content", "body1-txt");
        bodyEl.textContent = body;
        mediaBody.appendChild(bodyEl);
    } else if (body instanceof HTMLElement) {
        body.classList.add("plus-media-content");
        if (!body.classList.contains("body1-txt")) {
            body.classList.add("body1-txt");
        }
        mediaBody.appendChild(body);
    }
    
    // Assemble: media element, then body (Bootstrap 4.6.2 structure)
    // For right alignment, reverse the order
    if (alignment === "right") {
        mediaObject.appendChild(mediaBody);
        mediaObject.appendChild(mediaEl);
    } else {
        mediaObject.appendChild(mediaEl);
        mediaObject.appendChild(mediaBody);
    }
    
    return mediaObject;
}

/**
 * Creates a nested media object (media object within another media object)
 * @param {Object} options - Nested media object configuration
 * @param {HTMLElement} options.parent - Parent media object element
 * @param {HTMLElement|string} options.media - Media element for nested object
 * @param {HTMLElement|string} options.body - Body content for nested object
 * @param {string} [options.heading] - Optional heading text
 * @param {string} [options.alignment="left"] - Media alignment
 * @param {string} [options.mediaSize="default"] - Media size
 * @returns {HTMLElement} Nested media object element
 */
export function createNestedMediaObject({
    parent,
    media,
    body,
    heading,
    alignment = "left",
    mediaSize = "default"
} = {}) {
    if (!parent) {
        throw new Error("Nested media object requires a parent element");
    }
    
    const nested = createMediaObject({
        media,
        body,
        heading,
        alignment,
        mediaSize,
        classes: ["plus-media-nested"]
    });
    
    parent.appendChild(nested);
    return nested;
}



