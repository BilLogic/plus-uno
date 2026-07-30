import React from 'react';
import PropTypes from 'prop-types';

/**
 * Skeleton placeholder shown while AI prepares a follow-up reflection question.
 *
 * @param {object} props
 * @param {string} [props.label='Preparing your question…'] - Status label
 * @param {string} [props.className] - Optional className
 */
const AiGeneratingPlaceholder = ({
    label = 'Preparing your question…',
    className = '',
}) => (
    <div
        className={className}
        role="status"
        aria-live="polite"
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-sm)',
            padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
            borderRadius: 'var(--size-card-radius-sm)',
            backgroundColor: 'var(--color-primary-state-08)',
            border: '1px solid var(--color-primary-state-16)',
            minHeight: '88px',
        }}
    >
        <div
            style={{
                height: '10px',
                width: '72%',
                borderRadius: '999px',
                backgroundColor: 'var(--color-primary-state-16)',
            }}
        />
        <div
            style={{
                height: '10px',
                width: '54%',
                borderRadius: '999px',
                backgroundColor: 'var(--color-primary-state-16)',
            }}
        />
        <span className="body2-txt" style={{ color: 'var(--color-primary-text)' }}>
            {label}
        </span>
    </div>
);

AiGeneratingPlaceholder.propTypes = {
    label: PropTypes.string,
    className: PropTypes.string,
};

export default AiGeneratingPlaceholder;
