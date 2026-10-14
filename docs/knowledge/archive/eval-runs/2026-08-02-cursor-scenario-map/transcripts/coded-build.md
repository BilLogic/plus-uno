### Turn 1 — brief

This maps to `uno-prototype`. I'll load the skill and check intake state first.PRD is required at entry — loading the method and intake next to confirm the gate.Flow for this run: **PRD → what you want to achieve → artifact → fidelity → what to leave out → confirm brief → build.** Saying **back** revisits an earlier answer; nothing locks until the brief is confirmed.

**Step 1/8 — PRD check**

uno-prototype needs a PRD first (user flows + acceptance criteria at minimum). What you pasted is a clear problem statement and three requirements, but not a structured PRD yet.

How do you want to proceed?

1. **Treat my text above as the inline PRD** and continue intake (Recommended if you want to move fast with what you wrote)
2. **Run `uno-synthesize` first** — draft a proper PRD, then come back to prototype
3. **I have a Notion URL or local `.md` PRD** — I’ll share it next
4. **Skip / terminate** this process

### Turn 2 — accept inline PRD

Treating your text as the inline PRD. Grounding against the blueprint and prior art, then continuing intake with the next question.**PRD accepted (inline).** Grounding + summary below; one intake question at the end.

### Grounding snapshot
- **Prior art:** [prototypes/post-session-reflection](prototypes/post-session-reflection) (list + form), Pre-/Post-Session Reflections tables (`Completed`/`Incomplete` only — no overdue), Home `StudentsOverviewSection` list pattern. No existing “reached out” / outreach-mark UI.
- **Product docs:** Reflection today = **tutor-written** post-session report *about* a student (`docs/product-and-service/features.md`, `flows.md`). Form “follow-up” = supervisor escalation, not tutor→student outreach. **Live uno-blueprint not queried** (Supabase MCP needs auth).
- **Uncertainty to carry:** your PRD says students *submit* reflections; repo language has tutors authoring them. We’ll treat your PRD wording as source of truth for this prototype unless you correct it later.

### PRD summary (no recommendations yet)
| | |
|---|---|
| **Feature** | Tutor view of students with no reflection in the last 2 weeks |
| **Users** | Tutors |
| **Workflow** | Scan overdue students → see time since last reflection → mark reached out |
| **Constraints** | Hi-fi on the DS in `prototypes/` |
| **Open** | Student- vs tutor-authored reflection; empty/reached-out list behavior; where it lives in nav |

---

**Step 2/8 — What are you trying to achieve?** (multi-select OK; reply with numbers or free text · say **back** to revise)

1. Validate usability — can tutors scan the list and mark outreach? *(Recommended)*
2. Reduce engineering ambiguity — pin list columns, empty states, mark-reached-out behavior
3. Align stakeholders — shareable clickable hi-fi for buy-in
4. Communicate product vision — show how follow-up fits the tutor workflow
5. Explore concepts — try alternate layouts / interactions
6. Something else — describe in your reply

### Turn 3 — correct framing + goals

Reframed PRD noted: tutors overdue on writing post-session reflections for a student (>2 weeks). Goals locked: reduce engineering ambiguity + validate that the list prompts follow-up.

Next intake step is open-ended (no recommendation yet).**Step 3/8 — Artifact (your words)**

In your own words, what do you picture making? No options and no recommendation this turn — a sentence or two is enough. (Say **back** to revise earlier answers.)

### Turn 4 — artifact, open-ended

Acknowledging your picture: a clickable student overdue list in `prototypes/` with a follow-up tick. Next step maps that to an artifact type.**Step 4/8 — Artifact type**

You pictured: *a real screen in prototypes — overdue list + tick follow-up — click through.*

Which artifact?

1. **Hi-fi build on the design system in `prototypes/`** *(Recommended)* — real PLUS components, working mark-reached-out, matches “real screen I could click through”
2. **Interactive prototype via an external tool** — clickable faster, weaker DS fidelity
3. **Wireframe / static mockup** — layout only, no working tick
4. **Something else** — describe in your reply

(Say **back** to revise.)

### Turn 5 — artifact pick

Hi-fi build locked. Next: fidelity dials.**Step 5/8 — Fidelity dials**

