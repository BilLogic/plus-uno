/**
 * The exception lists' tests: one conformance case over the live file, then the
 * loader's refusals over scratch files.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ALL } from '../checks.registry.mjs';
import { REPO_ROOT } from './corpus.mjs';
import { reachOf } from './script-reach.mjs';
import { EXCEPTIONS, listsOf, loadExceptions } from './exceptions.mjs';

/** Run `body` over a scratch tree whose exceptions file holds `record` (text, or an object written as JSON). */
function scratch(record, body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'exceptions-'));
  try {
    const absolute = path.join(root, EXCEPTIONS);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    if (record !== null) fs.writeFileSync(absolute, typeof record === 'string' ? record : JSON.stringify(record));
    return body(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const file = (lists, check = 'check:deps') => ({ why: 'x', checks: { [check]: lists } });
const load = (record, list = 'allowed', check = 'check:deps') =>
  scratch(record, (root) => loadExceptions(check, list, { repoRoot: root }));

test('every live list is named for a registered check, and every entry says where and why', () => {
  const names = new Set(ALL.map((row) => row.name));
  const live = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, EXCEPTIONS), 'utf8'));
  assert.equal(`${JSON.stringify(live, null, 2)}\n`, fs.readFileSync(path.join(REPO_ROOT, EXCEPTIONS), 'utf8'));
  assert.ok(Object.keys(live.checks).length >= 9, 'nine checks keep an exception list');
  for (const [check, lists] of Object.entries(live.checks)) {
    assert.ok(names.has(check), `${check} is a registered check`);
    for (const list of Object.keys(lists)) {
      const entries = loadExceptions(check, list);
      assert.ok(entries.length > 0, `${check} ${list} lists something`);
      for (const entry of entries) {
        assert.equal(typeof entry.at, 'string');
        assert.ok(entry.reason.length > 10, `${check} ${list} ${entry.at} names its reason`);
      }
    }
  }
});

test('a list reads back as its entries, in file order', () => {
  const entries = load(file({ allowed: [{ at: 'b', reason: 'because b stays' }, { at: 'a', reason: 'because a stays', token: 't' }] }));
  assert.deepEqual(entries, [
    { at: 'b', reason: 'because b stays' },
    { at: 'a', reason: 'because a stays', token: 't' },
  ]);
});

test('a missing file, an unreadable one, and a list nobody wrote are each an error, never an empty list', () => {
  assert.throws(() => load(null), /no exception file at scripts\/exceptions\.json/);
  assert.throws(() => load('{ not json'), /cannot be read as exception lists: it is not JSON/);
  assert.throws(() => load({ why: 'x' }), /no `checks` object/);
  assert.throws(() => load(file({ allowed: [] }), 'skip'), /holds no list `skip` for check:deps/);
  assert.throws(() => load(file({ allowed: [] }), 'allowed', 'check:nothing'), /holds no lists for check:nothing/);
});

test('an entry without a reason, with a placeholder reason, or without a place is refused', () => {
  assert.throws(() => load(file({ allowed: [{ at: 'a' }] })), /entry 1 \("a"\) names no reason/);
  assert.throws(() => load(file({ allowed: [{ at: 'a', reason: 'TODO' }] })), /names no reason/);
  assert.throws(() => load(file({ allowed: [{ at: 'a', reason: 'UNREVIEWED — later' }] })), /names no reason/);
  assert.throws(() => load(file({ allowed: [{ reason: 'a long enough reason' }] })), /entry 1 has no `at`/);
  assert.throws(() => load(file({ allowed: ['a'] })), /entry 1 is not an object/);
});

test('the same entry twice is refused, so a list cannot quietly hold a duplicate', () => {
  const twice = { at: 'a', reason: 'because a stays' };
  assert.throws(() => load(file({ allowed: [twice, { ...twice, reason: 'again, differently worded' }] })), /lists "a" twice/);
  assert.equal(load(file({ allowed: [twice, { at: 'a', token: 't', reason: 'a different thing at a' }] })).length, 2);
});

test('listsOf names every list a check keeps', () => {
  assert.deepEqual(scratch(file({ allowed: [], skip: [] }), (root) => listsOf('check:deps', { repoRoot: root })), ['allowed', 'skip']);
});

test('every check that keeps a list reads it through the loader, and holds none of its own', () => {
  const live = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, EXCEPTIONS), 'utf8'));
  for (const check of Object.keys(live.checks)) {
    const row = ALL.find((r) => r.name === check);
    const entry = row.module ?? /(scripts\/[\w.-]+\.(?:mjs|js))/.exec(row.script)?.[1];
    const reach = reachOf(entry);
    assert.ok(
      reach.files.some((f) => f.endsWith('scripts/lib/exceptions.mjs')),
      `${check} (${entry}) reaches scripts/lib/exceptions.mjs`,
    );
  }
});
