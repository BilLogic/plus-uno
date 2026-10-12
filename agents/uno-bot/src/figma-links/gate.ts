// When Dev Mode links may be offered, and for how many components.
//
// uno-bot's first Figma write is checked live on ONE component with Bill
// before the rest (#904): whether a link on a component's library component
// reaches its variants is Figma behaviour no fixture can show. Bill named the
// component: Button. So until the `FIGMA_DEV_LINKS` setting reads `on`, a run
// names Button alone, the 68 do not run, and a merged library PR's link waits
// in its queue. Every run
// still posts Review cards and writes nothing until one is approved.
//
// PURE.

import type { DevLinksRequest } from "./run";

/** The one component the live check runs on. */
export const LIVE_CHECK_COMPONENT = "Button";

/** Whether the setting lets the whole registry, and merged PRs, through. */
export function devLinksOn(setting: string | undefined): boolean {
  return setting?.trim().toLowerCase() === "on";
}

/**
 * The request a manual run makes, or why it is refused.
 *
 * @param params - `component`: names, comma-separated; `all`: every registry component
 * @param setting - `FIGMA_DEV_LINKS`
 */
export function devLinksRequestOf(
  params: { component?: string | null; all?: boolean },
  setting: string | undefined,
): { request: DevLinksRequest } | { refused: string } {
  const on = devLinksOn(setting);
  if (params.all) {
    return on
      ? { request: { all: true } }
      : { refused: "every component waits until FIGMA_DEV_LINKS is on, after the live check on one component" };
  }
  const names = [...new Set((params.component ?? "").split(",").map((n) => n.trim()).filter(Boolean))];
  if (!names.length) return { refused: "name a component (component=Button), or all=1" };
  if (!on && (names.length > 1 || names[0] !== LIVE_CHECK_COMPONENT)) {
    return { refused: `${LIVE_CHECK_COMPONENT} alone until FIGMA_DEV_LINKS is on: it is the live check's component` };
  }
  return { request: { components: names } };
}
