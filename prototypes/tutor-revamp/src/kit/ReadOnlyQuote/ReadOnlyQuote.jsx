import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '../Avatar';
import './ReadOnlyQuote.css';

/**
 * ReadOnlyQuote: someone else's words the tutor reads but cannot edit, such
 * as a lead tutor's note or a kickoff note. A filled block (no side stripe),
 * the quote in Body/large, then the author, a date and a lock marker that
 * says it is read-only.
 */
const ReadOnlyQuote = ({ children, author, initials, tone = 'teal', date, marker = 'Read only', className = '' }) => (
    <figure className={['tr-quote', className].filter(Boolean).join(' ')}>
        <blockquote className="tr-quote__body">{typeof children === 'string' ? <p>{children}</p> : children}</blockquote>
        <figcaption className="tr-quote__caption">
            {initials ? <Avatar initials={initials} tone={tone} size="sm" /> : null}
            <span className="tr-quote__author">{author}</span>
            {date ? <span aria-hidden="true">·</span> : null}
            {date ? <span>{date}</span> : null}
            <span className="tr-quote__marker" data-part="marker">
                <i className="fa-solid fa-lock" aria-hidden="true" />
                {marker}
            </span>
        </figcaption>
    </figure>
);

ReadOnlyQuote.propTypes = {
    /** The quote */
    children: PropTypes.node.isRequired,
    /** Who wrote it */
    author: PropTypes.string.isRequired,
    /** The author's initials, for the avatar */
    initials: PropTypes.string,
    /** The avatar's accent */
    tone: PropTypes.oneOf(['teal', 'blue', 'purple', 'yellow', 'green', 'orange']),
    /** When it was written: "Jan 2" */
    date: PropTypes.string,
    /** The read-only marker's words */
    marker: PropTypes.string,
    className: PropTypes.string,
};

export default ReadOnlyQuote;
