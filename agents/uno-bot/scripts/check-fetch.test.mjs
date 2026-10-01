// The fetch guard's Figma door (#892), proven on fixture trees: a call that
// names Figma's API outside the Figma client fails, however it is sent and
// however the host is spelled, while the client itself and prose that names
// the host pass.
//
// Fixtures rather than the real tree: `check:fetch` runs at deploy (it is not
// a `check:harness` member), and this file proves the rule, not today's src/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { run, summary } from "./check-fetch.mjs";

const CLIENT = { "figma/rest.ts": 'const FIGMA_API = "https://api.figma.com";\n' };

/** What the guard says about a repo whose `agents/uno-bot/src` holds `files`. */
function offences(files) {
  const root = mkdtempSync(path.join(tmpdir(), "check-fetch-"));
  try {
    for (const [rel, text] of Object.entries(files)) {
      const file = path.join(root, "agents", "uno-bot", "src", rel);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    }
    return run({ repoRoot: root }).map((f) => f.message);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("a Figma call outside the client fails, even through countedFetch", () => {
  const found = offences({
    ...CLIENT,
    "jobs/poll.ts": "const res = await countedFetch(`https://api.figma.com/v1/files/${key}/versions`, init);\n",
  });
  assert.equal(found.length, 1);
  assert.match(found[0], /^src\/jobs\/poll\.ts:1: /);
  assert.match(found[0], /-> only src\/figma\/rest\.ts talks to Figma \(#892\)/);
});

test("the client itself, and prose that names the host, pass", () => {
  assert.deepEqual(
    offences({
      ...CLIENT,
      "integrations/notes.ts": "// Figma is reached at api.figma.com, through src/figma/.\n/**\n * api.figma.com, again\n */\nexport {};\n",
    }),
    [],
  );
});

test("the host is Figma's however it is spelled", () => {
  assert.equal(offences({ ...CLIENT, "probe.ts": 'const me = "https://API.Figma.com/v1/me";\n' }).length, 1);
});

test("only the client's own path is the client", () => {
  assert.equal(offences({ ...CLIENT, "other/figma/rest.ts": 'const FIGMA_API = "https://api.figma.com";\n' }).length, 1);
});

test("the green line says what was proved", () => {
  assert.equal(summary(), "every outbound call is counted, and only the Figma client calls Figma");
});
