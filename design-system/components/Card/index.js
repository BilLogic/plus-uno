/**
 * @fileoverview Card component for PLUS design system.
 * Universal card component for creating self-contained containers that display related information.
 * Cards are modular - each part (image, title, subtitle, body, header, items, footer, links, button) can be added or removed.
 * Cards are used to help users quickly scan, compare, and interact with content.
 */

import { createButton } from '../Button/index.js';

/**
 * Creates a card element styled according to PLUS design system
 * @param {Object} options - Card configuration options
 * @param {string} [options.id] - Card ID
 * @param {HTMLElement|string} [options.image] - Card image/media area (HTML element or image URL string)
 * @param {string} [options.title] - Card title text
 * @param {string} [options.subtitle] - Card subtitle text
 * @param {HTMLElement|string} [options.body] - Card body content (HTML element or string)
 * @param {string} [options.header] - Card header section text
 * @param {Array<string>} [options.items] - Array of item strings for list items
 * @param {string} [options.footer] - Card footer section text
 * @param {Array<Object>} [options.links] - Array of link objects: [{text: string, href: string, onClick: Function}]
 * @param {Object} [options.actionButton] - Action button config: {text: string, onClick: Function, style: string, fill: string}
 * @param {string} [options.paddingSize="md"] - Padding size ("sm", "md", "lg")
 * @param {string} [options.gapSize="md"] - Gap size between card elements ("sm", "md", "lg")
 * @param {string} [options.radiusSize="sm"] - Border radius size ("sm", "md")
 * @param {string} [options.borderSize="sm"] - Border size ("sm", "md", "lg")
 * @param {boolean} [options.showBorder=true] - Whether to show border
 * @param {Array} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @param {Function} [options.onClick] - Click handler function for entire card
 * @returns {HTMLElement} Card element
 */
