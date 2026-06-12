# Skill Quality Checklist

Source basis: [Claude Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

Use this checklist as the authoritative evaluation criteria for skill audits.

## 1. Skill Definition

- [ ] Clearly states **what the skill does**
- [ ] Clearly states **when to use it**
- [ ] Includes **specific trigger scenarios or keywords**
- [ ] Avoids vague descriptions (for example: "help with tasks", "process data")
- [ ] Written in **third person** (no "I" or "you")
- [ ] Specific enough to stand out among many skills

## 2. Scope

- [ ] Covers **one clear task only**
- [ ] Avoids combining multiple workflows (for example: research + design + coding)
- [ ] Can be broken down into smaller skills if needed
- [ ] Can work well with other skills (composable)

## 3. Instructions

- [ ] Uses **clear, imperative instructions** (for example: "Analyze...", "Generate...")
- [ ] Includes **step-by-step workflow**
- [ ] Avoids vague language (for example: "try to", "consider", "maybe")
- [ ] Clearly defines **input -> output**

## 4. Output Structure

- [ ] Defines a **clear output format** (bullets, table, sections, and so on)
- [ ] Specifies expected structure (for example: insights, report sections)
- [ ] Reduces randomness in responses
- [ ] Produces consistent outputs across runs

## 5. Context Design

- [ ] `SKILL.md` is **concise and focused**
- [ ] Large content is moved to references/assets
- [ ] Avoids overloading the prompt with unnecessary details
- [ ] Supports **progressive loading** (only load what is needed)

## 6. Workflow Value

- [ ] Encapsulates a **repeatable workflow**
- [ ] Reduces the need for repeated user instructions
- [ ] More stable than a one-off prompt

## 7. Trigger -> Action Mapping

- [ ] Clear mapping between **user intent -> skill activation**
- [ ] Avoids overlap with other skills
- [ ] Avoids being too broad or too generic

## 8. Scalability & Maintainability

- [ ] Well-structured (clear separation of logic, references, assets)
- [ ] Easy to update or extend
- [ ] Avoids hardcoded logic or fragile structure

## 9. Failure Handling

- [ ] Defines **when NOT to use the skill**
- [ ] Avoids misuse or over-triggering
- [ ] Allows fallback to default model behavior

## Scoring Guidance

Each item must be marked as one of:
- `Pass`
- `Partial`
- `Fail`
- `N/A` (only when truly not applicable, with rationale)

Priority guidance for issues:
- `P0` High risk: blocks reliable usage, likely to cause misuse or wrong outputs
- `P1` Medium risk: weakens consistency, maintainability, or reuse
- `P2` Low risk: polish-level or clarity improvements
