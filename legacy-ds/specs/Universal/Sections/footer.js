/**
 * @fileoverview Spec component for PLUS design system.
 * Shared organism component for page footer with copyright and version information.
 * Matches Figma design system specifications.
 * 
 * Figma: node-id 111-227938
 */

/**
 * Creates a footer organism component
 * @param {Object} options - Footer configuration
 * @param {string} [options.version='v5.2.0'] - Version number
 * @param {string} [options.copyright='Copyright © Carnegie Mellon University 2024'] - Copyright text
 * @param {string} [options.termsText='Terms of Use'] - Terms of use text
 * @param {string} [options.termsUrl] - Terms of use URL (optional link)
 * @param {string} [options.id] - Footer ID
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Footer element
 */
export function createFooter({
    version = 'v5.2.0',
    copyright = 'Copyright © Carnegie Mellon University 2024',
    termsText = 'Terms of Use',
    termsUrl = null,
    id = null,
    classes = []
}) {
    const footer = document.createElement('footer');
    footer.classList.add('plus-footer');
    
    if (id) {
        footer.id = id;
    }
    
    if (classes && classes.length > 0) {
        footer.classList.add(...classes);
    }
    
    // Footnote section - Figma: px-0 py-[var(--element/pad-y-lg,8px)]
    const footnote = document.createElement('div');
    footnote.classList.add('plus-footer-footnote');
    
    const footnoteContent = document.createElement('div');
    footnoteContent.classList.add('plus-footer-footnote-content');
    
    // Figma: Body/B3/Regular (Light, 12px), color var(--neutral-colors/on-surface,#191c1e)
    // Text format: "v5.2.0 | Copyright © Carnegie Mellon University 2024 | Terms of Use"
    const parts = [version, copyright];
    
    if (termsUrl) {
        const termsLink = document.createElement('a');
        termsLink.href = termsUrl;
        termsLink.textContent = termsText;
        termsLink.classList.add('plus-footer-link', 'body3-txt');
        termsLink.style.fontWeight = 'var(--font-weight-light)';
        termsLink.style.textDecoration = 'none';
        termsLink.style.color = 'var(--color-on-surface)';
        
        footnoteContent.appendChild(document.createTextNode(parts.join(' | ') + ' | '));
        footnoteContent.appendChild(termsLink);
    } else {
        parts.push(termsText);
        const footnoteText = document.createElement('p');
        footnoteText.classList.add('body3-txt');
        footnoteText.style.fontWeight = 'var(--font-weight-light)';
        footnoteText.textContent = parts.join(' | ');
        footnoteContent.appendChild(footnoteText);
    }
    
    footnote.appendChild(footnoteContent);
    footer.appendChild(footnote);
    
    return footer;
}
