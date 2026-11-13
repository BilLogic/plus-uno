import React from 'react';

/**
 * The PLUS framework, the strip that opens Foundations Overview: the problem,
 * the promise, the four pillars and the closer. Copy is locked; each pillar
 * leaves a labeled placeholder where its illustration goes.
 */
export const PROBLEM = 'It takes a village to help a student learn';
export const VILLAGE =
    'A student is tutored by a college student, who is supported by a supervisor, who works alongside a researcher studying every session.';
export const PROMISE = 'PLUS is designed to make tutoring effective, affordable, and scalable';
export const CLOSER = 'Good tools save time. Great systems turn it into learning.';

export const PILLARS = [
    {
        name: 'Productivity',
        axis: 'The work',
        art: 'One laptop, one window, a timer with time to spare',
        promise:
            "Focused, fast, and dependable. We're here to clear the busywork for tutors, supervisors, and researchers, so every minute goes to the student.",
    },
    {
        name: 'Learning',
        axis: 'The outcome',
        art: 'Tutor and student at a whiteboard, the step just reached',
        promise:
            'We believe in designing a system that learns as it works: students master the math, tutors sharpen their craft, supervisors coach with evidence, and researchers share what works with the field. No one should have to rebuild a session from memory.',
    },
    {
        name: 'Uplift',
        axis: 'The feeling',
        art: 'A raised hand, or a high five over a solved problem',
        promise:
            'We design small moments of encouragement into everything we do, so students, tutors, and the people who support them feel seen and keep going. We design for hard work, but it should always feel hopeful, and never heavy.',
    },
    {
        name: 'Simplicity',
        axis: 'The form',
        art: 'Loose papers settling into one card with one arrow',
        promise:
            "Simplicity isn't just about fewer features. It's about one shared record for every role, showing each person what matters to them, and making the next step obvious.",
    },
];

const lede = { margin: 0, font: 'var(--heading-medium)', color: 'var(--ds-text)' };

const Pillar = ({ name, axis, art, promise }) => (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)', margin: 0 }}>
        <div
            role="img"
            aria-label={`${name} illustration placeholder`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--stack-sm)',
                minHeight: 180,
                padding: 'var(--card-pad-spacious)',
                textAlign: 'center',
                background: 'var(--ds-surface-sunken)',
                borderRadius: 'var(--ds-radius-medium)',
                color: 'var(--ds-text-subtle)',
            }}
        >
            <span style={{ font: 'var(--heading-xxsmall)' }}>Illustration placeholder</span>
            <span style={{ font: 'var(--body-small)' }}>{art}</span>
        </div>
        <span style={{ font: 'var(--heading-xxsmall)', color: 'var(--ds-text-subtle)' }}>{axis}</span>
        <h3 style={{ margin: 0, font: 'var(--heading-medium)', color: 'var(--ds-text)' }}>{name}</h3>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{promise}</p>
    </article>
);

export const FrameworkPillars = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-lg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
            <p style={lede}>{PROBLEM}</p>
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)', maxWidth: '64ch' }}>{VILLAGE}</p>
            <p style={lede}>{PROMISE}</p>
        </div>
        <p style={{ margin: 0, font: 'var(--body-large)', color: 'var(--ds-text)' }}>
            Our design strategy prompts productivity, learning, uplift and simplicity.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--section-stack-lg) var(--section-stack-md)' }}>
            {PILLARS.map((p) => (
                <Pillar key={p.name} {...p} />
            ))}
        </div>
        <p style={lede}>{CLOSER}</p>
    </div>
);
