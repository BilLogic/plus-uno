// The team's Notion surfaces on `Env`: where the running notes live, and the
// databases the team writes its specs and answers in (`./surfaces.ts`). One
// binding, read by every path that asks whether a page is a team surface —
// the sweep, the DM capture, and a Figma ask's public scope.

import type { Env } from "../types";
import type { SurfaceConfig } from "./surfaces";

/**
 * The surfaces as the Worker is configured.
 *
 * @param env - Worker bindings
 */
export function teamSurfacesFor(env: Env): SurfaceConfig {
  return {
    runningNotesDb: env.NOTION_RUNNING_NOTES_DB_ID?.trim() || undefined,
    teamSurfaceDbs: [
      env.NOTION_ROADMAP_DB_ID,
      env.NOTION_HELP_TUTORS_DB_ID,
      env.NOTION_HELP_TEACHERS_DB_ID,
      env.NOTION_DECISIONS_DB_ID,
      env.NOTION_MARKETPLACE_DB_ID,
    ].flatMap((id) => (id?.trim() ? [id.trim()] : [])),
  };
}
