import React from 'react';
import PropTypes from 'prop-types';
import { motionEventsOf, motionRowOf, motionVarOf, soundNameOf } from '../../../scripts/lib/tokens/motion-docs.mjs';
import { DocsTable } from './ds-docs-layout.jsx';

/** An event's sound cell: the token, the moment it plays and its condition; empty when silent. */
export const SoundCell = ({ sound }) => (sound
    ? <><code>{soundNameOf(sound.token)}</code> on {sound.at}{sound.when ? `: ${sound.when}` : ''}</>
    : null);

SoundCell.propTypes = {
    /** The event's sound cell from `motionEventsOf`, or null. */
    sound: PropTypes.shape({ token: PropTypes.string.isRequired, at: PropTypes.string.isRequired, when: PropTypes.string }),
};

/**
 * The Motion section of a component's Usage, rendered from its row in the
 * motion registry (`scripts/lib/tokens/motion-registry.mjs`). It renders
 * nothing for a component with no row. A template page passes `tier="template"`,
 * since a template and a component can share a name (Panel, Popup). A row with
 * a sound cell gains a Sound column.
 */
const MotionSection = ({ component, tier }) => {
    const row = motionRowOf(component, undefined, tier);
    if (!row) return null;
    const events = motionEventsOf(row);
    const plays = events.some((e) => e.sound);
    return (
        <DocsTable>
            <thead>
                <tr><th>Event</th><th>Transition</th><th>Tokens</th><th>What it does</th>{plays && <th>Sound</th>}</tr>
            </thead>
            <tbody>
                {events.map((e) => (
                    <tr key={e.event}>
                        <td>{e.event}</td>
                        <td>{e.transition}</td>
                        <td>{e.tokens.map((t, i) => <React.Fragment key={t}>{i > 0 && ' · '}<code>{motionVarOf(t)}</code></React.Fragment>)}</td>
                        <td>{e.note}</td>
                        {plays && <td><SoundCell sound={e.sound} /></td>}
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
