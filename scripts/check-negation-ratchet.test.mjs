/**
 * Tests for what `check:negation` says when it CANNOT run.
 *
 * The check reads its file list from `bundle-harness.mjs --check`. When the
 * committed bundle is stale that child exits non-zero, and until #204 the
 * failure escaped as a raw `execFileSync` throw: a Node stack trace, the
 * bundler's own diagnostic discarded by `stdio: ignore`, and the composite gate
 * reporting `✗ check:negation` — a prohibition-count problem that does not
 * exist. Same shape `generate-agent.js` fixed in #191.
 *
 * What is asserted here is the message a contributor actually reads. #191's
 * lesson is that a guard nobody has watched fail is a guard nobody knows works;
 * the corollary for THIS fix is that a guard which fails unreadably has not
 * really reported anything.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { bundlerFailureReport } from './check-negation-ratchet.mjs';

/** The bundler's real `--check` failure, verbatim in shape (2026-08-26). */
const realStderr =
  '[bundle-harness] 2 generated artifact(s) STALE — a bundled harness doc changed but the generated file was not regenerated:\n' +
  '  /repo/agents/uno-bot/src/generated/harness.ts\n' +
  '    committed: 170,000 chars · regenerated: 170,037 chars\n' +
  '  -> npm run bundle:harness';

test('a stale bundle is reported as a stale bundle, not as a prohibition rise', () => {
  const msg = bundlerFailureReport({ status: 1, stderr: realStderr });

  assert.match(msg, /stale/i, 'must name staleness as the cause');
  // The whole defect: the reader was pointed at the ratchet, which is fine.
  assert.match(
    msg,
    /nothing is wrong with the prohibition count/i,
    'must say the count itself is not the problem',
  );
});

test('the message points at the command that fixes it', () => {
  const msg = bundlerFailureReport({ status: 1, stderr: realStderr });
  assert.match(msg, /bundle:harness/, 'must name the regeneration script');
});

test("the bundler's own diagnostic reaches the reader", () => {
  const msg = bundlerFailureReport({ status: 1, stderr: realStderr });
  // Relayed whole — the naming of WHICH artifact is behind, and by how much,
  // is the fact the stack trace used to bury.
  for (const line of realStderr.split('\n')) {
    assert.ok(msg.includes(line), `child stderr line missing from the report: ${line}`);
  }
});

test('no Node stack trace is quoted back at the reader', () => {
  const msg = bundlerFailureReport({ status: 1, stderr: realStderr });
  assert.doesNotMatch(msg, /node:internal/, 'the Node internals frame must not appear');
  assert.doesNotMatch(msg, /Command failed:/, "execFileSync's own wrapper message must not appear");
});

test('a child that says nothing still produces an actionable report', () => {
  // A guard that goes quiet when the child does is the same defect one level
  // down, so the silent case gets its own line rather than an empty gap.
  const msg = bundlerFailureReport({ status: 2, stderr: '' });
  assert.match(msg, /exited 2/, 'must state the exit code when there is nothing else to show');
  assert.match(msg, /bundle:harness/);
});

test('a signalled child reports the signal rather than a bare exit code', () => {
  const msg = bundlerFailureReport({ status: null, signal: 'SIGKILL', stderr: '' });
  assert.match(msg, /SIGKILL/);
});
