# PLUS User Flows

## Session Lifecycle (Tutor)

The core workflow — what happens before, during, and after every tutoring session.

```
Sign Up → Pre-Session → In-Session → Post-Session → Between Sessions
```

### 1. Sign Up
- Browse available sessions (filtered by site, date, recurring vs one-time)
- Register for one-time or recurring sessions
- Fill in for open session slots when other tutors call off

### 2. Pre-Session
- View assigned students on student cards
- Read AI-generated student insights (engagement style, needs, strategies)
- Review recommended tutoring strategies from previous sessions
- Receive TACT motivation dashboard (affirmations, growth metrics)

### 3. In-Session
- Join Zoom breakout room or Pencil Spaces session
- Receive auto-assigned students (lead tutor marks attendance → system pairs)
- Tutor students one-on-one
- Optionally capture lightweight notes (timestamped, tagged: Breakthrough/Stuck/Question/Concern)
- Mark students as helped (future)
- AI co-pilot surfaces momentum, observations, and talking points in real time

### 4. Post-Session
- Complete **Student Reflections** — one per student, covering progress and observations
- Complete **Session Reflection** — overall session quality, strategy effectiveness
- Optionally check "escalate this session" → triggers supervisor notification
- In-session notes surface as memory aid during reflection

### 5. Between Sessions
- View TACT motivation dashboard with personalized encouragement
- Review weekly Tutor Coach report (personal growth, strategies to improve)
- AI insights from reflections feed back into next session's co-pilot

---

## Session Sign-Up & Call-Off

### Sign-Up Flow
1. Tutor opens Sessions view in Toolkit
2. Browses available sessions (filtered by site, date)
3. Chooses one-time or recurring registration
4. Acuity iframe handles scheduling details
5. Session appears in tutor's session list
6. Calendar sync sends to personal calendar (in progress)

### Call-Off Flow
1. Tutor can't attend → opens session → submits call-off
2. Must provide reason for call-off
3. **Late call-off** (< 24 hours before session) → flagged as strike
4. System checks call-off frequency and lateness against compliance thresholds
5. Supervisor notified of call-off

### Shift Swap Flow
1. Tutor requests another tutor to cover their session
2. Available tutors can accept the swap
3. Original tutor's call-off is not counted as a strike if swap is accepted

### Accidental Sign-Up (v1.5)
1. Tutor realizes they signed up by mistake
2. Selects "Signed up by mistake" option
3. Not counted as a call-off or strike

### Session Cancellation (Admin)
1. Admin cancels a session (school closed, schedule change, etc.)
2. All related tutor call-offs are automatically approved/excused
3. Affected tutors are notified

---

## Session Escalation

When a tutor encounters something concerning during a session:

1. During session reflection, tutor checks **"escalate this session"** checkbox
2. System creates a new entry in supervisor Slack list with:
   - Tutor first name + surname
   - Affiliation (CMU / Pitt / Duq)
   - Date of report
   - Reflection text
   - Priority: empty (set by supervisor)
   - Status: Open
3. **Auto-assignment** based on affiliation + surname range:
   - Duquesne (all) + Pitt (all) → Alex Houk
   - CMU surnames A-K → Emme Castellow
   - CMU surnames L-Q → Jacquelynn Jordan
   - CMU surnames R-Z → Harry Gilliland
4. Supervisor reviews escalation, sets priority (Low/Medium/High)
5. Supervisor investigates (may review Zoom recording, logs, do tutor interview)
6. Closes with closure note + status → Closed

---

## Training Flow (New Tutor Onboarding)

### Current Flow
1. New tutor joins PLUS → receives access to training materials
2. Works through 6+ training modules:
   - **Module 1**: PLUS background (mission, virtual background setup)
   - **Module 2**: Policies & expectations (camera on, recording, attendance)
   - **Module 3**: Communication tools (Slack, platform features)
   - **Module 4**: Session responsibilities (co-host, breakout rooms, student engagement)
   - **Module 5**: Tutoring scenarios (handling difficult situations)
   - **Module 6**: Tutoring tools (Zoom, Pencil, PLUS platform features)
