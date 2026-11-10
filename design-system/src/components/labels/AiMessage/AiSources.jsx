import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import Link from '@/components/navigation/Link';
import Button from '@/components/forms-and-inputs/Button';
import './AiMessage.scss';

/** One source per address, in the order they came. */
const unique = (sources) => {
    const seen = new Set();
    return sources.filter((source) => {
        if (!source?.href || seen.has(source.href)) return false;
        seen.add(source.href);
        return true;
    });
};

/**
 * What an AI answer read, folded under the message: one quiet "Sources"
 * toggle with the count, and behind it one row per source, its title as a
 * link and its type beside it. The answer links what it names in its own
 * text, so the list starts closed: it is there to check the answer, not to
 * read first. The same address listed twice shows once.
 */
export const AiSources = ({ sources = [], target, defaultOpen = false, className = '' }) => {
    const [open, setOpen] = useState(defaultOpen);
    const listId = useId();
    const list = unique(sources);
    if (list.length === 0) return null;
    return (
        <div className={['plus-ai-sources', className].filter(Boolean).join(' ')}>
            <Button
                appearance="subtle"
                spacing="compact"
                className="plus-ai-sources__toggle"
                aria-expanded={open}
                aria-controls={listId}
                iconAfter={open ? 'chevron-up' : 'chevron-down'}
                onClick={() => setOpen((value) => !value)}
                text={`Sources (${list.length})`}
            />
            {open ? (
                <ul id={listId} className="plus-ai-sources__list" aria-label="Sources">
                    {list.map((source) => (
                        <li key={source.href} className="plus-ai-sources__item">
                            <Link href={source.href} target={target} isOpenInNewWindow={!target && /^https?:/.test(source.href)}>{source.title}</Link>
                            {source.type ? <span className="plus-ai-sources__type">{source.type}</span> : null}
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
};

AiSources.propTypes = {
    /** One `{ title, href, type }` per source the answer read; a repeated `href` shows once. */
    sources: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
        type: PropTypes.string,
    })),
    /** Where the source links open, such as `_top` from inside a frame. Without it, outside links open in a new window. */
    target: PropTypes.string,
    /** Whether the list starts open. Closed by default: the answer's own links come first. */
    defaultOpen: PropTypes.bool,
    className: PropTypes.string,
};

export default AiSources;
