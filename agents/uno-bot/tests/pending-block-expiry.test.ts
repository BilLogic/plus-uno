// What the model is told about a card waiting in its thread: when it expires
// (#1315). Every card lives 24 weekday hours, so the pending-proposal block
// says that, and never the hour every turn's card used to get.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemBlocks } from "../src/agent/skills";
import type { Env } from "../src/types";

const PENDING = {
  operations: [{ toolName: "notion_create", input: { title: "Reflection redesign" } }],
  toolName: "notion_create",
  input: { title: "Reflection redesign" },
  requesterUserId: "U0ADE",
};

test("the pending-card instructions state the card's real expiry: 24 weekday hours, weekends not counted", async () => {
  const blocks = await buildSystemBlocks({} as Env, PENDING, { userId: "U0ADE" });
  const pending = blocks.map((b) => b.text).find((t) => t.startsWith("<pending_proposal>"));
  assert.ok(pending);
  assert.match(pending, /expires 24 weekday hours after it was staged — Saturday and Sunday do not count/);
  assert.doesNotMatch(pending, /60 minutes/);
});
