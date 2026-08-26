/**
 * Guard for the transient `.storybook/vitest.setup.ts` import failure (#157).
 *
 * The flake was a dependency discovered at runtime: the browser-mode Vite server
 * re-optimises and reloads the page, and whichever test files were mid-import
 * abort with a spurious error naming the setup file. Two properties of the root
 * config keep that from recurring, and both are easy to undo by accident:
 *
 *   1. `optimizeDeps.include` pins the setup graph, so the first optimise pass is
 *      the only one. `axe-core` is the load-bearing entry — addon-a11y reaches it
 *      through a dynamic `import("axe-core")` that no static scan can see.
 *   2. `setupFiles` names the addon's internal setup file alongside ours. Vitest
 *      replaces config arrays rather than merging them, so listing only our file
 *      deletes the ones @storybook/addon-vitest injects.
 *
 * Our own setup file must stay, despite Storybook's info box offering to remove
 * it: without a local `setProjectAnnotations` the addon loads
 * `setup-file-with-project-annotations.js`, whose graph fails to import under
 * Vite 8 and takes every story file down with it.
 *
 * This test lives in the design-system package because `npm test` is the only
 * test command the repo currently has; it asserts properties of the ROOT config.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Loads the root Vite config in a child Node process. Vitest's module runner
 * cannot import a file outside its own project root, and the config has to be
 * evaluated rather than pattern-matched for the assertions to mean anything.
 *
 * @returns {{present: boolean, setupFiles: string[]|null, optimizeDepsInclude: string[]|null}}
 *   The storybook project's shape.
 */
const readStorybookProject = () => {
  const script = `
    const { loadConfigFromFile } = await import('vite');
    const loaded = await loadConfigFromFile(
      { command: 'serve', mode: 'test' },
      './vite.config.js',
    );
    const config = loaded.config;
    const project = (config.test?.projects ?? []).find((p) => p?.test?.name === 'storybook');
    process.stdout.write(JSON.stringify({
      present: Boolean(project),
      setupFiles: project?.test?.setupFiles ?? null,
      optimizeDepsInclude: project?.optimizeDeps?.include ?? null,
    }));
  `;
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return JSON.parse(out);
};

describe('root vite.config.js storybook test project', () => {
  /** @type {ReturnType<typeof readStorybookProject>} */
  let project;

  // Evaluating the root config spawns a child process and loads the Storybook
  // plugin, which takes a few seconds. Do it once.
  beforeAll(() => {
    project = readStorybookProject();
  }, 60000);

  it('pins the setup graph so no dependency is discovered mid-run', () => {
    expect(project.present, 'storybook test project is missing from vite.config.js').toBe(true);
    expect(project.optimizeDepsInclude).toEqual(
      expect.arrayContaining([
        '@storybook/addon-a11y/preview',
        '@storybook/react-vite',
        'axe-core',
        'storybook/preview-api',
        'storybook/test'
      ])
    );
  });

  it('keeps the setup files that @storybook/addon-vitest injects', () => {
    expect(project.setupFiles).toEqual([
      '@storybook/addon-vitest/internal/setup-file',
      '.storybook/vitest.setup.ts'
    ]);
  });

  it('keeps .storybook/vitest.setup.ts, which supplies the project annotations', () => {
    const setupFile = path.join(repoRoot, '.storybook/vitest.setup.ts');

    expect(fs.existsSync(setupFile)).toBe(true);
    expect(fs.readFileSync(setupFile, 'utf8')).toContain('setProjectAnnotations');
  });
});
