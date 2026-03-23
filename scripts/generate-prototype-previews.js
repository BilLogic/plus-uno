import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { prototypes } from '../src/pages/PrototypeMarket/prototypes-data.js';

const BASE_URL = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4100';
const OUTPUT_DIR = path.resolve('public/prototype-previews');
const VIEWPORT = { width: 1440, height: 900 };

function getTargetUrl(proto) {
  if (proto.deploymentUrl) return proto.deploymentUrl;
  if (proto.localPath) return `${BASE_URL}${proto.localPath}`;
  return null;
}

async function generate() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });

  try {
    for (const proto of prototypes) {
      const targetUrl = getTargetUrl(proto);
      if (!targetUrl) {
        // eslint-disable-next-line no-console
        console.log(`[skip] ${proto.id} ${proto.title} (no url)`);
        continue;
      }

      const outputPath = path.join(OUTPUT_DIR, `${proto.id}.png`);

      try {
        // eslint-disable-next-line no-console
        console.log(`[shot] ${proto.id} -> ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(1200);
        await page.screenshot({ path: outputPath, fullPage: false });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[fail] ${proto.id} ${proto.title}: ${error.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  // eslint-disable-next-line no-console
  console.log(`Done. Preview screenshots saved to ${OUTPUT_DIR}`);
}

generate().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
