---
name: uno-research
description: >
  Discover context, audit assets, surface prior knowledge. Use when the user asks
  "What is...", "How does...", "Where is...", or needs to understand the codebase
  before building.
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, WebSearch, mcp__notion-plus__*
---

# Research & Discovery

Surface existing knowledge, audit assets, and build context before any implementation begins.

## When to Use

- The user asks discovery questions: "What is...", "How does...", "Where is..."
- The user needs to explore the codebase before building
- Auditing which components, tokens, or patterns already exist for a given area
- Understanding product context, user flows, or domain terminology
- Checking whether prior solutions or learnings apply to a new problem

## Not for Use

- Simple, well-defined questions with direct answers
- Tasks that already have clear implementation direction

## Auto-Suggest

Proactively suggest this skill when:
- The user jumps into building without understanding what exists
- A new feature area is mentioned that may already have prior art
- The user asks a question that requires cross-referencing multiple sources
- Before `/uno:plan` if the problem space is unclear

Do not suggest if the user already has clear context and is ready to plan or build.

## Tier 2 Context (~3K tokens budget)

Load on-demand based on the research question:

| Trigger | Load |
|---------|------|
| Product/domain questions | `docs/context/product/*` |
| Component/token discovery | `references/component-discovery.md` |
| Prior knowledge check | `docs/knowledge/INDEX.md` → relevant domain files |
| Learning/orientation | `references/learning.md` |
| Existing solutions | `docs/knowledge/lessons/` → relevant category |

Stay within ~3K tokens of Tier 2 context. Load the INDEX first, then only the specific files needed.

## Workflow

### Step 0: Classify the Question

Determine what type of question this is:

- Structural (layout, IA, flow)
- Component-level (UI elements, props, usage)
- Token-level (spacing, color, typography)
- Product/domain (user flow, feature logic)
- Prior knowledge/lessons

Use this classification to guide:
- Which sources to load first
- How deep to search before synthesizing an answer

### Step 1: Check Prior Knowledge

Read `docs/knowledge/INDEX.md` to determine if prior knowledge exists for the topic. If a relevant domain file exists, load it before searching further.

### Step 2: Search Codebase

Search for existing artifacts related to the query:
- Components: `design-system/src/components/`, `design-system/src/specs/`
- Stories: `design-system/src/**/*.stories.jsx`
- Tokens: `design-system/src/tokens/`
- Playground prototypes: `playground/`
- Solution docs: `docs/knowledge/lessons/`

Use Glob for file discovery, Grep for content matching. Cast a wide net first, then narrow.

### Step 2.5: Use Discovery References (if needed)

- If exploring available components or patterns, read `references/component-discovery.md`
- If onboarding or understanding system concepts, read `references/learning.md`

Use these references to guide where and how to search.

### Step 3: Search Notion (if relevant)

When the question relates to product decisions, roadmap, or design rationale, use `mcp__notion-plus__*` tools to search the PLUS Notion workspace. Only invoke if the codebase alone cannot answer the question.

### Step 4: Check Existing Solutions

Scan `docs/knowledge/lessons/` for related findings from previous work sessions. Past learnings often apply to new problems.

### Step 5: Synthesize Findings

Compile findings into a structured research brief with:
- Direct answers to the user's question
- Source citations (file paths, Notion page titles)
- Related assets discovered during search
- Gaps: what was NOT found that might be needed

## Output Format

Present findings as a structured research brief:

```
## Research Brief: {topic}

### Type
- {Structural/Component/Token/Product/Knowledge}

### Findings
- {finding 1} — source: `{file path or Notion page}`
- {finding 2} — source: `{file path}`

### Related Assets
- {component/token/prototype that is relevant}

### Gaps
- {what does not exist yet that may be needed}

### Recommendations
- {suggested next step: plan, build, or investigate further}
```

## Handoff

If the research reveals that planning or building is needed next:
1. Write the research brief to `.agent/handoffs/briefs/{topic-slug}.md`
2. Suggest `/uno:plan` to scope the implementation

If the user only needed an answer (no follow-up work), skip the handoff file.

## Constraints

- **Read-only**: This skill does NOT create files (except handoff briefs), modify code, or make design decisions.
- **Cite sources**: Every finding must include a file path or external reference.
- **No speculation**: If information is not found, say so. Do not guess.
- **Stay scoped**: Answer the question asked. Do not expand into adjacent topics unless they directly impact the answer.

## Next Step

After completing research:
- If implementation is needed → Suggest `/uno:plan` to scope the work.
- If the user just needed an answer → No further skill needed.
- If a gotcha or learning was discovered → Suggest `/uno:compound` to document it.

These are suggestions — the user may choose to skip steps.
