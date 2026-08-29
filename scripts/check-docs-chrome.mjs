#!/usr/bin/env node
/**
 * `npm run check:docs-chrome` — the docs pages, in a real browser.
 *
 * WHY IT EXISTS. #263 recorded four defects in the docs chrome: the props table
 * spilling out of its column and under the sidebar, a canvas card left hanging
 * open onto whitespace, a demo flush against its own toolbar, and a scrollbar on
 * the tab strip. Every one was found by looking at a rendered page, because
 * nothing could have found them otherwise — `check:storybook`'s 1136 tests are
 * story tests, and a docs page is not a story. That is the thing the four have in
 * common, and it is the thing this fixes.
 *
 * WHAT IT ASSERTS is deliberately narrow, and lives in `scripts/docs-chrome.mjs`
 * with its own unit tests: the docs body never scrolls sideways, no canvas
 * renders an open bottom edge with no panel beneath it, and any props table wider
 * than its wrapper sits in a wrapper that scrolls. Three facts, each one a defect
 * that actually shipped.
 *
 * IT MEASURES THE DOCS DOCUMENT, NOT THE MANAGER. Storybook renders docs in an
 * iframe; the manager around it costs a sidebar and a table-of-contents rail, so
 * the docs column is far narrower than the window. Loading `iframe.html` directly
 * makes the viewport width and the column width the same number, which is what
 * makes these widths readable: 1140 and 468 are the column widths a 1440px and a
 * 768px window actually produce, measured.
 *
 * WHY IT IS NOT PART OF `check:harness`. Same reason as `check:storybook`, and it
 * runs in the same workflow for the same reason: it needs `npm ci`, a Playwright
 * chromium, and a Storybook server. The decision is recorded in `EXCLUDED` in
 * `scripts/check-harness.mjs`, which is where composition decisions live.
 *
 * Usage:
 *   npm run check:docs-chrome                    start a Storybook, measure, assert
 *   npm run check:docs-chrome -- --url http://localhost:4200
 *                                                measure a Storybook already running
 *   npm run check:docs-chrome -- --report        print every measurement and assert
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromeFailures, measureScript } from './docs-chrome.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The pages to look at.
 *
 * Not every docs page — the point is one assertion over docs pages existing at
 * all, and the cost is a browser. Button carries both canvas shapes (one with a
 * source panel, one without) and an interactive playground with a props table,
 * which is every element the three assertions read.
 */
const PAGES = [
  'components-actions-button--docs',
  'components-forms-and-inputs-checkbox--docs',
  'foundations-design-tokens--docs',
];

/**
 * The column widths a 1440px and a 768px window produce, measured in the manager.
 * 768 is where the props table stopped fitting; 1440 is where it did fit, and is
 * here so a fix that simply hides the table cannot pass.
 */
const WIDTHS = [1140, 468];

const args = process.argv.slice(2);
const report = args.includes('--report');
const urlFlag = args.indexOf('--url');
const externalBase = urlFlag === -1 ? null : args[urlFlag + 1];

if (urlFlag !== -1 && (!externalBase || externalBase.startsWith('-'))) {
  console.error('--url needs a base URL, e.g. --url http://localhost:4200');
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    '[docs-chrome] playwright is not installed here.\n' +
      '  -> npm ci, then `npx playwright install chromium`. This check needs a browser;\n' +
      '     it is excluded from check:harness for exactly that reason.',
  );
  process.exit(1);
}

/** Waits for a Storybook to answer with a story index, or gives up. */
async function waitForStorybook(base, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = 'no attempt made';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/index.json`);
      if (res.ok) return await res.json();
      lastErr = `HTTP ${res.status}`;
    } catch (err) {
      lastErr = String(err.cause?.code ?? err.message ?? err);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no Storybook answered at ${base} within ${timeoutMs / 1000}s (last: ${lastErr})`);
}

let server = null;
let base = externalBase;

if (!base) {
  const port = 4300 + (process.pid % 200);
  base = `http://localhost:${port}`;
  console.log(`[docs-chrome] starting Storybook on ${port}…`);
  server = spawn('npm', ['run', 'storybook:preview'], {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Held rather than streamed: Storybook is loud, and the only time its output
  // matters is when it never came up.
  let log = '';
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
  server.on('exit', (code) => {
    if (code !== null && code !== 0) console.error(log.slice(-4000));
  });
  try {
    await waitForStorybook(base, 180_000);
  } catch (err) {
    console.error(`[docs-chrome] ${err.message}`);
    console.error(log.slice(-4000));
    server.kill('SIGTERM');
    process.exit(1);
  }
}

const stop = () => {
  if (server && !server.killed) server.kill('SIGTERM');
};
process.on('exit', stop);
process.on('SIGINT', () => {
  stop();
  process.exit(130);
});

let exitCode = 0;
const browser = await chromium.launch();
try {
  const index = await waitForStorybook(base, 30_000);
  // A page id that no longer exists would otherwise measure an error screen and
  // pass — the "Couldn't find story" page has no tables and no canvases.
  const missing = PAGES.filter((id) => !index.entries?.[id]);
  if (missing.length) {
    console.error(
      `[docs-chrome] ${missing.length} page(s) in PAGES are not in this Storybook: ${missing.join(', ')}.\n` +
        '  -> They were renamed or removed. Update PAGES in scripts/check-docs-chrome.mjs;\n' +
        '     leaving them would measure an error screen, which passes every assertion.',
    );
    exitCode = 1;
  }

  const measurements = [];
  const context = await browser.newContext();
  for (const width of WIDTHS) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 900 });
    for (const id of PAGES.filter((p) => !missing.includes(p))) {
      await page.goto(`${base}/iframe.html?viewMode=docs&id=${encodeURIComponent(id)}`, {
        waitUntil: 'load',
      });
      // The docs root, not networkidle: Storybook's dev server keeps a HMR socket
      // open, so networkidle never arrives.
      await page.waitForSelector('.sbdocs-content', { timeout: 60_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const m = await page.evaluate(measureScript(id));
      measurements.push({ ...m, width });
    }
    await page.close();
  }

  if (report) console.log(JSON.stringify(measurements, null, 2));

  const failures = chromeFailures(measurements);
  if (failures.length) {
    console.error(`[docs-chrome] ${failures.length} problem(s):`);
    for (const f of failures) console.error(`  -> ${f}`);
    exitCode = 1;
  } else {
    const canvases = measurements.reduce((n, m) => n + m.canvases.length, 0);
    const tables = measurements.reduce((n, m) => n + m.tables.length, 0);
    console.log(
      `[docs-chrome] ${measurements.length} page render(s) across ${WIDTHS.length} width(s): ` +
        `no horizontal bleed, ${canvases} canvas(es) closed or attached, ${tables} table(s) contained.`,
    );
  }
} finally {
  await browser.close();
  stop();
}

process.exit(exitCode);
