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

/** What a token resolves to as a computed color, read through a probe. */
export const tokenColor = (host, token) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = `var(${token})`;
    host.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
};

/**
 * What a `box-shadow` value resolves to once computed, read through a probe, so
 * a story compares a shadow against its token (`var(--elevation-light-2)`) or
 * a composition of tokens, never against a hand-typed copy of the numbers.
 */
export const computedShadow = (host, value) => {
    const probe = document.createElement('span');
    probe.style.boxShadow = value;
    host.appendChild(probe);
    const shadow = getComputedStyle(probe).boxShadow;
    probe.remove();
    return shadow;
};

/** The alpha channel of a computed color; 1 when it has none. */
export const alpha = (color) => {
    const parts = color.match(/[\d.]+/g).map(Number);
    return parts.length === 4 ? parts[3] : 1;
};
