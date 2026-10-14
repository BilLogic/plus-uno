// notion_create executor — creates a page/card in a convention Notion surface
// (prd / intake / decision), or creates or updates the Prototype Marketplace
// row for one prototype (marketplace), then posts the link. Side effect → routed
// through the ✅ gate. Component PRDs and research notes are not bot surfaces:
// component PRDs are regular feature PRDs on the Roadmap, and deep research is
// an IDE-only skill that writes to the project hub's Research page. A created
// page opens with the attribution line naming the requester
// (`integrations/notion-attribution.ts`).

import type { Env } from "../types";
import type { SlackContext } from "../types";
import { postMessage } from "../slack/api";
import { escapeSlackText } from "../slack/mrkdwn";
import { notionCreate, type NotionCreateSurface, type PrdSection } from "../integrations/notion";
import { MarketplaceQuestion, marketplaceInputOf, publishMarketplaceRow } from "../integrations/notion-marketplace";
import { requesterName } from "./requester-name";

const SURFACES = new Set<NotionCreateSurface>(["prd", "intake", "decision", "marketplace"]);

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

/**
 * Create a Notion page on a convention surface and post the link in-thread.
 * @param env - Worker bindings
 * @param input - Tool args from the model
 * @param slack - Thread context for the outcome message
 */
export async function executeNotionCreate(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const surface = asString(input.surface).toLowerCase() as NotionCreateSurface;
  const title = asString(input.title);
  if (!SURFACES.has(surface)) {
    return JSON.stringify({ ok: false, error: `unknown or unsupported surface '${surface}'` });
  }
  if (!title) return JSON.stringify({ ok: false, error: "missing 'title'" });
  if (surface === "marketplace") return publishToMarketplace(env, input, title, slack);

  // Split the model's freeform `properties` into known keys and body extras.
  const props =
    input.properties && typeof input.properties === "object"
      ? (input.properties as Record<string, unknown>)
      : {};
  const productPillar = asString(props.product_pillar) || asString(input.product_pillar);
  const roadmapCard =
    asString(props.roadmap_card) ||
    asString(props["Roadmap Card"]) ||
    asString(input.roadmap_card);
  const decisionStatus =
    asString(props.status) || asString(props.Status) || asString(input.status);
  const evidence =
    asString(props.evidence) ||
    asString(props.Evidence) ||
    asString(input.evidence);
  // Decisions DB people: Notion user ids, one or a list.
  const peopleOf = (v: unknown): string[] => (Array.isArray(v) ? asStringArray(v) : asString(v).split(",").map((x) => x.trim()).filter(Boolean));
  const owner = peopleOf(props.owner ?? props.Owner);
  const signOff = peopleOf(props.sign_off ?? props["Sign-off"]);
  const extras: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    const key = k.toLowerCase().replace(/[\s_-]+/g, "");
    if (["productpillar", "roadmapcard", "status", "evidence", "owner", "signoff"].includes(key)) {
      continue;
    }
    if (typeof v === "string" && v.trim()) extras[k] = v.trim();
  }
  if (evidence) extras.evidence = evidence;

  if (surface === "decision" && !roadmapCard) {
    return JSON.stringify({
      ok: false,
      error: "decision requires properties.roadmap_card (Roadmap page URL or id)",
    });
  }

  try {
    const created = await notionCreate(env, surface, {
      title,
      summary: asString(input.summary) || undefined,
      sections: asSections(input.sections),
      acceptanceCriteria: asStringArray(input.acceptance_criteria),
      productPillar: productPillar || undefined,
      sourceUrl: asString(input.source_url) || evidence || undefined,
      extras,
      roadmapCard: roadmapCard || undefined,
      decisionStatus: decisionStatus || undefined,
      ...(surface === "decision" && owner.length ? { owner } : {}),
      ...(surface === "decision" && signOff.length ? { signOff } : {}),
      onBehalfOf: await requesterName(env, slack),
    });
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      // Escaped inside the label: a `>` in the title would end the link.
      text: `Created <${created.url}|${escapeSlackText(title)}> in ${created.label}.`,
    });
    return JSON.stringify({
      ok: true,
      status: "created",
      surface,
      url: created.url,
      message: `Created '${title}' on ${created.label}.`,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:x: Couldn't create in Notion — ${detail}`,
    });
    return JSON.stringify({ ok: false, status: "notion_failed", detail });
  }
}

/** Create or update the Marketplace row, and post where it landed. A value the
 *  database cannot take goes back to the requester as a question. */
async function publishToMarketplace(
  env: Env,
  input: Record<string, unknown>,
  title: string,
  slack: SlackContext,
): Promise<string> {
  try {
    const row = await publishMarketplaceRow(env, {
      ...marketplaceInputOf(input),
      name: title,
      onBehalfOf: await requesterName(env, slack),
    });
    const verb = row.status === "updated" ? "Updated" : "Created";
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `${verb} <${row.url}|${escapeSlackText(title)}> in ${row.label}.`,
    });
    return JSON.stringify({
      ok: true,
      status: row.status,
      surface: "marketplace",
      url: row.url,
      message: `${verb} '${title}' on ${row.label}.`,
    });
  } catch (err) {
    if (err instanceof MarketplaceQuestion) {
      return JSON.stringify({
        ok: false,
        status: "needs_input",
        question: err.message,
        message: "Nothing was written. Put the question to the requester, then stage the publish again with their answer.",
      });
    }
    const detail = err instanceof Error ? err.message : String(err);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:x: Couldn't publish to the Marketplace — ${detail}`,
    });
    return JSON.stringify({ ok: false, status: "notion_failed", detail });
  }
}
