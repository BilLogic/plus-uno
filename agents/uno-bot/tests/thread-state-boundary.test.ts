// The state layer sits below the Slack layer: it defines the shapes it stores,
// and `src/slack/` imports them from here, never the reverse. Held as a scan of
// the layer's own imports so a new edge back up fails here, not in review.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");

function stateLayerFiles(): string[] {
  const dir = join(SRC, "thread-state");
  return [
    join(SRC, "thread-state.ts"),
    ...readdirSync(dir)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => join(dir, f)),
  ];
}

test("nothing in the thread-state layer imports from src/slack/", () => {
  const offenders: string[] = [];
  for (const file of stateLayerFiles()) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const spec = m[1] ?? "";
      if (/(^|\/)slack(\/|$)/.test(spec) && spec.startsWith(".")) offenders.push(`${file}: ${spec}`);
    }
  }
  assert.deepEqual(offenders, []);
});
