import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import './FooterActions.scss';

/**
 * Computes the 4 equal tracks and their spans inside a rendered FooterActions
 * container, accounting for CSS zoom or transform scale.
 */
export const footerTracks = (footerEl) => {
    const box = footerEl.getBoundingClientRect();
    const style = getComputedStyle(footerEl);
    const scale = footerEl.offsetWidth > 0 ? box.width / footerEl.offsetWidth : 1;
    const gap = (parseFloat(style.columnGap) || 0) * scale;
    const trackWidth = (box.width - 3 * gap) / 4;
    const track = (n) => {
        const left = box.left + (n - 1) * (trackWidth + gap);
        return { left, right: left + trackWidth, width: trackWidth };
    };
    const span = (start, end = start) => {
        const first = track(start);
        const last = track(end);
        return { left: first.left, right: last.right, width: last.right - first.left };
    };
    return { box, gap, trackWidth, track, span };
};

const isGhostButton = (node) =>
    React.isValidElement(node) &&
    (node.props?.appearance === 'subtle' || node.props?.['data-footer-leading'] !== undefined);

const trackListFor = (count, { hasLeading, narrow }) => {
    if (hasLeading) {
        if (count === 1) return ['3-4'];
        return ['3', '4'];
    }
    if (count === 1) return [narrow ? '1-4' : '3-4'];
    if (count === 2) return ['1-2', '3-4'];
    return ['2', '3', '4'];
};

/**
 * FooterActions — 4-track footer layout for Modal, Panel and Focused view.
 *
 * Rules (r5):
 * 1. 4 equal tracks with an inline gap (`--inline-md`), inside the container padding.
 *    Every button in a track is spacious (48) and uses `shouldFitContainer`.
 * 2. 1 button: right half (tracks 3–4), or full width (`1-4`) when `narrow`.
 * 3. 2 buttons: 50/50 split across the full width (tracks 1–2 and 3–4).
 * 4. 3 buttons: a quarter each in tracks 2, 3 and 4; only the rightmost is primary.
 * 5. Text (ghost) button (`appearance="subtle"` or `elemBefore` prop): hugs the left
 *    content edge and takes no track; the filled buttons take tracks 3 and 4.
 * 6. Destructive dialogs: safer alternative secondary left, danger primary right, 50/50.
 * 7. No Cancel in footers (the × dismisses).
 * 8. Steps footer: Back and Next split 50/50.
 */
export const FooterActions = ({
    elemBefore,
    narrow = false,
    className,
    style,
    children,
    'data-probe': probe = 'footer',
    ...props
}) => {
    const items = React.Children.toArray(children).filter(React.isValidElement);
    const implicitLeading = !elemBefore && items.length >= 2 && isGhostButton(items[0]) ? items[0] : null;
    const leadingNode = elemBefore ?? implicitLeading;
    const filledNodes = implicitLeading ? items.slice(1) : items;
    const tracks = trackListFor(filledNodes.length, { hasLeading: Boolean(leadingNode), narrow });

    return (
        <div
            className={clsx('plus-footer-actions', narrow && 'plus-footer-actions--narrow', className)}
            data-probe={probe}
            style={style}
            {...props}
        >
            {React.isValidElement(leadingNode)
                ? React.cloneElement(leadingNode, {
                      spacing: leadingNode.props.spacing ?? 'spacious',
                      shouldFitContainer: false,
                      'data-footer-track': 'leading',
                      className: clsx(leadingNode.props.className, 'plus-footer-actions__leading'),
                  })
                : leadingNode}
            {filledNodes.slice(0, 3).map((node, index) => {
                const track = tracks[index] ?? '4';
                return React.cloneElement(node, {
                    spacing: node.props.spacing ?? 'spacious',
                    shouldFitContainer: true,
                    'data-footer-track': track,
                    className: clsx(node.props.className, `plus-footer-actions__track-${track}`),
                });
            })}
        </div>
    );
};

FooterActions.propTypes = {
    /** Optional text/ghost button hugging the left content edge (rule 5). */
    elemBefore: PropTypes.node,
    /** Single action in a narrow container (4 columns or fewer) fills all 4 tracks. */
    narrow: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    'data-probe': PropTypes.string,
    /** Filled action buttons placed across the 4 tracks. */
    children: PropTypes.node,
};

export default FooterActions;
