// The subscription CLI's command line and route (#895). The work itself —
// what is listed, created and reported — is tests/figma-subscriptions.test.ts,
// against the in-memory Figma.
import { test } from "node:test";
import assert from "node:assert/strict";

import { ROUTE, endpointFor, parseArgs } from "./figma-subscriptions.mjs";
import { DEFAULT_WORKER_ORIGIN } from "./worker-url.mjs";

test("defaults to the 12: list both events on every team (#896)", () => {
  assert.deepEqual(parseArgs([]), { action: "list", teams: "all", events: ["FILE_COMMENT", "FILE_UPDATE"] });
});

test("reads every flag, in any case", () => {
  assert.deepEqual(parseArgs(["--action", "CREATE", "--teams", "all", "--events", "file_comment, FILE_UPDATE"]), {
    action: "create",
    teams: "all",
    events: ["FILE_COMMENT", "FILE_UPDATE"],
  });
});

test("refuses what it cannot read, so a typo creates nothing", () => {
  assert.throws(() => parseArgs(["--action", "delete"]), /--action is one of list, create, status/);
  assert.throws(() => parseArgs(["--team", "Universal"]), /unknown argument --team/);
  assert.throws(() => parseArgs(["--teams"]), /--teams needs a value/);
  assert.throws(() => parseArgs(["--action", "--teams", "all"]), /--action needs a value/);
  assert.throws(() => parseArgs(["--events", " , "]), /names no event/);
});

test("points at the Worker's route, on UNO_BOT_WORKER_URL when it is set", () => {
  assert.equal(endpointFor({}), `${DEFAULT_WORKER_ORIGIN}${ROUTE}`);
  assert.equal(endpointFor({ UNO_BOT_WORKER_URL: "https://uno-bot.other.workers.dev/" }), "https://uno-bot.other.workers.dev/figma/events");
});
