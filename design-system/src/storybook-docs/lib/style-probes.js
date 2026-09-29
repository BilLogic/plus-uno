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

/**
 * What `value` computes to as `property` (a camelCase style name), read
 * through a throwaway element inside `host`, so tokens resolve in the
 * story's own cascade. `extra` sets any other styles the probe needs first.
 */
export const probe = (host, property, value, extra = {}) => {
    const el = document.createElement('span');
    Object.assign(el.style, extra);
    el.style[property] = value;
    host.appendChild(el);
    const computed = getComputedStyle(el)[property];
    el.remove();
    return computed;
};

/** What a token resolves to as a computed color, read through a probe. */
export const tokenColor = (host, token) => probe(host, 'backgroundColor', `var(${token})`);

/**
 * What a length token resolves to, in pixels, read through a probe. It reads
 * the layout width of a block span, so it is reliable for plain length tokens
 * on story canvases only.
 */
export const tokenLength = (host, token) => px(probe(host, 'width', `var(${token})`, { display: 'block' }));

/**
 * What a `box-shadow` value resolves to once computed, read through a probe, so
 * a story compares a shadow against its token (`var(--elevation-light-2)`) or
 * a composition of tokens, never against a hand-typed copy of the numbers.
 */
export const computedShadow = (host, value) => probe(host, 'boxShadow', value);

/** The alpha channel of a computed color; 1 when it has none. */
export const alpha = (color) => {
    const parts = color.match(/[\d.]+/g).map(Number);
    return parts.length === 4 ? parts[3] : 1;
};