3. Training materials hosted in Intercom Help Center + Notion
4. Supervisors verify completion

### Future Flow (Redesign — Ready for Design)
1. New tutor joins → assigned step-by-step onboarding checklist in-app
2. Checklist guides through training modules with progress visibility
3. After checklist completion → AI-powered practice simulation
4. Simulation presents real scenarios (e.g., student says "I'm just not good at math")
5. Tutor practices responses, gets feedback
6. Marked as onboarding-complete → ready for first session
7. Completion data logged so supervisors can verify

---

## Tutor Coach (Supervisor Weekly Review)

The AI-powered compliance monitoring loop:

### Data Collection
1. AI processes session recordings weekly from both platforms:
   - **Zoom**: breakout room activity, camera status, mic usage, attendance
   - **Pencil Spaces**: interaction data, engagement metrics, content context
2. AI analyzes against 9 behavior categories

### Report Generation
3. Generates per-tutor weekly compliance report with:
   - Strike count per behavior category
   - Specific session timestamps and evidence
   - Trend over time

### Supervisor Review
4. Supervisor opens Tutor Coach dashboard
5. Reviews flagged tutors (sorted by strike severity)
6. **Manually overrides** false positives (e.g., camera failed due to tech issue, not non-compliance)
7. For tutors at 3+ strikes → initiates **TIP** (Tutor Improvement Plan)
8. If behavior continues after TIP → escalates to **PIP** (Performance Improvement Plan)

### Known Challenges
- Zoom provides minimal metadata vs Pencil's rich interaction data
- False positives require manual supervisor review
- Some behaviors (help offers, greetings) are harder to detect from recordings alone

---

## Tutor-Student Assignment (In-Session)

Previously a manual process taking 3-5 minutes per session:

### Current Flow (Automated)
1. Session starts → lead tutor marks **attendance** (which students showed up)
2. System automatically pairs students with available tutors
3. Assignments appear in sequence on tutor's **student cards**
4. Each card shows: student name, engagement level, AI-generated insight, action buttons
5. Tutor proceeds to help assigned students in breakout rooms

### Research Benefit
- Researchers can experiment with different pairing protocols
- Changes to pairing logic don't require ops coordination
- Data on tutor-student matching effectiveness feeds back into the algorithm

---

## In-Session Note-Taking (Design WIP)

A new capture point for tutor judgment during live sessions:

1. Tutor sees 📝 icon next to each student in "Your Students" table
2. Clicks icon → small modal opens
3. Selects optional tag: 💡 Breakthrough | 😟 Stuck | ❓ Question | ⚠️ Concern | 🗒️ Just noting
4. Types short observation (≤100 characters)
5. System auto-captures: timestamp, session ID, student ID, engagement level
6. Multiple notes per student allowed (captures progression)
7. Notes surface during post-session reflection as memory aid
8. Aggregated notes feed into AI systems (never surfaced verbatim to others)

### Example Note Sequence
```
10:15 — 😟 Stuck: Struggling with fraction multiplication
10:25 — 💡 Breakthrough: Visual model unlocked understanding
10:40 — 🗒️ Just noting: Applied independently to new problem
```

---

## Help Center (Design WIP)

Self-service support for tutors:

1. Tutor has a question about PLUS features
2. Opens Help Center (Intercom-based)
3. Browses by category (mapped to platform features: Zoom, Sessions, Reflections, etc.)
4. Finds article with walkthrough, video, or FAQ
5. Common questions addressed:
   - How to claim co-host in Zoom
   - How long to wait for students
   - How to edit a submitted reflection
   - How to handle "no students joined" situations
6. Time-sensitive questions (co-host, no students) flagged for faster response
