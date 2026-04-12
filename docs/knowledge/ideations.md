<!-- Tier: 2 -->
---
domain: ideations
type: ideation
confidence: medium
created: 2026-04-11
tags: [toolkit-ia, skills, revision]
---

## [2026-03-17] Toolkit IA revision: sidebar tree navigation with dynamic sub-items

**Status**: Explored (plan created: `docs/plans/2026-03-17-001-feat-toolkit-ia-revision-plan.md`)

### Ranked ideas

1. **Sidebar tree navigation with dynamic sub-items** (90% confidence, Medium complexity)
   - Three accordion categories (Sessions, Students, Reflections) with spawned dismissible sub-tabs
   - Sub-tabs auto-clear on browser session end, real URLs, max depth = 2
   - Overflow `...` indicator for >3 open sub-tabs per category

2. **Docked student context panel** (85% confidence, Medium complexity)
   - Replace StudentInsightsModal with dockable side panel that coexists with the student table
   - Addresses PRD user story about referencing student data without losing context

3. **Embedded reflection flow with auto-draft** (75% confidence, Medium-High complexity)
   - Session sub-tab transitions in-place to reflection when session ends
   - Forms auto-populated from captured session data (attendance, engagement)

4. **Declarative route manifest** (85% confidence, Medium complexity)
   - Replace 3 parallel maps (pathToTab, pathToUserType, onTabClick) with single manifest
   - Highest-leverage infrastructure change; makes all future IA changes trivial

5. **Multi-tier reflection system** (70% confidence, High complexity)
   - Three tiers: inline micro-notes per student row, guided ReflectionAssistantChat, searchable archive
   - Largest scope; requires persistence layer for micro-notes

6. **Master-detail layout for session list** (70% confidence, Medium complexity)
   - Split-pane preview within Sessions main tab before opening a full sub-tab

### Rejected ideas
- In-page NavPills (user prefers sidebar-level visibility)
- Phase-aware sidebar morphing (over-engineered, requires backend scheduling)
- Persistent session dock (new UI paradigm not in DS)
- Context-carrying breadcrumbs as primary nav (too hidden)
- Student-centric IA (contradicts sessions-first directive)
- Unified activity feed/timeline (loses focused work capability)

**Source**: _archive/ideation/2026-03-17-toolkit-ia-revision-ideation.md

---

## [2026-03-25] Skill documentation revision: auto-suggest, pipeline, and quality

**Status**: Unexplored (7 improvements identified, not yet implemented)

### Ranked ideas

1. **Add auto-suggest conditions to every skill** (95% confidence, Low complexity)
   - Each SKILL.md declares when the agent should proactively suggest it
   - Key mechanism for "skills the agent uses automatically"
   - Include "suggest once, don't repeat if declined" guidance

2. **Add next-step directives (skill pipeline)** (90% confidence, Low complexity)
   - Each skill declares what typically comes next: prototype -> review -> post -> compound
   - Makes the implicit pipeline explicit in each SKILL.md

3. **Improve description fields with better trigger phrases** (95% confidence, Low complexity)
   - 3 of 4 skills have weak descriptions without real user trigger phrases
   - Better descriptions mean better discovery across all agent platforms

4. **Slim down SKILL.md files** (85% confidence, Low complexity)
   - Move inline content to proper subdirectories (references/, examples/, scripts/)
   - Enforce <80 line guideline for SKILL.md files

5. **Add human gate to compound pattern escalation** (90% confidence, Low complexity)
   - uno-compound Step 3 instructs agent to modify AGENTS.md without approval
   - Agent instruction files govern all future sessions -- changes must be intentional

6. **Add examples/ to uno-review** (80% confidence, Low complexity)
   - Only skill without examples/; add sample PASS/WARN/FAIL review output

7. **Add skill manifest to SKILL.md router** (85% confidence, Low complexity)
   - Enhanced table with auto-suggest conditions, pipeline position, side effects

### Rejected ideas
- Move skills to .claude/commands/ (platform-specific)
- Add `context: fork` to skills (Claude Code-specific frontmatter)
- Add `allowed-tools` / model overrides (Claude Code-specific)
- Convert grep patterns to JSON schema (over-engineering)
- Create new skills (out of scope for revision)

### Recommended execution order
- Phase 1 (Quick wins): Improve descriptions, add human gate
- Phase 2 (Structure): Slim SKILL.md files, add review examples
- Phase 3 (Auto-suggest): Auto-suggest conditions, next-step directives, skill manifest

**Source**: _archive/ideation/2026-03-25-skill-documentation-revision-ideation.md
