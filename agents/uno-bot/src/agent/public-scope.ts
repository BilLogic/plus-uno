// What a turn whose answer leaves the team may read.
//
// An @uno ask in a Figma comment is answered in the file, and people outside
// the team can open a file. So a turn with the `figma` origin runs every tool
// at PUBLIC SCOPE (`SlackContext.publicOnly`). The rule is an ALLOWLIST: a
// tool runs only when `CLASSIFIED` below names it, so a tool added later is
// refused on a Figma turn until someone classifies it. Each estate keeps the
// rule the house already keeps for it:
//
//   • SLACK — public channels alone. `slack_search` runs no private pass and
//     `slack_thread_read` refuses a private conversation, in their own bodies.
//     A canvas, or any other Slack link, is not read through `source_read`.
//     The people lookups (`slack_user_profile`, `slack_channel_members`) are
//     refused, since who is in a channel says which private channels exist,
//     and so is `slack_react`, a write.
//   • NOTION — team surfaces alone: a row of the Roadmap, the Help Centers,
//     the Decisions log or the Marketplace (`sweep/surfaces.ts` §
//     isTeamSurface). A page with no database parent is refused, a top-level
//     page titled as a spec included, because any workspace member can title
//     a private page that way. A page is checked on the parent Notion reports
//     before `source_read` returns a word of it; a workspace search keeps
//     only the hits on a team surface; a catalog search runs only over a team
//     surface's database; `roadmap_query` runs only when the Roadmap is a
//     configured team surface.
//   • GITHUB — public repos alone, by GitHub's own flag (`githubRepoVisibility`);
//     a repo GitHub will not say of counts as private. `source_read` fetches
//     GitHub without a token, so it reaches public repos alone already.
//   • FIGMA — the file the comment sits on (`SlackContext.figmaFileKey`), and
//     no other: a link to another file is refused, since the Worker's token
//     opens every file the team owns. The file's frames are read without
//     their comments (`agent/tool-bodies.ts` turns `figmaComments` off).
//   • REFUSED OUTRIGHT — the blueprint (`search_blueprint`: internal
//     operations facts) and `reminder_set` (a write).
//
// An ASKER TEAM MEMBERS DOES NOT MAP (`SlackContext.unmappedAsker`) gets public
// facts only: no Slack, no Notion, no blueprint and no Roadmap, only what
// anyone on the web could open (a public link, a public repo, the comment's
// own file, uno's own playbook). The model is not offered a gated tool on that
// turn at all (`toolRosterFor` in `run-agent.ts`), so it can propose no write.
//
// A refusal is an ordinary tool result, `{ ok: false, error }`, so the model
// reads why and answers from what it has, or says it could not find it.
//
// The rule is pure over `PublicScopeDeps`; `publicScopeDepsFor` at the foot
// binds it to `Env`.

import type { Env, SlackContext } from "../types";
import { parseFigmaUrl } from "../integrations/figma-reading";
import { githubRepoVisibility, resolveRepoFor, type RepoVisibility } from "../integrations/github";
import { parseNotionPageId, readNotionPage } from "../integrations/notion";
import { rethrowIfBudget } from "../net";
import { estateOfUrl } from "../slack/estate-hosts";
import { isTeamSurface, type SurfaceConfig } from "../sweep/surfaces";
import { teamSurfacesFor } from "../sweep/team-surfaces";
import { catalogDatabaseOf } from "../tools/notion-search";
import { sourceUrlOf } from "../tools/read-source";
import type { ToolName } from "./tool-table";

