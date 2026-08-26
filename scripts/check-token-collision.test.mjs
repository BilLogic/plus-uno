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

import { collisions, reachable, specificity, tokenOf } from './check-token-collision.mjs';

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
