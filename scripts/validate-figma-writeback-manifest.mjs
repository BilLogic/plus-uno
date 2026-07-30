#!/usr/bin/env node
/**
 * Validate a Figma write-back manifest (structure + forbidden capture methods).
 * Run: npm run validate:figma-writeback -- playground/test-roundtrip/roundtrip-manifest.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { validateWritebackManifest } from './lib/figma-writeback-manifest.mjs';

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('Usage: node scripts/validate-figma-writeback-manifest.mjs <manifest.json>');
  process.exit(1);
}

const resolved = path.resolve(manifestPath);
if (!fs.existsSync(resolved)) {
  console.error(`Manifest not found: ${resolved}`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(resolved, 'utf8'));
} catch (error) {
  console.error(`Invalid JSON: ${error.message}`);
  process.exit(1);
}

const result = validateWritebackManifest(manifest);

console.log(`Figma write-back manifest: ${resolved}`);
for (const warning of result.warnings) {
  console.log(`  WARN  ${warning}`);
}
for (const error of result.errors) {
  console.log(`  FAIL  ${error}`);
}

if (result.ok) {
  console.log('STATUS: PASS');
  process.exit(0);
}

console.log('STATUS: FAIL');
process.exit(1);