/** What the rule reads. */
export interface PublicScopeDeps {
  /** The team's Notion surfaces and where the running notes live. */
  surfaces: SurfaceConfig;
  /** The Roadmap database `roadmap_query` reads; undefined when unset. */
  roadmapDb: string | undefined;
  /** A `notion_search` catalog scope's database id; undefined for none. */
  catalogDb(scope: string): string | undefined;
  /** A Notion page's title and parent, as Notion reports them. Throws when it cannot be read. */
  notionPage(pageId: string): Promise<{ title: string; parentDatabaseId: string | null; parentType: string | null }>;
  /** Who can read the repo a GitHub tool's `repo` input resolves to; `unlisted`
   *  when it resolves to none, which the tool itself refuses. */
  repoVisibility(requested: unknown): Promise<RepoVisibility | "unlisted">;
}

/**
 * Every tool a public-scope turn may run. `public` runs for any asker: what
 * anyone on the web could open. `team` runs only for an asker Team Members
 * maps. A tool not named here is refused.
 */
const CLASSIFIED: Partial<Record<ToolName, "public" | "team">> = {
  source_read: "public",
  github_read: "public",
  github_intake_search: "public",
  read_reference: "public",
  present: "public",
  notion_search: "team",
  roadmap_query: "team",
  slack_search: "team",
  slack_thread_read: "team",
};

/**
 * Whether a tool is offered to the model on this turn at all. On an unmapped
 * asker's public-scope turn only the tools that asker may run are offered, so
 * no gated tool is, and no write can be proposed.
 *
 * @param name - The tool
 * @param slack - The turn's context
 */
export function offeredAtPublicScope(name: ToolName, slack: Pick<SlackContext, "publicOnly" | "unmappedAsker">): boolean {
  if (!slack.publicOnly || !slack.unmappedAsker) return true;
  return CLASSIFIED[name] === "public";
}

const refuse = (error: string): string =>
  JSON.stringify({
    ok: false,
    error,
    note: "This answer is posted in a Figma comment, which people outside the team can open. Answer from what you could read, or say you couldn't find it.",
  });

/**
 * Run one tool at public scope: refuse it, run it, or run it and keep only the
 * results a public answer may read.
 *
 * @param name - The tool
 * @param input - Its arguments
 * @param slack - The turn's context: `publicOnly`, and `unmappedAsker`
 * @param run - The tool's body, as the dispatch would run it
 * @param deps - The surfaces, the reads and the repo visibility
 */
export async function runAtPublicScope(
  name: ToolName,
  input: Record<string, unknown>,
  slack: Pick<SlackContext, "publicOnly" | "unmappedAsker" | "figmaFileKey">,
  run: () => Promise<string>,
  deps: PublicScopeDeps,
): Promise<string> {
  if (!slack.publicOnly) return run();
  const reach = CLASSIFIED[name];
  if (!reach) return refuse(`'${name}' is not run for an answer posted outside Slack`);
  if (slack.unmappedAsker && reach !== "public") {
    return refuse(`'${name}' reads the team's own estates, and this asker is not on Team Members: public facts only`);
  }

  switch (name) {
    case "source_read":
      return (await sourceRefusal(input, slack, deps)) ?? run();
    case "roadmap_query": {
      const teamDbs = (deps.surfaces.teamSurfaceDbs ?? []).map(bare);
      if (deps.roadmapDb && teamDbs.includes(bare(deps.roadmapDb))) return run();
      return refuse("the Roadmap is not a configured team surface, so it is not queried for an answer posted outside Slack");
    }
    case "notion_search":
      return notionSearchAtPublicScope(input, run, deps);
    case "github_read":
    case "github_intake_search": {
      const visibility = await deps.repoVisibility(input.repo);
      if (visibility === "unlisted" || visibility === "public") return run();
      return refuse(`that repo is ${visibility === "private" ? "private" : "not confirmed public"}, so it is not read for an answer posted outside Slack`);
    }
    default:
      return run();
  }
}

/** A Notion page a public answer may read: a row of a team surface's database. A page with no database parent is none. */
function onTeamSurface(page: { title: string; parentDatabaseId: string | null; parentType: string | null }, surfaces: SurfaceConfig): boolean {
  return page.parentDatabaseId !== null && isTeamSurface({ kind: "notion", ...page }, surfaces);
}

