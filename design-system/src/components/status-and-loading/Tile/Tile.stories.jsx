import React from 'react';
import { expect, within } from 'storybook/test';

import Tile, { TILE_SIZES, TILE_COLORS } from './Tile';

/**
 * `Tile` — a square that frames an icon, a logo or an image.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is something a person could observe or a
 * computed style really is: the rendered width, height and radius, the color
 * the ground and the glyph resolve to, the role and the name. Never a class.
 *
 * Tiles are found by `data-testid`, because a decorative tile is hidden from
 * the accessibility tree on purpose and so has no role to find it by.
 *
 * Colors are compared against the token, not against a hex: a probe element
 * paints the token and the test reads back what the browser resolved, so a
 * palette change moves both sides together and only a wrong mapping fails.
 */

export default {
    title: 'Components/Status and loading/Tile',
    component: Tile,
    parameters: {
        docs: {
            description: {
                component:
                    'A square that frames an icon, a logo or an image, from 16 to 48. '
                    + 'Its corners are a quarter of its size.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' };

/** The inner size each tile size insets its icon or logo to. */
const INNER = { 16: 10, 20: 12, 24: 14, 32: 16, 40: 20, 48: 24 };

/** A landscape picture, 3:2, so a stretched image would show as a wrong aspect. */
const LANDSCAPE = 'data:image/svg+xml;utf8,'
    + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">'
        + '<rect width="300" height="200" fill="#6b8f71"/><circle cx="150" cy="100" r="60" fill="#f2c14e"/></svg>',
    );

/** What the browser resolves a color token to, read back through a probe. */
const tokenColor = (canvasElement, token) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    canvasElement.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
};

const px = (value) => parseFloat(value);

const box = (el) => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
};

/* ------------------------------------------------------------------ sizes */

export const Sizes = () => (
    <div style={row}>
        {TILE_SIZES.map((size) => (
            <Tile key={size} size={size} icon="book-open" data-testid={`tile-${size}`} />
        ))}
    </div>
);

/**
 * Every size is square, rounds its corners at a quarter of its size, and scales
 * its icon to the inner size — so a 16 tile holds a 10 icon and a 48 holds a 24.
 */
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of TILE_SIZES) {
        const tile = canvas.getByTestId(`tile-${size}`);
        await expect(box(tile), `size ${size} is square`).toEqual({ width: size, height: size });

        const style = getComputedStyle(tile);
        await expect(px(style.borderTopLeftRadius), `size ${size} radius`).toBe(size / 4);
        await expect(px(style.borderBottomRightRadius)).toBe(size / 4);

        const glyph = tile.querySelector('i');
        await expect(px(getComputedStyle(glyph).fontSize), `size ${size} icon`).toBe(INNER[size]);
    }
};

/** Without a size, a tile is 32. */
export const DefaultSize = () => <Tile icon="book-open" data-testid="tile" />;

DefaultSize.play = async ({ canvasElement }) => {
    const tile = within(canvasElement).getByTestId('tile');
    await expect(box(tile)).toEqual({ width: 32, height: 32 });
    await expect(px(getComputedStyle(tile).borderTopLeftRadius)).toBe(8);
};

/* ------------------------------------------------------------------ icons */

const HUE = {
    blue: 'technology-tools',
    green: 'advocacy',
    purple: 'mastering-content',
    magenta: 'relationship',
    yellow: 'social-emotional',
    teal: 'tertiary',
};

const ICON_COLORS = TILE_COLORS.filter((c) => c !== 'white');

export const IconSubtle = () => (
    <div style={row}>
        {ICON_COLORS.map((color) => (
            <Tile key={color} color={color} icon="book-open" data-testid={`tile-${color}`} />
        ))}
    </div>
);

/**
 * Subtle is the color's Container with its on-container glyph. Grey has no
 * container of its own, so it takes surface-container-high and on-surface-variant.
 */
IconSubtle.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const color of ICON_COLORS) {
        const tile = canvas.getByTestId(`tile-${color}`);
        const [ground, ink] = color === 'grey'
            ? ['--color-surface-container-high', '--color-on-surface-variant']
            : [`--color-${HUE[color]}-container`, `--color-on-${HUE[color]}-container`];
        await expect(getComputedStyle(tile).backgroundColor, `${color} ground`).toBe(tokenColor(canvasElement, ground));
        await expect(getComputedStyle(tile.querySelector('i')).color, `${color} glyph`).toBe(tokenColor(canvasElement, ink));
    }
};

export const IconBold = () => (
    <div style={row}>
        {ICON_COLORS.map((color) => (
            <Tile key={color} appearance="bold" color={color} icon="book-open" data-testid={`tile-${color}`} />
        ))}
    </div>
);

/**
 * Bold is the solid color with its on-color glyph. Grey bold is the inverse
 * surface, so a bold grey tile reads as dark rather than as a darker grey.
 */
IconBold.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const color of ICON_COLORS) {
        const tile = canvas.getByTestId(`tile-${color}`);
        const [ground, ink] = color === 'grey'
            ? ['--color-inverse-surface', '--color-inverse-on-surface']
            : [`--color-${HUE[color]}`, `--color-on-${HUE[color]}`];
        await expect(getComputedStyle(tile).backgroundColor, `${color} ground`).toBe(tokenColor(canvasElement, ground));
        await expect(getComputedStyle(tile.querySelector('i')).color, `${color} glyph`).toBe(tokenColor(canvasElement, ink));
    }
};

/* ------------------------------------------------------------------ logos */

const Logo = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="#1f6feb" />
        <path d="M6 12h12M12 6v12" stroke="#ffffff" strokeWidth="3" />
    </svg>
);

