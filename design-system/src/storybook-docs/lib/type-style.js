/**
 * A product text style for an inline docs style object: the `font` shorthand
 * cannot carry letter spacing, so the style's `-tracking` companion travels
 * beside it. A metric and `code-sm` also get tabular figures and
 * `label-eyebrow` gets its capitals, as the generated utility classes set them. Spread it:
 * `style={{ ...typeStyle('body-sm'), color }}`.
 */
export function typeStyle(name) {
    const style = { font: `var(--${name})`, letterSpacing: `var(--${name}-tracking)` };
    if (name.startsWith('metric-') || name === 'code-sm') style.fontVariantNumeric = 'tabular-nums';
    if (name === 'label-eyebrow') style.textTransform = 'uppercase';
    return style;
}
