// The checked-in role map (`src/usage/roles.ts`) is edited by hand, so the
// shape of every entry is held here: a Slack user id, and one of the three
// roles the kickoff record's CHECK constraint accepts.
import { test } from "node:test";
import assert from "node:assert/strict";

import { TEAM_ROLES, aimedAtOf, roleOf } from "../src/usage/roles";

test("every entry is a Slack user id mapped to pm, dev or design", () => {
  for (const [id, role] of Object.entries(TEAM_ROLES)) {
    assert.match(id, /^[UW][A-Z0-9]{6,}$/, id);
    assert.ok(["pm", "dev", "design"].includes(role), `${id}: ${role}`);
  }
});

test("someone off the map, or nobody at all, has no role", () => {
  assert.equal(roleOf("U0NOBODY", {}), null);
  assert.equal(roleOf(null), null);
  // Inherited keys are not people.
  assert.equal(roleOf("toString", {}), null);
});

test("the person an ask is aimed at is the first one it names other than the asker", () => {
  assert.equal(aimedAtOf("<@U1> <@U2|bo> file it", "U1"), "U2");
  assert.equal(aimedAtOf("<@U1> only me", "U1"), null);
  assert.equal(aimedAtOf("<#C123|general> is a channel, not a person", "U1"), null);
});
