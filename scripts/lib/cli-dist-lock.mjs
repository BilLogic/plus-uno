// `node --test` runs test files in parallel, and every `npm pack` / `npm publish` of
// packages/cli runs `prepack`, which wipes and rebuilds packages/cli/dist. Two at once
// delete each other's files, so the tests that pack take this lock around the call.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LOCK = path.join(os.tmpdir(), 'plus-uno-cli-dist.lock');
const STALE_MS = 5 * 60_000;

/** Run `fn` while holding the cross-process lock on packages/cli/dist. */
export function withCliDistLock(fn) {
  for (;;) {
    try {
      fs.mkdirSync(LOCK);
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      try {
        if (Date.now() - fs.statSync(LOCK).mtimeMs > STALE_MS) fs.rmdirSync(LOCK);
      } catch { /* released between the checks */ }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmdirSync(LOCK);
  }
}
