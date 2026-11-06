import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Avatar,
    ButtonItem,
    DropdownMenu,
    IconButton,
    LinkIconButton,
    Section,
    initialsOf,
} from '@/components';

/** The one-word roles the account row shows. */
export const ACCOUNT_ROLES = ['Tutor', 'Lead', 'Admin'];

/** The role in full, for the accessible name and the menu header. */
const ROLE_IN_FULL = { Tutor: 'Tutor', Lead: 'Lead tutor', Admin: 'Admin' };

/**
 * The Sidebar's account row, at its foot under a divider: a 24 avatar with the
 * first and last initials, the preferred first name (14), a middle dot and the
 * one-word role (12, subtlest), then Help Center on the trailing column.
 *
 * - The button hugs avatar, name and role, padded 4 left (plus the avatar
 *   slot's 4) and 8 right, so its hover fill ends 8 after the role. It has no
 *   tooltip; the full name and role are its accessible name and the menu header.
 * - The name truncates with an ellipsis; the role never does.
 * - The row opens a menu with Profile and Sign out. States: rest, hover,
 *   focus, and menu open (the selected fill).
 * - Help Center opens in a new tab: `circle-question` at rest, the external
 *   icon on hover and focus, the selected fill while pressed.
 */
const SidebarAccount = ({
    name,
    preferredName,
    role,
    onProfile,
    onSignOut,
    helpHref,
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

    const help = (
        <span className="plus-sidebar-account__help-glyphs" aria-hidden="true">
            <i className="fa-regular fa-circle-question plus-sidebar-account__help-rest" />
            <i className="fa-solid fa-arrow-up-right-from-square plus-sidebar-account__help-go" />
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
                        <ButtonItem elemBefore={<i className="fa-regular fa-user" aria-hidden="true" />} onClick={onProfile}>
                            Profile
                        </ButtonItem>
                        <ButtonItem elemBefore={<i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />} onClick={onSignOut}>
                            Sign out
                        </ButtonItem>
                    </Section>
                </DropdownMenu>
            </span>
            {helpHref ? (
                <LinkIconButton
                    className="plus-sidebar-account__help"
                    appearance="subtle"
                    icon={help}
                    label="Help Center, opens in a new tab"
                    tooltip="Help Center · opens in a new tab"
                    href={helpHref}
                    target="_blank"
                />
            ) : (
                <IconButton
                    className="plus-sidebar-account__help"
                    appearance="subtle"
                    icon={help}
                    label="Help Center"
                    tooltip="Help Center"
                />
            )}
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
    /** Help Center's address, opened in a new tab */
    helpHref: PropTypes.string,
    /** Start with the menu open (stories) */
    defaultMenuOpen: PropTypes.bool,
    className: PropTypes.string,
};

export default SidebarAccount;
