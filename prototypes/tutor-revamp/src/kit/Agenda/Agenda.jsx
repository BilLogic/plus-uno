import React from 'react';
import PropTypes from 'prop-types';
import '../kit.css';
import './Agenda.css';

/**
 * Agenda: a day as a timeline. Each entry is a time, a dot on a vertical
 * thread, a linked title and an optional status. Done entries go quiet; the
 * entry happening now gets the brand dot, a semibold title and
 * `aria-current="time"`.
 *
 * Titles are `a` by default; pass a router `Link` as `linkAs` (entries take `to`).
 */
const Agenda = ({ items, linkAs: Link = 'a', label, className = '' }) => (
    <ol className={['tr-agenda', className].filter(Boolean).join(' ')} aria-label={label}>
        {items.map((item) => {
            const linkProps = Link === 'a' ? { href: item.href ?? item.to } : { to: item.to ?? item.href };
            return (
                <li key={item.id} className={`tr-agenda__item tr-agenda__item--${item.state}`} aria-current={item.state === 'now' ? 'time' : undefined}>
                    <time className="tr-agenda__time">{item.time}</time>
                    <span className="tr-agenda__dot" aria-hidden="true" />
                    <Link className="tr-agenda__title" {...linkProps}>
                        {item.title}
                        {item.state === 'done' ? <span className="tr-sr-only"> (done)</span> : null}
                    </Link>
                    {item.status ?? <span />}
                </li>
            );
        })}
    </ol>
);

Agenda.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        /** "1:00" */
        time: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        state: PropTypes.oneOf(['done', 'now', 'upcoming']).isRequired,
        /** A Status at the end of the entry */
        status: PropTypes.node,
        href: PropTypes.string,
        to: PropTypes.string,
    })).isRequired,
    linkAs: PropTypes.elementType,
    label: PropTypes.string,
    className: PropTypes.string,
};

export default Agenda;
