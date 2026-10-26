import React from 'react';
import { expect, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Illustration, {
    ILLUSTRATION_CHARACTERS,
    ILLUSTRATION_SIZES,
    SMART_CHARACTERS,
    MATH_CHARACTERS,
} from './Illustration';

/**
 * `Illustration` — the PLUS illustration characters.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser, and assert what a person could observe or what a computed
 * style really is: the rendered box, the color the body and the line work
 * resolve to in every color mode, the role and the name. Never a class.
 *
 * Characters are found by `data-testid`, because a decorative character is
 * hidden from the accessibility tree on purpose and so has no role.
 *
 * Colors are compared against the token, read back through a probe, so a
 * palette change moves both sides together and only a wrong mapping fails.
 */

export default {
    title: 'Components/Images and icons/Illustrations',
    component: Illustration,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'One of the twelve PLUS illustration characters: five SMART areas and seven math characters. '
                    + 'Decorative by default, and colored by tokens in every mode.',
            },
        },
    },
};

/** The body token each character should paint, as the Figma Docs map it. */
const BODY_TOKEN = {
    'mastering-content': '--ds-background-smart-mastering-content-subtle',
    advocacy: '--ds-background-smart-advocacy-subtle',
    technology: '--ds-background-smart-technology-tools-subtle',
    relationships: '--ds-background-smart-relationship-subtle',
    'social-emotional': '--ds-background-smart-social-emotional-subtle',
    dot: '--ds-background-accent-red-subtle',
    'approximately-equal': '--ds-background-accent-blue-subtle',
    root: '--ds-background-accent-green-subtle',
    all: '--ds-background-accent-purple-subtle',
    pi: '--ds-background-accent-red-subtle',
    equal: '--ds-background-accent-blue-subtle',
    divider: '--ds-background-accent-green-subtle',
};

const LINE_TOKEN = '--ds-icon-subtle';

const LABEL = {
    'mastering-content': 'Mastering content',
    advocacy: 'Advocacy',
    technology: 'Technology',
    relationships: 'Relationships',
    'social-emotional': 'Social emotional',
    dot: 'Dot',
    'approximately-equal': 'Approximately equal',
    root: 'Root',
    all: 'All',
    pi: 'Pi',
    equal: 'Equal',
    divider: 'Divider',
};

/** A hex color literal anywhere in markup. */
const HEX = /#[0-9a-f]{3,8}\b/i;

const box = (el) => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
};

/** Asserts one character rendered whole: its box, its body mask and its line work. */
const expectRendered = async (el, character, size) => {
    await expect(el, `${character} renders`).toBeInTheDocument();
    await expect(box(el), `${character} is a ${size} square`).toEqual({ width: size, height: size });

    const body = el.querySelector('.plus-illustration__body');
    const mask = getComputedStyle(body).maskImage || getComputedStyle(body).webkitMaskImage;
    await expect(mask, `${character} body is masked by its texture`).toMatch(/^url\(.+\.png/);
    await expect(box(body), `${character} body fills the frame`).toEqual({ width: size, height: size });

    const lines = el.querySelector('svg');
    await expect(lines.querySelectorAll('path').length, `${character} has line work`).toBeGreaterThan(0);
    await expect(lines.outerHTML, `${character} line work has no hex literal`).not.toMatch(HEX);
};

/** Asserts that every character's body and line work resolve to their tokens, in every mode. */
const expectTokenColors = (canvasElement, characters) => inEveryColorModeOf(canvasElement, async (mode, token) => {
    const canvas = within(canvasElement);
    for (const character of characters) {
        const el = canvas.getByTestId(character);
        const body = el.querySelector('.plus-illustration__body');
        await expect(getComputedStyle(body).backgroundColor, `${character} body, ${mode}`)
            .toBe(token(BODY_TOKEN[character]));
        for (const path of el.querySelectorAll('svg path')) {
            await expect(getComputedStyle(path).fill, `${character} line work, ${mode}`).toBe(token(LINE_TOKEN));
        }
    }
});

/* ---------------------------------------------------------------- gallery */

const gallery = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 160px)',
    columnGap: '120px',
    rowGap: '96px',
    padding: '48px 64px 96px',
    justifyContent: 'center',
};

export const Gallery = () => (
    <div style={gallery}>
        {ILLUSTRATION_CHARACTERS.map((character) => (
            <Illustration key={character} character={character} size={160} data-testid={character} />
        ))}
    </div>
);

