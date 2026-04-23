# Example Audit: uno-research

## Executive Summary
- Overall result: `Needs Revision`
- Issues: `3` (`P0: 0`, `P1: 2`, `P2: 1`)
- Primary risk: classification and reference activation are implied but not explicit enough for consistent runs.

## Issue 1 - Missing Explicit Question Classification Step
- Priority: `P1`
- Checklist section: `3. Instructions`
- Specific problem:
  - The workflow does not define a required question-classification step before search depth decisions.
- Original code:
```md
### Step 2: Search Codebase
Search for existing artifacts related to the query...
```
- Improvement suggestion:
  - Add an explicit "classify question type" step that drives which references and search scopes are loaded.
- Suggested revised code:
```md
### Step 0: Classify the Question
Classify as one: Structural, Component, Token, Product/Domain, Knowledge.
Use this classification to decide search scope and reference loading.
```

## Issue 2 - Reference Activation Rules Are Incomplete
- Priority: `P1`
- Checklist section: `5. Context Design`
- Specific problem:
  - The skill lists references but does not always define clear trigger conditions for each reference.
- Original code:
```md
Load on-demand based on the research question...
```
- Improvement suggestion:
  - Add explicit conditional statements for each reference to improve repeatability.
- Suggested revised code:
```md
### Step 2.5: Use Discovery References
- If component/pattern discovery is requested, load `references/component-discovery.md`.
- If orientation/system learning is requested, load `references/learning.md`.
```

## Issue 3 - Output Lacks Problem Type Field
- Priority: `P2`
- Checklist section: `4. Output Structure`
- Specific problem:
  - Output format does not include a "Type" field to support downstream planning and handoff.
- Original code:
```md
### Findings
- {finding 1} — source: `{file path or Notion page}`
```
- Improvement suggestion:
  - Add a standardized `Type` field in the output.
- Suggested revised code:
```md
### Type
- {Structural | Component | Token | Product | Knowledge}
```
