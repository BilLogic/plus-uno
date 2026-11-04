// The react-bootstrap-import ratchet, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASELINE, REPO_ROOT, measure, run } from './check-react-bootstrap-imports.mjs';

const src = (file, text) => ({ path: file, text });
const A = 'design-system/src/components/labels/A/A.jsx';

/** A scratch repo root holding a baseline record of `counts`. */
function scratch(counts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-imports-'));
  fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
  fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ why: 'fixture', counts }, null, 2));
  return root;
}

test('a bare react-bootstrap import is counted', () => {
  const code = "import { Container, Row, Col } from 'react-bootstrap';\n";
  assert.equal(measure([src(A, code)]).get(A).count, 1);
});

test('a react-bootstrap subpath import is counted', () => {
  const code = "import RBButton from 'react-bootstrap/Button';\n";
  assert.equal(measure([src(A, code)]).get(A).count, 1);
  assert.equal(measure([src(A, code)]).get(A).line, 1);
});

test('two imports in the same file both count', () => {
  const code = "import { Form } from 'react-bootstrap';\nimport RBModal from 'react-bootstrap/Modal';\n";
  assert.equal(measure([src(A, code)]).get(A).count, 2);
});

test('an unrelated import, or a react-bootstrap mention outside an import, is not counted', () => {
  const code = "import { Button } from '@/components';\n// uses react-bootstrap under the hood\n";
  assert.equal(measure([src(A, code)]).size, 0);
});

test('a file the baseline does not hold fails: new code starts at zero', () => {
  const findings = run({ repoRoot: scratch({}), sources: [src(A, "import { Form } from 'react-bootstrap';\n")] });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, A);
  assert.equal(findings[0].line, 1);
  assert.match(findings[0].message, /baseline does not hold/);
});

test('a count that rises fails, and one that falls passes', () => {
  const root = scratch({ [A]: 2 });
  const two = "import { Form } from 'react-bootstrap';\nimport RBModal from 'react-bootstrap/Modal';\n";
  assert.deepEqual(run({ repoRoot: root, sources: [src(A, two)] }), []);
  assert.deepEqual(
    run({ repoRoot: root, sources: [src(A, "import { Form } from 'react-bootstrap';\n")] }),
    [],
    'lowering a count passes',
  );
  const rose = run({ repoRoot: root, sources: [src(A, `${two}import RBAlert from 'react-bootstrap/Alert';\n`)] });
  assert.equal(rose.length, 1);
  assert.match(rose[0].message, /rose: 3 x against a baseline of 2/);
});

test('a file that reaches zero is stale until the baseline is regenerated', () => {
  const findings = run({ repoRoot: scratch({ [A]: 1 }), sources: [src(A, "import React from 'react';\n")] });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /--update/);
});

test('a missing baseline fails loudly rather than passing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-imports-'));
  const findings = run({ repoRoot: root, sources: [] });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /no baseline is recorded/);
});

test('the labels group holds no react-bootstrap import, and the live tree holds its own baseline', () => {
  assert.deepEqual(run(), []);
  const record = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, BASELINE), 'utf8')).counts;
  assert.deepEqual(Object.keys(record).filter((k) => k.includes('/components/labels/')), []);
});

test('the component library holds no react-bootstrap import: the record has no entry under components', () => {
  const record = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, BASELINE), 'utf8')).counts;
  assert.deepEqual(Object.keys(record).filter((k) => k.startsWith('design-system/src/components/')), []);
});
