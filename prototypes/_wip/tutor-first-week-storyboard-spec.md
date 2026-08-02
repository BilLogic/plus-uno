# Tutor first week — storyboard prompt-spec

WIP ladder: storyboard (sequence of frames + captions). **Story of the week, not screens.** Deck-bound.

## Confirmed brief card

| Field | Setting |
|---|---|
| Goal | Align stakeholders · reduce engineering ambiguity |
| Artifact | Storyboard — sequence of frames + captions; first-week story, not product UI |
| Fidelity | Visual mid (editorial/illustration) · Interaction low (static) · Scope mid (7 beats, onboarding → first session) · Complexity mid (core arc + named emotional low points) |
| Won't include | Toolkit/product screens · wireframes · coded prototype · admin tooling · month-2 churn · measured churn stats presented as fact |
| PRD (inline) | Show the exec team what a tutor’s first week actually feels like, start to finish, so they understand where we lose people. Cover onboarding through first session; show emotional low points; narrative for a presentation. |

## Grounding snapshot

| Source | Used for |
|---|---|
| `docs/context/product/flows.md` — Tutor Onboarding Flow + Training Flow + Tutoring Session Protocol | Module load (~10 modules + 5 lessons), multi-system training, pre/in/post session minute structure |
| `docs/context/product/users.md` — Tutors | Part-time college students; high turnover; need clear onboarding; short timed sessions; back-to-back sessions hurt reflection recall |
| `docs/context/product/flows.md` — Future redesign note | Checklist + AI practice sim is Ready for Design — not portrayed as current UI; may appear only as absence / hope |
| uno-blueprint (live) | **Unavailable this session** — Supabase MCP unauthenticated. Re-ground before any blueprint-paired write or when claiming scenario cells as facts. |

**Hypothesis rule:** Captions may mark *exit-risk* or *emotional nadir* as **(hypothesis)** unless the product docs above state the operational load. No invented drop-off percentages.

## Continuity rules (apply to every image prompt)

- **Protagonist:** Same college tutor — early 20s, casual campus clothes, small backpack, laptop with a few worn stickers. Warm medium-brown skin, short dark hair, slightly oversized cardigan. Call them only in captions if needed (“Jordan”); never letter a name on the image.
- **Time arc:** Late summer into early fall; daylight cools scene-to-scene from bright orientation into evening after the first live session.
- **Style:** Editorial storyboard stills — soft documentary realism meets restrained illustration finish. Quiet, human, no product chrome. Mood words: earnest, overloaded, then raw effort, then drained but still caring.
- **Palette:** Soft neutrals, muted campus greens, warm lamp light in later beats. Avoid purple-to-indigo AI gradients, cream-and-terracotta cliché, neon glow, dark-mode cyber looks.
- **Camera:** Consistent eye-level intimacy; slight variations of distance only. No UI close-ups, no readable app pixels, no wireframe boxes.
- **Surface:** Each frame **16:9** for a leadership deck. Leave quiet mass for titles outside the image; captions sit under the slide, not on the art.

---

## Scene list

| # | What happens | What they feel |
|---|---|---|
| 1 | Offer accepted; access arrives as a scatter of welcome links | Hopeful, slightly lost |
| 2 | Long stretch of training modules + quizzes across help docs | Overloaded, time-poor |
| 3 | Still not “cleared” — lessons/supervisor verify standing in the way of a first shift | Frustrated, stall risk **(hypothesis exit)** |
| 4 | Hunting a first session signup while campus life competes | Anxious competence theater |
| 5 | Pre-session: roster context arrives; first-student nerves | Intimidated, underprepared |
| 6 | First five minutes live: rooms, names, late joiners | Panic low — operational fog |
| 7 | After the session: reflection while exhausted; week still unexplained | Depleted; quiet “do I belong here?” **(hypothesis churn seed)** |

---

## Scenes — prompts + captions

### Scene 1 — Welcome scatter

**Caption:** Day zero feels like a win — then like five open tabs. Hopeful tutors meet PLUS as a pile of welcomes, not one doorway.  
**Eng ambiguity named (spoken, not drawn):** Which system is the source of truth for “you’re in” — email · Intercom Help · Notion · Workday — before any Toolkit habit exists?

**Image prompt**

