import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { storybookDocEntries } from "./generate-storybook-docs.mjs";

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
});
