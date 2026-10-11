// `npm test` runs only the tests whose source still exists.
//
// `tsc` writes an output for every source it compiles and removes none, and
// the runner globs `.test-build/tests/*.test.js`. So a test file deleted from
// `tests/` kept running from its old compiled copy until someone cleared the
// directory by hand — which is how ten tests deleted by a merge failed with
// `droppedItems is not a function` against the very revision that removed them.
//
// The check runs the package's real `test` script, read from package.json, in a
// throwaway package that holds one live test and the compiled leftover of a
// deleted one. Reading the script rather than restating it is what lets a later
// edit to package.json fail here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_SCRIPT = JSON.parse(fs.readFileSync(path.join(PKG, "package.json"), "utf8")).scripts.test;

function scratchPackage() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uno-bot-test-script-"));
  // Standalone, so the compile is the one file below and not the Worker.
  fs.writeFileSync(
    path.join(dir, "tsconfig.test.json"),
    JSON.stringify({
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        target: "ES2022",
        types: ["node"],
        typeRoots: [path.join(PKG, "node_modules/@types")],
        rootDir: ".",
        outDir: ".test-build",
      },
      include: ["tests/**/*.ts"],
    }),
  );
  fs.mkdirSync(path.join(dir, "tests"));
  fs.writeFileSync(
    path.join(dir, "tests/live.test.ts"),
    'import { test } from "node:test";\ntest("live", () => {});\n',
  );
  // What a deleted test leaves behind: output with no source.
  fs.mkdirSync(path.join(dir, ".test-build/tests"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, ".test-build/tests/deleted.test.js"),
    'const { test } = require("node:test");\ntest("deleted", () => { throw new Error("stale output ran"); });\n',
  );
  return dir;
}

test("a test whose source was deleted does not run from its old compiled copy", (t) => {
  const dir = scratchPackage();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  // The outer runner marks its children with NODE_TEST_CONTEXT, and a nested
  // `node --test` that inherits it skips its files; drop it so the inner run is
  // the one a developer would see.
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const run = spawnSync(TEST_SCRIPT, {
    cwd: dir,
    shell: true,
    encoding: "utf8",
    env: { ...env, PATH: `${path.join(PKG, "node_modules/.bin")}${path.delimiter}${env.PATH}` },
  });
  const output = `${run.stdout}${run.stderr}`;

  assert.equal(run.status, 0, output);
  assert.match(output, /# pass 1\b/);
  assert.doesNotMatch(output, /stale output ran/);
  assert.equal(fs.existsSync(path.join(dir, ".test-build/tests/deleted.test.js")), false);
});
