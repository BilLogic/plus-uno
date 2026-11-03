// The automations registry names every scheduled job the Worker can run.
//
// `docs/engineering/operations.md` says an automation absent from its table is
// undocumented, and the Worker answers "what runs when" by reading that table
// through read_reference. A job kind added to `ScheduledJobKind` without a row
// would be a job the bot cannot tell anyone about, so this reads the union
// from source and the registry from the baked reference map — the copy the
// Worker actually serves.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readReference } from "../src/tools/read-reference";

const REGISTRY = "docs/engineering/operations";

function jobKinds(): string[] {
  const src = readFileSync(resolve(process.cwd(), "src", "scheduled", "runs.ts"), "utf8");
  const union = src.match(/export type ScheduledJobKind =([\s\S]*?);/)?.[1];
  assert.ok(union, "ScheduledJobKind is declared in src/scheduled/runs.ts");
  const kinds = [...union!.matchAll(/"([a-z-]+)"/g)].map((m) => m[1] ?? "");
  // The floor is read off the union itself rather than held as a literal: each
  // member is one `|`, so a quoting change that made the capture miss a kind
  // (or double-count one) shows up as a mismatch against a count the regex
  // cannot also get wrong the same way.
  const members = (union!.match(/\|/g) ?? []).length;
  assert.equal(
    kinds.length,
    members,
    `parsed ${kinds.length} quoted kind(s) from ${members} union member(s) in ` +
      "src/scheduled/runs.ts; the quoting style changed and the capture missed one",
  );
  return kinds;
}

test("read_reference serves the automations registry by name", () => {
  const payload = JSON.parse(readReference({ name: REGISTRY })) as { ok: boolean; text?: string };
  assert.equal(payload.ok, true);
  assert.match(payload.text ?? "", /Automations Registry/);
});

test("every scheduled job kind has a row in the registry", () => {
  const { text } = JSON.parse(readReference({ name: REGISTRY })) as { text: string };
  const kinds = jobKinds();
  const missing = kinds.filter((k) => !text.includes(`\`${k}\``));
  assert.deepEqual(missing, [], "add each to docs/engineering/operations.md and rerun `npm run bundle:harness`");
});
