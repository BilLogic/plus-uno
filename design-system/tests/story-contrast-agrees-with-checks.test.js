// @vitest-environment node
/**
 * The number a designer reads in Storybook is the number the build fails on
 * (#507).
 *
 * THE DEFECT THIS PINS. Five stories — `FocusRing`, `IntentRoles`,
 * `AiIdentity`, `ColourCandidates` and `BadgeVariants` — each carried their own
 * copy of WCAG relative luminance, and `check:focus-ring`,
 * `check:text-contrast` and `check:button-contrast` carried a sixth in
 * `scripts/button-contrast.mjs`. Six copies of one formula agree until one of
 * them is edited, and nothing in the repository would have said so: a story
 * displaying 5.02:1 beside a gate failing at 4.98:1 is two numbers about the
 * same pair of colours, and no test compared them.
 *
 * #507 deleted the story copies and pointed everything at
 * `design-system/src/lib/tokens.mjs`. This is the test that would notice if they
 * ever drifted apart again — it runs the SAME token pair through both paths and
 * asserts one number.
 *
 * THE PAIR is the focus ring: `--color-primary` on `--color-surface`.
 * `scripts/focus-ring.mjs` documents it as the 5.02:1 that most of the design
 * system's focus declarations already use, and `FocusRing.stories.jsx` renders
 * the same swatch. It is the one pair a check and a story both actually show.
 *
 * THE TWO PATHS are not the same code, which is the point:
 *
 *   the check   `ratio(token, ground, values)` from `scripts/focus-ring.mjs` —
 *               token names resolved through the stylesheet, composited, scored.
 *   the story   token values read as text, normalised to `#rrggbb` the way
 *               `readToken` does, then scored through the story's own adapter.
 *
 * The hex round-trip in the middle of the story path is deliberate: it is what
 * `readToken` does to a `getComputedStyle` value, and a test that skipped it
 * would not notice a reader that lost a channel on the way.
 *
 * NODE, NOT JSDOM. `scripts/focus-ring.mjs` resolves the repository root from
 * `import.meta.url`, which is an `http://` URL under this package's jsdom
 * default and which `fileURLToPath` refuses. The docblock above switches this
 * one file.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, it, expect } from 'vitest';

import { ratio } from '../../scripts/focus-ring.mjs';
import { contrast, parseColour, readTokens, resolveToken, toHex } from '../src/lib/tokens.mjs';

/** The two files `colours()` in the check reads, in the order it reads them. */
const TOKEN_FILES = ['src/tokens/_colors.scss', 'src/tokens/_color_roles.scss'];

const RING = '--color-primary';
const PAGE = '--color-surface';

/** `readToken` in `FocusRing.stories.jsx`, for an opaque token: hex, or null. */
const storyReadToken = (value) => {
  const colour = parseColour(value);
  return colour ? toHex(colour) : null;
};

/** The story's adapter: everything in the story speaks `#rrggbb`. */
const storyContrast = (a, b) => contrast(parseColour(a), parseColour(b));

describe('a story and a check agree about one pair of colours', () => {
  const source = TOKEN_FILES.map((file) => readFileSync(resolve(file), 'utf8')).join('\n');
  const values = readTokens(source, { prefix: '--color-' });

  it('finds both tokens in the stylesheet', () => {
    // Without this the assertion below can pass on two nulls, which is the way
    // a test like this stops measuring anything.
    expect(resolveToken(RING, values)).toBeTruthy();
    expect(resolveToken(PAGE, values)).toBeTruthy();
  });

  it('scores the focus ring on the page identically', () => {
    const fromCheck = ratio(RING, PAGE, values);
    const fromStory = storyContrast(
      storyReadToken(resolveToken(RING, values)),
      storyReadToken(resolveToken(PAGE, values)),
    );

    expect(fromCheck).not.toBeNull();
    expect(fromStory).toBe(fromCheck);
    // And it is a ring that can be seen — the 3:1 of WCAG 1.4.11. Asserted so
    // that a drift which moved BOTH numbers together still has to move them to
    // somewhere defensible.
    expect(fromStory).toBeGreaterThanOrEqual(3);
  });
});
