/**
 * Tests for `check:token-collision` — the cases that decide whether it is worth
 * running at all.
 *
 * A guard nobody has watched fail is a guard nobody knows works (#191), and for
 * this one the harder half is the opposite: a guard that fires on the FIXED file
 * gets switched off within a week. The `Navbar` fix (#219) does not delete the
 * `--color-primary` link colour — the light bar still wants it — it overrides it
 * inside the primary variant. So the exoneration cases below are as load-bearing
 * as the detection case.
 *
 * The SCSS in each fixture is the real shape from
 * `design-system/src/components/_internal/Navbar/Navbar.scss`, reduced.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { blank, collisions, flatten, reachable, specificity, tokenOf } from './check-token-collision.mjs';

/** The 1-based line a fixture's `needle` sits on, so the expectations below are not hand-counted. */
const lineOf = (src, needle) => src.slice(0, src.indexOf(needle)).split('\n').length;

/** #219 as it stood on `main`: one token, background and foreground. */
const DEFECT = `
.plus-navbar {
    &.plus-navbar-bg-primary {
        background-color: var(--color-primary);
    }
}

.plus-navbar .nav-link {
    color: var(--color-primary);
}
`;

/** The fix: the bare rule stays, the variant re-colours it. */
const FIXED = `
.plus-navbar {
    &.plus-navbar-bg-primary {
        background-color: var(--color-primary);

        .nav-link,
        .nav-link:hover {
            color: var(--color-on-primary);
        }
    }
}

.plus-navbar .nav-link {
    color: var(--color-primary);
}

.plus-navbar .nav-link:hover {
    color: var(--color-primary);
}
`;

test('the #219 pair is reported', () => {
  const found = collisions(DEFECT);
  assert.equal(found.length, 1);
  assert.equal(found[0].bg.token, '--color-primary');
  assert.equal(found[0].fg.selector, '.plus-navbar .nav-link');
});

test('a variant override at higher specificity exonerates the pair', () => {
  assert.deepEqual(collisions(FIXED), []);
});

test('an override that does not name `:hover` leaves the hover state exposed', () => {
  // `.plus-navbar.plus-navbar-bg-primary .nav-link` (0,3,0) ties with
  // `.plus-navbar .nav-link:hover` (0,3,0), and the bare hover rule is written
  // afterwards — so on hover the link goes back to primary-on-primary. This is
  // why the real override spells out every state.
  const partial = `
.plus-navbar.plus-navbar-bg-primary {
    background-color: var(--color-primary);
}

.plus-navbar.plus-navbar-bg-primary .nav-link {
    color: var(--color-on-primary);
}

.plus-navbar .nav-link:hover {
    color: var(--color-primary);
}
`;
  const found = collisions(partial);
  assert.equal(found.length, 1);
  assert.equal(found[0].fg.selector, '.plus-navbar .nav-link:hover');
});

test('at equal specificity the later rule wins, here and in the browser', () => {
  const earlier = `
.plus-navbar.plus-navbar-bg-primary {
    background-color: var(--color-primary);
}

.plus-navbar .nav-link {
    color: var(--color-on-primary);
}

.plus-navbar .nav-link {
    color: var(--color-primary);
}
`;
  assert.equal(collisions(earlier).length, 1, 'the earlier override does not save it');

  const later = earlier.split('\n').join('\n'); // same text, order swapped below
  const swapped = later.replace(
    /color: var\(--color-on-primary\);([\s\S]*?)color: var\(--color-primary\);/,
    'color: var(--color-primary);$1color: var(--color-on-primary);',
  );
  assert.deepEqual(collisions(swapped), [], 'the later override does');
});

test('sibling variants never co-apply, so they are not compared', () => {
  const siblings = `
.plus-navbar.plus-navbar-bg-primary {
    background-color: var(--color-primary);
}

.plus-navbar.plus-navbar-bg-light .nav-link {
    color: var(--color-primary);
}
`;
  assert.deepEqual(collisions(siblings), []);
});

test('an element that paints its own background is left to axe', () => {
  // axe measures this one correctly, because the text and the paint are on the
  // same box. Reporting it here would be a second opinion, not a second gate.
  const selfPainted = `
.card {
    background-color: var(--color-surface);
}

.card .badge {
    background-color: var(--color-primary);
    color: var(--color-surface);
}
`;
  assert.deepEqual(collisions(selfPainted), []);
});

test('a foreground outside the painted subtree is not a pair', () => {
  const elsewhere = `
.plus-navbar.plus-navbar-bg-primary {
    background-color: var(--color-primary);
}

.plus-footer .link {
    color: var(--color-primary);
}
`;
  assert.deepEqual(collisions(elsewhere), []);
});

test('only a raw var() is a token — literals and layered values are not', () => {
  assert.equal(tokenOf('var(--color-primary)'), '--color-primary');
  assert.equal(tokenOf('#0472a8'), null);
  assert.equal(tokenOf('linear-gradient(var(--color-primary), #fff)'), null);
});

test('reachability walks the selector chain position by position', () => {
  assert.equal(reachable('.plus-navbar.plus-navbar-bg-primary', '.plus-navbar .nav-link'), true);
  assert.equal(reachable('.plus-navbar.plus-navbar-bg-dark', '.plus-navbar.plus-navbar-bg-primary .nav-link'), false);
  assert.equal(reachable('.a .b', '.a'), false);
});

test('specificity counts classes, pseudo-classes and elements the way the cascade does', () => {
  assert.deepEqual(specificity('.plus-navbar .nav-link'), [0, 2, 0]);
  assert.deepEqual(specificity('.plus-navbar.plus-navbar-bg-primary .nav-link'), [0, 3, 0]);
  assert.deepEqual(specificity('.plus-navbar .nav-link:hover'), [0, 3, 0]);
  assert.deepEqual(specificity('nav.plus-navbar a'), [0, 1, 2]);
});

