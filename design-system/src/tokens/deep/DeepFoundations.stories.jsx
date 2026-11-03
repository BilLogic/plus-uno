import React from 'react';

/**
 * A scale story for the ADR-038 role and motion tokens: every container-pad
 * and element role rendered as a swatch at its three (or two) densities, and
 * the motion durations as animated bars. Read directly from
 * scripts/lib/tokens/plan.mjs so the story can never drift from what the
 * generator actually wrote.
 */
export default {
    title: 'Foundations/Deep Tokens',
    tags: ['!dev', '!autodocs'],
};

const label = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const row = { display: 'flex', alignItems: 'flex-end', gap: 'var(--space-150)', flexWrap: 'wrap' };
const col = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-050)' };
const section = { display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', marginBottom: 'var(--space-300)' };

const CONTAINER_PAD_ROLES = [
    { token: 'card-pad' },
    { token: 'section-pad-x' },
    { token: 'section-pad-y' },
    { token: 'modal-pad-x' },
    { token: 'modal-pad-y' },
    { token: 'page-pad-x' },
    { token: 'page-pad-y' },
];
const DENSITIES = ['compact', 'default', 'spacious'];
const ELEMENT_ROLES = ['pad', 'gap', 'radius'];

const Swatch = ({ name }) => (
    <div style={col}>
        <div
            style={{
                background: 'var(--ds-background-selected)',
                borderRadius: name.includes('radius') ? `var(${name})` : 'var(--radius-025)',
                padding: name.includes('pad') || name.includes('gap') ? `var(${name})` : 'var(--space-100)',
            }}
        >
            <div style={{ width: 'var(--space-200)', height: 'var(--space-200)', background: 'var(--ds-background-brand-bold)' }} />
        </div>
        <span style={label}>{name}</span>
    </div>
);

export const ContainerRoles = () => (
    <div style={section}>
        {CONTAINER_PAD_ROLES.map(({ token }) => (
            <div key={token} style={row}>
                {DENSITIES.map((d) => (
                    <Swatch key={d} name={`--${token}-${d}`} />
                ))}
            </div>
        ))}
    </div>
);

export const ElementRoles = () => (
    <div style={row}>
        {ELEMENT_ROLES.map((kind) => (
            <React.Fragment key={kind}>
                <Swatch name={`--element-${kind}-default`} />
                <Swatch name={`--element-${kind}-compact`} />
            </React.Fragment>
        ))}
    </div>
);

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
                        className={`deep-tokens-motion-bar deep-tokens-motion-bar--${name}`}
                        style={{
                            width: '40%',
                            height: '100%',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--ds-background-brand-bold)',
                            animation: `deep-tokens-motion-slide var(--motion-duration-${name}) var(--motion-easing-standard) infinite alternate`,
                        }}
                    />
                </div>
                <span style={label}>{`--motion-duration-${name}`}</span>
            </div>
        ))}
        <style>{'@keyframes deep-tokens-motion-slide { from { transform: translateX(0); } to { transform: translateX(150%); } }'}</style>
    </div>
);
