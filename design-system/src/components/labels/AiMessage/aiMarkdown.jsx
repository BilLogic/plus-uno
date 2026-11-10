import React from 'react';
import Link from '@/components/navigation/Link';

/**
 * The Markdown an AI reply is written in, drawn as React elements (never as
 * HTML, so a reply cannot inject markup). It covers what a chat answer uses:
 * paragraphs, line breaks, headings, bulleted and numbered lists, fenced code,
 * and inline code, bold, italic and links. Anything else stays text.
 */

const FENCE = /^\s*```/;
const HEADING = /^\s*(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;

/** Splits text into blocks: `{ type: 'code' | 'heading' | 'ul' | 'ol' | 'p', ... }`. */
export const parseBlocks = (text) => {
    const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let paragraph = null;
    const endParagraph = () => { paragraph = null; };

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (FENCE.test(line)) {
            endParagraph();
            const language = line.trim().slice(3).trim();
            const code = [];
            i += 1;
            while (i < lines.length && !FENCE.test(lines[i])) { code.push(lines[i]); i += 1; }
            blocks.push({ type: 'code', language, text: code.join('\n') });
            continue;
        }
        if (!line.trim() || RULE.test(line)) { endParagraph(); continue; }
        const heading = HEADING.exec(line);
        if (heading) { endParagraph(); blocks.push({ type: 'heading', text: heading[2] }); continue; }
        const bullet = BULLET.exec(line);
        const numbered = bullet ? null : NUMBERED.exec(line);
        if (bullet || numbered) {
            endParagraph();
            const type = bullet ? 'ul' : 'ol';
            const last = blocks[blocks.length - 1];
            const item = (bullet ?? numbered)[1];
            if (last?.type === type && last.open) last.items.push(item);
            else blocks.push({ type, items: [item], open: true });
            continue;
        }
        const quote = QUOTE.exec(line);
        const content = quote ? quote[1] : line;
        // A line under a list item continues that item.
        const last = blocks[blocks.length - 1];
        if (!paragraph && (last?.type === 'ul' || last?.type === 'ol') && last.open && /^\s+/.test(line)) {
            last.items[last.items.length - 1] += ` ${content.trim()}`;
            continue;
        }
        if (last && (last.type === 'ul' || last.type === 'ol')) last.open = false;
        if (paragraph) paragraph.lines.push(content);
        else { paragraph = { type: 'p', lines: [content] }; blocks.push(paragraph); }
    }
    return blocks.map(({ open, ...block }) => block);
};

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*|__[^_\n]+?__)|(\[([^\]\n]+)\]\(([^)\s]+)\))|(\*[^*\s][^*\n]*?\*|(?<![A-Za-z0-9])_[^_\s][^_\n]*?_(?![A-Za-z0-9]))/;

/** A link a reply may carry: the web, mail, or a page on this site. Anything else (`javascript:`) stays text. */
export const isSafeHref = (href) => /^(https?:|mailto:|\/|\?|#|\.)/i.test(String(href ?? '').trim());

/**
 * Inline Markdown as React nodes. `options.resolveHref(href)` may rewrite a
 * link's address (a docs page named by title, say); `options.linkTarget` is
 * where links open.
 */
export const renderInline = (text, options = {}, keyPrefix = 'i') => {
    const nodes = [];
    let rest = String(text ?? '');
    let n = 0;
    while (rest) {
        const match = INLINE.exec(rest);
        if (!match) { nodes.push(rest); break; }
        if (match.index > 0) nodes.push(rest.slice(0, match.index));
        const key = `${keyPrefix}-${n}`;
        n += 1;
        const [token, code, bold, link, label, rawHref, em] = match;
        if (code) {
            nodes.push(<code key={key} className="plus-ai-markdown__code">{code.slice(1, -1)}</code>);
        } else if (bold) {
            nodes.push(<strong key={key}>{renderInline(bold.slice(2, -2), options, key)}</strong>);
        } else if (link) {
            const href = options.resolveHref ? options.resolveHref(rawHref) : rawHref;
            nodes.push(href && isSafeHref(href) ? (
                <Link key={key} href={href} target={options.linkTarget} isOpenInNewWindow={!options.linkTarget && /^https?:/i.test(href)}>
                    {renderInline(label, options, key)}
                </Link>
            ) : <React.Fragment key={key}>{renderInline(label, options, key)}</React.Fragment>);
        } else if (em) {
            nodes.push(<em key={key}>{renderInline(em.slice(1, -1), options, key)}</em>);
        } else {
            nodes.push(token);
        }
        rest = rest.slice(match.index + token.length);
    }
    return nodes;
};

const withBreaks = (lines, options, key) => lines.flatMap((line, i) => (
    i === 0 ? renderInline(line, options, `${key}-${i}`) : [<br key={`${key}-br${i}`} />, ...renderInline(line, options, `${key}-${i}`)]
));

/** A reply's Markdown as React blocks. */
export const AiMarkdown = ({ text, resolveHref, linkTarget }) => {
    const options = { resolveHref, linkTarget };
    return parseBlocks(text).map((block, index) => {
        const key = `b${index}`;
        switch (block.type) {
        case 'code':
            return (
                <pre key={key} className="plus-ai-markdown__pre">
                    <code data-language={block.language || undefined}>{block.text}</code>
                </pre>
            );
        case 'heading':
            return <p key={key} className="plus-ai-markdown__heading">{renderInline(block.text, options, key)}</p>;
        case 'ul':
        case 'ol': {
            const List = block.type;
            return (
                <List key={key} className="plus-ai-markdown__list">
                    {block.items.map((item, i) => <li key={`${key}-${i}`}>{renderInline(item, options, `${key}-${i}`)}</li>)}
                </List>
            );
        }
        default:
            return <p key={key} className="plus-ai-message__text">{withBreaks(block.lines, options, key)}</p>;
        }
    });
};

export default AiMarkdown;
