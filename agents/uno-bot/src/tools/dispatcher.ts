// Central tool executor for side-effect tools after the ✅ gate. Called from
// resolve-proposal.ts once a pending proposal is confirmed. (Read-only tools
// run separately via executeReadOnlyTool in run-agent.ts during the loop.)
//
// Each tool body returns a JSON string that goes straight into a tool_result
// content block.

import type { Env, SlackContext } from "../types";
import { executeImplement } from "./implement";
import { executeImplementDesign } from "./implement-design";
import { executeNotionCreate } from "./notion-create";
import { executeNotionUpdate } from "./notion-update";
import { executeNotionArchive } from "./notion-archive";
import { executeSendEmail } from "./send-email";
import { executeShareForFeedback } from "./share-for-feedback";

// SlackContext now lives in types.ts (shared by the tool layer + agent loop).
// Re-exported here so existing `from "./dispatcher"` imports keep working.
export type { SlackContext } from "../types";

export async function executeTool(
  env: Env,
  name: string,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  switch (name) {
    case "notion_create":
      return executeNotionCreate(env, input, slack);
    case "notion_update":
      return executeNotionUpdate(env, input, slack);
    case "notion_archive":
      return executeNotionArchive(env, input, slack);
    case "component_implement":
      return executeImplement(env, input, slack);
    case "prototype_scaffold":
      return executeImplementDesign(env, input, slack);
    case "shareout_post":
      return executeShareForFeedback(env, input, slack);
    case "email_send":
      return executeSendEmail(env, input, slack);
    default:
      return JSON.stringify({ ok: false, error: `unknown tool: ${name}` });
  }
}
