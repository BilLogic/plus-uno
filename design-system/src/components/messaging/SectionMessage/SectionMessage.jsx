import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CloseButton from '@/components/forms-and-inputs/CloseButton';
import { headingTag } from '@/lib/headingLevel';
import { messageIcon } from '../messageAppearance';
import Icon from '../../images-and-icons/Icon';
import './SectionMessage.scss';

/** The six styles, as the Figma Section message set names them. */
export const SECTION_MESSAGE_APPEARANCES = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];

/** The default leading icon of each style: the shared glyph for its role. */
export const SECTION_MESSAGE_ICONS = Object.fromEntries(
    SECTION_MESSAGE_APPEARANCES.map((appearance) => [appearance, messageIcon(appearance)]),
);

/**
 * SectionMessage: a message that belongs to the page and stays there until
 * it is resolved or dismissed.
 *
 * @example
 * // Simple message
 * <SectionMessage appearance="warning">Warning message here</SectionMessage>
 *
 * // With title
 * <SectionMessage appearance="info" title="Info">This is an info message.</SectionMessage>
 *
 * // Rich content
 * <SectionMessage appearance="danger">
 *   <strong>Error:</strong> Something went wrong. <a href="/help">Get help</a>
 * </SectionMessage>
 *
 * // Leading icon: each style has a default; a name or a node replaces it, false removes it
 * <SectionMessage appearance="info" leadingVisual="bell">Reminders are on.</SectionMessage>
 * <SectionMessage appearance="warning" leadingVisual={false}>Sign-in didn't complete. Please try again.</SectionMessage>
 *
 * // Actions: link buttons after the body, in the order given
 * <SectionMessage appearance="warning" actions={[{ text: 'Reschedule', onClick: onReschedule }]}>
 *   This term's schedule is provisional.
 * </SectionMessage>
 */
const SectionMessage = ({
    id,
    appearance = 'primary',
    title,
    headingLevel,
    children,
    leadingVisual = true,
    actions,
    dismissible = true,
    onDismiss,
    className = '',
    ...props
}) => {
    const [show, setShow] = useState(true);

    if (!show) return null;

    const handleClose = () => {
        setShow(false);
        if (onDismiss) onDismiss();
    };

    const sectionMessageAppearance = appearance || 'primary';
    const HeadingTag = headingTag(headingLevel ?? 2);

    // The leading icon and the × center on the first line of text: the title
    // line when there is a title, otherwise the first body line. An invisible
    // strut in that line's text style gives each column exactly one line of
    // height; the icon stays a 20px square (the column's width) and the button
    // 24×24 whatever the text size.
    const firstLineClass = title ? 'plus-section-message-strut--title' : 'plus-section-message-strut--text';
    const strut = <span className={`plus-section-message-strut ${firstLineClass}`} aria-hidden="true">{'​'}</span>;

    // `true` (the default) is the style's own icon; a string is a Font Awesome
    // solid name, as Button and Status take it; a node renders as given.
    const visual = leadingVisual === true ? (SECTION_MESSAGE_ICONS[sectionMessageAppearance] ?? SECTION_MESSAGE_ICONS.primary) : leadingVisual;

    return (
        <div
            id={id}
            role="alert"
            className={`plus-section-message ${sectionMessageAppearance} ${className}`}
            {...props}
        >
            {visual !== false && visual != null && (
                <div className="plus-section-message-leading" aria-hidden="true">
                    {strut}
                    {typeof visual === 'string'
                        ? <Icon name={visual} className="plus-section-message-leading-icon" />
                        : <span className="plus-section-message-leading-icon">{visual}</span>}
                </div>
            )}

            <div className="plus-section-message-content">
                {title && <HeadingTag className="plus-section-message-title">{title}</HeadingTag>}
                <div className="plus-section-message-text">{children}</div>
                {actions && actions.length > 0 && (
                    <div className="plus-section-message-actions">
                        {actions.map((action, index) => {
                            const ActionTag = action.href ? 'a' : 'button';
                            return (
                                <React.Fragment key={action.text}>
                                    {index > 0 && <span className="plus-section-message-actions-divider" aria-hidden="true" />}
                                    <ActionTag
                                        type={action.href ? undefined : 'button'}
                                        className="plus-section-message-action"
                                        href={action.href}
                                        target={action.target}
                                        onClick={action.onClick}
                                    >
                                        {action.text}
                                    </ActionTag>
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
            </div>

            {dismissible && (
                <div className="plus-section-message-dismiss">
                    {strut}
                    <CloseButton label="Dismiss message" onClick={handleClose} />
                </div>
            )}
        </div>
    );
};

SectionMessage.propTypes = {
    /** Unique identifier for the section message element */
    id: PropTypes.string,
    /** Visual appearance */
    appearance: PropTypes.oneOf(SECTION_MESSAGE_APPEARANCES),
    /** Optional title/heading for the message */
    title: PropTypes.string,
    /** Heading level the title renders as, 1 through 6. Defaults to `h2`. */
    headingLevel: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
    /** Message content - supports text, JSX, or React components */
    children: PropTypes.node.isRequired,
    /** Leading icon on the first line: `true` for the style's default, a Font Awesome solid name or a node to replace it, `false` to remove it. Always decorative. */
    leadingVisual: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.node]),
    /** Link-button actions after the body, in the order given. Avoid more than two. */
    actions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        target: PropTypes.string,
        onClick: PropTypes.func,
    })),
    /** Whether the message can be dismissed */
    dismissible: PropTypes.bool,
    /** Callback when the message is dismissed */
    onDismiss: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SectionMessage;
