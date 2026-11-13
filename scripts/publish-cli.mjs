#!/usr/bin/env node
// Prepares the @plus-uno/cli publish: stamps the release tag's version into
// packages/cli/package.json (in the CI checkout only) and asks the registry whether
// that version already exists. Writes `version`, `dist_tag` and `publish` (true/false)
// to $GITHUB_OUTPUT; the workflow runs `npm publish` only when `publish` is true.
//
//   node scripts/publish-cli.mjs <tag>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { distTag, registryHas, versionFromTag } from './lib/cli-release.mjs';
import { PACKAGE_NAME } from '../packages/cli/src/constants.mjs';

const tag = process.argv[2];
let version;
try {
  version = versionFromTag(tag);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

const file = path.join(REPO_ROOT, 'packages/cli/package.json');
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.version = version;
fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);

const view = (spec) => {
  try {
    return execFileSync('npm', ['view', spec, 'version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return ''; // E404: the package or version is not on the registry yet
  }
};
const exists = registryHas(view, PACKAGE_NAME, version);
const out = { version, dist_tag: distTag(version), publish: String(!exists) };
console.log(exists ? `${PACKAGE_NAME}@${version} is already on the registry: skipping publish.` : `${PACKAGE_NAME}@${version} is new: publishing.`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(out).map(([k, v]) => `${k}=${v}\n`).join(''));
