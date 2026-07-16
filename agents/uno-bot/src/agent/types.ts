// Local types for the agentic loop. The Tool shape is structurally compatible
// with @anthropic-ai/sdk's Tool type (run-agent.ts casts `TOOLS as Anthropic.Tool[]`).

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export type ToolName =
  // reads (ungated)
  | "notion_search"
  | "roadmap_query"
  | "source_read"
  | "blueprint_search"
  | "github_read"
  | "slack_thread_read"
  | "slack_search"
  | "slack_react"
  | "slack_user_profile"
  | "slack_channel_members"
  // writes (gated)
  | "notion_create"
  | "notion_update"
  | "notion_archive"
  | "component_implement"
  | "prototype_scaffold"
  | "shareout_post"
  | "email_send"
  // control
  | "proposal_resolve";

// Tools whose execution opens a PR / fires a GitHub Action. These route
// through the confirmation gate: the Worker posts a proposal and waits for ✅
// before invoking the tool body. Membership is checked directly via
// SIDE_EFFECT_TOOLS.has(...) in run-agent.ts.
export const SIDE_EFFECT_TOOLS: ReadonlySet<ToolName> = new Set<ToolName>([
  "notion_create",
  "notion_update",
  "notion_archive",
  "component_implement",
  "prototype_scaffold",
  "shareout_post",
  "email_send",
]);
