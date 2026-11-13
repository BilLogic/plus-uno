import React from 'react';
import PropTypes from 'prop-types';
import { HEROES } from './hero-registry.jsx';
import { HeroFit } from './HeroDrawing.jsx';

/**
 * An overview page's thumbnail grid: three columns, each page's own registry
 * hero as its picture. Small things take one cell; big things span two
 * columns (`span="wide"`) or two rows (`span="tall"`). A picture covers its
 * tile, cropping the hero's frame around its centered stage, so one drawing
 * serves every tile shape and nothing is redrawn. The tile has no outline: its
 * sunken fill against the white page is the edge.
 *
 * Layout lives in `docs-rhythm.css` (`.sb-docs-thumbs`): every picture is at
 * least one cell's 8:5 tall, so the cells of one row line up and a tall tile
 * grows to fill its two rows. The grid packs densely, so tiles stay in page
 * order in the source and a one-cell tile fills the cell a wide one leaves. In
 * a narrow column the grid is one column.
 */
export const ThumbGrid = ({ children }) => <div className="sb-docs-thumbs not-prose">{children}</div>;

ThumbGrid.propTypes = { children: PropTypes.node };

/** The tile sizes: one cell, two columns, two rows. */
export const THUMB_SPANS = ['one', 'wide', 'tall'];

/**
 * One page: its hero, its title as the link, and one line.
 *
 * - `hero`: the page's registry id; also where the title links unless `to` is given.
 * - `span`: `one`, `wide` or `tall`.
 */
export const ThumbTile = ({ hero, title, to = hero, span = 'one', children }) => {
    const entry = HEROES[hero];
    const Hero = entry?.Hero;
    return (
        <figure className={`sb-docs-thumb sb-docs-thumb--${span}`} data-thumb={hero} data-span={span}>
            <div className="sb-docs-thumb__picture" role="img" aria-label={entry?.description}>
                <HeroFit.Provider value="xMidYMid slice">{Hero ? <Hero /> : null}</HeroFit.Provider>
            </div>
            <figcaption className="sb-docs-thumb__caption">
                <a className="sb-docs-thumb__title" href={`?path=/docs/${to}--docs`}>{title}</a>
                {children ? <span className="sb-docs-thumb__text">{children}</span> : null}
            </figcaption>
        </figure>
    );
};

ThumbTile.propTypes = {
    hero: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    to: PropTypes.string,
    span: PropTypes.oneOf(THUMB_SPANS),
    children: PropTypes.node,
};
