import test from 'node:test';
import assert from 'node:assert/strict';

import { MOTION_REGISTRY } from './tokens/motion-registry.mjs';

// The menu family opens and closes with one plain fade: appearance.fast both
// ways, no spatial token (no clip, scale or travel).
const FAMILY = [
  ['Popup', 'template'],
  ['Popup', 'component'],
  ['Select', 'component'],
  ['DropdownMenu', 'component'],
  ['FilterMenu', 'component'],
  ['PopupSelect', 'component'],
  ['TreeSelect', 'component'],
];

for (const [name, tier] of FAMILY) {
  test(`${name} (${tier}) enters and exits on the appearance.fast fade alone`, () => {
    const row = MOTION_REGISTRY.find((r) => r.name === name && r.tier === tier);
    assert.ok(row, `${name} has a ${tier} row`);
    for (const event of ['enter', 'exit']) {
      const e = row.events[event];
      assert.equal(e.transition, 'Open and close an overlay');
      assert.equal(e.appearance, 'appearance.fast', `${event} fades on appearance.fast`);
      assert.equal(e.spatial, undefined, `${event} has no spatial token`);
    }
  });
}
