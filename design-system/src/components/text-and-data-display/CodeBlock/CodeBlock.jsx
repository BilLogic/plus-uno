import React from 'react';
import PropTypes from 'prop-types';
import VisuallyHidden from '../VisuallyHidden';
import './CodeBlock.scss';

/**
 * Lines to highlight, as a set of 1-based numbers. Takes "2,4-6", a number, or
 * an array of numbers and ranges such as `[1, '3-4']`. Anything else is ignored.
 */
export const parseHighlight = (spec) => {
    const lines = new Set();
    const parts = Array.isArray(spec) ? spec : String(spec ?? '').split(',');
    parts.forEach((part) => {
        const match = String(part).trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!match) return;
        const from = Number(match[1]);
        const to = Number(match[2] ?? match[1]);
        for (let n = from; n <= to; n += 1) lines.add(n);
    });
    return lines;
};

/**
 * A block of code in the code typeface on the code surface, with optional line
 * numbers and highlighted lines. Long lines scroll sideways inside a focusable,
 * named region, or fold onto the next line when `wrap` is on. It does not
 * color syntax: the text is one ink, and `language` is recorded for tools.
 */
const CodeBlock = ({
    text = '',
    language,
    showLineNumbers = true,
    highlight,
    wrap = false,
    label = 'Code snippet',
    className = '',
}) => {
    const lines = String(text).replace(/\n$/, '').split('\n');
    const marked = parseHighlight(highlight);
    const digits = String(lines.length).length;

    const classes = [
        'plus-code-block',
        wrap ? 'plus-code-block--wrap' : '',
        className,
    ].filter(Boolean).join(' ');

    // A scrolling block is a named region a keyboard can focus, so its sideways
    // scroll is reachable. A wrapping block has nothing to scroll.
    const regionProps = wrap
        ? {}
        : { role: 'region', 'aria-label': label, tabIndex: 0 };

    return (
        <pre className={classes} style={{ '--plus-code-block-digits': digits }} {...regionProps}>
            <code className={language ? `language-${language}` : undefined}>
                {lines.map((line, index) => {
                    const number = index + 1;
                    const on = marked.has(number);
                    const starts = on && !marked.has(number - 1);
                    const ends = on && !marked.has(number + 1);
                    return (
                        <span
                            key={number}
                            className="plus-code-block__line"
                            data-line={number}
                            data-highlighted={on ? '' : undefined}
                        >
                            {showLineNumbers && (
                                <span className="plus-code-block__number" data-line-number aria-hidden="true">
                                    {number}
                                </span>
                            )}
                            <span className="plus-code-block__text" data-empty={line === '' ? '' : undefined}>
                                {starts && <span className="plus-code-block__marker"><VisuallyHidden>Highlight start</VisuallyHidden></span>}
                                {line}
                                {ends && <span className="plus-code-block__marker"><VisuallyHidden>Highlight end</VisuallyHidden></span>}
                            </span>
                        </span>
                    );
                })}
            </code>
        </pre>
    );
};

CodeBlock.propTypes = {
    /** The code, with lines separated by newlines. */
    text: PropTypes.string,
    /** The language, recorded as a `language-*` class for tools that read it. It does not color the text. */
    language: PropTypes.string,
    /** Whether each line is numbered in a gutter that screen readers skip. */
    showLineNumbers: PropTypes.bool,
    /** Lines to highlight: a string such as "2,4-6", or an array such as [1, 3]. Start and end are announced to screen readers. */
    highlight: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
    ]),
    /** Fold long lines onto the next line instead of scrolling sideways. */
    wrap: PropTypes.bool,
    /** The name of the scrolling region a screen reader announces. Unused when `wrap` is on. */
    label: PropTypes.string,
    /** Extra classes for placement, such as spacing. */
    className: PropTypes.string,
};

export default CodeBlock;
