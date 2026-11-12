import React from 'react';
import PropTypes from 'prop-types';
import { motionEventsOf, motionRowOf, motionVarOf } from '../../../scripts/lib/tokens/motion-docs.mjs';
import { DocsTable } from './ds-docs-layout.jsx';

/**
 * The Motion section of a component's Usage, rendered from its row in the
 * motion registry (`scripts/lib/tokens/motion-registry.mjs`). It renders
 * nothing for a component with no row. A template page passes `tier="template"`,
 * since a template and a component can share a name (Panel, Popup).
 */
const MotionSection = ({ component, tier }) => {
    const row = motionRowOf(component, undefined, tier);
    if (!row) return null;
    return (
        <DocsTable>
            <thead>
                <tr><th>Event</th><th>Transition</th><th>Tokens</th><th>What it does</th></tr>
            </thead>
            <tbody>
                {motionEventsOf(row).map((e) => (
                    <tr key={e.event}>
                        <td>{e.event}</td>
                        <td>{e.transition}</td>
                        <td>{e.tokens.map((t, i) => <React.Fragment key={t}>{i > 0 && ' · '}<code>{motionVarOf(t)}</code></React.Fragment>)}</td>
                        <td>{e.note}</td>
                    </tr>
                ))}
            </tbody>
        </DocsTable>
    );
};

MotionSection.propTypes = {
    /** The component's name, as its registry row names it. */
    component: PropTypes.string.isRequired,
    /** The row's tier, when a template or pattern shares its name with a component. */
    tier: PropTypes.oneOf(['template', 'pattern', 'component']),
};

export default MotionSection;
