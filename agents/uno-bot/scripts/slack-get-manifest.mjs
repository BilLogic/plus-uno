// Slack CLI `get-manifest` hook (.slack/hooks.json).
//
// Emits slack-app-manifest.yaml as JSON on stdout so the Slack CLI can diff the
// repo's manifest against what is actually configured on the app:
//
//   npm run slack:diff
//
// The repo YAML is the documented intent. It is NOT pushable: uno-bot has
// oauth_config.pkce_enabled, and apps.manifest.validate then rejects every
// payload — including Slack's own export — with cannot_disable_once_enabled.
// So .slack/config.json pins manifest.source to "remote", which makes
// `slack manifest sync` refuse outright rather than fail confusingly at the API.
// Manifest edits are UI-only for this app. See
// docs/adr/024-slack-app-configuration-is-a-one-way-door.md.
//
// A clean diff means repo == app settings. It does NOT mean the installed
// token carries those scopes — a grant is a third state no manifest tool can
// see. For that, hit GET /debug/slack-search.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load } from "js-yaml";

const here = dirname(fileURLToPath(import.meta.url));
const manifest = join(here, "..", "slack-app-manifest.yaml");

process.stdout.write(JSON.stringify(load(readFileSync(manifest, "utf8"))));
