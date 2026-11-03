#!/usr/bin/env node
/**
 * Builds the archived pre-ADS Storybook: React-Bootstrap components on the
 * previous tokens, frozen at the tag below. The source is never modified —
 * this script extracts it read-only via `git archive`, builds it in an
 * isolated temp directory with its own commit's build command, then
 * post-processes only the generated static output to add the archived
 * banner. No code from the archive is imported into main.
 *
 * Output: archive-storybook-static/ (gitignored build artifact, not committed).
 *
 * Usage: node scripts/build-archive-storybook.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const ARCHIVE_REF = 'archive/storybook-pre-ads';
const ARCHIVE_COMMIT = '7304a5e5c5cec50f9bdd74f25c6ad4d6e3cf9a3c';
const OUT_DIR = path.join(REPO_ROOT, 'archive-storybook-static');
const BANNER_TEXT = 'Archived: pre-ADS library, for comparison only';

function sh(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
}

function resolveArchiveCommit() {
  let full;
  try {
    // `^{commit}` dereferences an annotated tag to the commit it points at.
    full = sh('git', ['rev-parse', `${ARCHIVE_REF}^{commit}`], REPO_ROOT).trim();
  } catch {
    full = sh('git', ['rev-parse', ARCHIVE_COMMIT], REPO_ROOT).trim();
  }
  if (!full.startsWith(ARCHIVE_COMMIT.slice(0, 12)) && !ARCHIVE_COMMIT.startsWith(full.slice(0, 12))) {
    // Tag moved off the commit the archive is pinned to.
    throw new Error(
      `${ARCHIVE_REF} resolves to ${full}, not the pinned archive commit ${ARCHIVE_COMMIT}. ` +
        'The archive tag must stay immutable.'
    );
  }
  return full;
}

function injectBanner(html) {
  const style = `
<style id="pre-ads-archive-banner-style">
  #pre-ads-archive-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    background: #3d2b00;
    color: #ffe4a3;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    letter-spacing: 0.01em;
  }
  body {
    margin-top: 36px !important;
  }
</style>`;
  const script = `
<div id="pre-ads-archive-banner" role="note">${BANNER_TEXT}</div>`;
  let out = html;
  out = out.includes('</head>') ? out.replace('</head>', `${style}\n</head>`) : out + style;
  out = out.includes('<body>')
    ? out.replace('<body>', `<body>\n${script}`)
    : out.replace(/<body([^>]*)>/, (m) => `${m}\n${script}`);
  return out;
}

function main() {
  const commit = resolveArchiveCommit();
  console.log(`Building archived Storybook from ${ARCHIVE_REF} (${commit.slice(0, 12)})`);

  const tmpDir = mkdtempSync(path.join(tmpdir(), 'plus-uno-archive-storybook-'));
  try {
    console.log(`Extracting source to ${tmpDir} (read-only, via git archive)`);
    const tarball = path.join(tmpDir, 'source.tar');
    sh('git', ['archive', '--format=tar', '-o', tarball, commit], REPO_ROOT);
    const srcDir = path.join(tmpDir, 'src');
    sh('mkdir', ['-p', srcDir]);
    sh('tar', ['-xf', tarball, '-C', srcDir]);

    console.log('Installing dependencies for the archived commit');
    sh('npm', ['install', '--no-audit', '--no-fund'], srcDir);

    console.log('Building the archived Storybook (its own build-storybook script)');
    sh('npm', ['run', 'build-storybook'], srcDir);

    const builtDir = path.join(srcDir, 'dist', 'storybook');
    if (!existsSync(builtDir)) {
      throw new Error(`Expected archived build output at ${builtDir}, found nothing.`);
    }

    rmSync(OUT_DIR, { recursive: true, force: true });
    sh('cp', ['-R', builtDir, OUT_DIR]);

    console.log('Injecting the archived banner into the built static output');
    for (const file of ['index.html', 'iframe.html']) {
      const filePath = path.join(OUT_DIR, file);
      if (!existsSync(filePath)) continue;
      const html = readFileSync(filePath, 'utf8');
      writeFileSync(filePath, injectBanner(html));
    }

    console.log(`Archived Storybook built at ${OUT_DIR}`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
