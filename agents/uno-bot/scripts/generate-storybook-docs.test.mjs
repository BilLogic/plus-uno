import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { STORYBOOK_DOCS_PATH, artifacts, run, storybookDocEntries } from "./generate-storybook-docs.mjs";

function writeRegistry(root, components) {
  const path = join(root, "design-system/figma/component-registry.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ components }, null, 2), "utf8");
}

describe("the Storybook docs map", () => {
  it("keys a component in a folder of its own by the folder, and a flat one by its file stem", () => {
    const entries = storybookDocEntries({
      components: {
        Button: { code: { source: "design-system/src/components/forms-and-inputs/Button/Button.jsx", storybookId: "components-forms-and-inputs-button-button--docs" } },
        Checkbox: { code: { source: "design-system/src/components/forms-and-inputs/Checkbox.jsx", storybookId: "components-forms-and-inputs-checkbox--docs" } },
      },
    });
    assert.deepEqual(entries, [
      ["design-system/src/components/forms-and-inputs/Button/", "Button", "components-forms-and-inputs-button-button--docs"],
      ["design-system/src/components/forms-and-inputs/Checkbox.", "Checkbox", "components-forms-and-inputs-checkbox--docs"],
    ]);
  });

  it("leaves out a component with no source or no Storybook id, and a key two components claim", () => {
    const entries = storybookDocEntries({
      components: {
        NoId: { code: { source: "design-system/src/components/a/NoId/NoId.jsx" } },
        NoSource: { code: { storybookId: "x--docs" } },
        One: { code: { source: "design-system/src/components/b/Same/Same.jsx", storybookId: "one--docs" } },
        Two: { code: { source: "design-system/src/components/b/Same/Same.tsx", storybookId: "two--docs" } },
      },
    });
    assert.deepEqual(entries, []);
  });

  it("holds the committed Storybook docs map in sync with component-registry.json", () => {
    assert.deepEqual(run(), []);
  });

  it("detects missing output, edited output, and stale source without writing in verification mode, and regenerates deterministically", () => {
    const root = mkdtempSync(join(tmpdir(), "storybook-docs-"));
    try {
      writeRegistry(root, {
        Button: {
          code: {
            source: "design-system/src/components/forms-and-inputs/Button/Button.jsx",
            storybookId: "components-forms-and-inputs-button-button--docs",
          },
        },
      });
      const outAbs = join(root, STORYBOOK_DOCS_PATH);

      assert.deepEqual(
        run({ repoRoot: root }).map((f) => f.file),
        [STORYBOOK_DOCS_PATH],
      );
      assert.equal(existsSync(outAbs), false, "check mode must not create a missing output file");

      const [first] = artifacts(root);
      const [second] = artifacts(root);
      assert.equal(first.path, STORYBOOK_DOCS_PATH);
      assert.equal(first.content, second.content, "regeneration must be deterministic");

      mkdirSync(dirname(outAbs), { recursive: true });
      writeFileSync(outAbs, first.content, "utf8");
      assert.deepEqual(run({ repoRoot: root }), []);

      const edited = `${first.content}// hand-edited\n`;
      writeFileSync(outAbs, edited, "utf8");
      assert.deepEqual(
        run({ repoRoot: root }).map((f) => f.file),
        [STORYBOOK_DOCS_PATH],
      );
      assert.equal(readFileSync(outAbs, "utf8"), edited, "check mode must not overwrite an edited output file");

      writeFileSync(outAbs, first.content, "utf8");
      writeRegistry(root, {
        Button: {
          code: {
            source: "design-system/src/components/forms-and-inputs/Button/Button.jsx",
            storybookId: "components-forms-and-inputs-button-button--docs",
          },
        },
        Checkbox: {
          code: {
            source: "design-system/src/components/forms-and-inputs/Checkbox.jsx",
            storybookId: "components-forms-and-inputs-checkbox--docs",
          },
        },
      });
      assert.deepEqual(
        run({ repoRoot: root }).map((f) => f.file),
        [STORYBOOK_DOCS_PATH],
      );
      assert.equal(readFileSync(outAbs, "utf8"), first.content, "check mode must not write when source moves ahead");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
