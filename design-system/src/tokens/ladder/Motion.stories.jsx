import React from 'react';

/**
 * The motion durations as animated bars, each reading its own
 * `--motion-duration-*` and the standard easing.
 */
export default {
    title: 'Foundations/Motion Tokens',
    tags: ['!dev', '!autodocs'],
};

const label = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const row = { display: 'flex', alignItems: 'flex-end', gap: 'var(--space-150)', flexWrap: 'wrap' };
const col = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-050)' };

const MOTION_DURATIONS = ['short', 'medium', 'long'];

export const Motion = () => (
    <div style={row}>
        {MOTION_DURATIONS.map((name) => (
            <div key={name} style={col}>
                <div
                    style={{
                        width: 'var(--space-500)',
                        height: 'var(--space-150)',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--ds-background-neutral)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        className={`motion-tokens-bar motion-tokens-bar--${name}`}
                        style={{
                            width: '40%',
                            height: '100%',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--ds-background-brand-bold)',
                            animation: `motion-tokens-slide var(--motion-duration-${name}) var(--motion-easing-standard) infinite alternate`,
                        }}
                    />
                </div>
                <span style={label}>{`--motion-duration-${name}`}</span>
            </div>
        ))}
        <style>{'@keyframes motion-tokens-slide { from { transform: translateX(0); } to { transform: translateX(150%); } }'}</style>
    </div>
);
