/**
 * The committed sweep list, read the way `check:secrets` reads wrangler.toml.
 *
 * A private channel on `SWEEP_CHANNELS` is read only when it is also on
 * `SLACK_SEARCH_PRIVATE_ALLOWLIST` (ADR-031). #plus-design-feedback is the
 * first private channel swept, so it has to be on both.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { varValueInWrangler } from "./secrets.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const committedToml = () => readFileSync(path.join(here, "..", "wrangler.toml"), "utf8");
const ids = (value) =>
  String(value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

const PLUS_DESIGN_FEEDBACK = "C074QG2V7DJ";

test("#plus-design-feedback is swept, and is on the private allowlist that lets it be read", () => {
  const toml = committedToml();
  assert.ok(ids(varValueInWrangler(toml, "SWEEP_CHANNELS")).includes(PLUS_DESIGN_FEEDBACK));
  assert.ok(ids(varValueInWrangler(toml, "SLACK_SEARCH_PRIVATE_ALLOWLIST")).includes(PLUS_DESIGN_FEEDBACK));
});

test("#uno-bot is not on the sweep list", () => {
  const toml = committedToml();
  assert.ok(!ids(varValueInWrangler(toml, "SWEEP_CHANNELS")).includes(varValueInWrangler(toml, "UNO_BOT_CHANNEL_ID")));
});
