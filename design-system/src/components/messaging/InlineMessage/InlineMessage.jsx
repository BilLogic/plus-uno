import React from 'react';
import PropTypes from 'prop-types';
import Popover from '../../overlays-and-layering/Popover/Popover';
import { IconButton } from '../../forms-and-inputs/IconButton/IconButton';
import './InlineMessage.scss';

/**
 * The appearances this library has a role token for. ADS also offers
 * `connectivity` and `confirmation`; we fold those into `info` and `success`
 * until those roles exist as their own tokens.
 */
export const INLINE_MESSAGE_APPEARANCES = ['info', 'warning', 'danger', 'success'];

/** Each appearance's glyph (Font Awesome solid name) and icon role token. */
const INLINE_MESSAGE_ICONS = {
    info: { glyph: 'circle-info', token: '--ds-icon-information' },
    warning: { glyph: 'triangle-exclamation', token: '--ds-icon-warning' },
    danger: { glyph: 'circle-exclamation', token: '--ds-icon-danger' },
    success: { glyph: 'circle-check', token: '--ds-icon-success' },
};

/**
 * InlineMessage: a compact icon trigger that opens a Popup carrying the full
 * message. Built on Popover so placement, dismissal and focus return are
 * shared with every other popup in the system.
 */
export const InlineMessage = ({
    appearance = 'info',
    label,
    title,
    secondaryText,
    placement = 'bottom-start',
    children,
    className = '',
    id,
}) => {
    const { glyph, token } = INLINE_MESSAGE_ICONS[appearance];

    return (
        <Popover
            trigger={(
                <IconButton
                    icon={<i className={`fa-solid fa-${glyph}`} style={{ color: `var(${token})` }} aria-hidden="true" />}
                    label={label}
                    appearance="subtle"
                    spacing="compact"
                    className="plus-inline-message-trigger"
                />
            )}
            placement={placement}
            width="sm"
            id={id}
            className={`plus-inline-message ${className}`}
        >
            <div className="plus-inline-message-content">
                {(title || secondaryText) && (
                    <div className="plus-inline-message-heading">
                        {title && <strong className="plus-inline-message-title">{title}</strong>}
                        {secondaryText && <span className="plus-inline-message-secondary">{secondaryText}</span>}
                    </div>
                )}
                {children}
            </div>
        </Popover>
    );
};

InlineMessage.propTypes = {
    /** The trigger's icon and tint. */
    appearance: PropTypes.oneOf(INLINE_MESSAGE_APPEARANCES),
    /** The trigger icon's accessible name and tooltip. Required: it is the only visible part before the popup opens. */
    label: PropTypes.string.isRequired,
    /** Bolded first line of the popup. */
    title: PropTypes.node,
    /** A second line, when the title alone does not say enough. */
    secondaryText: PropTypes.node,
    /** Where the popup opens relative to the trigger. */
    placement: PropTypes.oneOf(['auto', 'top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end', 'right-start', 'right-end', 'left-start', 'left-end']),
    /** The popup's body content. */
    children: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default InlineMessage;
