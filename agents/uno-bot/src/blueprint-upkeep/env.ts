// Blueprint upkeep bound to `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • the Roadmap: one status query on `Design Status: Shipped` or `Dev
//     Status: Deployed`, narrowed to cards edited since the cursor
//     (`queryRowsWithAnyStatus`), one page of 100;
//   • the evidence: the card's page text and its PRD's (`readNotionPage`,
//     through `cardEvidence`);
//   • the gate's search: `search_blueprint`'s read (`searchBlueprint`);
//   • the path read: four anon-key PostgREST reads of uno-blueprint — the
//     matched cell's path, then that path's cells, lanes and ordered steps;
//   • the model: the Worker's provider (`selectProvider`), one tier a call;
//   • the owner: the card's first Contributor, through the Team Members
//     directory then by name (card follow-ups' `peopleFor`);
//   • the place: card follow-ups' ladder (`cardPlace`);
//   • Bill: `LEAD_USER_ID`, the deployment's lead;
//   • the state: one JSON record in HARNESS_KV.
//
// Budget (ADR-022), per card weighed: the page and up to three block pages
// (4), its one PRD the same (4), the judgement (1), the search (≤3), the path
// read (4), the draft (1-2), a Slack lookup or two for the owner — about 15
// on a typical card, 20 at the worst, so `MAX_CARDS_PER_RUN` (2) and the
// Roadmap query fit one alarm's ceiling unless both cards are at their worst;
// `measured` stops the run there. A promotion reads only the path (4) and
// the owner.

import type { Env } from "../types";
import { countedFetch } from "../net";
import { selectProvider } from "../agent/run-agent";
import { channelIdsFor } from "../destination/env";
import { queryRowsWithAnyStatus, readNotionPage } from "../integrations/notion";
import { searchBlueprint, isBlueprintConfigured } from "../integrations/blueprint";
import { cellUrl } from "../integrations/blueprint-link";
import { ENTITY_STATUSES, type EntityStatus } from "../blueprint-write/index";
import { kvJson } from "../figma-poll";
import { measured } from "../sweep/env";
import { sectionHandOffIn, type SweepSection } from "../sweep/sections";
import { cardPlace } from "../follow-through/run";
import { peopleFor } from "../follow-through/env";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import { threadStateFor } from "../thread-state/production";
import type { JobContext } from "../scheduled/runs";
import type { PendingProposal } from "../thread-state/index";
import { serviceChangeGate } from "./gate";
import type { PathToday } from "./draft";
import { cardEvidence } from "./evidence";
import { stageOf, STAGES } from "./stages";
import {
  handOverRevisions,
  revisionSection,
  runShippedRevisions,
  UPKEEP_SECTION,
  type RevisionHanded,
  type ShippedCard,
  type ShippedReport,
  type UpkeepState,
} from "./job";

const STATE_KV_KEY = "blueprint-upkeep:state";
const EMPTY: UpkeepState = { cursor: null, seen: [], waiting: [] };

const stateFor = (env: Env) => kvJson<UpkeepState>(env, STATE_KV_KEY, EMPTY);

async function shippedSince(env: Env, since: string): Promise<ShippedCard[]> {
  if (!env.NOTION_ROADMAP_DB_ID) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  const { rows } = await queryRowsWithAnyStatus(env, env.NOTION_ROADMAP_DB_ID, [STAGES.designed, STAGES.deployed], 100, {
    timestamp: "last_edited_time",
    last_edited_time: { on_or_after: since },
  });
  return rows.flatMap((row) => {
    const stage = stageOf(row.values);
    if (!stage) return [];
    return [
      {
        pageId: row.id,
        url: row.url,
        title: row.title,
        number: row.number ?? null,
        stage,
        pillars: row.values["Product Pillar"] ?? [],
        contributors: row.persons.Contributor ?? [],
        lastEditedAt: Date.parse(row.lastEditedTime) || 0,
      },
    ];
  });
}

/** One anon-key PostgREST read of uno-blueprint. */
async function rest<T>(env: Env, table: string, qs: string): Promise<T[]> {
  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const res = await countedFetch(`${base}/rest/v1/${table}?${qs}`, {
    headers: { apikey: env.SUPABASE_ANON_KEY!, authorization: `Bearer ${env.SUPABASE_ANON_KEY!}` },
  });
  if (!res.ok) throw new Error(`blueprint ${table} read failed (${res.status})`);
  return (await res.json()) as T[];
}

const asStatus = (v: unknown): EntityStatus => (ENTITY_STATUSES.includes(v as EntityStatus) ? (v as EntityStatus) : "live");

/**
 * Today's path holding a cell: its scenario, its status, its lanes and steps
 * in order, and every cell on it.
 *
 * @param env - Worker bindings
 * @param cellId - A cell the gate matched
 */
