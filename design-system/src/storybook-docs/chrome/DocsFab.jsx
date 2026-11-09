import React from 'react';
import PropTypes from 'prop-types';
import { Menu } from '@base-ui/react/menu';
import { IconButton, LinkIconButton } from '@/components';
import './DocsFab.scss';

/** The Notion catalog of prototypes; the in-app /market route is retired. */
export const MARKETPLACE_HREF =
    'https://app.notion.com/p/plus-tutors/397b7cca49828002826cc45e2baa8e4f?v=397b7cca4982803893a8000c8fdd359c';
export const BLUEPRINT_HREF = '/blueprint/';
/**
 * Relative to the preview page, so it resolves under Storybook's own static dir
 * (see .storybook/main.js) both locally (`/uno-bot/…`) and on the site (`/storybook/uno-bot/…`).
 */
export const BLUEPRINT_LOGO_SRC = 'uno-bot/logos/uno-blueprint.png';

/**
 * The floating button in the Storybook docs' bottom-right corner. It
 * discloses, above it and top to bottom: AI agent, Prototype Marketplace,
 * Uno Blueprint.
 *
 * Built on Base UI's Menu rather than Popover: the actions are a short set of
 * links, so the menu's roving focus (arrow keys), Escape-to-close with focus
 * returned to the trigger, and outside-press dismissal come with it.
 *
 * `aiAgent` is the slot for the AI agent button, a menu item like the other
 * two (arrow keys reach it). Nothing renders when it is omitted; give it a
 * circle `IconButton` with a `tooltip` so it matches the two below.
 */
export const DocsFab = ({ aiAgent = null }) => (
    <div className="plus-docs-fab">
        <Menu.Root modal={false}>
            <Menu.Trigger
                render={(
                    <IconButton
                        shape="circle"
                        appearance="primary"
                        className="plus-docs-fab__button plus-docs-fab__trigger"
                        icon="plus"
                        label="Prototype links"
                        isTooltipDisabled
                    />
                )}
            />
            <Menu.Portal>
                <Menu.Positioner side="top" align="center" sideOffset={8} className="plus-docs-fab__positioner">
                    <Menu.Popup className="plus-docs-fab__menu" aria-label="Prototype links">
                        {aiAgent && <Menu.Item closeOnClick render={aiAgent} />}
                        <Menu.Item
                            closeOnClick
                            render={(
                                <LinkIconButton
                                    shape="circle"
                                    className="plus-docs-fab__button"
                                    icon="store"
                                    label="Prototype Marketplace"
                                    tooltip="Prototype Marketplace"
                                    href={MARKETPLACE_HREF}
                                    target="_blank"
                                />
                            )}
                        />
                        <Menu.Item
                            closeOnClick
                            render={(
                                <LinkIconButton
                                    shape="circle"
                                    className="plus-docs-fab__button"
                                    icon={<img className="plus-docs-fab__logo" src={BLUEPRINT_LOGO_SRC} alt="" />}
                                    label="Uno Blueprint"
                                    tooltip="Uno Blueprint"
                                    href={BLUEPRINT_HREF}
                                    target="_top"
                                />
                            )}
                        />
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    </div>
);

DocsFab.propTypes = {
    /** The AI agent button, rendered above Marketplace. Nothing when omitted. */
    aiAgent: PropTypes.node,
};

export default DocsFab;