export const Logos = () => (
    <div style={{ display: 'grid', gap: '12px' }}>
        <div style={row}>
            {TILE_SIZES.map((size) => (
                <Tile key={size} content="logo" size={size} data-testid={`logo-${size}`}>
                    <Logo />
                </Tile>
            ))}
        </div>
        <div style={row}>
            {TILE_COLORS.map((color) => (
                <Tile key={color} content="logo" color={color} data-testid={`logo-${color}`}>
                    <Logo />
                </Tile>
            ))}
        </div>
    </div>
);

/**
 * A logo sits inset at the inner size and keeps its own colors. Its ground is
 * white by default, grey or a color's Container when the logo needs contrast.
 */
Logos.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const size of TILE_SIZES) {
        const tile = canvas.getByTestId(`logo-${size}`);
        await expect(box(tile), `logo ${size} is square`).toEqual({ width: size, height: size });
        await expect(px(getComputedStyle(tile).borderTopLeftRadius)).toBe(size / 4);
        await expect(box(tile.querySelector('svg')), `logo ${size} inset`).toEqual({ width: INNER[size], height: INNER[size] });
    }

    const grounds = {
        white: '--color-surface',
        grey: '--color-surface-container',
        ...Object.fromEntries(Object.entries(HUE).map(([c, h]) => [c, `--color-${h}-container`])),
    };
    for (const color of TILE_COLORS) {
        const tile = canvas.getByTestId(`logo-${color}`);
        await expect(getComputedStyle(tile).backgroundColor, `${color} logo ground`).toBe(tokenColor(canvasElement, grounds[color]));
    }
};

/** A logo tile with no color chosen sits on white. */
export const LogoDefaultsToWhite = () => (
    <Tile content="logo" data-testid="tile"><Logo /></Tile>
);

LogoDefaultsToWhite.play = async ({ canvasElement }) => {
    const tile = within(canvasElement).getByTestId('tile');
    await expect(getComputedStyle(tile).backgroundColor).toBe(tokenColor(canvasElement, '--color-surface'));
};

/* ----------------------------------------------------------------- images */

export const Images = () => (
    <div style={row}>
        {TILE_SIZES.map((size) => (
            <Tile key={size} content="image" size={size} src={LANDSCAPE} data-testid={`image-${size}`} />
        ))}
    </div>
);

/**
 * An image fills the whole tile and crops to it. `object-fit: cover` is what
 * keeps a landscape picture from being squashed into the square.
 */
Images.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of TILE_SIZES) {
        const tile = canvas.getByTestId(`image-${size}`);
        const img = tile.querySelector('img');
        await expect(box(tile), `image ${size} is square`).toEqual({ width: size, height: size });
        await expect(box(img), `image ${size} fills`).toEqual({ width: size, height: size });
        await expect(getComputedStyle(img).objectFit, 'crops, never stretches').toBe('cover');
        await expect(px(getComputedStyle(tile).borderTopLeftRadius)).toBe(size / 4);
        await expect(getComputedStyle(tile).overflow).toBe('hidden');
    }
};

/* ----------------------------------------------------------------- border */

export const WithBorder = () => (
    <div style={row}>
        <Tile hasBorder icon="book-open" data-testid="icon" />
        <Tile hasBorder content="logo" data-testid="logo"><Logo /></Tile>
        <Tile hasBorder content="image" src={LANDSCAPE} data-testid="image" />
    </div>
);

/**
 * `hasBorder` draws a 1px outline-variant edge inside the tile, so the tile
 * stays exactly its size — and on an image it sits above the picture.
 */
WithBorder.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const outline = tokenColor(canvasElement, '--color-outline-variant');
    for (const id of ['icon', 'logo', 'image']) {
        const tile = canvas.getByTestId(id);
        await expect(box(tile), `${id} keeps its size`).toEqual({ width: 32, height: 32 });
        const edge = getComputedStyle(tile, '::after');
        await expect(edge.borderTopWidth, `${id} border width`).toBe('1px');
        await expect(edge.borderTopColor, `${id} border color`).toBe(outline);
    }
};

/* --------------------------------------------------------- accessibility */

export const Decorative = () => (
    <div style={row}>
        <Tile icon="book-open" data-testid="icon" />
        <Tile content="logo" data-testid="logo"><Logo /></Tile>
        <Tile content="image" src={LANDSCAPE} data-testid="image" />
    </div>
);

/**
 * A tile is decorative by default: it sits beside a name that already says what
 * it is, so announcing it would say the same thing twice.
 */
Decorative.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('img')).toHaveLength(0);
    for (const id of ['icon', 'logo', 'image']) {
        await expect(canvas.getByTestId(id)).toHaveAttribute('aria-hidden', 'true');
    }
};

export const Labelled = () => (
    <div style={row}>
        <Tile icon="book-open" label="Lesson" />
        <Tile content="logo" label="Figma"><Logo /></Tile>
        <Tile content="image" src={LANDSCAPE} label="Lincoln Elementary" />
    </div>
);

/**
 * `label` makes a tile one image with a name — one announcement for the whole
 * square, not one for the square and another for the picture inside it.
 */
Labelled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('img')).toHaveLength(3);
    await expect(canvas.getByRole('img', { name: 'Lesson' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'Figma' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'Lincoln Elementary' })).toBeInTheDocument();
};

/* -------------------------------------------------------------- playground */

export const Interactive = (args) => <Tile {...args} />;
Interactive.args = {
    content: 'icon',
    icon: 'book-open',
    size: 32,
    appearance: 'subtle',
    color: 'blue',
    hasBorder: false,
};
Interactive.argTypes = {
    size: { control: 'select', options: TILE_SIZES },
};