export function createCard({
    id,
    image,
    title,
    subtitle,
    body,
    header,
    items,
    footer,
    links,
    actionButton,
    paddingSize = "md",
    gapSize = "md",
    radiusSize = "sm",
    borderSize = "sm",
    showBorder = true,
    classes = [],
    styles = null,
    onClick = null
}) {
    const card = document.createElement("div");
    
    if (id) {
        card.id = id;
    }
    
    // Base card class
    card.classList.add("plus-card");
    
    // Add padding size class
    if (paddingSize) {
        card.classList.add(`plus-card-pad-${paddingSize}`);
    }
    
    // Add gap size class
    if (gapSize) {
        card.classList.add(`plus-card-gap-${gapSize}`);
    }
    
    // Add radius size class
    if (radiusSize) {
        card.classList.add(`plus-card-radius-${radiusSize}`);
    }
    
    // Add border size class if border is shown
    if (showBorder && borderSize) {
        card.classList.add(`plus-card-border-${borderSize}`);
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        card.classList.add(...classes);
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(card.style, styles);
    }
    
    // Add click handler if provided
    if (onClick) {
        card.style.cursor = "pointer";
        card.addEventListener("click", onClick);
    }
    
    // Image/Media area (top of card)
    if (image) {
        const imageEl = document.createElement("div");
        imageEl.classList.add("plus-card-image");
        
        if (typeof image === "string") {
            // If string, assume it's an image URL
            const img = document.createElement("img");
            img.src = image;
            img.alt = "Card image";
            imageEl.appendChild(img);
        } else if (image instanceof HTMLElement) {
            imageEl.appendChild(image);
        }
        
        card.appendChild(imageEl);
    }
    
    // Card content container
    const cardContent = document.createElement("div");
    cardContent.classList.add("plus-card-content");
    
    // Card Description container - wraps title, subtitle, body
    // Figma: gap-[var(--spacing/small/space-050,4px)] px-0 py-[var(--spacing/small/space-075,6px)]
    if (title || subtitle || body) {
        const descriptionContainer = document.createElement("div");
        descriptionContainer.classList.add("plus-card-description");
        
        // Title element - Figma: Title/H5 - Lato SemiBold, 20px, lineHeight 1.4
        if (title) {
            const titleEl = document.createElement("div");
            titleEl.classList.add("plus-card-title", "h5");
            titleEl.textContent = title;
            descriptionContainer.appendChild(titleEl);
        }
        
        // Subtitle element - Figma: Body/B3/Regular - Merriweather Sans Light, 12px, lineHeight 1.667
        if (subtitle) {
            const subtitleEl = document.createElement("div");
            subtitleEl.classList.add("plus-card-subtitle", "body3-txt");
            subtitleEl.textContent = subtitle;
            descriptionContainer.appendChild(subtitleEl);
        }
        
        // Body content
        if (body) {
            const bodyEl = document.createElement("div");
            bodyEl.classList.add("plus-card-body", "body1-txt");
            
            if (typeof body === "string") {
                bodyEl.innerHTML = body;
            } else if (body instanceof HTMLElement) {
                bodyEl.appendChild(body);
            }
            
            descriptionContainer.appendChild(bodyEl);
        }
        
        cardContent.appendChild(descriptionContainer);
    }
    
    // Header section - Figma: Body/B1/Regular - Merriweather Sans Light, 16px, lineHeight 1.5
    if (header) {
        const headerEl = document.createElement("div");
        headerEl.classList.add("plus-card-header", "body1-txt");
        headerEl.textContent = header;
        cardContent.appendChild(headerEl);
    }
    
    // List items
    // Figma: Dividers are separate elements between items (not borders on items)
    if (items && items.length > 0) {
        const itemsEl = document.createElement("div");
        itemsEl.classList.add("plus-card-items");
        
        items.forEach((itemText, index) => {
            const itemEl = document.createElement("div");
            itemEl.classList.add("plus-card-item", "body1-txt");
            itemEl.textContent = itemText;
            itemsEl.appendChild(itemEl);
            
            // Add divider after each item except the last one
            // Figma: h-px bg-[var(--state-layers/on-surface/opacity-0_08,rgba(25,28,30,0.08))]
            if (index < items.length - 1) {
                const divider = document.createElement("div");
                divider.classList.add("plus-card-item-divider");
                itemsEl.appendChild(divider);
            }
        });
        
        cardContent.appendChild(itemsEl);
    }
    
    // Footer section
    if (footer || links || actionButton) {
        const footerEl = document.createElement("div");
        footerEl.classList.add("plus-card-footer");
        
        // Footer text - Figma: Body/B1/Regular - Merriweather Sans Light, 16px, lineHeight 1.5
        if (footer) {
            const footerTextEl = document.createElement("div");
            footerTextEl.classList.add("plus-card-footer-text", "body1-txt");
            footerTextEl.textContent = footer;
            footerEl.appendChild(footerTextEl);
        }
        
        // Links
        if (links && links.length > 0) {
            const linksEl = document.createElement("div");
            linksEl.classList.add("plus-card-links");
            
            links.forEach((link) => {
                const linkEl = document.createElement("a");
                linkEl.classList.add("plus-card-link", "body1-txt");
                linkEl.textContent = link.text;
                linkEl.href = link.href || "#";
                
                if (link.onClick) {
                    linkEl.addEventListener("click", (e) => {
                        e.preventDefault();
                        link.onClick(e);
                    });
                }
                
                linksEl.appendChild(linkEl);
            });
            
            footerEl.appendChild(linksEl);
        }
        
        // Action button - use the actual Button component
        // Figma: justify-end px-[var(--spacing/medium/space-400,20px)] py-[var(--spacing/medium/space-200,12px)]
        if (actionButton) {
            const buttonWrapper = document.createElement("div");
            buttonWrapper.classList.add("plus-card-action-button");
            buttonWrapper.style.display = "flex";
            buttonWrapper.style.justifyContent = "flex-end";
            buttonWrapper.style.padding = `var(--size-element-gap-lg) var(--size-card-pad-x-md)`; /* 12px top/bottom, 20px left/right */
            
            const buttonEl = createButton({
                btnText: actionButton.text || "Action",
                btnStyle: actionButton.style || "primary",
                btnFill: actionButton.fill || "filled",
                btnSize: actionButton.size || "default",
                buttonOnClick: (e) => {
                    if (e) {
                        e.stopPropagation(); // Prevent card click if card has onClick
                    }
                    if (actionButton.onClick) {
                        actionButton.onClick(e);
                    }
                },
                icon: actionButton.icon || null,
                iconPosition: actionButton.iconPosition || "left",
                classes: []
            });
            
            buttonWrapper.appendChild(buttonEl);
            footerEl.appendChild(buttonWrapper);
        }
        
        cardContent.appendChild(footerEl);
    }
    
    card.appendChild(cardContent);
    
    return card;
}
