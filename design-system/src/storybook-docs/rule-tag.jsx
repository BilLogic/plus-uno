import React from 'react';

import { Tag } from '@/components';

/**
 * How a rule is held: `automatic` when a check fails the build on it, `review`
 * when a person judges it. Placed on the line under a rule's `###` heading; the
 * generated agent file reads the same marker (`scripts/lib/docs-agent-file.mjs`).
 */
export const RULE_KINDS = { automatic: 'Automatic', review: 'Review' };

export function RuleTag({ kind }) {
    const label = RULE_KINDS[kind];
    if (!label) return null;
    return <Tag text={label} color={kind === 'automatic' ? 'green' : 'gray'} />;
}
