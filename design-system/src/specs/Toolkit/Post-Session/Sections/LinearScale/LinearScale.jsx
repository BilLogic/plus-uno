import React from 'react';
import PropTypes from 'prop-types';
import Radio from '@/components/forms-and-inputs/Radio';

/**
 * Five-point linear scale (Figma Sections · Linear Scale `10819:11602`).
 * Anchors sit beside a non-shrinking 1–5 radio row — labels wrap as phrases, not one letter per line.
 *
 * @param {object} props
 * @param {number} [props.value=0]
 * @param {(value: number) => void} [props.onChange]
 * @param {string} [props.name='linear-scale']
 * @param {string} [props.lowLabel='I struggled to find my footing.']
 * @param {string} [props.highLabel='I nailed it!']
 */
const LinearScale = ({
    value = 0,
    onChange,
    name = 'linear-scale',
    lowLabel = 'I struggled to find my footing.',
    highLabel = 'I nailed it!',
}) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--size-section-gap-md)',
            padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-sm)',
            backgroundColor: 'var(--color-primary-state-08)',
            borderRadius: 'var(--size-section-radius-md, 12px)',
            width: '100%',
            maxWidth: '445px',
        }}
    >
        <p
            className="body2-txt m-0"
            style={{
                flex: '1 1 120px',
                minWidth: '100px',
                maxWidth: '160px',
                color: 'var(--color-on-surface)',
                lineHeight: 1.571,
            }}
        >
            {lowLabel}
        </p>

        <div
            style={{
                display: 'flex',
                gap: 'var(--size-section-gap-md)',
                alignItems: 'center',
                flexShrink: 0,
            }}
            role="radiogroup"
            aria-label="Self reflection scale"
        >
            {[1, 2, 3, 4, 5].map((option) => (
                <div
                    key={option}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--size-element-gap-sm)',
                        width: '29px',
                    }}
                >
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                        {option}
                    </span>
                    <Radio
                        id={`${name}-${option}`}
                        name={name}
                        value={String(option)}
                        checked={value === option}
                        onChange={() => onChange?.(option)}
                        aria-label={String(option)}
                        label=""
                        size="small"
                    />
                </div>
            ))}
        </div>

        <p
            className="body2-txt m-0"
            style={{
                flex: '1 1 72px',
                minWidth: '72px',
                maxWidth: '120px',
                color: 'var(--color-on-surface)',
                lineHeight: 1.571,
                textAlign: 'right',
            }}
        >
            {highLabel}
        </p>
    </div>
);

LinearScale.propTypes = {
    value: PropTypes.number,
    onChange: PropTypes.func,
    name: PropTypes.string,
    lowLabel: PropTypes.string,
    highLabel: PropTypes.string,
};

export default LinearScale;
