import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@/components/overlays-and-layering/Tooltip';
import { useIsTruncated } from './useIsTruncated';

/**
 * The one way clipped text gets its full text: a Tooltip that is on only while
 * the text is clipped, never the browser `title`.
 *
 * The tooltip goes on whatever takes focus, and the caller places two things
 * from the render prop. `measureRef` goes on the element that ellipsizes.
 * `truncated` says when that element is clipped: a plain element that is not
 * already a control takes `tabIndex={truncated ? 0 : undefined}`, so a keyboard
 * user can reach the tooltip, and only while there is something to read. A row
 * that is already a button or a link carries the tooltip on itself and adds no
 * second tab stop.
 *
 * The Tooltip stays mounted and is switched on by truncation, so the element a
 * person is focused on never remounts when the page resizes.
 *
 * @param {object} props
 * @param {React.ReactNode} props.text - the full text, shown while clipped; an empty string leaves the tooltip off
 * @param {React.ReactNode} [props.textWhenFits] - shown even while the text fits, for a control that has a tooltip of its own, such as a sort action
 * @param {'top'|'bottom'|'left'|'right'} [props.placement]
 * @param {unknown[]} [props.deps] - what changes the text's width besides a resize
 * @param {(state: { measureRef: React.RefObject<Element>, truncated: boolean }) => React.ReactElement} props.children
 * @returns {JSX.Element}
 */
export const ClippedTooltip = ({ text, textWhenFits, placement, deps = [], children }) => {
    const measureRef = useRef(null);
    const truncated = useIsTruncated(measureRef, [text, ...deps]);
    const shown = truncated ? text : textWhenFits;
    return (
        <Tooltip text={shown || ' '} placement={placement} trigger={shown ? ['hover', 'focus'] : []}>
            {children({ measureRef, truncated: Boolean(truncated && text) })}
        </Tooltip>
    );
};

ClippedTooltip.propTypes = {
    text: PropTypes.node,
    textWhenFits: PropTypes.node,
    placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    deps: PropTypes.array,
    children: PropTypes.func.isRequired,
};

export default ClippedTooltip;
