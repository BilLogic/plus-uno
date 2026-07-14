/**
 * Shared rules for DS-compliant Figma write-back manifests.
 * Canonical example: playground/test-roundtrip/roundtrip-manifest.json
 */

export const FORBIDDEN_MANIFEST_PATTERNS = [
  /html-to-design/i,
  /generate_figma_design/i,
  /raw frames?, not library/i,
  /screenshot import/i,
  /pixel-perfect capture/i,
];

/**
 * @param {unknown} manifest
 * @returns {{ ok: boolean; errors: string[]; warnings: string[] }}
 */
export function validateWritebackManifest(manifest) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, errors: ['Manifest must be a JSON object.'], warnings };
  }

  const m = /** @type {Record<string, unknown>} */ (manifest);
  const serialized = JSON.stringify(manifest);

  for (const pattern of FORBIDDEN_MANIFEST_PATTERNS) {
    if (pattern.test(serialized)) {
      errors.push(
        `Forbidden write-back method detected (${pattern}). Use library component instances — not screenshot/html capture.`,
      );
    }
  }

  if (!m.playground || typeof m.playground !== 'string') {
    errors.push('Missing required field: playground (e.g. "playground/test-roundtrip").');
  }

  const testFile = /** @type {Record<string, unknown>} */ (m.figmaTestFile || {});
  if (!testFile.fileKey || typeof testFile.fileKey !== 'string') {
    errors.push('Missing required field: figmaTestFile.fileKey');
  }

  const frame = /** @type {Record<string, unknown>} */ (m.writeBackFrame || {});
  if (!frame.nodeId || typeof frame.nodeId !== 'string') {
    errors.push('Missing required field: writeBackFrame.nodeId');
  }
  if (!frame.name || typeof frame.name !== 'string') {
    errors.push('Missing required field: writeBackFrame.name');
  } else if (!String(frame.name).startsWith('[replica]')) {
    warnings.push('writeBackFrame.name should use the [replica] prefix per figma-workspace.md.');
  }

  const components = /** @type {unknown[]} */ (m.components || []);
  if (!Array.isArray(components) || components.length === 0) {
    errors.push('Missing required field: components (non-empty array).');
  } else {
    components.forEach((entry, index) => {
      const c = /** @type {Record<string, unknown>} */ (entry || {});
      if (!c.codeImport) errors.push(`components[${index}]: missing codeImport`);
      if (!c.componentSetNodeId) errors.push(`components[${index}]: missing componentSetNodeId`);
      if (!c.figmaInstanceNodeId) errors.push(`components[${index}]: missing figmaInstanceNodeId`);
    });
  }

  const tokenBindings = /** @type {unknown[]} */ (m.tokenBindings || []);
  if (!Array.isArray(tokenBindings) || tokenBindings.length === 0) {
    errors.push('Missing required field: tokenBindings (non-empty array).');
  } else {
    tokenBindings.forEach((entry, index) => {
      const t = /** @type {Record<string, unknown>} */ (entry || {});
      if (!t.codeToken) errors.push(`tokenBindings[${index}]: missing codeToken`);
      if (!t.figmaVariableName && !t.figmaTextStyleName) {
        errors.push(`tokenBindings[${index}]: missing figmaVariableName or figmaTextStyleName`);
      }
    });
  }

  return { ok: errors.length === 0, errors, warnings };
}