/*
 * #233. Three ways the hand-rolled front end used to go wrong, each of them
 * silent and green — which is the only kind worth a fixture, because the loud
 * kind announces itself. Every case below was watched to fail on the code as it
 * stood before the fix.
 */

test('a brace inside a string does not swallow the rest of the file', () => {
  // `content: "}"` used to pop a brace that was never pushed. Written at the top
  // level the file gets away with it, because the over-pop empties the stack and
  // the next `{` refills it from the root. Nested — the shape `Navbar` actually
  // has — it does not: the pop eats the enclosing `.plus-navbar` frame, so the
  // rule below resolves to a bare `.nav-link` that no longer sits inside the
  // painted bar, `reachable` says no, and the collision goes unreported. Green,
  // silent, and wrong.
  const quotedBrace = `
.plus-navbar {
    &.plus-navbar-bg-primary {
        background-color: var(--color-primary);
    }

    .nav-link::after {
        content: "}";
    }

    .nav-link {
        color: var(--color-primary);
    }
}
`;
  const found = collisions(quotedBrace);
  assert.equal(found.length, 1, 'the collision under the quoted brace is still found');
  assert.equal(found[0].fg.selector, '.plus-navbar .nav-link');
  assert.equal(found[0].fg.line, lineOf(quotedBrace, '        color: var(--color-primary);'));
});

test('a semicolon inside a string does not split the declaration it sits in', () => {
  // The quieter half of the same defect. A quoted `;` leaves the brace stack
  // alone, so nothing downstream is lost — it garbles the declaration it is in,
  // which used to arrive as `content` with the value `"a` plus two fragments
  // that matched nothing. Harmless on this corpus, and the kind of harmless
  // that stops being harmless the moment a value carries a token.
  const quotedSemicolon = `
.plus-navbar .nav-link::before {
    content: "a;b;c";
}
`;
  const declarations = flatten(quotedSemicolon);
  assert.equal(declarations.length, 1, 'one declaration in, one declaration out');
  assert.equal(declarations[0].prop, 'content');
  assert.equal(declarations[0].value, '""');
});

test('blanking keeps every line, so a reported line is the line in the file', () => {
  // A block comment replaced by the empty string took its newlines with it and
  // shifted every number below it. `check-unspread-rest.mjs` preserved newlines
  // for exactly this reason, in the same week, and this one did not.
  const commented = `
/*
 * The primary bar. Four lines of prose, which is the point:
 * whatever this comment costs in height, the numbers below it
 * must not move.
 */
.plus-navbar.plus-navbar-bg-primary {
    background-color: var(--color-primary);
}

.plus-navbar .nav-link {
    color: var(--color-primary);
}
`;
  assert.equal(
    blank(commented).split('\n').length,
    commented.split('\n').length,
    'blanking is line-for-line with the source',
  );

  const [{ bg, fg }] = collisions(commented);
  assert.equal(bg.line, lineOf(commented, 'background-color: var(--color-primary);'));
  assert.equal(fg.line, lineOf(commented, '    color: var(--color-primary);'));
});

test('an override that only reaches part of the painted subtree exonerates nothing', () => {
  // `.plus-navbar .plus-navbar-search .nav-link` re-colours the links inside the
  // search box and no others, so every other link on the primary bar is still
  // primary-on-primary. Comparing only the first segment of the chain saw
  // `.plus-navbar`, called it a subset of the painted scope, and dismissed a
  // real collision — the wrong direction for a check to be wrong in.
  const partialReach = `
.plus-navbar.plus-navbar-bg-primary {
    background-color: var(--color-primary);
}

.plus-navbar .nav-link {
    color: var(--color-primary);
}

.plus-navbar .plus-navbar-search .nav-link {
    color: var(--color-on-primary);
}
`;
  const found = collisions(partialReach);
  assert.equal(found.length, 1);
  assert.equal(found[0].fg.selector, '.plus-navbar .nav-link');
});

test('an override whose whole chain is guaranteed still exonerates', () => {
  // The other half of the same fix: reading the full chain must not turn into
  // firing on the fixed file. Here every segment of the override's scope is
  // named by the painted element's own chain, so it applies wherever the
  // background is painted — and a check that reported this would be switched
  // off inside a week.
  const nested = `
.plus-navbar.plus-navbar-bg-primary .plus-navbar-inner {
    background-color: var(--color-primary);
}

.plus-navbar .plus-navbar-inner .nav-link {
    color: var(--color-primary);
}

.plus-navbar.plus-navbar-bg-primary .plus-navbar-inner .nav-link {
    color: var(--color-on-primary);
}
`;
  assert.deepEqual(collisions(nested), []);
});

test('an interpolated selector is not a block, and does not eat the rule it names', () => {
  // Live in the corpus, not hypothetical: `Alert`, `Badge`, `Button`, `Dropdown`
  // and `LoadingGif` all interpolate. The `{` of `#{` used to open a block, so
  // the head being read was mangled and the body went unexamined.
  const interpolated = `
$themes: 'primary';

.plus-alert-#{$theme} {
    background-color: var(--color-surface);
    color: var(--color-surface);
}
`;
  const declarations = flatten(interpolated);
  assert.deepEqual(
    declarations.map((d) => d.prop),
    ['background-color', 'color'],
    'both declarations survive the interpolation above them',
  );
  assert.equal(declarations[0].line, lineOf(interpolated, 'background-color:'));
});
