import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import Link from '@/components/navigation/Link';
import Button from '@/components/forms-and-inputs/Button';
import './AiMessage.scss';

/** How many sources show before the rest fold behind the toggle. */
const SHOWN = 3;

/**
 * What an AI answer read: a compact list under the message, one row per
 * source with its title as a link and its type beside it. Past three, the
 * rest fold behind "Show N more sources".
 */
export const AiSources = ({ sources = [], className = '' }) => {
    const [open, setOpen] = useState(false);
    const headingId = useId();
    if (sources.length === 0) return null;
    const hidden = sources.length - SHOWN;
    const shown = open || hidden <= 0 ? sources : sources.slice(0, SHOWN);
    return (
        <div className={['plus-ai-sources', className].filter(Boolean).join(' ')}>
            <p id={headingId} className="plus-ai-sources__heading">Sources</p>
            <ul className="plus-ai-sources__list" aria-labelledby={headingId}>
                {shown.map((source) => (
                    <li key={source.href} className="plus-ai-sources__item">
                        <Link href={source.href} isOpenInNewWindow={/^https?:/.test(source.href)}>{source.title}</Link>
                        {source.type ? <span className="plus-ai-sources__type">{source.type}</span> : null}
                    </li>
                ))}
            </ul>
            {hidden > 0 ? (
                <Button
                    appearance="subtle"
                    spacing="compact"
                    aria-expanded={open}
                    onClick={() => setOpen((value) => !value)}
                    text={open ? 'Show fewer sources' : `Show ${hidden} more ${hidden === 1 ? 'source' : 'sources'}`}
                />
            ) : null}
        </div>
    );
};

AiSources.propTypes = {
    /** One `{ title, href, type }` per source the answer read. */
    sources: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
        type: PropTypes.string,
    })),
    className: PropTypes.string,
};

export default AiSources;
