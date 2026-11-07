import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import AiIcon from '@/components/images-and-icons/AiIcon';
import AiSources from './AiSources';
import AiFeedback from './AiFeedback';
import './AiMessage.scss';

export const AI_MESSAGE_STATUSES = ['complete', 'streaming', 'thinking'];

/**
 * Types `text` out one character at a time, then calls `onComplete`.
 * Under reduced motion the whole text shows at once.
 */
export const TypingText = ({ text, speed = 14, onComplete }) => {
    const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const [count, setCount] = useState(reduced ? text.length : 0);

    useEffect(() => {
        if (reduced) {
            setCount(text.length);
            onComplete?.();
            return undefined;
        }
        setCount(0);
        let index = 0;
        const timer = setInterval(() => {
            if (index < text.length) {
                index += 1;
                setCount(index);
            } else {
                clearInterval(timer);
                onComplete?.();
            }
        }, speed);
        return () => clearInterval(timer);
    // `onComplete` is read when typing ends; a new function must not restart the typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, speed, reduced]);

    return (
        <>
            {text.slice(0, count)}
            {count < text.length ? <span className="plus-ai-message__caret" aria-hidden="true" /> : null}
        </>
    );
};

TypingText.propTypes = {
    text: PropTypes.string.isRequired,
    speed: PropTypes.number,
    onComplete: PropTypes.func,
};

/** Three pulsing dots: the assistant has the message and has not started writing. */
const TypingIndicator = () => (
    <span className="plus-ai-message__typing" role="status" aria-label="AI is writing">
        <span className="plus-ai-message__dot" aria-hidden="true" />
        <span className="plus-ai-message__dot" aria-hidden="true" />
        <span className="plus-ai-message__dot" aria-hidden="true" />
    </span>
);

/**
 * An assistant reply, marked as AI by the small AI icon at its start (named
 * "AI" for assistive technology), so no answer reads as a person's. The
 * content is `text`, or `parts` when a reply mixes
 * text with other content: a part is `{ type: 'text', text }` or any other
 * `{ type, ... }`, which `renderPart` draws.
 *
 * - `status="complete"` is a finished message.
 * - `status="streaming"` is text still arriving: a caret follows the last
 *   character and the message is marked busy for assistive technology.
 * - `status="thinking"` is the typing indicator, before any text exists.
 *
 * `sources` lists what a finished answer read, under the message: an answer
 * that draws on records always shows them. `onFeedback` puts thumbs up and
 * down under a finished answer; `feedback` holds the rating when the page
 * owns it.
 */
const AiMessage = ({
    text,
    parts,
    status = 'complete',
    typeOut = false,
    renderPart,
    sources,
    onFeedback,
    feedback,
    className,
    ...rest
}) => {
    const items = parts ?? (text == null ? [] : [{ type: 'text', text }]);
    const lastText = items.reduce((last, part, i) => (part?.type === 'text' ? i : last), -1);

    return (
        <div
            className={classNames('plus-ai-message', `plus-ai-message--${status}`, className)}
            aria-busy={status === 'streaming' ? true : undefined}
            {...rest}
        >
            <AiIcon name="generate" size={16} label="AI" className="plus-ai-message__icon" />
            <div className="plus-ai-message__body">
                {status === 'thinking' ? <TypingIndicator /> : items.map((part, index) => {
                    if (!part) return null;
                    if (part.type === 'text') {
                        const streaming = status === 'streaming' && index === lastText;
                        return (
                            <p key={index} className="plus-ai-message__text">
                                {typeOut && status === 'complete' ? (
                                    <>
                                        <span className="plus-ai-message__sr">{part.text}</span>
                                        <span aria-hidden="true"><TypingText text={part.text} /></span>
                                    </>
                                ) : part.text}
                                {streaming ? <span className="plus-ai-message__caret" aria-hidden="true" /> : null}
                            </p>
                        );
                    }
                    return <div key={index} className="plus-ai-message__part">{renderPart?.(part, index) ?? null}</div>;
                })}
                {status === 'complete' && sources?.length ? <AiSources sources={sources} /> : null}
                {status === 'complete' && onFeedback ? <AiFeedback value={feedback} onFeedback={onFeedback} /> : null}
            </div>
        </div>
    );
};

AiMessage.propTypes = {
    /** A single text reply; shorthand for one text part. */
    text: PropTypes.string,
    /** Parts of a reply, in order: `{ type: 'text', text }` or another `{ type }` that `renderPart` draws. */
    parts: PropTypes.arrayOf(PropTypes.shape({ type: PropTypes.string.isRequired })),
    /** `complete` is finished, `streaming` is text still arriving, `thinking` is the typing indicator. */
    status: PropTypes.oneOf(AI_MESSAGE_STATUSES),
    /** Types a finished text out character by character, as a reply that has just arrived. */
    typeOut: PropTypes.bool,
    /** Draws a part that is not text: `(part, index) => node`. */
    renderPart: PropTypes.func,
    /** What a finished answer read: one `{ title, href, type }` per source, listed under the message. */
    sources: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
        type: PropTypes.string,
    })),
    /** Thumbs up and down under a finished answer: called with `{ rating }`, or `{ rating: 'down', comment }`. */
    onFeedback: PropTypes.func,
    /** The rating, when the page owns it: `up`, `down` or null. */
    feedback: PropTypes.oneOf(['up', 'down', null]),
    className: PropTypes.string,
};

export default AiMessage;
