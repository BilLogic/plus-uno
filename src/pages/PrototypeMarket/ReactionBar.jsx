import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import Tooltip from '@/components/Tooltip';
import {
  REACTION_EMOJIS,
  getReactions,
  toggleReaction,
  ensureUser,
  getUser,
} from './feedback-store';
import './ReactionBar.scss';

/**
 * ReactionBar — Slack-style inline emoji reactions for a prototype card.
 * Only shows emojis that have at least one reaction.
 * A "+" button opens an inline picker to add new reactions.
 */
const ReactionBar = ({ prototypeId }) => {
  const [reactions, setReactions] = useState(() => getReactions(prototypeId));
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // Close picker on click outside
  useEffect(() => {
    if (!pickerOpen) return;
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  const handleReaction = useCallback(
    (emoji, e) => {
      e.stopPropagation();

      const user = ensureUser();
      if (!user) return;

      const updated = toggleReaction(prototypeId, emoji, user);
      setReactions({ ...updated });
      setPickerOpen(false);
    },
    [prototypeId]
  );

  const currentUser = getUser();

  // Only show emojis that have at least one reaction
  const activeEmojis = REACTION_EMOJIS.filter(
    (emoji) => (reactions[emoji] || []).length > 0
  );

  return (
    <div className="reaction-bar" onClick={(e) => e.stopPropagation()}>
      {activeEmojis.map((emoji) => {
        const users = reactions[emoji] || [];
        const count = users.length;
        const isActive = currentUser && users.includes(currentUser);

        return (
          <Tooltip
            key={emoji}
            text={users.join(', ')}
            placement="top"
            size="small"
            id={`reaction-${prototypeId}-${emoji}`}
          >
            <Button
              text={`${count}`}
              leadingVisual={<span className="reaction-bar__emoji">{emoji}</span>}
              style={isActive ? 'primary' : 'secondary'}
              fill={isActive ? 'tonal' : 'outline'}
              size="small"
              onClick={(e) => handleReaction(emoji, e)}
              className="reaction-bar__btn"
              aria-label={`React with ${emoji}`}
            />
          </Tooltip>
        );
      })}

      {/* Add reaction picker */}
      <div className="reaction-bar__picker-wrap" ref={pickerRef}>
        <Tooltip
          text="Add reaction"
          placement="top"
          size="small"
          id={`reaction-add-${prototypeId}`}
        >
          <Button
            text=""
            leadingVisual="plus"
            style="secondary"
            fill="outline"
            size="small"
            onClick={(e) => { e.stopPropagation(); setPickerOpen(!pickerOpen); }}
            className="reaction-bar__btn reaction-bar__add-btn"
            aria-label="Add reaction"
          />
        </Tooltip>

        {pickerOpen && (
          <div className="reaction-bar__picker">
            {REACTION_EMOJIS.map((emoji) => {
              const users = reactions[emoji] || [];
              const isActive = currentUser && users.includes(currentUser);

              return (
                <Button
                  key={emoji}
                  text=""
                  leadingVisual={<span className="reaction-bar__emoji">{emoji}</span>}
                  style={isActive ? 'primary' : 'secondary'}
                  fill={isActive ? 'tonal' : 'ghost'}
                  size="small"
                  onClick={(e) => handleReaction(emoji, e)}
                  className="reaction-bar__picker-btn"
                  aria-label={`React with ${emoji}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

ReactionBar.propTypes = {
  prototypeId: PropTypes.string.isRequired,
};

export default ReactionBar;
