// What a turn whose answer leaves the team may read (#903).
//
// An @uno ask in a Figma comment is answered in the file, and people outside
// the team can open a file. So a turn with the `figma` origin runs every tool
// at PUBLIC SCOPE (`SlackContext.publicOnly`), each estate by the rule the
// house already keeps for it:
//
//   • SLACK — public channels alone. `slack_search` runs no private pass and
//     `slack_thread_read` refuses a private conversation, in their own bodies.
//     A canvas, or any other Slack link, is not read through `source_read`, and
//     the people lookups (`slack_user_profile`, `slack_channel_members`) are
//     refused: who is in a channel says which private channels exist.
//   • NOTION — team surfaces alone, by the rule the sweep reads its sources by
//     (`sweep/surfaces.ts` § isTeamSurface): a row of the Roadmap, the Help
//     Centers, the Decisions log or the Marketplace, or a top-level spec page;
//     never a running note. A page is checked on the parent Notion reports
//     before `source_read` returns a word of it; a workspace search keeps
//     only the hits on a team surface; a catalog search runs only over a team
//     surface's database. Anything else is refused.
//   • GITHUB — public repos alone, by GitHub's own flag (`githubRepoVisibility`);
//     a repo GitHub will not say of counts as private. `source_read` fetches
//     GitHub without a token, so it reaches public repos alone already.
//
// An ASKER TEAM MEMBERS DOES NOT MAP (`SlackContext.unmappedAsker`) gets public
// facts only: no Slack and no Notion at all, and no blueprint or Roadmap — only
// what anyone on the web could open: a public link, a public repo, uno's own
// playbook.
//
// A refusal is an ordinary tool result, `{ ok: false, error }`, so the model
// reads why and answers from what it has, or says it could not find it.
//
// The rule is pure over `PublicScopeDeps`; `publicScopeDepsFor` at the foot
// binds it to `Env`.

import type { Env, SlackContext } from "../types";
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
  /** A `notion_search` catalog scope's database id; undefined for none. */
  catalogDb(scope: string): string | undefined;
  /** A Notion page's title and parent, as Notion reports them. Throws when it cannot be read. */
  notionPage(pageId: string): Promise<{ title: string; parentDatabaseId: string | null; parentType: string | null }>;
  /** Who can read the repo a GitHub tool's `repo` input resolves to; `unlisted`
   *  when it resolves to none, which the tool itself refuses. */
  repoVisibility(requested: unknown): Promise<RepoVisibility | "unlisted">;
}

/** What an unmapped asker's turn may run: what anyone on the web could open. */
const PUBLIC_FACTS: ReadonlySet<ToolName> = new Set<ToolName>(["source_read", "github_read", "github_intake_search", "read_reference", "present"]);

/** Refused on every public-scope turn. */
const PEOPLE_LOOKUPS: ReadonlySet<ToolName> = new Set<ToolName>(["slack_user_profile", "slack_channel_members"]);

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
  slack: Pick<SlackContext, "publicOnly" | "unmappedAsker">,
  run: () => Promise<string>,
  deps: PublicScopeDeps,
): Promise<string> {
  if (!slack.publicOnly) return run();
  if (slack.unmappedAsker && !PUBLIC_FACTS.has(name)) {
    return refuse(`'${name}' reads the team's own estates, and this asker is not on Team Members: public facts only`);
  }
  if (PEOPLE_LOOKUPS.has(name)) return refuse(`'${name}' is not run for an answer posted outside Slack`);

  switch (name) {
    case "source_read":
      return (await sourceRefusal(input, slack.unmappedAsker === true, deps)) ?? run();
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

/** Why a link may not be read at public scope; null when it may. */
async function sourceRefusal(input: Record<string, unknown>, unmapped: boolean, deps: PublicScopeDeps): Promise<string | null> {
  const url = sourceUrlOf(input);
  if (!url) return null;
  const estate = isNotionUrl(url) ? "notion" : estateOfUrl(url);
  if (estate === "slack") return refuse("a Slack link is not read for an answer posted outside Slack");
  if (estate !== "notion") return null;
  if (unmapped) return refuse("a Notion page is not read for an asker who is not on Team Members");
  const pageId = parseNotionPageId(url);
  if (!pageId) return null;
  let page: Awaited<ReturnType<PublicScopeDeps["notionPage"]>>;
  try {
    page = await deps.notionPage(pageId);
  } catch (err) {
    rethrowIfBudget(err);
    return refuse("that Notion page could not be checked as a team surface, so it is not read");
  }
  return isTeamSurface({ kind: "notion", ...page }, deps.surfaces)
    ? null
    : refuse("that Notion page is not on a team surface (the Roadmap, the Help Centers, the Decisions log, the Marketplace or a spec page), so it is not read for an answer posted outside Slack");
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
    isTeamSurface(
      {
        kind: "notion",
        title: typeof hit.title === "string" ? hit.title : "",
        parentDatabaseId: typeof hit.parentDatabaseId === "string" ? hit.parentDatabaseId : null,
        parentType: typeof hit.parentType === "string" ? hit.parentType : null,
      },
      deps.surfaces,
    ),
  );
  return JSON.stringify({ ...parsed, count: results.length, results });
}

function isNotionUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase() === "app.notion.com";
  } catch {
    return false;
  }
}

function bare(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

/**
 * The rule's reads on `Env`: the sweep's team surfaces, Notion's page read
 * (cached, so the tool's own read of a page that passes costs nothing more),
 * and GitHub's repo flag.
 *
 * @param env - Worker bindings
 */
export function publicScopeDepsFor(env: Env): PublicScopeDeps {
  return {
    surfaces: teamSurfacesFor(env),
    catalogDb: (scope) => catalogDatabaseOf(env, scope),
    notionPage: (pageId) => readNotionPage(env, pageId),
    async repoVisibility(requested) {
      const target = resolveRepoFor(env, requested);
      return target.ok ? githubRepoVisibility(env, target.entry) : "unlisted";
    },
  };
}
