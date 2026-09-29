/**
 * Probes for story `play:` functions that assert computed styles.
 *
 * A story that checks a color checks it against the token it should resolve
 * to, read through a probe element, so a wrong mapping fails in the browser
 * rather than in review. Contrast ratios are not computed here; they belong
 * to the one contrast helper, not to a second copy.
 */

/** A computed length as a number of pixels. */
export const px = (value) => parseFloat(value);

/** Set `property` to `var(token)` on a throwaway span in `host`; return its computed value. */
const probe = (host, property, token, extra = {}) => {
    const span = document.createElement('span');
    Object.assign(span.style, extra, { [property]: `var(${token})` });
    host.appendChild(span);
    const value = getComputedStyle(span)[property];
    span.remove();
    return value;
};

/** What a token resolves to as a computed color, read through a probe. */
export const tokenColor = (host, token) => probe(host, 'backgroundColor', token);

/**
 * What a length token resolves to, in pixels, read through a probe. It reads
 * the layout width of a block span, so it is reliable for plain length tokens
 * on story canvases only.
 */
export const tokenLength = (host, token) => px(probe(host, 'width', token, { display: 'block' }));

/** The alpha channel of a computed color; 1 when it has none. */
export const alpha = (color) => {
    const parts = color.match(/[\d.]+/g).map(Number);
    return parts.length === 4 ? parts[3] : 1;
};
