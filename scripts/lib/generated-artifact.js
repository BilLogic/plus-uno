/**
 * Write-or-check for generated artifacts.
 *
 * `--check` exists to answer one question: is the committed file stale? A check
 * that regenerates its own target answers that question with the bytes it just
 * wrote, so it can never fail — and it leaves a dirty tree for whatever runs
 * next. Both were live defects (#191).
 *
 * The shape this enforces: rendering is pure and returns a string, and only
 * this module touches the disk. Check mode reads and compares; write mode
 * writes. Neither path can accidentally do the other's job.
 */

import fs from 'fs';
import path from 'path';

/**
 * Compare each artifact against the committed file. Reads only — never writes.
 *
 * @param {{file: string, content: string}[]} artifacts
 * @returns {boolean} true if every artifact matches what is on disk.
 */
export function checkArtifacts(artifacts) {
  let ok = true;
  for (const { file, content } of artifacts) {
    const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (prev === content) continue;
    console.error(`✗ ${file} is ${prev === null ? 'missing' : 'stale'}.`);
    ok = false;
  }
  return ok;
}

/**
 * @param {{file: string, content: string, note?: string}[]} artifacts
 */
export function writeArtifacts(artifacts) {
  for (const { file, content, note } of artifacts) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    console.log(`✓ ${file}${note ? ` ${note}` : ''}`);
  }
}
