import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import './FooterActions.scss';

const isLeadingNode = (node, totalCount) => {
    if (!React.isValidElement(node)) return false;
    const { appearance, role, href } = node.props ?? {};
    if (node.props?.['data-footer-leading']) return true;
    if (appearance === 'link') return true;
    if (role === 'link' || href != null) return true;
    if (appearance === 'danger' && totalCount >= 2) return true;
    return false;
};

const trackListFor = (count, { hasLeading }) => {
    if (hasLeading) {
        if (count === 1) return ['3-4'];
        if (count === 2) return ['3', '4'];
        return ['2', '3', '4'];
    }
    if (count === 1) return ['3-4'];
    if (count === 2) return ['1-2', '3-4'];
    if (count === 3) return ['2', '3', '4'];
    return ['1', '2', '3', '4'];
};

/**
 * FooterActions — 4-track footer layout for Modal, Panel and a multi-step task's footer.
 *
 * Divides the footer into 4 equal tracks separated by `--inline-md`. Every
 * filled action button is cloned at `spacing="spacious"` (48) with
 * `shouldFitContainer`. A leading `danger` or link action hugs the left edge
 * without taking a filled track, and containers up to 400 wide split a single
 * action across the full width via `@container (max-width: 400px)`.
 */
export const FooterActions = ({
    leadingAction,
    className,
    style,
    children,
    'data-probe': probe = 'footer',
    ...props
}) => {
    const items = React.Children.toArray(children).filter(React.isValidElement);
    const explicitLeading = leadingAction;
    const implicitLeading =
        !explicitLeading && items.length >= 2 && isLeadingNode(items[0], items.length)
            ? items[0]
            : null;
    const leadingNode = explicitLeading ?? implicitLeading;
    const filledNodes = implicitLeading ? items.slice(1) : items;

    const filledCount = filledNodes.length;
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' && filledCount > 3) {
            console.warn(
                `FooterActions: received ${filledCount} filled action buttons; the 4-track footer layout supports at most 3 filled buttons.`
            );
        }
    }, [filledCount]);

    const hasLeading = Boolean(leadingNode);
    const tracks = trackListFor(filledNodes.length, { hasLeading });
    const leadingSingleTrack = hasLeading && filledNodes.length >= 3;

    return (
        <div
            className={clsx('plus-footer-actions', className)}
            data-probe={probe}
            style={style}
            {...props}
        >
            {React.isValidElement(leadingNode)
                ? React.cloneElement(leadingNode, {
                      spacing: leadingNode.props.spacing ?? 'spacious',
                      shouldFitContainer: false,
                      className: clsx(
                          leadingNode.props.className,
                          'plus-footer-actions__leading',
                          leadingSingleTrack && 'plus-footer-actions__leading--single'
                      ),
                  })
                : leadingNode}
            {filledNodes.map((node, index) => {
                const track = tracks[index];
                return React.cloneElement(node, {
                    spacing: node.props.spacing ?? 'spacious',
                    shouldFitContainer: true,
                    className: clsx(
                        node.props.className,
                        track && `plus-footer-actions__track-${track}`
                    ),
                });
            })}
        </div>
    );
};

FooterActions.propTypes = {
    /** Optional `danger` or link action hugging the left content edge without taking a filled track. */
    leadingAction: PropTypes.node,
    /** Filled action buttons placed across the 4 tracks. */
    children: PropTypes.node,
    /** Extra class names added to the footer grid container. */
    className: PropTypes.string,
    /** Inline style overrides on the footer grid container. */
    style: PropTypes.object,
};

export default FooterActions;
