import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Avatar, { initialsOf } from '../../images-and-icons/Avatar';
import DropdownMenu, { ButtonItem, LinkItem, Section } from '../../forms-and-inputs/DropdownMenu';
import Icon from '../../images-and-icons/Icon';
import IconButton from '../../forms-and-inputs/IconButton';
import CountTag from '../../labels/CountTag';

/** The one-word roles the account row shows. */
export const ACCOUNT_ROLES = ['Tutor', 'Lead', 'Admin'];

/** The role in full, for the accessible name and the menu header. */
const ROLE_IN_FULL = { Tutor: 'Tutor', Lead: 'Lead tutor', Admin: 'Admin' };

/**
 * The Sidebar's account row, at its foot under a divider: a 24 avatar with the
 * first and last initials, the preferred first name (14), a middle dot and the
 * one-word role (12, subtlest), then the Inbox bell on the trailing column.
 *
 * - The button hugs avatar, name and role, padded 4 left (plus the avatar
 *   slot's 4) and 8 right, so its hover fill ends 8 after the role. It has no
 *   tooltip; the full name and role are its accessible name and the menu header.
 * - The name truncates with an ellipsis; the role never does.
 * - The row opens a menu with Profile, Help Center (a new tab) and Sign out.
 *   States: rest, hover, focus, and menu open (the selected fill).
 * - The bell opens the Inbox beside the Sidebar. Its unread count rides its
 *   top corner, and the bell takes the selected fill while the Inbox is open.
 */
const SidebarAccount = ({
    name,
    preferredName,
    role,
    onProfile,
    onSignOut,
    helpHref,
    inboxCount = 0,
    isInboxOpen = false,
    onInbox,
    defaultMenuOpen = false,
    className = '',
}) => {
    const [open, setOpen] = useState(defaultMenuOpen);
    const first = preferredName || name.trim().split(/\s+/)[0];
    const full = `${name} · ${ROLE_IN_FULL[role] ?? role}`;

    const trigger = (
        <button
            type="button"
            className="plus-sidebar-account__trigger"
            aria-label={`${name}, ${ROLE_IN_FULL[role] ?? role}: account menu`}
        >
            <Avatar initials={initialsOf(name)} size={24} />
            <span className="plus-sidebar-account__who">
                <span className="plus-sidebar-account__name">{first}</span>
                <span className="plus-sidebar-account__role">· {role}</span>
            </span>
        </button>
    );

    const unread = inboxCount > 0
        ? `${inboxCount} unread ${inboxCount === 1 ? 'notification' : 'notifications'}`
        : 'no unread notifications';
    const bell = (
        <span className="plus-sidebar-account__bell-glyphs" aria-hidden="true">
            <Icon name="bell" />
            {inboxCount > 0 ? <CountTag value={inboxCount} className="plus-sidebar-account__bell-count" /> : null}
        </span>
    );

    return (
        <div className={['plus-sidebar-account', className].filter(Boolean).join(' ')}>
            <span className="plus-sidebar-account__hit">
                <DropdownMenu
                    trigger={trigger}
                    isOpen={open}
                    onOpenChange={setOpen}
                    placement="top-start"
                    spacing="compact"
                >
                    <Section title={full}>
                        <ButtonItem elemBefore={<Icon name="user" />} onClick={onProfile}>
                            Profile
                        </ButtonItem>
                        {helpHref ? (
                            <LinkItem
                                href={helpHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                elemBefore={<Icon name="circle-question" />}
                                elemAfter={<Icon name="arrow-up-right-from-square" />}
                            >
                                Help Center
                            </LinkItem>
                        ) : null}
                        <ButtonItem elemBefore={<Icon name="arrow-right-from-bracket" />} onClick={onSignOut}>
                            Sign out
                        </ButtonItem>
                    </Section>
                </DropdownMenu>
            </span>
            {onInbox ? (
                <IconButton
                    className="plus-sidebar-account__bell"
                    appearance="subtle"
                    icon={bell}
                    label={`Inbox, ${unread}`}
                    tooltip="Inbox"
                    isSelected={isInboxOpen}
                    onClick={onInbox}
                />
            ) : null}
        </div>
    );
};

SidebarAccount.propTypes = {
    /** Full name: the initials, the accessible name and the menu header */
    name: PropTypes.string.isRequired,
    /** The name the row shows; the first name when unset */
    preferredName: PropTypes.string,
    /** One word: Tutor, Lead or Admin */
    role: PropTypes.oneOf(ACCOUNT_ROLES).isRequired,
    /** The menu's Profile */
    onProfile: PropTypes.func,
    /** The menu's Sign out */
    onSignOut: PropTypes.func,
    /** Help Center's address: a row in the account menu, opened in a new tab */
    helpHref: PropTypes.string,
    /** Unread notifications, drawn on the bell; zero draws no count */
    inboxCount: PropTypes.number,
    /** The Inbox is open: the bell takes the selected fill */
    isInboxOpen: PropTypes.bool,
    /** The bell's press; the bell is drawn only when this is set */
    onInbox: PropTypes.func,
    /** Start with the menu open (stories) */
    defaultMenuOpen: PropTypes.bool,
    className: PropTypes.string,
};

export default SidebarAccount;
