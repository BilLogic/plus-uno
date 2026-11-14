#!/usr/bin/env node
/**
 * `npm run check:docs-hero-fit` — no cover hero draws outside its card.
 *
 * WHY IT EXISTS. A hero is composed on a 5:2 frame and shown on an overview card
 * of another shape. The card used to lay the frame out wider than itself and clip
 * it, so a drawing wider than the stage lost its edges (the Typography card's
 * "Aa Aa" was cut on both sides). Nothing failed, because nothing measured the
 * drawn box against its card; this does.
 *
 * WHAT IT DOES. Opens every overview page and every page that has a hero in the
 * hero registry, at 1440, 1280, 1024 and 768, and compares each hero's drawn
 * boxes to the box that holds them (`scripts/docs-hero-fit.mjs`). Needs
 * `npm ci`, a Playwright chromium and a Storybook server, so it runs in the
 * storybook-gate job beside `check:docs-chrome`.
 *
 * Usage:
 *   npm run check:docs-hero-fit                    start a Storybook, measure, assert
 *   npm run check:docs-hero-fit -- --url http://localhost:4200
 *                                                  measure a Storybook already running
 *   npm run check:docs-hero-fit -- --all           every docs page, not just the covered ones
 *   npm run check:docs-hero-fit -- --report        print every overflowing hero, even on pass
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { heroFitFailures, measureScript, overflowing } from './docs-hero-fit.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = path.join(REPO_ROOT, 'design-system/src/storybook-docs/docs-landing/hero-registry.jsx');

/** The viewport widths a reader's window produces; the docs frame is the iframe, so viewport = column. */
const WIDTHS = [1440, 1280, 1024, 768];

const args = process.argv.slice(2);
const report = args.includes('--report');
const all = args.includes('--all');
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
  console.error('[docs-hero-fit] playwright is not installed here. -> npm ci, then `npx playwright install chromium`.');
  process.exit(1);
}

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
let log = '';
if (!base) {
  const port = 4300 + (process.pid % 200);
  base = `http://localhost:${port}`;
  console.log(`[docs-hero-fit] starting Storybook on ${port}…`);
  server = spawn('npm', ['run', 'storybook:preview'], {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
}
const stop = () => {
  if (server && !server.killed) server.kill('SIGTERM');
};
process.on('exit', stop);
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.on(sig, () => {
    stop();
    process.exit(code);
  });
}

let index;
try {
  index = await waitForStorybook(base, 180_000);
} catch (err) {
  console.error(`[docs-hero-fit] ${err.message}`);
  console.error(log.slice(-4000));
  process.exit(1);
}

const docsIds = Object.values(index.entries)
  .filter((e) => e.type === 'docs')
  .map((e) => e.id);
const registryIds = [...fs.readFileSync(REGISTRY, 'utf8').matchAll(/^ {2}'([a-z0-9-]+)':/gm)].map((m) => m[1]);
const covered = new Set(registryIds.map((id) => `${id}--docs`));
const pages = docsIds.filter((id) => all || covered.has(id) || /overview--docs$/.test(id) || id.startsWith('templates-'));

const browser = await chromium.launch();
const measurements = [];
try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const queue = [...pages];
    const worker = async () => {
      const page = await context.newPage();
      for (let id = queue.shift(); id; id = queue.shift()) {
        await page.goto(`${base}/iframe.html?viewMode=docs&id=${encodeURIComponent(id)}`, { waitUntil: 'load' });
        await page.waitForSelector('.sbdocs', { timeout: 60_000 }).catch(() => {});
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(300);
        const heroes = await page.evaluate(measureScript());
        if (heroes.length) measurements.push({ page: id, width, heroes });
      }
      await page.close();
    };
    await Promise.all([worker(), worker(), worker()]);
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = heroFitFailures(measurements);
// Coverage: every page the registry names must have shown a hero at every width.
// A page that never loaded or lost its selector would otherwise pass by having nothing to measure.
const seen = new Set(measurements.map((m) => `${m.page}@${m.width}`));
const mustShow = pages.filter((id) => covered.has(id));
for (const width of WIDTHS) {
  for (const id of mustShow) if (!seen.has(`${id}@${width}`)) failures.push(`${id} @${width}: no hero found to measure`);
}
const heroCount = measurements.reduce((n, m) => n + m.heroes.length, 0);
const distinct = new Set(measurements.flatMap((m) => overflowing(m.heroes).map((h) => `${m.page}|${h.label}`)));
console.log(
  `[docs-hero-fit] ${pages.length} pages x ${WIDTHS.length} widths, ${heroCount} hero boxes, ${distinct.size} overflowing heroes (${failures.length} measurements)`,
);
if (report || failures.length) for (const f of failures) console.log(`  ${f}`);
if (!measurements.length) {
  console.error('[docs-hero-fit] no hero found on any page: the selectors no longer match anything');
  process.exit(1);
}
process.exit(failures.length ? 1 : 0);
