import React from 'react';
import PropTypes from 'prop-types';
import { LinkIconButton } from '@/components';
import './DocsFab.scss';

/** The Notion catalog of prototypes; the in-app /market route is retired. */
export const MARKETPLACE_HREF =
    'https://app.notion.com/p/plus-tutors/397b7cca49828002826cc45e2baa8e4f?v=397b7cca4982803893a8000c8fdd359c';
export const BLUEPRINT_HREF = '/blueprint/';
/** Served from `public/` on the site and from a Storybook static dir locally (see .storybook/main.js). */
export const BLUEPRINT_LOGO_SRC = '/uno-bot/logos/uno-blueprint.png';

/**
 * The floating stack in the Storybook docs' bottom-right corner, top to bottom:
 * AI agent, Prototype Marketplace, Uno Blueprint.
 *
 * `aiAgent` is the slot for the AI agent button. It renders nothing until a
 * later ticket passes one; give it a circle `IconButton` with a `tooltip` so it
 * matches the two below.
 */
export const DocsFab = ({ aiAgent = null }) => (
    <nav className="plus-docs-fab" aria-label="Prototype links">
        {aiAgent}
        <LinkIconButton
            shape="circle"
            icon="store"
            label="Prototype Marketplace"
            tooltip="Prototype Marketplace"
            href={MARKETPLACE_HREF}
            target="_blank"
        />
        <LinkIconButton
            shape="circle"
            icon={<img className="plus-docs-fab__logo" src={BLUEPRINT_LOGO_SRC} alt="" />}
            label="Uno Blueprint"
            tooltip="Uno Blueprint"
            href={BLUEPRINT_HREF}
        />
    </nav>
);

DocsFab.propTypes = {
    /** The AI agent button, rendered above Marketplace. Nothing when omitted. */
    aiAgent: PropTypes.node,
};

export default DocsFab;