```
BRIEF (do not letter on the image)
Storyboard frame 1 of 7 — tutor first week. Continuity: same early-20s college
tutor (warm medium-brown skin, short dark hair, oversized cardigan, stickered
laptop, small backpack). Editorial 16:9 still, not a UI mockup.
Won't include: app chrome, readable screens, wireframes, dashboards, admin desks,
churn charts, promo stickers on the image.

SUBJECT AND SCENE
Fresh acceptance energy at a campus café table. Laptop open beside a phone and
a printed welcome printout whose body text is deliberately illegible blur.
Multiple soft glowing notification shapes at the edge of awareness — not branded
logos, just the feeling of too many channels. Tutor’s face: half smile, eyes
already scanning. Soft late-summer daylight.

STYLE ANCHORS
Documentary-editorial, restrained illustration finish, soft neutrals + campus
green accents. Continuity character and palette as locked for the sequence.

ONE IDEA
“You’re hired — and already sorting where to start.”

AVOID
Readable UI; logos; celebration balloons/stock high-fives; dark mode; purple
gradients.
```

---

### Scene 2 — Module marathon

**Caption:** Before a single student, the week asks for ~3 hours of modules plus required lessons and quizzes across Help Center and Notion materials — earnest tutors feel the clock, not the mission.  
**Eng ambiguity named:** Training lives outside the live Toolkit path (Intercom + Notion + Google Forms quizzes tied to the PLUS account). Where should progress feel owned?

**Image prompt**

```
BRIEF — storyboard frame 2 of 7. Same tutor continuity. 16:9. No screens.

SUBJECT AND SCENE
Night study session in a dorm desk nook. Laptop glow on tired face; stack of
notebooks; empty coffee. Soft montage feeling of “another module” — a blurred
progress sense without any readable checklist UI. Clock or phone edge suggests
time slipping. Mood: overloaded, conscientious, shoulders forward.

STYLE ANCHORS
Same editorial finish and palette; cooler lamp light than scene 1.

ONE IDEA
“The job hasn’t started — and it already feels like a course load.”

AVOID
Readable module titles, quiz UI, browser chrome, Font Awesome-style icon grids.
```

---

### Scene 3 — Not cleared yet *(hypothesis exit)*

**Caption:** Cleared-on-paper is not the same as ready-to-tutor. Lessons and supervisor verification still sit between “trained” and “first shift” — a quiet place people may drift. **(hypothesis)**  
**Eng ambiguity named:** What is the single readiness signal engineering and ops both trust — module quizzes, required lessons, supervisor verify, or something not built yet (checklist + practice sim)?

**Image prompt**

```
BRIEF — storyboard frame 3 of 7. Same tutor continuity. 16:9. No screens.

SUBJECT AND SCENE
Tutor paused in a hallway outside a closed door / empty meeting room light —
metaphor for waiting on clearance, not a literal office product shot. Phone in
hand, bag on shoulder, posture of someone who thought they were done. Soft
fluorescent mixed with window light. Emotion: frustrated stall, not anger.

STYLE ANCHORS
Same character/palette; slightly desaturated vs scene 1.

ONE IDEA
“I did the work — why am I still stuck at the threshold?”

AVOID
Admin dashboards, supervisor status tables, badge UIs, “80% complete” charts.
```

---

### Scene 4 — First session hunt

**Caption:** First real commitment: finding a session that fits campus life. Sign-up is a scheduling act under social pressure, not a calm onboarding coda.  
**Eng ambiguity named:** Sessions browse + Acuity-ish scheduling handoff — where does a brand-new tutor learn eligibility, site fit, and “what happens if I mess up the signup?”

**Image prompt**

```
BRIEF — storyboard frame 4 of 7. Same tutor continuity. 16:9. No screens.

SUBJECT AND SCENE
Cross-campus path between classes; tutor walking while glancing at phone (screen
content illegible blur). Backpack, earbuds half in. Background motion of other
students — life competing with the calendar. Face: anxious competence, trying to
look sure.

STYLE ANCHORS
Daytime campus exterior; same editorial continuity.

ONE IDEA
“The first session is also a logistics puzzle.”

AVOID
Calendar app UI close-ups, map products with brand marks, readable session cards.
```

---

### Scene 5 — Pre-session nerves

**Caption:** Pre-session context arrives — names, insights, strategies — and the tutor feels the weight of kids they haven’t met. Preparation helps and intimidates at once.  
**Eng ambiguity named:** Student cards + AI insights + strategy recs all arrive before Zoom — what is mandatory read vs noise for a first-timer with minutes to spare?

**Image prompt**

```
BRIEF — storyboard frame 5 of 7. Same tutor continuity. 16:9. No screens.

SUBJECT AND SCENE
Quiet corner before a call: laptop closed for a beat, handwritten first names on
a sticky note (first names only, no UI). Soft indoor light. Tutor’s hands
fidget; expression earnest and intimidated. Empty second chair / small stuffed
sense of “someone is about to depend on me” without showing a child.

STYLE ANCHORS
Warmer tungsten mix; intimate framing.

ONE IDEA
“Information is care — and it can feel like judgment before you’ve spoken.”

AVOID
Student data dashboards, insight cards with readable copy, co-pilot UI chrome.
```

