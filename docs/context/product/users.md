<!-- Tier: 2 -->
# PLUS Users & Stakeholders

## User Roles

| Role | Who | Scale | What they do |
|------|-----|-------|-------------|
| **Tutor** | Part-time college students (CMU, Pitt, Duquesne) | ~500 | Conduct sessions, complete reflections, track training, sign up for sessions |
| **Lead Tutor** | Experienced tutors promoted internally | ~30 | Mentor peers, attend weekly debriefs, mark attendance, manage breakout rooms |
| **Tutor Supervisor** | Full-time staff | ~5 | Monitor compliance via Tutor Coach, review flagged sessions, manage TIP/PIP, approve call-offs |
| **Admin** | Program leadership | ~3 | Product roadmap, OKRs, cross-team coordination, researcher collaboration |
| **Student** | K-12 math learners in public schools | ~3,000+ | Attend sessions, receive tutoring, grouped by school/site |
| **Teacher** | School-side coordinators | ~50+ | Coordinate session schedules, provide student context, share progress data |
| **Researcher** | Internal research team | ~5 | Track tutoring behaviors, analyze outcomes, experiment with pairing protocols |

## Stakeholder Context

### Tutors
- Part-time college students, mostly STEM backgrounds (math, engineering, science, public policy, linguistics)
- Academic levels from freshman to graduate students
- High turnover rate — most are part-time, recruited each semester via Workday/Handshake
- Need clear onboarding since they have short, strictly timed sessions to adapt to
- Organized by **affiliation** (CMU, Pitt, Duquesne) which determines their supervisor assignment
- Run back-to-back sessions making it hard to recall details for reflections

### Lead Tutors
- Senior tutors with mentoring responsibilities
- Mark attendance at session start (triggers automated student-tutor assignment)
- Attend weekly debriefs
- Previously spent 3-5 minutes manually matching students — now automated

### Tutor Supervisors
- Full-time staff who each cover a segment of tutors:
  - **Alex Houk** — Duquesne + Pitt (all surnames)
  - **Emme Castellow** — CMU (surnames A-K)
  - **Jacquelynn Jordan** — CMU (surnames L-Q)
  - **Harry Gilliland** — CMU (surnames R-Z)
- Review AI-generated Tutor Coach reports weekly
- Manually override false positives in compliance data
- Initiate TIP (Tutor Improvement Plan) after 3+ strikes
- Receive escalated session flags via Slack lists
- Previously had to coordinate every change manually — system now automates most monitoring

### Administrators
- **Shiv** — Program leadership, product vision, success metrics
- **Suraj** — Product management, PRD writing, sprint planning, stakeholder coordination
- Set OKRs, approve feature priorities, coordinate between design/engineering/research

### Students
- K-12 math learners in public schools (primarily marginalized communities)
- Grouped by school **site** (geographic location)
- Each student has engagement data, assignment history, and AI-generated insights
- Sessions happen on Zoom (breakout rooms) or Pencil Spaces

### Teachers
- School-side coordinators who schedule sessions
- Provide student context and share progress data back to PLUS
- Part of the service system loop — schools receive tutoring for free in exchange for data

### Researchers
- Analyze tutoring behavior data to prove impact and validate strategies
- Experiment with pairing protocols (can now do this without burdening ops)
- Track skills demonstrated, noted, and remediated
- Their evidence feeds back to philanthropic foundations

## PLUS Team Structure

| Team | Members | Focus |
|------|---------|-------|
| **Product** | Shiv (lead), Suraj (PM) | Roadmap, PRDs, stakeholder coordination |
| **Design** | Bill (lead), Ashley, Victor, Bryan + rotating designers each semester | UI/UX, design system, prototyping, user research |
| **Engineering** | Jose, Ishan, Max, Zach, Cindy | Frontend, backend, AI/ML, data pipelines |
| **Research** | Internal team | Behavior analysis, pairing experiments, outcome tracking |
| **Supervisors** | Alex, Emme, Jacquelynn, Harry | Tutor management, compliance, intervention |

### Design Team Notes
- New designers onboard almost every semester — the Design System Playbook helps with this
- Designers typically contribute 5-10 hours/week (part-time student workers)
- Sprint cadence: 2-week sprints
- Design artifacts live in Figma; documentation in Notion
- Design reviews happen via Notion Design Running Notes

### Beta Testing Group
- 10 volunteer tutors from diverse academic backgrounds (math, engineering, linguistics, psychology, policy)
- Mix of freshman through graduate students
- Participate through Slack feedback and occasional 20-45 min Zoom sessions
- No NDAs — feedback from peers is welcomed
- Help test features before wider rollout
