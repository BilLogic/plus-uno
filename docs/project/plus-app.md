# PLUS App — Product Landscape

## Mission

AI is rewriting our economy, and it runs on one language: mathematics. But global math proficiency among K-12 students is at a historic low due to a lack of both content mastery and emotional support. Decades of research prove one-on-one human tutoring works — moving students two standard deviations ahead. But most public schools simply cannot afford it.

**Traditional one-on-one tutoring: $2,000/student/month. PLUS: $20/student/month.**

PLUS makes expert tutoring both effective and scalable by combining AI superpowers (tracking patterns, coordinating data, surfacing insights in real time) with human superpowers (building trust, reading the room, making judgment calls).

## Service System

PLUS isn't just an app for tutors — it's a service system connecting four groups:

```
Philanthropic Foundations → provide funding
        ↓
PLUS → trains and pays college STEM students as tutors
        ↓
Tutors → deliver one-on-one instruction to K-12 students
        ↓
Schools → receive tutoring for free, share student progress data
        ↓
Researchers → analyze data, prove impact, validate strategies
        ↓
Evidence → feeds back to foundations (completing the loop)
```

As the system operates, it improves: AI gets sharper, training becomes faster, cost per student drops. What started foundation-funded becomes sustainable — schools can eventually self-fund as efficiency increases.

## The AI + Human Loop

### Before Sessions — AI as Coach
Tutors train through simulations — real scenarios like a student saying "I'm just not good at math." They practice responses and build pedagogical skills at scale before ever meeting a real student.

### During Sessions — AI as Co-Pilot
AI surfaces student momentum (progressing or stuck?), highlights key observations (where exactly are they struggling?), and provides talking points (how might we smoothly intervene?). The tutor sees the full picture and decides how to respond.

### After Sessions — AI Guides Reflection
AI prompts tutors to reflect on each student's progress and their own tutoring strategy: What worked? What didn't? Their insights feed back into the system — making the AI a better co-pilot for the next session.

### Between Sessions — AI as Personal Coach
Each week, tutors receive reports with personalized encouragement, showing their growth and specific strategies to improve. This continuous loop ensures every hour of tutoring is more effective than the last.

## Platform Overview

PLUS connects 500+ college tutors with 3,000+ marginalized K-12 students for math tutoring across CMU, Pitt, and Duquesne University. Sessions run on Zoom and Pencil Spaces.

The PLUS dashboard provides specialized features for each stakeholder:
- **Tutors** need in-session tools, reflections, training, and personal growth tracking
- **Administrators** need to know which tutors are thriving and which need support — table views give them operational health at a glance
- **Researchers** need to understand what teaching strategies actually work — they ask exploratory questions, and AI consolidates millions of interactions into answers

## Platforms & Integrations

| Platform | Role | Data |
|----------|------|------|
| **Pencil Spaces** | Primary tutoring platform | Rich metadata: interaction data, session recordings, content context |
| **Zoom** | Secondary session platform | Breakout rooms, recordings (minimal metadata vs Pencil) |
| **Slack** | Team communication | Escalation lists, supervisor alerts, beta group feedback, call-off notifications |
| **Intercom** | Help Center hosting | Tooltip onboarding, searchable articles, feature walkthroughs |
| **Notion** | Product HQ | Roadmap database, PRDs, meeting notes, design running notes |
| **Figma** | Design source of truth | Component library, prototypes, design specs, design system |
| **Acuity** | Session scheduling | Embedded iframe for session sign-ups |
| **Mathia / IXL** | Math content platforms | Learning content used during sessions |
| **Workday / Handshake** | Tutor recruitment | Job postings, application management |

## Current Product Direction

### Active Initiatives
- **Sidebar IA Revision** — Restructuring navigation into 3-category tree (Toolkit, Training, Admin)
- **In-Session Note-Taking** — Lightweight timestamped observations during live sessions
- **Help Center Launch** — Intercom-based self-service for tutors (feature walkthroughs, FAQ)
- **Student Insight Panel** — AI student summaries on student cards before breakout rooms
- **Tutor Admin Revamp** — Centralized supervisor interface integrating Tutor Coach
- **Strategy Revamp** — AI-powered moment flagging + tailored strategy recommendations

### Recent Launches
- **Session Escalation** — Reflection checkbox → Slack list → supervisor routing (v10.1)
- **Tutor-Student Assignment** — Automated pairing post-attendance
- **Tutor Coach v1** — AI weekly compliance reports deployed
- **Session Sign-Up v2** — Recurring sessions, fill-ins, call-offs

### Future Exploration
- **AI Research Assistant** — Chat-based research tool for tutors in admin
- **Multi-tier Reflections** — More structured escalation and supervisor routing
- **Tutor Onboarding Redesign** — Checklist + AI simulation replacing manual training
- **Calendar Sync** — Sync signed-up sessions to personal calendars
- **Beta Testing Program** — 10 volunteer tutors testing features before rollout

## Related Docs

- [Users & Stakeholders](plus-app-users.md) — who uses PLUS, team structure
- [Features & Entities](plus-app-features.md) — product pillars, feature status, core data model
- [User Flows](plus-app-flows.md) — session lifecycle, sign-up, escalation, training, tutor coach

## Notion Sources

- [Product HQ](https://www.notion.so/05ceff2078364d58a294b5f69f2026cd) — Roadmap database, third-party apps, release notes
- [Tutor Coach PRD](https://www.notion.so/9e5ff0e48ea74cd48159f28ac1ef8c39) — AI compliance monitoring (ID: 1205)
- [Tutor Onboarding PRD](https://www.notion.so/25db7cca49828003b92bc978886b916c) — Training redesign (ID: 1856)
- [Escalate Session through Reflection](https://www.notion.so/2a0b7cca49828014b002f365af5c45c5) — Session flagging (ID: 2067)
- [In-Session Note-Taking](https://www.notion.so/2e0b7cca498280dabcdfd0227b07652f) — Lightweight observations (ID: 2158)
- [Help Center for Tutors](https://www.notion.so/26ab7cca49828074b1b0e2196bd20519) — Self-service training (ID: 1901)
- [Ongoing Design Projects](https://www.notion.so/1eab7cca4982804cb5deca6e447e284b) — Active project status overview
- [Beta Testing Program](https://www.notion.so/321b7cca498280839ae0e0d95e9e67fa) — 10 volunteer tutors
- [PLUS Training](https://www.notion.so/1fab7cca498280e488b4c112ac296a44) — Training curriculum resources
- [PLUS Tutoring 101](https://www.notion.so/a87a3afc6b5043b29b45e4a076635409) — Tutor handbook
