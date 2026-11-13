import React from 'react';

import { BAR_TOKEN } from './focused-task.jsx';

/**
 * A full-bleed footer, composed from Buttons because the Modal and the Panel
 * have no footer prop for it yet (Planned): `--space-300` high, its cells
 * filling edge to edge with their inner corners squared. Every child is a cell:
 * the footer gives it the cell style itself. `bleed` names the
 * host's pad token, which the footer cancels on the sides and the bottom, and
 * the footer clips its own bottom corners to `radius`, so it never draws past
 * the host's edge. Shared by the Form and Modal template pages.
 */

/**
 * A full-bleed cell fills its slot edge to edge and the footer's whole height,
 * so it has no corners and no edge of its own: a Default button's own border
 * would run along the host's bottom and side, a second edge inside the host's
 * rounded corner. The footer draws the one rule above the cells and one between
 * neighbors instead.
 */
export const CELL = { borderRadius: 0, blockSize: '100%', borderWidth: 0 };

/** The rule between two neighboring cells. */
const DIVIDER = { borderInlineStartWidth: 'var(--border-default)', borderInlineStartStyle: 'solid', borderInlineStartColor: 'var(--ds-border)' };

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
            // An inset rule, so the cells keep the footer's whole height.
            boxShadow: `inset 0 var(--border-default) 0 var(--ds-border)`,
            ...(bleed && {
                marginInline: `calc(-1 * var(${bleed}))`,
                marginBlockEnd: `calc(-1 * var(${bleed}))`,
                borderEndStartRadius: `var(${radius})`,
                borderEndEndRadius: `var(${radius})`,
            }),
        }}
    >
        {React.Children.map(children, (cell, i) => (React.isValidElement(cell)
            ? React.cloneElement(cell, { style: { ...cell.props.style, ...CELL, ...(i > 0 && DIVIDER) } })
            : cell))}
    </div>
);
