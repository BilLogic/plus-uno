#!/usr/bin/env node
/**
 * Smoke check for the built archived Storybook (#1689): the index serves and
 * carries the archived banner. Run after `npm run build:archive-storybook`.
 * Not part of `check:harness` — the archive is a one-time/occasional build,
 * not a per-PR artifact.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { request } from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(REPO_ROOT, 'archive-storybook-static');
const BANNER_TEXT = 'Archived: pre-ADS library, for comparison only';

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

function serveStatic(dir, port) {
  const server = createServer((req, res) => {
    const reqPath = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(dir, decodeURIComponent(reqPath.split('?')[0]));
    if (!filePath.startsWith(dir) || !existsSync(filePath)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200);
    res.end(readFileSync(filePath));
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

function get(url) {
  return new Promise((resolve, reject) => {
    request(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    })
      .on('error', reject)
      .end();
  });
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    fail(`${DIST_DIR} does not exist. Run \`npm run build:archive-storybook\` first.`);
    return;
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!existsSync(indexPath)) {
    fail(`${indexPath} is missing.`);
    return;
  }

  const port = 4567;
  const server = await serveStatic(DIST_DIR, port);
  try {
    const { status, body } = await get(`http://127.0.0.1:${port}/index.html`);
    if (status !== 200) {
      fail(`index.html served ${status}, expected 200.`);
    } else if (!body.includes(BANNER_TEXT)) {
      fail('index.html does not contain the archived banner.');
    } else {
      console.log('✓ archive-storybook-static/index.html serves and shows the archived banner.');
    }
  } finally {
    server.close();
  }
}

main();
