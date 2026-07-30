import React from 'react';
import PropTypes from 'prop-types';

/**
 * Five-point linear scale (Figma Sections · Linear Scale `10819:11602`).
 * Fixed 445px shell: equal flex label columns + non-shrinking 1–5 radio row.
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
            alignItems: 'flex-start',
            gap: 'var(--size-section-gap-md)',
            padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-sm)',
            backgroundColor: 'var(--color-primary-state-08)',
            borderRadius: 'var(--size-section-radius-md, 12px)',
            width: '445px',
            maxWidth: '100%',
            boxSizing: 'border-box',
        }}
    >
        <div
            style={{
                display: 'flex',
                flex: '1 0 0',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--size-section-gap-lg, 24px)',
                minWidth: 0,
            }}
        >
            <p
                className="body2-txt m-0"
                style={{
                    flex: '1 0 0',
                    minWidth: 0,
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
                {[1, 2, 3, 4, 5].map((option) => {
                    const checked = value === option;
                    return (
                        <label
                            key={option}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 'var(--size-element-gap-sm)',
                                width: '29px',
                                cursor: 'pointer',
                                margin: 0,
                            }}
                        >
                            <span className="body2-txt" style={{ color: 'var(--color-on-surface)', textAlign: 'center' }}>
                                {option}
                            </span>
                            <span
                                style={{
                                    position: 'relative',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '999px',
                                    border: '1px solid var(--color-primary)',
                                    backgroundColor: checked
                                        ? 'var(--color-surface)'
                                        : 'var(--color-on-primary, #fff)',
                                    flexShrink: 0,
                                }}
                            >
                                <input
                                    type="radio"
                                    name={name}
                                    value={option}
                                    checked={checked}
                                    onChange={() => onChange?.(option)}
                                    aria-label={String(option)}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        margin: 0,
                                        cursor: 'pointer',
                                    }}
                                />
                                {checked && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '999px',
                                            backgroundColor: 'var(--color-primary)',
                                        }}
                                    />
                                )}
                            </span>
                        </label>
                    );
                })}
            </div>

            <p
                className="body2-txt m-0"
                style={{
                    flex: '1 0 0',
                    minWidth: 0,
                    color: 'var(--color-on-surface)',
                    lineHeight: 1.571,
                }}
            >
                {highLabel}
            </p>
        </div>
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