```
Visual        low ─────● high — hi-fi on the DS (“real screen”)
Interaction   low ─────● high — mark reached-out must work to validate follow-up
Scope         low ●────── high — one overdue-list screen (per your picture)
Complexity    low ──●──── high — overdue rows + empty + already-reached-out; no filters/settings
```

Confirm or adjust?

1. **Yes: high visual, high interaction, 1 list screen, happy path + empty + already-reached-out** *(Recommended)*
2. Same but fake the mark-reached-out (lower interaction)
3. Broader scope — add student detail / compose-follow-up beyond the list
4. Adjust dials — describe in your reply

(Say **back** to revise.)

### Turn 6 — fidelity dials

Dials locked. Next: intentional exclusions.**Step 6/8 — Won’t include**

Intentional exclusions (from the 1-screen / eng-ambiguity goals):

- Writing/editing the post-session reflection form itself  
- Student detail, compose message, or actual outbound contact  
- Filters, sort prefs, custom date-range (fixed rule: 2 weeks)  
- Supervisor escalation / Slack  
- Auth, APIs, or live data  

Confirm or adjust?

1. **Yes — exclude reflection writing, student detail/messaging, filters/settings, escalation, and real backend** *(Recommended)*
2. Also show on-time students (not just overdue) on the same list
3. Keep a minimal student-detail / note field when marking reached out
4. Adjust exclusions — describe in your reply

(Say **back** to revise.)

### Turn 7 — exclusions

Exclusions locked. Last intake step: confirm the brief card.**Step 7/8 — Confirm brief card**

| | |
|---|---|
| **Goal** | Reduce eng ambiguity; validate that the overdue list prompts follow-up |
| **Artifact** | Hi-fi build on the DS in `prototypes/` |
| **Fidelity** | Visual high · Interaction high · Scope: 1 overdue-list screen · Complexity: overdue rows + empty + already-reached-out |
| **Won’t include** | Reflection form · student detail/messaging · filters/date-range · escalation · auth/APIs/live data |

PRD (reframed): Tutors who haven’t written a post-session reflection for a student in 2+ weeks — list those students, show time since last reflection, mark reached out.

1. **Confirm brief — build to this contract** *(Recommended)*
2. Revise something — say what
3. **Back** — revisit an earlier step

### Turn 8 — confirm brief

Brief confirmed. Loading the hi-fi deliverable procedure and scaffold patterns to draft the plan.Brief is locked. The coded-build path requires one Figma gate before the plan can commit to an approach.

### Turn 9 — no Figma → build

No Figma — building DS-direct from the confirmed plan. Switching to agent mode to scaffold and implement.Scaffold was blocked — retrying and loading component APIs.Shell is blocked — scaffolding by copying the starter files with the Write tool instead.Writing the prototype files directly since shell remains blocked.Fixing a stuck state: when every row is marked reached-out, keep the list visible so checkboxes can be undone; reserve pure empty for the demo switch.Fixing the ds-lens findings: re-export the shell provider from the area index and replace hardcoded CSS with tokens.Hi-fi prototype is in place at `prototypes/overdue-reflection-follow-up/` (DS-direct, no Figma).

### What you get
- **Page:** Toolkit → Sessions → Reflection follow-up list
- **Columns:** Student · Last reflection (relative + date) · Overdue by (`Badge`) · Reached out (`Checkbox`)
- **Rule:** fixed 14-day threshold; unchecked overdue rows sort first
- **States:** fixture mix (incl. one pre-marked) · success `Alert` when all marked · **Demo: show empty** switch for the empty state
- **Run:** `npm run dev:overdue-reflection-follow-up` → http://localhost:3031/

### Also
- Re-exported `PageLayoutShellProvider` from [`@/specs/Universal/Pages`](design-system/src/specs/Universal/Pages/index.js) so the bootstrap import stays legal

### Validation
Shell (beyond `ls`) is blocked in this session, so `validate-prototype.sh`, review checks, and a Vite build did not run live. Static review looks clean aside from starter-style `main.jsx` warn patterns (ThemeProvider / crash hex). Please run the command above locally and click through mark-reached-out + the empty demo.

**Manifest:** hi-fi · PLUS DS coded build · inline PRD (reframed) · live validate/unavailable (shell blocked) · hand off to `uno-review` when you’ve smoked it.
