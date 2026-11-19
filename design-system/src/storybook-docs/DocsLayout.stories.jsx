/**
 * The docs layout pieces at a narrow width: what a reader on a phone gets. The
 * jsdom tests check the markup; this checks the layout in a browser.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/DocsLayout.stories.jsx
 */
import React from "react";
import { expect, waitFor } from "storybook/test";
import { ThemeProvider, ensure, themes } from "storybook/theming";

import { DoDontPair } from "./ds-docs-layout.jsx";

export default {
  // A test harness, not a page: `!dev` keeps it out of the sidebar while the
  // Storybook tests still run it.
  title: "Get started/Docs layout",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
};

const LONG_LINE = `<SectionMessage appearance="warning" title="This line is much longer than any phone screen is wide" actions={[{ text: 'Review the request', onClick: reviewTheRequest }]} />`;

const NARROW = "calc(var(--card-min-width-md) * 1.2)";

/** Opened code scrolls inside its card; the card and the page keep their width. */
export const DoDontCodeStaysInItsCard = {
  // The code block reads Storybook's theme, which a docs page supplies and a story does not.
  render: () => (
    <ThemeProvider theme={ensure(themes.light)}>
      <div data-testid="column" style={{ inlineSize: NARROW }}>
        <DoDontPair
          doExample={<span>Do</span>}
          doCaption="A caption."
          doCode={LONG_LINE}
          dontExample={<span>Don't</span>}
          dontCaption="A caption."
          dontCode={LONG_LINE}
        />
      </div>
    </ThemeProvider>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    canvasElement.querySelectorAll("details").forEach((details) => {
      details.open = true;
    });
    // The highlighter loads after the first paint; wait for the code itself.
    await waitFor(() =>
      expect(canvasElement.querySelectorAll(".sb-ds-dodont-card__code pre")).toHaveLength(2),
    );
    const edge = column.getBoundingClientRect().right;
    for (const card of canvasElement.querySelectorAll(".sb-ds-dodont-card")) {
      await expect(
        card.getBoundingClientRect().right,
        "the card stays inside the column",
      ).toBeLessThanOrEqual(edge + 1);
      const code = card.querySelector(".sb-ds-dodont-card__code");
      await expect(
        code.getBoundingClientRect().right,
        "the code stays inside its card",
      ).toBeLessThanOrEqual(card.getBoundingClientRect().right + 1);
    }
    await expect(
      column.scrollWidth,
      "nothing pushes the column wide",
    ).toBeLessThanOrEqual(column.clientWidth + 1);
  },
};
