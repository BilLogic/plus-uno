import React from 'react';
import PropTypes from 'prop-types';
import { motionEventsOf, motionRowOf, motionVarOf } from '../../../scripts/lib/tokens/motion-docs.mjs';
import { DocsTable } from './ds-docs-layout.jsx';

/**
 * The Motion section of a component's Usage, rendered from its row in the
 * motion registry (`scripts/lib/tokens/motion-registry.mjs`). It renders
 * nothing for a component with no row.
 */
const MotionSection = ({ component }) => {
    const row = motionRowOf(component);
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
};

export default MotionSection;
