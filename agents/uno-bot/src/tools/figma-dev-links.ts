// figma_dev_links executor — a Dev Mode links card's one operation, past its
// Review's Approve: the card's links that are still missing go into Figma,
// with one labelled comment the first time a component gets its links. What
// it decides is `figma-links/run.ts` (`writeDevLinks`); this file only binds
// `Env`.

import type { Env } from "../types";
import { figmaClientFor } from "../figma/production";
import { writeDevLinks } from "../figma-links/run";
import { rethrowIfBudget } from "../net";

/** Approve on a Dev Mode links card, on `Env`. */
export async function executeDevLinks(env: Env, input: Record<string, unknown>): Promise<string> {
  const figma = figmaClientFor(env);
  if (!figma) return JSON.stringify({ ok: false, error: "FIGMA_ACCESS_TOKEN not set — no links added" });
  try {
    return await writeDevLinks(figma, input);
  } catch (err) {
    rethrowIfBudget(err);
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
