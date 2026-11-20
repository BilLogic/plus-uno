/**
 * The view control of a full-page preview, run in a browser. The jsdom tests
 * check the markup; this checks the layout: Fit shows the whole page with no
 * sideways overflow, a zoom change rescales it, Full screen opens and closes.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/chrome/BrowserFrame.stories.jsx
 */
import React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

export default {
  // A test harness, not a page: `!dev` keeps it out of the sidebar while the
  // Storybook tests still run it.
  title: "Get started/Browser frame",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded", browserFrame: "chrome" },
};

// A desktop page wider than any docs column.
const PAGE_WIDTH = 1400; // docs-literal: a page wider than any docs column, the case Fit exists for

const WidePage = () => (
  <div
    data-testid="wide-page"
    style={{
      inlineSize: PAGE_WIDTH,
      blockSize: "calc(var(--card-min-width-md) * 2)", // docs-literal: a tall demo page, no role token is a page height
      background: "var(--ds-surface-sunken)",
    }}
  >
    A page laid out at its real width
  </div>
);

export const ViewControl = {
  render: () => <WidePage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const well = canvasElement.querySelector(".plus-page-view__well");
    const page = canvas.getByTestId("wide-page");

    // A story's own canvas keeps real size; Fit (the default on a docs page) shows the whole page, scaled, with no sideways scroll.
    await expect(canvas.getByRole("button", { name: "100%" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Fit" }));
    await expect(canvas.getByRole("button", { name: "Fit" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(well.dataset.scale).not.toBe("1"));
    const box = page.getBoundingClientRect();
    await expect(box.right, "Fit draws the whole page inside the well").toBeLessThanOrEqual(well.getBoundingClientRect().right + 1);
    await expect(getComputedStyle(well).overflowX, "Fit leaves nothing to scroll sideways").not.toBe("auto");
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
    await expect(box.width, "the page keeps its real layout width").toBeCloseTo(PAGE_WIDTH * Number(well.dataset.scale), 0);
    // The well is as tall as the scaled page: no dead space under it.
    await expect(well.offsetHeight).toBeLessThanOrEqual(Math.ceil(box.height) + 1);

    // A zoom change rescales without relayout.
    await userEvent.click(canvas.getByRole("button", { name: "50%" }));
    await waitFor(() => expect(well.dataset.scale).toBe("0.5"));
    await expect(page.offsetWidth).toBe(PAGE_WIDTH);

    // 100% is actual size and scrolls inside its own well.
    await userEvent.click(canvas.getByRole("button", { name: "100%" }));
    await waitFor(() => expect(getComputedStyle(well).overflowX).toBe("auto"));
    await expect(well.scrollWidth).toBeGreaterThan(well.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
  },
};

/** A page sized by the viewport must keep its height at Fit, not be squashed into the scaled box. */
export const ViewportHeightPage = {
  render: () => (
    <div data-testid="tall-page" style={{ inlineSize: PAGE_WIDTH, minBlockSize: "100vh" }}>
      A page that is at least as tall as the viewport
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const well = canvasElement.querySelector(".plus-page-view__well");
    const page = canvas.getByTestId("tall-page");
    await userEvent.click(canvas.getByRole("button", { name: "Fit" }));
    await waitFor(() => expect(Number(well.dataset.scale)).toBeLessThan(1));
    await expect(page.offsetHeight, "the page keeps its viewport height").toBeGreaterThanOrEqual(window.innerHeight);
    await expect(well.offsetHeight, "the well follows the scaled page").toBeCloseTo(Math.ceil(page.offsetHeight * Number(well.dataset.scale)), 0);
  },
};

export const FocusableScrollRegion = {
  render: () => <WidePage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "100%" }));
    const region = await canvas.findByLabelText("Page preview, scrollable");
    await expect(region).toHaveAttribute("tabindex", "0");
    region.focus();
    await expect(region).toHaveFocus();
  },
};

export const FullScreen = {
  render: () => <WidePage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Full screen" });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole("dialog", { name: "Full screen preview" });
    const box = dialog.getBoundingClientRect();
    await expect(box.width, "the layer fills the viewport").toBeCloseTo(window.innerWidth, 0);
    await expect(box.height).toBeCloseTo(window.innerHeight, 0);
    await expect(within(dialog).getByTestId("wide-page").offsetWidth).toBe(PAGE_WIDTH);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(canvas.getByRole("button", { name: "Full screen" })).toHaveFocus());
  },
};
