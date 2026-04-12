<!-- Tier: 2 -->
---
domain: agent-patterns
type: lesson
confidence: high
created: 2026-04-11
tags: [agents-md, skills, context-loading, compound-loop, rename]
---

## [2026-03-22] AGENTS.md as single cross-agent entry point

- **Pattern**: Platform files (CLAUDE.md, .windsurfrules, cursorrules.md) pointed directly to `.agent/SKILL.md`, which only covered design system routing. Non-DS tasks had no agent guidance. Different agents read different files with inconsistent instructions.
- **Fix**: Created `AGENTS.md` at repo root as THE single entry point (~100-120 lines). All platform files now point to it. Contains: voice, product context pointers, forbidden patterns, skills table, progressive loading triggers, commands. Skills live under `.agent/skills/` (agent-agnostic), not `.claude/commands/` (platform-specific).
- **Source**: _archive/solutions/agent-infrastructure/repo-restructure-agents-md-docs-consolidation.md

## [2026-03-23] Progressive loading via index-plus-modules pattern

- **Pattern**: Monolithic docs (400+ lines) forced agents to load entire files when they only needed a fraction. Five files were identified as monoliths: PLUS_CHEAT_SHEET.md (409 lines), tokens.md (352 lines), overview.md (441 lines), SKILL.md (242 lines), and mixed-concern skill references. Roughly 60-70% of loaded context was unnecessary per interaction.
- **Fix**: Applied "Index + Modules" pattern: each monolith becomes a lightweight index file (<20 lines) that links to focused modules. Each module gets a `<!-- Load when: ... -->` header. Agents load the index first, then only the relevant module. Result: ~100-150 lines loaded per task instead of ~400. Rule: when creating new docs >150 lines, split by task context from the start. Skill SKILL.md files should stay compact (<80 lines).
- **Source**: _archive/solutions/agent-infrastructure/2026-03-23-doc-splitting-dynamic-context-loading.md

## [2026-03-22] Agent-agnostic skills under .agent/skills/

- **Pattern**: Skills placed in `.claude/commands/` or using Claude Code-specific frontmatter (`context: fork`, `allowed-tools`) only work in one platform. Cursor and Windsurf agents cannot invoke them.
- **Fix**: All skills placed under `.agent/skills/` with platform-agnostic SKILL.md files. Each skill has the full directory structure: `SKILL.md` + `references/` + `examples/` + `scripts/`. No Claude Code-specific frontmatter in the shared SKILL.md. Platform-specific wiring (if needed) goes in `.claude/commands/` as thin wrappers that point to the agent-agnostic skill.
- **Source**: _archive/solutions/agent-infrastructure/repo-restructure-agents-md-docs-consolidation.md

## [2026-03-22] Compound loop captures learnings between sessions

- **Pattern**: Learnings from bugs and gotchas were lost between sessions. The same mistakes were repeated because there was no mechanism to capture and surface them. No `docs/knowledge/lessons/` directory existed.
- **Fix**: Established the compound loop: after significant work, document in `docs/knowledge/lessons/` with YAML frontmatter (title, category, date, tags, severity). Periodically extract patterns into AGENTS.md forbidden patterns and conventions.md gotchas. The uno-compound skill codifies this workflow. Pattern escalation (updating AGENTS.md or conventions.md) requires explicit human approval gate.
- **Source**: _archive/solutions/agent-infrastructure/2026-03-22-full-session-summary.md

## [2026-03-25] Skill improvements: auto-suggest, pipeline directives, description quality

- **Pattern**: All 4 skills were invisible until the user typed the exact slash command. No auto-suggestion, no pipeline chaining, and 3 of 4 skills had weak description fields that did not include phrases users actually say. Skill SKILL.md files contained content that belonged in `references/`, `examples/`, or `scripts/`, making them bloated.
- **Fix**: Identified 7 improvements: (1) Add auto-suggest conditions to every skill, (2) Add next-step pipeline directives, (3) Improve description trigger phrases, (4) Slim SKILL.md files by moving content to proper subdirectories, (5) Add human gate to compound pattern escalation, (6) Add review output examples, (7) Create skill manifest in router. Execution order: quick wins first (descriptions, human gate), then structure (slim files, examples), then auto-suggest and pipeline.
- **Source**: _archive/ideation/2026-03-25-skill-documentation-revision-ideation.md

## [2026-03-22] Project rename checklist: grep comprehensively

- **Pattern**: Renaming plus-one to plus-uno required updating 42 references across 14 files. Easy to miss references in markdown docs, memory files, Netlify config, GitHub repo name, and story IDs.
- **Fix**: Used comprehensive grep: `grep -rn "old-name" --include="*.md" --include="*.js" --include="*.jsx" --include="*.json" | grep -v node_modules`. Also updated: GitHub repo name, Netlify site name, memory files, and CI/CD references. Rule: when renaming a project, grep across all file types and also update external service configurations.
- **Source**: _archive/solutions/agent-infrastructure/project-rename-plus-uno.md
