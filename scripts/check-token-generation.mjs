#!/usr/bin/env node
/**
 * `npm run check:token-generation` — `npm run generate:tokens` cannot silently
 * delete tokens.
 *
 * See `scripts/token-generation.mjs` for what it did before this existed: it
 * printed "Token generation is DISABLED to protect existing tokens" and then
 * wrote all four files anyway, taking `_colors.scss` from 195 tokens to 5 and
 * reporting `✅ All token files generated successfully!`.
 *
 * WHAT THIS ASSERTS, AND WHY IT IS PHRASED THIS WAY. Not "the generator
 * refuses" — that would go red on the day someone fixes the Figma exports, and
 * a gate that fails when the problem is FIXED is a gate that gets deleted. The
 * invariant is the conditional:
 *
 *   the generator exits non-zero if and only if it says a file would shrink,
 *   and a --dry-run leaves every token file byte-for-byte unchanged.
 *
 * That holds in both worlds — today's, where the sources are incomplete, and
 * the one where they are whole — and it is exactly the property that was
 * missing.
 *
 * Run: `npm run check:token-generation`.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const TOKENS = path.join(REPO_ROOT, 'design-system/src/tokens');

const digest = () =>
  Object.fromEntries(
    fs
      .readdirSync(TOKENS)
      .filter((f) => f.endsWith('.scss'))
      .map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(TOKENS, f))).digest('hex')]),
  );

const before = digest();

/*
 * spawnSync, not execFileSync. The refusal is written with `console.error`, and
 * execFileSync returns only stdout when the child exits 0 — so a mutation that
 * printed the refusal and forgot to exit read as a clean pass. That is the exact
 * defect this check exists to catch, and it slipped through the first draft
 * until the mutation test went looking for it.
 */
const run = spawnSync('node', ['scripts/generate-all-tokens.js', '--dry-run'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
});
const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
const status = run.status ?? 1;

const after = digest();
const found = [];

const shrinks = output.includes('Refusing to write');
if (shrinks && status === 0) {
  found.push('the generator said a file would shrink and still exited 0 — the refusal is cosmetic.');
}
if (!shrinks && status !== 0) {
  found.push(`the generator exited ${status} without saying why. A refusal has to name what it saved.`);
}

for (const [file, hash] of Object.entries(before)) {
  if (after[file] !== hash) found.push(`${file} CHANGED during --dry-run. Nothing may be written on that path.`);
}
for (const file of Object.keys(after)) {
  if (!(file in before)) found.push(`${file} was created during --dry-run.`);
}

/*
 * The claim that used to be printed unconditionally beside a validation that had
 * been commented out. Read from the SOURCE rather than from the run: on the
 * refusal path the generator exits long before reaching that line, so watching
 * the output would be watching a branch that is not taken.
 */
const source = fs.readFileSync(path.join(REPO_ROOT, 'scripts/generate-all-tokens.js'), 'utf8');
if (/console\.log\([`'"]✅[^`'"]*Validation passed/.test(source)) {
  found.push(
    'the generator still prints "✅ Validation passed" — validateSemanticTokens is ' +
      'commented out, so that is a claim and not a result.',
  );
}

if (found.length) {
  console.error(`\n[token-generation] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error('✗ check:token-generation\n');
  console.error(
    '  -> `npm run generate:tokens` is documented in skills/uno-maintain as the way\n' +
      '     to regenerate SCSS from source. It has to be safe to run.',
  );
  process.exit(1);
}

console.log(
  `✓ check:token-generation — --dry-run wrote nothing, exit ${status} ` +
    `${shrinks ? 'with a named refusal' : 'and no file would shrink'}`,
);
