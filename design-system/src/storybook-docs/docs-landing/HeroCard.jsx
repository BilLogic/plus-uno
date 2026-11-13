import React from 'react';
import PropTypes from 'prop-types';
import { HEROES } from './hero-registry.jsx';

/**
 * A page's hero as the picture on an overview card: the registry's own drawing,
 * cropped to the 300 x 160-unit stage the drawing is composed on, in the same
 * tile (ground, radius, hairline edge) as the landing. Nothing is redrawn, so a
 * change to a hero reaches its card.
 *
 * - `page`: the page's id, as `DocsLanding` takes it.
 *
 * The crop is CSS (`.sb-docs-hero-card` in `docs-rhythm.css`): the full frame is
 * laid out wider than the card and shifted so only the stage shows. A page id
 * with no registry entry renders nothing.
 */
export const HeroCard = ({ page }) => {
    const entry = HEROES[page];
    const Hero = entry?.Hero;
    if (!Hero) return null;
    return (
        <div role="img" aria-label={entry.description} className="sb-docs-hero-card" data-hero-card={page}>
            <div className="sb-docs-hero sb-docs-hero--framed">
                <Hero />
            </div>
        </div>
    );
};

HeroCard.propTypes = { page: PropTypes.string.isRequired };
