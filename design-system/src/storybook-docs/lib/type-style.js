/**
 * A product text style for an inline docs style object: the `font` shorthand
 * cannot carry letter spacing, so the style's `-tracking` companion travels
 * beside it, and a metric also gets tabular figures. Spread it:
 * `style={{ ...typeStyle('body-sm'), color }}`.
 */
export function typeStyle(name) {
    const style = { font: `var(--${name})`, letterSpacing: `var(--${name}-tracking)` };
    if (name.startsWith('metric-')) style.fontVariantNumeric = 'tabular-nums';
    return style;
}
