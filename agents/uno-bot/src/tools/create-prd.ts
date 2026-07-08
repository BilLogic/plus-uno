// create_prd executor — creates a PRD card on the Roadmap board (Notion) in the
// "Need PRD / Under Playground" column, then posts the link back to the thread.
//
// Unlike implement/implement_design (which fire a GitHub Action that later posts
// the PR link), this runs entirely in the Worker: the Notion page is created
// synchronously, so the executor posts the resulting link itself.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";
import { createPrdCard, type PrdSection, type PrdBoard } from "../integrations/notion";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asSections(v: unknown): PrdSection[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return { heading: asString(o.heading), body: asString(o.body) };
    })
    .filter((s) => s.heading);
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
}

export async function executeCreatePrd(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const title = asString(input.title);
  if (!title) {
    return JSON.stringify({ ok: false, error: "missing 'title' for the PRD" });
  }

  // Route by PRD type: DS-component PRDs go to the DS Component PRDs DB; feature
  // PRDs (default) go to the Roadmap board. Fall back to Roadmap if the
  // component DB isn't configured yet.
  const requestedType = asString(input.prd_type).toLowerCase();
  let board: PrdBoard = requestedType === "ds-component" ? "component" : "roadmap";
  let fellBack = false;
  if (board === "component" && !env.NOTION_DS_COMPONENT_DB_ID) {
    console.warn("[create_prd] NOTION_DS_COMPONENT_DB_ID unset — filing ds-component PRD to Roadmap");
    board = "roadmap";
    fellBack = true;
  }
  const boardName = board === "component" ? "DS Component PRDs" : "Design HQ → Product (Roadmap)";

  try {
    const created = await createPrdCard(env, {
      title,
      summary: asString(input.summary) || undefined,
      sections: asSections(input.sections),
      acceptanceCriteria: asStringArray(input.acceptance_criteria),
      productPillar: asString(input.product_pillar) || undefined,
      sourceUrl: asString(input.source_url) || undefined,
    }, board);

    // The page is live now — post the link to the thread (no Action will).
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:memo: PRD created on *${boardName}*${fellBack ? " (DS Component PRDs DB not configured — filed to Roadmap)" : ""}: <${created.url}|${title}>`,
    });

    return JSON.stringify({ ok: true, status: "created", url: created.url, board, message: `PRD '${title}' created on ${boardName}.` });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:x: Couldn't create the PRD in Notion — ${detail}`,
    });
    return JSON.stringify({ ok: false, status: "notion_failed", detail });
  }
}
