import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { HeadingContextProvider } from '@/components/text-and-data-display/Heading';
import './Comment.scss';

/**
 * Comment: one entry in a threaded discussion, with slots for the
 * author, time, content, actions and replies.
 */
export const Comment = ({
    avatar,
    author,
    time,
    edited,
    content,
    actions,
    nestedReplies,
    isSaving = false,
    savingText = 'Saving…',
    isHighlighted = false,
    restrictedTo,
    type,
    headingLevel = 2,
    className,
    ...props
}) => (
    <article
        className={classNames('plus-comment', { 'plus-comment--highlighted': isHighlighted }, className)}
        data-type={type}
        {...props}
    >
        <div className="plus-comment-row">
            {avatar && <div className="plus-comment-avatar">{avatar}</div>}
            <div className="plus-comment-main">
                <div className="plus-comment-header">
                    {author && <span className="plus-comment-author">{author}</span>}
                    {time && <span className="plus-comment-time">{time}</span>}
                    {edited && <span className="plus-comment-edited">{edited}</span>}
                    {restrictedTo && <span className="plus-comment-restricted">{restrictedTo}</span>}
                </div>
                <div className="plus-comment-content">{content}</div>
                {isSaving ? (
                    <div className="plus-comment-saving">{savingText}</div>
                ) : (
                    actions && <div className="plus-comment-actions">{actions}</div>
                )}
            </div>
        </div>
        {nestedReplies && (
            <HeadingContextProvider value={headingLevel}>
                <div className="plus-comment-replies">{nestedReplies}</div>
            </HeadingContextProvider>
        )}
    </article>
);

Comment.propTypes = {
    avatar: PropTypes.node,
    author: PropTypes.node,
    time: PropTypes.node,
    edited: PropTypes.node,
    content: PropTypes.node,
    actions: PropTypes.node,
    nestedReplies: PropTypes.node,
    /** Hides `actions` and shows `savingText` instead. */
    isSaving: PropTypes.bool,
    savingText: PropTypes.node,
    isHighlighted: PropTypes.bool,
    restrictedTo: PropTypes.node,
    type: PropTypes.string,
    /** The heading level `nestedReplies` opens at, via HeadingContextProvider. */
    headingLevel: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
    className: PropTypes.string,
};

export default Comment;
