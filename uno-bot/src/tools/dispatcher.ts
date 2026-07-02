// Central tool executor. Called from:
//   - run-agent.ts (for read-only tools during the agentic loop)
//   - Step 7's confirmation-gate handler (for side-effect tools after ✅)
//
// All four tool bodies return a JSON string that goes straight into a
// tool_result content block.

import type { Env } from "../types";
import { executeImplement } from "./implement";
import { executeImplementDesign } from "./implement-design";
import { executeCreatePrd } from "./create-prd";
import { executeDeletePrd } from "./delete-prd";
import { executeMarketplaceAdd } from "./marketplace-add";
import { executeMarketplaceEdit } from "./marketplace-edit";
import { executeMarketplaceSearch } from "./marketplace-search";
import { executeSendEmail } from "./send-email";
import { executeShareForFeedback } from "./share-for-feedback";

export interface SlackContext {
  channel: string;
  threadTs: string;
  userMsgTs: string;
  requestedBy?: string;
  /** Optional Notion PRD reference, extracted from the thread root when the
   *  designer replied to a polling-bot PRD notification. Forwarded to the
   *  figma-implement workflow so Claude gets PRD context during code-gen. */
  notionPrdId?: string;
  notionPrdUrl?: string;
}

export async function executeTool(
  env: Env,
  name: string,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  switch (name) {
    case "marketplace_search":
      return executeMarketplaceSearch(env, input);
    case "implement":
      return executeImplement(env, input, slack);
    case "implement_design":
      return executeImplementDesign(env, input, slack);
    case "create_prd":
      return executeCreatePrd(env, input, slack);
    case "delete_prd":
      return executeDeletePrd(env, input, slack);
    case "marketplace_add":
      return executeMarketplaceAdd(env, input, slack);
    case "marketplace_edit":
      return executeMarketplaceEdit(env, input, slack);
    case "send_email":
      return executeSendEmail(env, input, slack);
    case "share_for_feedback":
      return executeShareForFeedback(env, input, slack);
    default:
      return JSON.stringify({ ok: false, error: `unknown tool: ${name}` });
  }
}