/** Why a link may not be read at public scope; null when it may. */
async function sourceRefusal(
  input: Record<string, unknown>,
  slack: Pick<SlackContext, "unmappedAsker" | "figmaFileKey">,
  deps: PublicScopeDeps,
): Promise<string | null> {
  const url = sourceUrlOf(input);
  if (!url) return null;
  const estate = estateOfUrl(url);
  if (estate === "slack") return refuse("a Slack link is not read for an answer posted outside Slack");
  if (estate === "figma") {
    const asked = slack.figmaFileKey;
    return asked && parseFigmaUrl(url)?.fileKey === asked
      ? null
      : refuse("only the Figma file this comment sits on is read for an answer posted in it; another file is not");
  }
  if (estate !== "notion") return null;
  if (slack.unmappedAsker === true) return refuse("a Notion page is not read for an asker who is not on Team Members");
  const pageId = parseNotionPageId(url);
  if (!pageId) return null;
  let page: Awaited<ReturnType<PublicScopeDeps["notionPage"]>>;
  try {
    page = await deps.notionPage(pageId);
  } catch (err) {
    rethrowIfBudget(err);
    return refuse("that Notion page could not be checked as a team surface, so it is not read");
  }
  return onTeamSurface(page, deps.surfaces)
    ? null
    : refuse("that Notion page is not on a team surface (a row of the Roadmap, the Help Centers, the Decisions log or the Marketplace), so it is not read for an answer posted outside Slack");
}

/** `notion_search` over team surfaces alone. */
async function notionSearchAtPublicScope(input: Record<string, unknown>, run: () => Promise<string>, deps: PublicScopeDeps): Promise<string> {
  const scope = typeof input.scope === "string" ? input.scope.trim().toLowerCase() : "any";
  if (scope !== "any") {
    const db = deps.catalogDb(scope);
    const teamDbs = (deps.surfaces.teamSurfaceDbs ?? []).map(bare);
    if (db && teamDbs.includes(bare(db))) return run();
    return refuse(`the '${scope}' scope is not a team surface, so it is not searched for an answer posted outside Slack`);
  }
  const out = await run();
  let parsed: { ok?: unknown; results?: unknown; count?: unknown };
  try {
    parsed = JSON.parse(out) as typeof parsed;
  } catch {
    return refuse("the search's result could not be checked, so it is not read");
  }
  if (parsed.ok !== true || !Array.isArray(parsed.results)) return out;
  const results = (parsed.results as Array<{ title?: unknown; parentDatabaseId?: unknown; parentType?: unknown }>).filter((hit) =>
    onTeamSurface(
      {
        title: typeof hit.title === "string" ? hit.title : "",
        parentDatabaseId: typeof hit.parentDatabaseId === "string" ? hit.parentDatabaseId : null,
        parentType: typeof hit.parentType === "string" ? hit.parentType : null,
      },
      deps.surfaces,
    ),
  );
  return JSON.stringify({ ...parsed, count: results.length, results });
}

function bare(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

/**
 * The rule's reads on `Env`: the sweep's team surfaces, the Roadmap's id, Notion's page read
 * (cached, so the tool's own read of a page that passes costs nothing more),
 * and GitHub's repo flag.
 *
 * @param env - Worker bindings
 */
export function publicScopeDepsFor(env: Env): PublicScopeDeps {
  return {
    surfaces: teamSurfacesFor(env),
    roadmapDb: env.NOTION_ROADMAP_DB_ID?.trim() || undefined,
    catalogDb: (scope) => catalogDatabaseOf(env, scope),
    notionPage: (pageId) => readNotionPage(env, pageId),
    async repoVisibility(requested) {
      const target = resolveRepoFor(env, requested);
      return target.ok ? githubRepoVisibility(env, target.entry) : "unlisted";
    },
  };
}
