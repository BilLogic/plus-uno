/**
 * The docs layout pieces at a narrow width: what a reader on a phone gets. The
 * jsdom tests check the markup; this checks the layout in a browser.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/DocsLayout.stories.jsx
 */
import React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Markdown } from "@storybook/addon-docs/blocks";
import { ThemeProvider, ensure, themes } from "storybook/theming";

import { Button, Dialog, DynamicTable, ProgressTracker, PromptStarters } from "@/components";
import { Section } from "@/templates";
// A deep import on purpose: the Popup cases are docs staging, not part of a public barrel.
import { FormInPopupCase } from "@/templates/Popup/PopupCases.jsx";
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

const WIDE_ROW = `| Appearance | Orientation | Spacing | Placement | Reflection | Highlighted |
| --- | --- | --- | --- | --- | --- |
| default | horizontal | compact | trailing | required | selected |`;

const NARROW_ROW = `| Prop | Type |
| --- | --- |
| size | number |`;

const HARNESS_TABLES = `## Slots

${WIDE_ROW}

## Props

${NARROW_ROW}

## Slots

${WIDE_ROW}
`;

/** A wide table in the Harness tab scrolls in its own box, which is focusable and named only then. */
export const HarnessTableScrollsInItsOwnBox = {
  render: () => (
    <div className="sbdocs" data-testid="column" style={{ inlineSize: NARROW }}>
      <Markdown options={AGENT_VIEW_MARKDOWN}>{HARNESS_TABLES}</Markdown>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    await waitFor(() => expect(column.querySelectorAll(".sb-ds-agent-view__table")).toHaveLength(3));
    const [first, narrow, second] = column.querySelectorAll(".sb-ds-agent-view__table");
    await waitFor(() => expect(first).toHaveAttribute("role", "region"));
    await expect(first.scrollWidth, "the table is wider than the box").toBeGreaterThan(first.clientWidth);
    await expect(first, "a scrolling box takes focus").toHaveAttribute("tabindex", "0");
    await expect(first).toHaveAttribute("aria-label", "Slots table");
    await expect(second, "a second table under the same heading is numbered").toHaveAttribute("aria-label", "Slots table 2");
    await expect(narrow.hasAttribute("tabindex"), "a table that fits has no tab stop").toBe(false);
    await expect(narrow.hasAttribute("role"), "and no region role").toBe(false);
    await expect(
      first.getBoundingClientRect().right,
      "the box stays inside the column",
    ).toBeLessThanOrEqual(column.getBoundingClientRect().right + 1);
    await expectColumnHolds(column);
  },
};

const FLAG_ROW = `| Prop | Type | Default |
| --- | --- | --- |
| \`actions\` | \`Array<{ text: string, onClick: () => void, appearance?: 'default' | 'subtle', isDisabled?: boolean, iconBefore?: string }>\` | \`[]\` |`;

/** A long inline code cell in the Harness tab breaks where it must; the column keeps its width. */
export const HarnessLongCodeCellHolds = {
  render: () => (
    <div className="sbdocs" data-testid="column" style={{ inlineSize: NARROW }}>
      <Markdown options={AGENT_VIEW_MARKDOWN}>{FLAG_ROW}</Markdown>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    await waitFor(() => expect(column.querySelector(".sb-ds-agent-view__table")).not.toBeNull());
    await expectColumnHolds(column);
  },
};

const NARROW_ROSTER = {
  head: {
    cells: [
      { key: "student", content: "Student", isSortable: true },
      { key: "tutor", content: "Tutor", isSortable: true },
      { key: "sessions", content: "Sessions", isSortable: true, align: "number" },
    ],
  },
  rows: [
    { key: "ava", cells: [{ key: "Ava", content: "Ava Thompson" }, { key: "Priya", content: "Priya Nair" }, { key: 12, content: "12" }] },
    { key: "marcus", cells: [{ key: "Marcus", content: "Marcus Lee" }, { key: "Daniel", content: "Daniel Kim" }, { key: 9, content: "9" }] },
  ],
};

/** The screen-reader text in a sorted header scrolls with the table instead of widening the page. */
export const SortedTableHeaderHoldsTheColumn = {
  render: () => (
    <div data-testid="column" style={{ inlineSize: NARROW }}>
      <DynamicTable label="Students" head={NARROW_ROSTER.head} rows={NARROW_ROSTER.rows} sortKey="tutor" sortOrder="ascending" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    const scroller = canvasElement.querySelector(".plus-table-shell-scroll");
    await expect(scroller.scrollWidth, "the table is wider than its box").toBeGreaterThan(scroller.clientWidth);
    await expect(getComputedStyle(scroller).position, "the scroll region holds its screen-reader text").toBe("relative");
    await expectColumnHolds(column);
  },
};