export async function readPathOf(env: Env, cellId: string): Promise<PathToday | null> {
  if (!isBlueprintConfigured(env)) return null;
  const id = encodeURIComponent(cellId);
  const [held] = await rest<{ path_id: string }>(env, "cells", `select=path_id&id=eq.${id}`);
  if (!held) return null;
  const pathId = encodeURIComponent(held.path_id);
  const [[path], cells, lanes, steps] = await Promise.all([
    rest<{ id: string; name: string; status: string; scenarios: { name: string } | null }>(env, "paths", `select=id,name,status,scenarios(name)&id=eq.${pathId}`),
    rest<{ id: string; lane_id: string; step_id: string; content: string | null; status: string }>(
      env,
      "cells",
      `select=id,lane_id,step_id,content,status&path_id=eq.${pathId}`,
    ),
    rest<{ id: string; name: string; position: number }>(env, "lanes", `select=id,name,position&path_id=eq.${pathId}&order=position`),
    rest<{ position: number; steps: { id: string; name: string } | null }>(env, "path_steps", `select=position,steps(id,name)&path_id=eq.${pathId}&order=position`),
  ]);
  if (!path) return null;
  const stepOrder = steps.flatMap((s) => (s.steps ? [{ id: s.steps.id, name: s.steps.name }] : []));
  const at = (stepId: string) => stepOrder.findIndex((s) => s.id === stepId);
  const laneAt = (laneId: string) => lanes.findIndex((l) => l.id === laneId);
  const ordered = [...cells].sort((a, b) => at(a.step_id) - at(b.step_id) || laneAt(a.lane_id) - laneAt(b.lane_id));
  const first = ordered[0]?.id ?? cellId;
  const link = cellUrl(env.BLUEPRINT_APP_URL, first);
  return {
    pathId: path.id,
    scenario: path.scenarios?.name ?? "",
    path: path.name,
    status: asStatus(path.status),
    lanes: lanes.map((l) => ({ id: l.id, name: l.name })),
    steps: stepOrder,
    cells: ordered.map((c) => ({ id: c.id, laneId: c.lane_id, stepId: c.step_id, content: c.content ?? "", status: asStatus(c.status) })),
    ...(link ? { link } : {}),
  };
}

/**
 * The end-of-day read on `Env`.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` keeps nothing
 */
export async function runShippedRevisionsOnEnv(env: Env, opts: JobContext): Promise<ShippedReport> {
  if (!env.NOTION_ROADMAP_DB_ID || !env.NOTION_API_KEY) return { drafted: 0, summary: "Notion not configured — read skipped" };
  if (!isBlueprintConfigured(env)) return { drafted: 0, summary: "uno-blueprint not configured — read skipped" };
  if (!env.HARNESS_KV) return { drafted: 0, summary: "HARNESS_KV not bound — nowhere to keep revisions; read skipped" };
  const provider = selectProvider(env);
  const people = peopleFor(env);
  const config = channelIdsFor(env);
  return runShippedRevisions(
    {
      roadmap: { shippedSince: (since) => measured(() => shippedSince(env, since)) },
      evidence: (card) => cardEvidence((pageId) => measured(() => readNotionPage(env, pageId)), card.pageId),
      gate: serviceChangeGate({ provider, search: async (q) => (await measured(() => searchBlueprint(env, q))).rows }),
      readPath: (cellId) => measured(() => readPathOf(env, cellId)),
      provider,
      async ownerOf(card) {
        const first = card.contributors[0];
        return first ? people.slackIdForNotionUser(first.id, first.name) : null;
      },
      placeOf: (card) => cardPlace(card, config),
      billId: env.LEAD_USER_ID?.trim() || null,
      state: stateFor(env),
      now: () => Date.now(),
    },
    opts,
  );
}

/**
 * The morning hand-over on `Env`.
 *
 * @param env - Worker bindings
 * @param opts - The morning run
 */
export async function runRevisionPostOnEnv(env: Env, opts: JobContext): Promise<{ summary: string }> {
  if (!env.HARNESS_KV) return { summary: "HARNESS_KV not bound — nothing handed over" };
  return handOverRevisions(
    {
      state: stateFor(env),
      ...(opts.runStorage ? { handOff: sectionHandOffIn<RevisionHanded>(opts.runStorage, UPKEEP_SECTION) } : {}),
      date: opts.runDate,
    },
    opts,
  );
}

/**
 * The revisions' section of the sweep's morning message, or undefined without
 * KV or the run's storage.
 *
 * @param env - Worker bindings
 * @param opts - The morning run
 */
export function revisionSectionFor(env: Env, opts: JobContext): SweepSection | undefined {
  if (!env.HARNESS_KV || !opts.runStorage) return undefined;
  return revisionSection(
    { state: stateFor(env), stage: (proposal) => stageRevisionCard(env, proposal) },
    sectionHandOffIn<RevisionHanded>(opts.runStorage, UPKEEP_SECTION),
    opts.runDate,
  );
}

/** Stage a revision card the Worker posted, and record it as staged. */
async function stageRevisionCard(env: Env, proposal: PendingProposal): Promise<void> {
  const { retired } = await threadStateFor(env).putProposal(proposal);
  const now = Date.now();
  await recordProposalEvents(proposalEventLogFor(env), [
    ...supersededEvents(retired, now, "worker"),
    stagedEvent({ proposal, at: now, via: "worker", channelStored: true }),
  ]);
}
