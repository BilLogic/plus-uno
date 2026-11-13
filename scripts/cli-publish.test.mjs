// The publish seam for @plus-uno/cli: the version is the release tag, an
// already-published version skips cleanly, and the workflow publishes by OIDC only.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { REPO_ROOT } from './lib/corpus.mjs';
import { distTag, registryHas, versionFromTag } from './lib/cli-release.mjs';
import { PACKAGE_NAME } from '../packages/cli/src/constants.mjs';

const WORKFLOW = fs.readFileSync(path.join(REPO_ROOT, '.github/workflows/publish-cli.yml'), 'utf8');
const stripComments = (s) => s.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
const live = stripComments(WORKFLOW);

test('the version is the release tag, with or without the v', () => {
  assert.equal(versionFromTag('v1.4.0'), '1.4.0');
  assert.equal(versionFromTag('1.4.0'), '1.4.0');
  assert.equal(versionFromTag('v2.0.0-rc.1'), '2.0.0-rc.1');
  for (const bad of ['', undefined, 'latest', 'v1.4', 'release-2026-11-13']) assert.throws(() => versionFromTag(bad), /not a semver version/);
});

test('a prerelease never takes the latest dist-tag', () => {
  assert.equal(distTag('1.4.0'), 'latest');
  assert.equal(distTag('2.0.0-rc.1'), 'rc');
});

test('a version the registry already holds is a skip', () => {
  assert.equal(registryHas(() => '1.4.0\n', PACKAGE_NAME, '1.4.0'), true);
  assert.equal(registryHas(() => '', PACKAGE_NAME, '1.4.0'), false);
});

test('publish-cli.mjs rejects a tag that is not a version and leaves package.json alone', () => {
  const before = fs.readFileSync(path.join(REPO_ROOT, 'packages/cli/package.json'), 'utf8');
  const run = spawnSync('node', ['scripts/publish-cli.mjs', 'nightly'], { cwd: REPO_ROOT, encoding: 'utf8' });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /not a semver version/);
  assert.equal(fs.readFileSync(path.join(REPO_ROOT, 'packages/cli/package.json'), 'utf8'), before);
});

test('the workflow publishes over OIDC with provenance, public, and no token secret', () => {
  assert.match(live, /id-token:\s*write/);
  assert.match(live, /npm publish[^\n]*--provenance[^\n]*--access public/);
  assert.doesNotMatch(live, /NPM_TOKEN|NODE_AUTH_TOKEN|secrets\.NPM/, 'trusted publishing needs no token secret');
  assert.match(live, /scripts\/publish-cli\.mjs/, 'the version and the skip come from the tested script');
  assert.match(live, /steps\.prepare\.outputs\.publish == 'true'/, 'an existing version skips the publish step');
});

test('the publish job runs only on a release, never on the pull request dry run', () => {
  const dry = live.match(/dry-run:[\s\S]*?(?=\n  publish:)/)?.[0] ?? '';
  const publish = live.match(/\n  publish:[\s\S]*$/)?.[0] ?? '';
  assert.match(dry, /npm publish --dry-run/);
  assert.doesNotMatch(dry, /id-token:\s*write/, 'the PR job has no publish rights');
  assert.match(publish, /if:[^\n]*github\.event_name != 'pull_request'/);
});

test('every workflow action is pinned to a version and the file parses as steps under jobs', () => {
  assert.match(live, /^jobs:/m);
  for (const [, use] of live.matchAll(/uses:\s*(\S+)/g)) assert.match(use, /@[\w.]+$/, `${use} is not pinned`);
});

test('npm publish --dry-run packs the package the tag will name', { timeout: 300_000 }, () => {
  const out = execFileSync('npm', ['publish', '--dry-run', '--json'], { cwd: path.join(REPO_ROOT, 'packages/cli'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const info = JSON.parse(out.slice(out.indexOf('{')));
  assert.equal(info.name, PACKAGE_NAME);
  assert.ok(info.files.some((f) => f.path === 'bin/ds.mjs'));
});

test('the production deploy dispatches the publish only when given a tag', () => {
  const deploy = stripComments(fs.readFileSync(path.join(REPO_ROOT, '.github/workflows/netlify-production-deploy.yml'), 'utf8'));
  assert.match(deploy, /publish-cli:[\s\S]*needs: deploy/);
  assert.match(deploy, /if: inputs\.tag != ''/);
  assert.match(deploy, /gh workflow run publish-cli\.yml/);
});

test('the publish job builds the tagged commit, and the package names its repository for provenance', () => {
  assert.match(live.match(/\n  publish:[\s\S]*$/)[0], /ref: refs\/tags\/\$\{\{ github\.event\.release\.tag_name \|\| inputs\.tag \}\}/);
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/cli/package.json'), 'utf8'));
  assert.equal(pkg.repository.url, 'git+https://github.com/BilLogic/plus-uno.git');
});
