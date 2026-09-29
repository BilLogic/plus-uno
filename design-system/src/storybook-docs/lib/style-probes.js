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

/** What a length token resolves to, in pixels, read through a probe. */
export const tokenLength = (host, token) => {
    const probe = document.createElement('span');
    probe.style.display = 'block';
    probe.style.width = `var(${token})`;
    host.appendChild(probe);
    const value = px(getComputedStyle(probe).width);
    probe.remove();
    return value;
};

/** The alpha channel of a computed color; 1 when it has none. */
export const alpha = (color) => {
    const parts = color.match(/[\d.]+/g).map(Number);
    return parts.length === 4 ? parts[3] : 1;
};