/**
 * All twelve characters render whole, each body in its token color and its
 * line work in the line token, in Light and Dark at both contrasts, with no hex
 * literal in the markup. Decorative by default, so nothing is announced.
 */
Gallery.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const character of ILLUSTRATION_CHARACTERS) {
        await expectRendered(canvas.getByTestId(character), character, 160);
    }
    await expectTokenColors(canvasElement, ILLUSTRATION_CHARACTERS);
    await expect(canvas.queryAllByRole('img')).toHaveLength(0);
};

/* ----------------------------------------------------------------- groups */

const row = { display: 'flex', flexWrap: 'wrap', gap: '96px', padding: '32px 64px 64px', alignItems: 'center' };

export const SmartCharacters = () => (
    <div style={row}>
        {SMART_CHARACTERS.map((character) => (
            <Illustration key={character} character={character} size={120} data-testid={character} />
        ))}
    </div>
);

/** The five SMART characters take their area's `subtle` step. */
SmartCharacters.play = async ({ canvasElement }) => expectTokenColors(canvasElement, SMART_CHARACTERS);

export const MathCharacters = () => (
    <div style={row}>
        {MATH_CHARACTERS.map((character) => (
            <Illustration key={character} character={character} size={120} data-testid={character} />
        ))}
    </div>
);

/** The seven math characters take an accent hue at the same strength, never a SMART hue. */
MathCharacters.play = async ({ canvasElement }) => expectTokenColors(canvasElement, MATH_CHARACTERS);

/* ------------------------------------------------------------------ sizes */

export const Sizes = () => (
    <div style={{ ...row, alignItems: 'flex-end' }}>
        {ILLUSTRATION_SIZES.map((size) => (
            <Illustration key={size} character="mastering-content" size={size} data-testid={`size-${size}`} />
        ))}
        <Illustration character="mastering-content" size={72} data-testid="size-72" />
    </div>
);

/** Each named size is the frame's width and height; any other number works the same way. */
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of [...ILLUSTRATION_SIZES, 72]) {
        await expectRendered(canvas.getByTestId(`size-${size}`), 'mastering-content', size);
    }
};

/** Without a size, a character is 96. */
export const DefaultSize = () => <Illustration data-testid="default" />;

DefaultSize.play = async ({ canvasElement }) => {
    await expectRendered(within(canvasElement).getByTestId('default'), 'mastering-content', 96);
};

/* --------------------------------------------------------- accessibility */

export const Decorative = () => <Illustration character="pi" data-testid="pi" />;

/** Without a title, a character is hidden from assistive technology. */
Decorative.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('pi')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.queryAllByRole('img')).toHaveLength(0);
};

export const Titled = () => <Illustration character="advocacy" title="Advocacy" />;

/** With a title, the character is one image with that name, and its parts stay hidden. */
Titled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const img = canvas.getByRole('img', { name: 'Advocacy' });
    await expect(img).not.toHaveAttribute('aria-hidden');
    await expect(img.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getAllByRole('img')).toHaveLength(1);
};

/* ---------------------------------------------------------- one per character */

const single = (character) => ({
    name: LABEL[character],
    render: () => (
        <div style={{ padding: '48px 96px 96px' }}>
            <Illustration character={character} size={160} data-testid={character} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expectRendered(within(canvasElement).getByTestId(character), character, 160);
        await expectTokenColors(canvasElement, [character]);
    },
});

export const MasteringContent = single('mastering-content');
export const Advocacy = single('advocacy');
export const Technology = single('technology');
export const Relationships = single('relationships');
export const SocialEmotional = single('social-emotional');
export const Dot = single('dot');
export const ApproximatelyEqual = single('approximately-equal');
export const Root = single('root');
export const All = single('all');
export const Pi = single('pi');
export const Equal = single('equal');
export const Divider = single('divider');

/* -------------------------------------------------------------- playground */

export const Interactive = (args) => (
    <div style={{ padding: '48px 96px 96px' }}>
        <Illustration {...args} />
    </div>
);
Interactive.args = {
    character: 'mastering-content',
    size: 160,
};
Interactive.argTypes = {
    character: { control: 'select', options: ILLUSTRATION_CHARACTERS },
    size: { control: { type: 'number', min: 24, step: 8 } },
    title: { control: 'text' },
};
