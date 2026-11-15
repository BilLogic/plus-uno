import React from 'react';
import PropTypes from 'prop-types';
import { Logo } from '@/components';

// The brackets follow the Logo's own geometry: the logomark is `size` wide and
// the wordmark starts a quarter-mark gap after it, so they take the size in px.
const LOCKUP_SIZE = 64;

const label = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const tag = {
    alignSelf: 'flex-start',
    font: 'var(--body-small)',
            fontWeight: 600, // docs-literal: no weight token pairs with the body-small style
    color: 'var(--ds-text-inverse)',
    background: 'var(--ds-background-neutral-bold)',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--stack-sm) var(--stack-md)',
};
const ground = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'var(--card-min-width-sm)',
    padding: 'var(--card-pad-spacious)',
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-surface-sunken)',
};

/** A soft placeholder bar standing in for text. */
const Bar = ({ width, height = 'var(--stack-sm)' }) => (
    <span style={{ display: 'block', width, height, borderRadius: 'var(--radius-sm)', background: 'var(--ds-skeleton)' }} />
);
Bar.propTypes = { width: PropTypes.string.isRequired, height: PropTypes.string };

/** One bracket: a rule under its label, spanning the part it names. */
const Bracket = ({ children, style }) => (
    <span
        style={{
            display: 'flex',
            justifyContent: 'center',
            borderBottom: 'var(--border-default) solid var(--ds-border-bold)',
            paddingBottom: 'var(--stack-sm)',
            font: 'var(--body-small)',
            fontWeight: 600, // docs-literal: no weight token pairs with the body-small style
            color: 'var(--ds-text)',
            ...style,
        }}
    >
        {children}
    </span>
);
Bracket.propTypes = { children: PropTypes.node.isRequired, style: PropTypes.object };

const Expression = ({ tagLetter, name, job, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <div style={ground}>{children}</div>
        <span style={tag} aria-hidden="true">{tagLetter}</span>
        <h3 style={{ margin: 0, font: 'var(--heading-medium)', color: 'var(--ds-text)' }}>{name}</h3>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{job}</p>
    </div>
);
Expression.propTypes = {
    tagLetter: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    job: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

const frame = {
    display: 'flex',
    minHeight: 'var(--card-min-width-sm)',
    overflow: 'hidden',
    borderRadius: 'var(--card-radius)',
    border: 'var(--border-default) solid var(--ds-border)',
    background: 'var(--ds-surface)',
};

const Example = ({ title, expression, children }) => (
    <li style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', listStyle: 'none' }}>
        <div style={frame}>{children}</div>
        <span style={label}>
            {title} <strong style={{ color: 'var(--ds-text)' }}>{expression}</strong>
        </span>
    </li>
);
Example.propTypes = { title: PropTypes.string.isRequired, expression: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

const pad = { padding: 'var(--card-pad-compact)', display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', width: '100%' };

/**
 * The Logos page's two expressions: the logomark that marks the app and the
 * lockup that introduces PLUS, with bracket labels and four in-product
 * examples. Every logo is the real Logo component.
 */
export const LogoExpressions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-md), 1fr))', gap: 'var(--grid-gutter)' }}>
            <Expression
                tagLetter="A"
                name="Logomark"
                job="The plus on its tile. Use it where PLUS is already named nearby, or where space is tight. Its job is to mark the app itself: the sidebar header, the browser tab, the loading screen."
            >
                <Logo size={96} />
            </Expression>
            <Expression
                tagLetter="B"
                name="Lockup"
                job="The logomark with the PLUS wordmark beside it. Use it where nothing else on screen names PLUS. Its job is the first hello: sign-in, email headers, partner and funder materials."
            >
                <Logo size={LOCKUP_SIZE} wordmark />
            </Expression>
        </div>

        <figure role="group" aria-label="Parts of the lockup" style={{ ...ground, margin: 0, flexDirection: 'column' }}>
            <div style={{ display: 'inline-grid', gridTemplateColumns: `${LOCKUP_SIZE}px ${LOCKUP_SIZE / 4}px auto`, rowGap: 'var(--stack-md)' }}>
                <Bracket style={{ gridColumn: '1 / -1' }}>Lockup</Bracket>
                <Bracket style={{ gridColumn: 1 }}>Logomark</Bracket>
                <Bracket style={{ gridColumn: 3 }}>Wordmark</Bracket>
                <span style={{ gridColumn: '1 / -1', display: 'flex' }}>
                    <Logo size={LOCKUP_SIZE} wordmark />
                </span>
            </div>
            <figcaption style={label}>The logomark, the wordmark and the lockup they make, each named once.</figcaption>
        </figure>

        <h3 style={{ margin: 0, font: 'var(--heading-medium)', color: 'var(--ds-text)' }}>In the product</h3>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>Where each expression lives. The logomark marks the app; the lockup introduces PLUS.</p>
        <ul aria-label="In the product" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))', gap: 'var(--grid-gutter)' }}>
            <Example title="Sidebar header ·" expression="Logomark">
                <div style={{ ...pad, width: '35%', background: 'var(--ds-surface-sunken)' }}>
                    <Logo size={24} />
                    <Bar width="80%" />
                    <Bar width="80%" />
                    <Bar width="80%" />
                </div>
                <div style={{ ...pad, justifyContent: 'flex-start' }}>
                    <Bar width="90%" />
                    <Bar width="75%" />
                    <Bar width="60%" />
                </div>
            </Example>
            <Example title="Sign-in ·" expression="Lockup">
                <div style={{ ...pad, alignItems: 'center' }}>
                    <Logo size={32} wordmark />
                    <Bar width="70%" height="var(--stack-md)" />
                    <Bar width="70%" height="var(--stack-md)" />
                </div>
            </Example>
            <Example title="Email header ·" expression="Lockup">
                <div style={{ ...pad, width: '100%' }}>
                    <div style={{ padding: 'var(--stack-sm)', background: 'var(--ds-surface-sunken)' }}>
                        <Logo size={24} wordmark />
                    </div>
                    <Bar width="90%" />
                    <Bar width="75%" />
                    <Bar width="60%" />
                </div>
            </Example>
            <Example title="Loading screen ·" expression="Logomark">
                <div style={{ ...pad, alignItems: 'center', justifyContent: 'center' }}>
                    <Logo size={48} />
                    <Bar width="40%" />
                </div>
            </Example>
        </ul>
    </div>
);
