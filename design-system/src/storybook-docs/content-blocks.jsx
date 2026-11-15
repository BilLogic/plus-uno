import React from 'react';

import { Icon } from '@/components';

/**
 * Blocks the Content pages share: a line of product copy, a message drawn as its
 * three parts, and a rule's heading row with its voice-word tag. Everything is
 * styled on `--ds-*` and layout tokens.
 */

/** One line of product copy, set as the reader sees it. */
export const Say = ({ children }) => (
    <span style={{ font: 'var(--body-default)', color: 'var(--ds-text)' }}>{children}</span>
);

/** A message drawn as its parts: an icon, a title, a body and an action. */
export const Sample = ({ icon = 'circle-info', title, children, action, secondary }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
        <div style={{ display: 'flex', gap: 'var(--stack-sm)', alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={{ color: 'var(--ds-icon-subtle)', paddingTop: 'var(--stack-sm)' }}>
                <Icon name={icon} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <strong style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{title}</strong>
                {children && <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{children}</span>}
            </div>
        </div>
        {action && (
            <div style={{ display: 'flex', gap: 'var(--stack-md)', font: 'var(--body-default)', color: 'var(--ds-link)' }}>
                <span>{action}</span>
                {secondary && <span>{secondary}</span>}
            </div>
        )}
    </div>
);

/** A rule's heading with the voice word it serves beside it. */
export const RuleHead = ({ children }) => (
    <div style={{ display: 'flex', gap: 'var(--stack-sm)', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
);
