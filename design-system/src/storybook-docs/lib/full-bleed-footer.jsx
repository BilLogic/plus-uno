import React from 'react';

import { BAR_TOKEN } from './focused-task.jsx';

/**
 * A full-bleed footer, composed from Buttons because the Modal and the Panel
 * have no footer prop for it yet (Planned): `--space-300` high, its cells
 * filling edge to edge with their inner corners squared. `bleed` names the
 * host's pad token, which the footer cancels on the sides and the bottom, and
 * the footer clips its own bottom corners to `radius`, so it never draws past
 * the host's edge. Shared by the Form and Modal template pages.
 */

/** A full-bleed cell fills its slot edge to edge and the footer's whole height, so it has no corners of its own. */
export const CELL = { borderRadius: 0, blockSize: '100%' };

/**
 * @param {object} props
 * @param {string} [props.columns]  the grid's column tracks, one per cell; two equal halves by default
 * @param {string} [props.bleed]    the host's pad token to cancel on the sides and bottom
 * @param {string} [props.radius]   the host's radius token for the bottom corners
 */
export const FooterCells = ({ columns = '1fr 1fr', bleed, radius = '--modal-radius', children }) => (
    <div
        data-probe="footer"
        style={{
            display: 'grid',
            gridTemplateColumns: columns,
            blockSize: `var(${BAR_TOKEN})`,
            flex: '1 1 auto',
            overflow: 'hidden',
            ...(bleed && {
                marginInline: `calc(-1 * var(${bleed}))`,
                marginBlockEnd: `calc(-1 * var(${bleed}))`,
                borderEndStartRadius: `var(${radius})`,
                borderEndEndRadius: `var(${radius})`,
            }),
        }}
    >
        {children}
    </div>
);
