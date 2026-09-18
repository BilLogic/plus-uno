// The tool table's other half: one body per row, paired by type.
//
// `TOOL_BODIES` is a `Record<ToolName, ToolBody>`, which is the whole point —
// a row in `tool-table.ts` with no body here, or a body here for a name that
// is not a row, fails `tsc`. Diagnostics pairs its probes the same way
// (`src/diagnostics/index.ts`), and for the same reason: a registry whose two
// halves are two independent lists is a registry that loses an entry quietly.
//
// This module names `Env` and imports every tool body, so it is the half that
// is not pure — but it still compiles and loads in the Node test build, which
// is where the pairing gets its runtime second reading. It reaches the tool
// bodies DIRECTLY rather than through the two dispatches, so that neither the
// agent entry's per-turn bookkeeping nor the Gate's Durable Object imports
// come with them.
//
// A BODY IS THE TOOL, NOT THE TURN. Three of the read arms are wrapped where
// they are dispatched, in `agent/run-agent.ts`: a correction turn forces
// `search_blueprint` to re-fetch, and `search_blueprint`, `slack_search` and
// `read_reference` each leave a per-turn receipt. Those wrappers read the
// turn's scope, which is the dispatch's knowledge and not the tool's, so they
// stay there — and a dispatch folded onto this table has to keep composing
// them around the body rather than assume the body carries them.
import type { Env, SlackContext } from "../types";
import { executeNotionSearch } from "../tools/notion-search";
import { executeRoadmapQuery } from "../tools/roadmap-query";
import { executeBlueprintSearch } from "../tools/blueprint-search";
import { executeReadSource } from "../tools/read-source";
import { executeGithubRead } from "../tools/github-read";
import { executeSlackThreadRead } from "../tools/slack-thread-read";
import { executeSlackSearch } from "../tools/slack-search";
import { executeSlackUserProfile, executeSlackChannelMembers } from "../tools/slack-people";
import { executeSlackReact } from "../tools/slack-react";
import { readReference } from "../tools/read-reference";
import { executeImplement } from "../tools/implement";
import { executeImplementDesign } from "../tools/implement-design";
import { executeNotionCreate } from "../tools/notion-create";
import { executeNotionUpdate } from "../tools/notion-update";
import { executeNotionArchive } from "../tools/notion-archive";
import { executeSendEmail } from "../tools/send-email";
import { executeShareForFeedback } from "../tools/share-for-feedback";
import type { ToolName } from "./tool-table";

/**
 * A tool body: the environment, the arguments the model sent and where the
 * conversation is happening, in — one JSON string out, which goes straight
 * into a `tool_result` content block.
 *
 * A body never throws for a bad argument; it answers `{ ok: false, error }`,
 * because the model is the reader and a thrown turn tells it nothing.
 */
export type ToolBody = (
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
) => Promise<string>;

export const TOOL_BODIES: Record<ToolName, ToolBody> = {
  roadmap_query: (env, input) => executeRoadmapQuery(env, input),
  notion_search: (env, input) => executeNotionSearch(env, input),
  source_read: (env, input, slack) => executeReadSource(env, input, slack),
  search_blueprint: (env, input) => executeBlueprintSearch(env, input),
  github_read: (env, input) => executeGithubRead(env, input),
  slack_user_profile: (env, input) => executeSlackUserProfile(env, input),
  slack_channel_members: (env, input) => executeSlackChannelMembers(env, input),
  slack_thread_read: (env, input) => executeSlackThreadRead(env, input),
  slack_react: (env, input, slack) => executeSlackReact(env, input, slack),
  slack_search: (env, input, slack) => executeSlackSearch(env, input, slack),
  read_reference: async (_env, input) => readReference(input),
  notion_create: (env, input, slack) => executeNotionCreate(env, input, slack),
  notion_update: (env, input, slack) => executeNotionUpdate(env, input, slack),
  notion_archive: (env, input, slack) => executeNotionArchive(env, input, slack),
  component_implement: (env, input, slack) => executeImplement(env, input, slack),
  prototype_scaffold: (env, input, slack) => executeImplementDesign(env, input, slack),
  shareout_post: (env, input, slack) => executeShareForFeedback(env, input, slack),
  email_send: (env, input, slack) => executeSendEmail(env, input, slack),
  // `control`, and so the one row whose body is never reached: the loop
  // intercepts `proposal_resolve` and validates it against the standing card
  // before any dispatch. The row still carries a body because the pairing is
  // what makes a MISSING one impossible — and an unreachable arm that says so
  // is cheaper than an exception in the type.
  proposal_resolve: async () =>
    JSON.stringify({
      ok: false,
      error: "proposal_resolve is resolved against the standing card, not executed as a tool",
    }),
};
