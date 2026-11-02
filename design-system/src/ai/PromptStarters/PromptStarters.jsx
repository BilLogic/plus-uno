import React from 'react';
import PropTypes from 'prop-types';
import { Suggestion } from '@/components';
import './PromptStarters.scss';

/**
 * A few things a person could ask the agent, as a wrapping row of prompt
 * Suggestions.
 *
 * - **starters** are `{ id, label, text }`: the short `label` shown on the chip
 *   and the longer `text` it stands for.
 * - **onSelect(starter)** runs when a chip is pressed. A starter is a
 *   suggestion, so the owner decides what it does, usually putting `text` in a
 *   PromptInput for the person to read and send. It never sends on its own.
 * - **label** names the group for assistive technology.
 */
const PromptStarters = ({
    starters = [],
    onSelect,
    label,
    className = '',
    ...props
}) => {
    if (starters.length === 0) return null;
    return (
        <div
            {...props}
            // After the spread, so a caller cannot rename or re-role the group.
            role="group"
            aria-label={label}
            className={['plus-prompt-starters', className].filter(Boolean).join(' ')}
        >
            {starters.map((starter) => (
                <Suggestion
                    key={starter.id}
                    type="prompt"
                    label={starter.label}
                    text={starter.text}
                    onAccept={() => onSelect?.(starter)}
                />
            ))}
        </div>
    );
};

PromptStarters.propTypes = {
    /** What to offer: `id` for the key, `label` on the chip, `text` for the prompt it stands for. */
    starters: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            label: PropTypes.string.isRequired,
            text: PropTypes.string,
        }),
    ),
    /** Called with the starter that was pressed. It does not send anything. */
    onSelect: PropTypes.func,
    /** The group's accessible name, such as "Suggested prompts". */
    label: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default PromptStarters;
