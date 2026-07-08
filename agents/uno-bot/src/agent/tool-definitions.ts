// Source of truth: ../../../bot-skills/tool-definitions.json
// Co-located there alongside the SKILL.md files so the schemas and the
// natural-language guidance live together. This module just re-exports
// them with TS types for the agent loop.

import toolsJson from "../../../bot-skills/tool-definitions.json";
import type { Tool, ToolName } from "./types";

export const TOOLS: Tool[] = toolsJson as Tool[];

export const TOOL_BY_NAME: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.name, t]),
);

export function knownToolName(name: string): name is ToolName {
  return name === "implement"
    || name === "implement_design"
    || name === "create_prd"
    || name === "delete_prd"
    || name === "find_experts"
    || name === "marketplace_search"
    || name === "marketplace_add"
    || name === "marketplace_edit"
    || name === "send_email"
    || name === "blueprint_search"
    || name === "read_source"
    || name === "share_for_feedback";
}