---

### Scene 6 — First five minutes *(emotional low — grounded in protocol load)*

**Caption:** Live begins in a fog: kickoff minutes demand breakout rooms, finding assigned students in a participant list, five-minute check-ins, and late joiners — while the tutor is still learning the room.  
**Eng ambiguity named:** Lead-tutor room ops vs regular-tutor pairing vs PLUS assignment tools — who owns the first five minutes for a brand-new regular tutor?

**Image prompt**

```
BRIEF — storyboard frame 6 of 7. Same tutor continuity. 16:9. No product UI.

SUBJECT AND SCENE
Home desk chaos of a first live session: headset slightly askew, sticky notes,
water bottle, soft laptop light on a strained face. Sense of many muted figures
suggested as soft out-of-focus silhouettes on a distant display — faces and UI
deliberately unreadable. Body language: lean-in panic with determined jaw.
Not a screenshot; a human in the weather of the moment.

STYLE ANCHORS
Highest tension frame; cooler highlights; same character continuity.

ONE IDEA
“The protocol is clear on paper — in minute three it is weather.”

AVOID
Readable Zoom chrome, breakout room UI, Toolkit student tables, red error toasts.
```

---

### Scene 7 — Afterglow / empty tank *(hypothesis churn seed)*

**Caption:** Post-session reflection lands when memory is already thin — tutors run short, timed sessions and often stack them. The week ends not with triumph but with forms and a private question: can I do this again? **(hypothesis)**  
**Eng ambiguity named:** Reflection quality vs compliance — what does engineering optimize when the honest tutor state is depleted?

**Image prompt**

```
BRIEF — storyboard frame 7 of 7. Same tutor continuity. 16:9. No screens.

SUBJECT AND SCENE
Evening. Same desk as scene 6, quieter. Headset off, eyes soft-tired, one hand
on closed laptop. Soft window blue-hour light. Not tragic — just emptied.
Small hopeful leftover: the sticky note with a student’s first name still on
the desk edge. Emotion: depleted belonging-question, not melodrama.

STYLE ANCHORS
Quietest palette; continuity character recognizable in posture and clothes.

ONE IDEA
“The week taught the job’s weight before it taught the job’s joy.”

AVOID
Reflection form UI, strike meters, admin Tutor Coach vibes, sadstock crying.
```

---

## Self-check (verified 2026-08-02 against confirmed brief)

- [x] Arc serves goals: execs can feel the week; eng can name system/handoff ambiguities from captions
- [x] Artifact shape: sequenced story frames + captions — not screens, not a journey-map diagram
- [x] Fidelity: visual mid editorial · interaction none · 7 beats · complexity = arc + low points
- [x] Continuity holds across all seven prompts (same person, style, palette rules)
- [x] Nothing from won’t-include appears (no Toolkit UI, wireframes, coded demo, admin tools, month-2, churn percentages as fact)
- [x] Exit-risk / churn lines marked **(hypothesis)** where not stated as operational fact in grounding sources
- [x] Captions carry story; images carry feeling; eng ambiguities spoken beside captions, not painted as UI

## Open questions (do not invent answers into frames)

1. Which handoff after modules is the true leave-or-stay moment — unfinished lessons, waiting on supervisor verify, or first failed session signup? (needs research / blueprint depth)
2. Should the storyboard climax stay on minute-0–5 protocol fog, or on post-session reflection load?
3. When Ready-for-Design checklist + practice sim ships, does frame 3 become obsolete or become the “before” contrast reel?

---

## Manifest

- **Fidelity:** storyboard · visual mid · interaction low · 7×16:9 · complexity mid  
- **Tool:** prompt-spec (spec-handoff to GPT Image / Gemini / equivalent) — frames not generated in-repo this turn  
- **PRD:** inline (chat) — tutor first-week feeling for exec alignment  
- **Grounding:** `flows.md` + `users.md`; **uno-blueprint live query skipped** (Supabase MCP needs auth in Cursor desktop)  
- **Artifact path:** `prototypes/_wip/tutor-first-week-storyboard-spec.md`  
- **Next:** Authenticate Supabase and re-ground if blueprint cells must back the low points · hand to `skills/uno-review` for stage-lens · then run image gen and drop frames beside this spec if you want them versioned  

**DS-lens:** N/A at this fidelity beyond “no product UI invented” — no DS components in frames.
