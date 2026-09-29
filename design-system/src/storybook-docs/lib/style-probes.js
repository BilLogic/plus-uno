/**
 * Probes for story `play:` functions that assert computed styles.
 *
 * A story that checks a color checks it against the token it should resolve
 * to, read through a probe element, so a wrong mapping fails in the browser
 * rather than in review. These helpers were Count's; Status reads the same
 * facts, so they live here once.
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

/** The alpha channel of a computed color; 1 when it has none. */
export const alpha = (color) => {
    const parts = color.match(/[\d.]+/g).map(Number);
    return parts.length === 4 ? parts[3] : 1;
};

/** WCAG contrast ratio between two opaque computed colors. */
export const contrast = (a, b) => {
    const lum = (color) => {
        const [r, g, b2] = color.match(/[\d.]+/g).slice(0, 3).map((v) => {
            const c = Number(v) / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
    };
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};
