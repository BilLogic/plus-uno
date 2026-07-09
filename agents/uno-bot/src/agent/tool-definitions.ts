// Source of truth: ../../tool-definitions.json (agents/uno-bot/)
// Co-located there alongside the SKILL.md files so the schemas and the
// natural-language guidance live together. This module just re-exports
// them with TS types for the agent loop.

import toolsJson from "../../tool-definitions.json";
import type { Tool } from "./types";

export const TOOLS: Tool[] = toolsJson as Tool[];
