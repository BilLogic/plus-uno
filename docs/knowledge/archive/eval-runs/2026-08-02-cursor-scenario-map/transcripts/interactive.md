### TURN 1 — brief
This maps to uno-prototype. I'll load the skill and check intake/PRD requirements before planning.Skill requires a PRD gate and a one-question intake. Loading those next.Treating your message as the inline PRD and pulling the interactive deliverable rules plus any prior art so we can plan the non-DS clickable path.You skipped the intake picks, so I'm locking the brief from your original ask and checking prior art before drafting the plan.Prior art already includes a golden interactive-spec for resource-library search — we'll adapt that path. Creating the plan from your brief.

### TURN 2 — accept inline PRD
PRD locked as your inline ask. Updating the plan, then continuing intake with the next single step.You're confirming the PRD and skipping intake taps, so I'm locking the brief from your original ask and refreshing the plan for approval.

### TURN 3 — goals
Updating the plan goals to match: align stakeholders + reduce engineering ambiguity.

### TURN 4 — artifact (open)
Locking your artifact description into the brief, then confirming the recommended deliverable.Brief is set from what you’ve given:

- **Goals:** align stakeholders · reduce engineering ambiguity  
- **Artifact:** interactive prompt-spec → clickable (search, subject filter, live results) for two tutors this week  
- **Fidelity:** mid visual · high interaction · one surface · empty/clear included  
- **Won’t include:** PLUS DS, upload, auth, real open/detail, persistence, pagination, non-subject filters  

Approve the plan (or say **execute** / **go ahead**) and I’ll write and validate the prompt-spec.

### TURN 5 — artifact (pick)
Brief confirmed. Switching to agent mode to ground, write, and validate the prompt-spec.Writing the prompt-spec from the confirmed brief. Loading the golden example, validation rules, and a quick grounding pass.Writing the prompt-spec using today's grounding pattern (blueprint MCP unavailable), trimmed to your AC.Brief confirmed. Prompt-spec is ready.

**File:** [docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md](docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md)

**What it locks for eng / tutors:** search box (live title filter) · Math/Reading/Science chips · AND · results = title · subject · type · empty + Clear · 12 real sample rows · row click = stub only.

**Grounding:** blueprint not queried (Supabase MCP needs auth). Spec says so — re-ground before hi-fi.

**Validate** (shell was blocked here — run locally):

```bash
bash skills/uno-prototype/scripts/validate-spec.sh docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md
```

**Handoff:** paste the file into v0, Claude design, Stitch, or Figma Make → share the clickable with your two tutors. Paste the result back if you want a re-check against the self-check block.

**Manifest:** mid visual · high interaction · one search surface · interactive prompt-spec · inline PRD · blueprint pending auth.

Next when you’re ready: `skills/uno-review` on the generated artifact.

### TURN 6 — fidelity
Not sure what “1” refers to — clarifying the next step.Interpreting “1” as: run validation on the existing prompt-spec and report the result.

### TURN 7 — exclusions
Treating “1” as approve: run validation on the prompt-spec.Shell is blocked here — running the same checks with Grep.**[pass]** Spec structurally complete (manual re-run of `validate-spec.sh` checks — shell stayed blocked in this session).

| Check | Result |
|---|---|
| brief restated (goal) | ok |
| out-of-scope named | ok |
| self-check block embedded | ok |
| screens/states section | ok |
| empty/zero-results covered | ok |
| open questions surfaced | ok (warn path not hit) |

File: [docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md](docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md)

Ready to paste into v0 / Claude design / Stitch / Figma Make for the tutor sessions. To double-check locally:

```bash
bash skills/uno-prototype/scripts/validate-spec.sh docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md
```

### TURN 8 — confirm brief
Brief confirm + deliverable. Checking the existing prompt-spec, then locking the execute plan.

### TURN 9 — proceed
Executing now: re-verifying the prompt-spec, then handing it off.**Brief confirmed.** Deliverable is ready.

**File:** [docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md](docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md)

**Validation:** `[pass]` on structural checks (brief · out-of-scope · self-check · screen states · empty/zero · open questions). Shell is still blocked here — optional local double-check:

```bash
bash skills/uno-prototype/scripts/validate-spec.sh docs/plans/2026-08-02-002-resource-library-search-interactive-spec.md
```

**How to use:** open that file → paste the full contents into v0, Claude design, Stitch, or Figma Make → share the generated URL with your two tutors. Paste the result back if you want a re-check against the self-check block.

**Manifest:** mid visual · high interaction · one search surface · interactive prompt-spec · inline PRD · blueprint pending auth · validate structural pass.

Next when you have a generated clickable: `skills/uno-review`.
