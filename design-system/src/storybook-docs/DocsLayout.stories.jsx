/**
 * The docs layout pieces at a narrow width: what a reader on a phone gets. The
 * jsdom tests check the markup; this checks the layout in a browser.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/DocsLayout.stories.jsx
 */
import React from "react";
import { expect, waitFor } from "storybook/test";
import { Markdown } from "@storybook/addon-docs/blocks";
import { ThemeProvider, ensure, themes } from "storybook/theming";

import { Button, Dialog, ProgressTracker, PromptStarters } from "@/components";
import { Section } from "@/templates";
import { AGENT_VIEW_MARKDOWN } from "./docs-tabs.jsx";
import { DoDontPair, FigureScreen } from "./ds-docs-layout.jsx";

export default {
  // A test harness, not a page: `!dev` keeps it out of the sidebar while the
  // Storybook tests still run it.
  title: "Get started/Docs layout",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
};

const LONG_LINE = `<SectionMessage appearance="warning" title="This line is much longer than any phone screen is wide" actions={[{ text: 'Review the request', onClick: reviewTheRequest }]} />`;

const NARROW = "calc(var(--card-min-width-md) * 1.2)";

/** The column keeps its width: nothing inside pushes it wide. */
const expectColumnHolds = async (column) => {
  await expect(
    column.scrollWidth,
    "nothing pushes the column wide",
  ).toBeLessThanOrEqual(column.clientWidth + 1);
};

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
      { timeout: 5000 },
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

const WIDE_TABLE = `| Appearance | Orientation | Spacing | Placement | Reflection | Highlighted |
| --- | --- | --- | --- | --- | --- |
| default | horizontal | compact | trailing | required | selected |
`;

/** A wide table in the Harness tab scrolls in its own box; the column keeps its width. */
export const HarnessTableScrollsInItsOwnBox = {
  render: () => (
    <div className="sbdocs" data-testid="column" style={{ inlineSize: NARROW }}>
      <Markdown options={AGENT_VIEW_MARKDOWN}>{WIDE_TABLE}</Markdown>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    const box = await waitFor(() => {
      const found = column.querySelector(".sb-ds-agent-view__table");
      expect(found).not.toBeNull();
      return found;
    });
    await expect(box.scrollWidth, "the table is wider than the box").toBeGreaterThan(box.clientWidth);
    await expect(
      box.getBoundingClientRect().right,
      "the box stays inside the column",
    ).toBeLessThanOrEqual(column.getBoundingClientRect().right + 1);
    await expectColumnHolds(column);
  },
};

/** A demo wider than its card scrolls in the card's well; the card and the page keep their width. */
export const WideDemoScrollsInItsWell = {
  render: () => (
    <div className="sbdocs" data-testid="column" style={{ inlineSize: NARROW }}>
      <DoDontPair
        doExample={
          <FigureScreen>
            <Dialog
              width="10-col"
              title="Remove this session?"
              body="The student is told it was canceled."
              primaryButton={{ text: "Remove" }}
              onClose={() => {}}
            />
          </FigureScreen>
        }
        doCaption="A caption."
        dontExample={<span>Don't</span>}
        dontCaption="A caption."
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    const well = canvasElement.querySelector(".sb-ds-dodont-card__well");
    await expect(well.scrollWidth, "the demo is wider than the well").toBeGreaterThan(well.clientWidth);
    await expect(
      well.closest(".sb-ds-dodont-card").getBoundingClientRect().right,
      "the card stays inside the column",
    ).toBeLessThanOrEqual(column.getBoundingClientRect().right + 1);
    await expectColumnHolds(column);
  },
};

/** The steps shrink and a long label truncates; the row never sets its own width. */
export const ProgressTrackerHoldsItsWidth = {
  render: () => (
    <div data-testid="column" style={{ inlineSize: NARROW }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ProgressTracker
          items={[
            { id: "one", label: "Session information", status: "visited", onClick: () => {} },
            { id: "two", label: "Student reflection", status: "current" },
            { id: "three", label: "Session reflection", status: "unvisited" },
            { id: "four", label: "Form feedback", status: "disabled" },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    await expect(
      canvasElement.querySelector(".plus-progress-tracker").getBoundingClientRect().right,
      "the row stays inside the column",
    ).toBeLessThanOrEqual(column.getBoundingClientRect().right + 1);
    await expectColumnHolds(column);
  },
};

/** A long starter label truncates; the row never sets its own width. */
export const PromptStartersHoldTheirWidth = {
  render: () => (
    <div data-testid="column" style={{ inlineSize: NARROW }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <PromptStarters
          label="Try asking"
          starters={[
            { id: "one", label: "Summarize this week's sessions for every student in my groups", text: "Summarize." },
            { id: "two", label: "Review goals", text: "Review." },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    await expect(
      canvasElement.querySelector(".plus-prompt-starters").getBoundingClientRect().right,
      "the row stays inside the column",
    ).toBeLessThanOrEqual(column.getBoundingClientRect().right + 1);
    await expectColumnHolds(column);
  },
};

/** Section actions that do not fit beside the heading drop under it, so the heading keeps a line of its own. */
export const SectionActionsWrap = {
  render: () => (
    <div data-testid="column" style={{ inlineSize: NARROW }}>
      <Section
        title="Students"
        actions={
          <>
            <Button text="More actions" />
            <Button text="Add students to group" appearance="primary" />
          </>
        }
      >
        <p>Body</p>
      </Section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    const title = canvasElement.querySelector(".plus-template-section-title");
    const actions = canvasElement.querySelector(".plus-template-section-actions");
    await expect(
      actions.getBoundingClientRect().top,
      "the actions drop under the heading",
    ).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom - 1);
    await expect(
      actions.getBoundingClientRect().right,
      "the actions stay at the end of the row",
    ).toBeCloseTo(column.getBoundingClientRect().right, -1);
    await expectColumnHolds(column);
  },
};