/** A demo wider than its card scrolls in its well, which is focusable and named only then; a well that fits is not. */
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
        doCaption="A wide demo."
        dontExample={<span>Don't</span>}
        dontCaption="A narrow demo."
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    const [wide, narrow] = canvasElement.querySelectorAll(".sb-ds-dodont-card__well");
    await waitFor(() => expect(wide).toHaveAttribute("role", "region"));
    await expect(wide.scrollWidth, "the demo is wider than the well").toBeGreaterThan(wide.clientWidth);
    await expect(wide).toHaveAttribute("tabindex", "0");
    await expect(wide).toHaveAttribute("aria-label", "Do example: A wide demo.");
    await expect(getComputedStyle(wide).overflowY, "the well clips, it never shows a vertical scrollbar").toBe("hidden");
    await expect(narrow.hasAttribute("tabindex"), "a well that fits has no tab stop").toBe(false);
    await expect(narrow.hasAttribute("role"), "and no region role").toBe(false);
    await expect(
      wide.closest(".sb-ds-dodont-card").getBoundingClientRect().right,
      "the card stays inside the column",
    ).toBeLessThanOrEqual(column.getBoundingClientRect().right + 1);
    await expectColumnHolds(column);
  },
};

/** A demo that grows after the first paint is measured again. */
export const WellMeasuresLateContent = {
  render: function Late() {
    const [wide, setWide] = React.useState(false);
    return (
      <div className="sbdocs" data-testid="column" style={{ inlineSize: NARROW }}>
        <Button text="Grow" onClick={() => setWide(true)} />
        <DoDontPair
          doExample={
            <FigureScreen>
              {wide ? (
                <Dialog width="10-col" title="Remove?" body="Short." primaryButton={{ text: "Remove" }} onClose={() => {}} />
              ) : (
                <span>Early</span>
              )}
            </FigureScreen>
          }
          doCaption="Grows."
          dontExample={<span>Don't</span>}
          dontCaption="Fits."
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const [well] = canvasElement.querySelectorAll(".sb-ds-dodont-card__well");
    await expect(well.hasAttribute("tabindex"), "fits at first").toBe(false);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Grow" }));
    await waitFor(() => expect(well).toHaveAttribute("tabindex", "0"));
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
    const cut = [...canvasElement.querySelectorAll(".plus-progress-tracker__label")].find(
      (label) => label.scrollWidth > label.clientWidth,
    );
    await expect(cut, "a label is cut short").toBeDefined();
    await expect(getComputedStyle(cut).textOverflow, "with an ellipsis").toBe("ellipsis");
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
    const label = canvasElement.querySelector(".plus-suggestion__label");
    await expect(label.scrollWidth, "the long label is cut short").toBeGreaterThan(label.clientWidth);
    await expect(getComputedStyle(label).textOverflow, "with an ellipsis").toBe("ellipsis");
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

/** An open layer a Do or Don't example shows stays inside its own well, under the card above it. */
export const OpenLayerStaysInItsWell = {
  render: () => (
    <div data-testid="column" style={{ inlineSize: NARROW }}>
      {/* A page's examples sit far down it: the viewport has no room under the trigger, which flips a layer measured against the page. */}
      <div style={{ blockSize: "100vh" }} />
      <DoDontPair
        doExample={<span>Do</span>}
        doCaption="A caption."
        dontExample={<FormInPopupCase />}
        dontCaption="A caption."
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-testid="column"]');
    const popup = await waitFor(() => {
      const found = canvasElement.querySelector(".plus-popup");
      expect(found, "the popup is open").not.toBeNull();
      return found;
    });
    const [, well] = canvasElement.querySelectorAll(".sb-ds-dodont-card__well");
    // Opening moves focus into the layer and scrolls it into view; a reader is at the top of the page, with the example below the fold.
    window.scrollTo(0, 0);
    // The layer places itself again after that scroll: wait until its position is the same on two looks in a row.
    let last = "";
    await waitFor(() => {
      const r = popup.getBoundingClientRect();
      const now = `${r.top}/${r.left}`;
      const settled = now === last;
      last = now;
      expect(settled, "the layer has settled").toBe(true);
    });
    const layer = popup.getBoundingClientRect();
    const box = well.getBoundingClientRect();
    await expect(layer.top, "the layer starts inside its well").toBeGreaterThanOrEqual(box.top - 1);
    await expect(layer.bottom, "the layer ends inside its well").toBeLessThanOrEqual(box.bottom + 1);
    await expect(layer.left, "the layer stays inside its well at the start").toBeGreaterThanOrEqual(box.left - 1);
    await expect(layer.right, "the layer stays inside its well at the end").toBeLessThanOrEqual(box.right + 1);
    const stage = popup.closest("[data-popup-stage]").getBoundingClientRect();
    await expect(layer.right, "the stage is wide enough that it does not cut the layer").toBeLessThanOrEqual(stage.right + 1);
    await expectColumnHolds(column);
  },
};
