import React from 'react';
import { motionLibraryOf, motionVarOf } from '../../../scripts/lib/tokens/motion-docs.mjs';
import { DocsTable } from './ds-docs-layout.jsx';
import { SoundCell } from './motion-section.jsx';

/**
 * The Motion · Library index: every row of the motion registry
 * (`scripts/lib/tokens/motion-registry.mjs`) in one table, one line per event,
 * with the sound it plays, so motion can be compared across components in one pass. Rendered from the
 * registry; there is no hand-written copy.
 */
const MotionLibrary = () => (
    <DocsTable>
        <thead>
            <tr><th>Name</th><th>Tier</th><th>Event</th><th>Transition</th><th>Tokens</th><th>Sound</th></tr>
        </thead>
        <tbody>
            {motionLibraryOf().flatMap((r) =>
                r.events.map((e, i) => (
                    <tr key={`${r.name}-${e.event}`}>
                        <td>{i === 0 ? r.name : ''}</td>
                        <td>{i === 0 ? r.tier : ''}</td>
                        <td>{e.event}</td>
                        <td>{e.transition}</td>
                        <td>{e.tokens.map((t, j) => <React.Fragment key={t}>{j > 0 && ' · '}<code>{motionVarOf(t)}</code></React.Fragment>)}</td>
                        <td><SoundCell sound={e.sound} /></td>
                    </tr>
                )),
            )}
        </tbody>
    </DocsTable>
);

export default MotionLibrary;
