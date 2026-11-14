import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import IconButton from '@/components/forms-and-inputs/IconButton';
import VisuallyHidden from '@/components/text-and-data-display/VisuallyHidden';
import './NotificationItem.scss';

/**
 * `NotificationItem` — one row for an update that arrived over time, shared by
 * the Inbox, a Home card and a full notifications page.
 *
 * The whole row is a single link (`href`). When `unread` is true, the row shows
 * the selected fill and an unread dot paired with the visually hidden word
 * "Unread" so assistive technology announces it. When `onMarkRead` is also
 * passed, a compact "Mark as read" `IconButton` sits as a sibling of the link
 * over the trailing slot and appears on hover and keyboard focus.
 *
 * Anatomy (`__start`, `__body` [`__label`, `__description`], `__end`) matches
 * `FileItem` and `SettingRow` so all three can lift onto a shared row base.
 */
const NotificationItem = ({
    actor,
    title,
    meta,
    unread = false,
    href = '#',
    onMarkRead,
    onClick,
    onPointerEnter,
    onPointerLeave,
    id,
    className,
    style,
    testId,
    'data-hovered': dataHovered,
    ...rest
}) => {
    const [hovered, setHovered] = useState(false);
    const actionable = Boolean(unread && onMarkRead);
    const resolvedHovered = dataHovered !== undefined ? dataHovered : (hovered ? '' : undefined);

    return (
        <div
            id={id}
            data-testid={testId}
            data-hovered={resolvedHovered}
            onPointerEnter={(event) => {
                setHovered(true);
                onPointerEnter?.(event);
            }}
            onPointerLeave={(event) => {
                setHovered(false);
                onPointerLeave?.(event);
            }}
            className={clsx(
                'plus-notification-item',
                unread && 'plus-notification-item--unread',
                actionable && 'plus-notification-item--actionable',
                className
            )}
            style={style}
            {...rest}
        >
            <a
                href={href}
                className={clsx(
                    'plus-notification-item__link',
                    unread && 'plus-notification-item__link--unread'
                )}
                onClick={onClick}
            >
                {actor != null && (
                    <span className="plus-notification-item__start" aria-hidden="true">
                        {actor}
                    </span>
                )}
                <span className="plus-notification-item__body">
                    <span className="plus-notification-item__label">{title}</span>
                    {meta != null && (
                        <>
                            {' '}
                            <span className="plus-notification-item__description">{meta}</span>
                        </>
                    )}
                </span>
                <span className="plus-notification-item__end">
                    {unread && (
                        <>
                            <span className="plus-notification-item__dot" aria-hidden="true" />
                            {' '}
                            <VisuallyHidden>Unread</VisuallyHidden>
                        </>
                    )}
                </span>
            </a>

            {actionable && (
                <div className="plus-notification-item__actions">
                    <IconButton
                        icon="check"
                        label="Mark as read"
                        tooltip="Mark as read"
                        appearance="subtle"
                        spacing="compact"
                        onClick={onMarkRead}
                    />
                </div>
            )}
        </div>
    );
};

NotificationItem.displayName = 'NotificationItem';

NotificationItem.propTypes = {
    /** Leading actor visual: an `Avatar` for a person or a `Tile` for the system. Hidden from the link's accessible name because `title` names who acted. */
    actor: PropTypes.node,
    /** Who did what, such as `"Ana Ruiz moved Thursday's session"`. */
    title: PropTypes.node.isRequired,
    /** Context and relative time on one line, such as `"Sessions · 2m"`. */
    meta: PropTypes.node,
    /** Marks the row unread with the selected fill, an unread dot and an announced `"Unread"` state. */
    unread: PropTypes.bool,
    /** Destination URL for the notification row. */
    href: PropTypes.string,
    /** Called when the user activates the `"Mark as read"` button on an unread item. */
    onMarkRead: PropTypes.func,
    /** Click handler forwarded to the row link. */
    onClick: PropTypes.func,
    /** Pointer-enter handler on the row container. */
    onPointerEnter: PropTypes.func,
    /** Pointer-leave handler on the row container. */
    onPointerLeave: PropTypes.func,
    /** Optional `id` on the row container. */
    id: PropTypes.string,
    /** Extra class names on the row container. */
    className: PropTypes.string,
    /** Inline style on the row container. */
    style: PropTypes.object,
    /** Maps to `data-testid` on the row container. */
    testId: PropTypes.string,
};

export default NotificationItem;
