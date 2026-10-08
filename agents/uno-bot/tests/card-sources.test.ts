// Which of our own site's links may ride on a card, asked of the filter itself.
//
// The blueprint and Storybook we host pass; every other path on that host is a
// prototype or a preview and does not. The paths come from the one table that
// maps a link to its estate (`estate-hosts.ts`), so this holds the filter and
// the glyphs to the same list.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { threadVisibleSources } from "../src/slack/card-sources";

const visible = (url: string): boolean => threadVisibleSources([{ text: "x", url }]).length === 1;

describe("our own site on a card", () => {
  it("passes a Storybook link and a blueprint link", () => {
    assert.ok(visible("https://plus-uno.netlify.app/storybook/?path=/docs/button"));
    assert.ok(visible("https://plus-uno.netlify.app/storybook"));
    assert.ok(visible("https://plus-uno.netlify.app/blueprint/cell/1"));
    assert.ok(visible("https://plus-uno.netlify.app/blueprint"));
  });

  it("drops any other path on the same host", () => {
    assert.ok(!visible("https://plus-uno.netlify.app/prototypes/x"));
    assert.ok(!visible("https://plus-uno.netlify.app/demo/home"));
    assert.ok(!visible("https://plus-uno.netlify.app/"));
    assert.ok(!visible("https://plus-uno.netlify.app/storybook-old/x"), "a prefix match is a path, not a substring");
  });
});
