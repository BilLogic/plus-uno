import React, { useState } from 'react';
import PropTypes from 'prop-types';
import IconButton from '@/components/forms-and-inputs/IconButton';
import Button from '@/components/forms-and-inputs/Button';
import TextArea from '@/components/forms-and-inputs/TextArea';
import Popup from '@/components/overlays-and-layering/Popup';
import Icon from '../../images-and-icons/Icon';
import './AiMessage.scss';

const thumb = (direction, selected) => (
    <Icon name={`${selected ? 'fa-solid' : 'fa-regular'} fa-thumbs-${direction}`} />
);

/**
 * Thumbs up and down on an AI answer. Two toggle buttons, at most one
 * pressed: a press reports `{ rating }` through `onFeedback`, a second press
 * on the same thumb clears it (`rating: null`). Thumbs down also opens a
 * popup for an optional comment, sent as `{ rating: 'down', comment }`.
 * A rating is confirmed quietly, in words a screen reader hears, and a
 * change of rating is announced as well.
 */
export const AiFeedback = ({ value, defaultValue = null, onFeedback, className = '' }) => {
    const controlled = value !== undefined;
    const [own, setOwn] = useState(defaultValue);
    const rating = controlled ? value : own;
    const [asking, setAsking] = useState(false);
    const [comment, setComment] = useState('');

    const rate = (next) => {
        const chosen = rating === next ? null : next;
        if (!controlled) setOwn(chosen);
        onFeedback?.({ rating: chosen });
        setAsking(chosen === 'down');
        setComment('');
    };

    const send = () => {
        const text = comment.trim();
        if (text) onFeedback?.({ rating: 'down', comment: text });
        setAsking(false);
    };

    return (
        <div className={['plus-ai-feedback', className].filter(Boolean).join(' ')}>
            <div role="group" aria-label="Rate this answer" className="plus-ai-feedback__buttons">
                <IconButton
                    icon={thumb('up', rating === 'up')}
                    label="Good answer"
                    appearance="subtle"
                    spacing="compact"
                    isSelected={rating === 'up'}
                    onClick={() => rate('up')}
                />
                <Popup
                    triggerType="manual"
                    show={asking}
                    onToggle={(open) => { if (!open) setAsking(false); }}
                    placement="bottom-start"
                    title="What went wrong?"
                    trigger={(
                        <IconButton
                            icon={thumb('down', rating === 'down')}
                            label="Bad answer"
                            appearance="subtle"
                            spacing="compact"
                            isSelected={rating === 'down'}
                            onClick={() => rate('down')}
                        />
                    )}
                >
                    <div className="plus-ai-feedback__ask">
                        <TextArea
                            label="What went wrong?"
                            isLabelHidden
                            caption="Optional. It helps the AI get better."
                            rows={2}
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                        />
                        <div className="plus-ai-feedback__actions">
                            <Button text="Skip" appearance="subtle" spacing="compact" onClick={() => setAsking(false)} />
                            <Button text="Send" appearance="primary" spacing="compact" onClick={send} />
                        </div>
                    </div>
                </Popup>
            </div>
            <span role="status" className="plus-ai-feedback__thanks">
                {/* Each rating has its own words, so a change of mind is announced too. */}
                {rating === 'up' && 'Thanks. Marked as a good answer.'}
                {rating === 'down' && 'Thanks. Marked as a bad answer.'}
            </span>
        </div>
    );
};

AiFeedback.propTypes = {
    /** The rating, owned by the page: `up`, `down` or null. */
    value: PropTypes.oneOf(['up', 'down', null]),
    /** The first rating when the component holds its own. */
    defaultValue: PropTypes.oneOf(['up', 'down', null]),
    /** Called with `{ rating }` on a press, and `{ rating: 'down', comment }` when a comment is sent. */
    onFeedback: PropTypes.func,
    className: PropTypes.string,
};

export default AiFeedback;
