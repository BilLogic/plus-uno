<!-- Tier: 2 -->
# PLUS Features & Entities

## Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Session** | A tutoring slot on Zoom or Pencil Spaces | Date, time, platform (Zoom/Pencil), school/site, tutor assignments, recording, attendance |
| **Reflection** | Post-session tutor self-report (two tiers) | Student reflection (per student) + Session reflection (overall). Can escalate to supervisors |
| **Training Module** | Onboarding curriculum unit | Module 1-6+ covering: PLUS background, policies, tools, session responsibilities, scenarios |
| **Group** | Organizational unit | By university (CMU/Pitt/Duq), team, school site |
| **Session Sign-Up** | Tutor registers for sessions | One-time or recurring. Supports fill-ins for open slots |
| **Call-Off** | Tutor cancels a session | Late call-offs (< 24h) tracked. Shift swap requests. Accidental sign-up handling |
| **Strike / Warning** | Compliance violation | 3-strike policy across 9 behavior categories |
| **TIP / PIP** | Formal intervention | Tutor Improvement Plan → Performance Improvement Plan. Manually initiated by supervisors |
| **Tutor Coach Report** | AI-generated weekly report | Per-tutor compliance summary from Zoom/Pencil data. Supervisor reviews + manual overrides |
| **Student Assignment** | Tutor-student pairing | Automated post-attendance. Replaced manual matching by lead tutors |
| **Student Insight** | AI-generated student summary | Engagement style, needs, support strategies. Shown before breakout rooms |
| **In-Session Note** | Lightweight timestamped observation | Tags: Breakthrough, Stuck, Question, Concern, Just noting. ≤100 chars. Feeds into reflections |
| **Lesson** | Training content unit | Assigned vs in-progress states. Part of SMART training system |

## Product Pillars

### Toolkit (Tutor-Facing)

The in-session workspace. What tutors interact with during and around sessions.

| Feature | Status | Description |
|---------|--------|-------------|
| **Sessions View** | Deployed | Session list with sign-up, fill-in, call-off actions |
| **Student Cards** | Deployed | Per-student view during session with status, engagement, actions |
| **Student Reflections** | Deployed | Post-session per-student reflection form |
| **Session Reflections** | Deployed | Post-session overall reflection with escalation checkbox |
| **Tutor-Student Assignment** | Deployed | Automated student pairing post-attendance |
| **Student Insight Panel** | Near hand-off | AI-generated student summaries on student cards |
| **Mark as Helped** | Concept stage | Track tutor-student help interactions during session |
| **In-Session Note-Taking** | Design WIP | Lightweight timestamped observations during live sessions |
| **Session Escalation** | Deployed (v10.1) | Flag session for supervisor review via reflection checkbox → Slack list |
| **Session Sign-Up v2** | Deployed | Recurring sessions, fill-ins, call-offs, withdrawal requests |
| **Session v1.5** | Deployed | Quick fix for accidental registrations ("signed up by mistake") |
| **Session Cancellation** | Deployed | Admin cancels session → auto-approve related call-offs |
| **Calendar Sync** | In progress | Sync signed-up sessions to tutor's calendar |
| **Strategy Revamp** | User testing | AI-powered moment flagging + tailored strategy recommendations |
| **Tutor Motivation (TACT)** | Near hand-off | Pre/post-session affirmations and growth reflections |
| **Call-Off & Shift Swap Redesign** | Deployed | In-app call-offs and swap requests |

### Training (Onboarding & Development)

| Feature | Status | Description |
|---------|--------|-------------|
| **Training Modules** | Deployed | 6+ modules: PLUS background, policies, tools, session duties, scenarios, tutoring tools |
| **Tutor Onboarding Redesign** | Ready for design | Step-by-step checklist + AI-powered practice simulation |
| **Help Center** | Design WIP | Intercom-based self-service: feature walkthroughs, FAQ by category, video guides |
| **Lessons Listing Facelift** | Near hand-off | Clearer assigned vs in-progress lesson states |
| **Design System Playbook** | In progress | Onboarding resource for new designers joining each semester |

### Admin (Supervisor & Admin Dashboards)

| Feature | Status | Description |
|---------|--------|-------------|
| **Tutor Coach Dashboard** | Deployed | AI-generated weekly compliance reports per tutor |
| **Tutor Admin Revamp** | Design specs in dev | Centralized supervisor interface with Tutor Coach integration |
| **Group Management** | Deployed | Organize tutors by university, team, site |
| **TIP/PIP Workflow** | Deployed | Manual tutor improvement plan initiation and tracking |
| **Toolkit Admin Redesign** | In progress | Students tab + associated functionality in Tutor Admin |
| **Sidebar IA Revision** | Planning | 3-category navigation tree restructure (Toolkit, Training, Admin) |

### Research & AI

| Feature | Status | Description |
|---------|--------|-------------|
| **Tutor Coach AI** | Deployed | Weekly behavior analysis from Zoom/Pencil recordings. 9 behaviors tracked |
| **Student Insights AI** | Near hand-off | Per-student engagement summaries from session data |
| **AI Research Assistant** | Prototype | Chat-based research tool — AI consolidates millions of interactions into answers |
| **Strategy Recommendations** | User testing | AI-powered tutoring strategy suggestions based on flagged moments |
| **Note-Taking → AI Pipeline** | Design WIP | In-session notes as grounding signals for AI analysis |

## Tutor Coach — 9 Monitored Behaviors

| # | Behavior | Source | Description |
|---|----------|--------|-------------|
| 1 | **No-Show** | Zoom/Pencil | Tutor didn't attend scheduled session |
| 2 | **No Camera** | Zoom metadata | Camera off during session |
| 3 | **No Laptop** | Zoom/Pencil | Using phone instead of laptop |
| 4 | **Foul Language** | Pencil/AI transcription | Inappropriate language detected |
| 5 | **Late Call-Off** | Platform data | Session cancelled < 24h before start |
| 6 | **No Mic** | Zoom metadata | Microphone not used (no verbal engagement) |
| 7 | **No Help Offer** | Pencil interaction | Tutor didn't offer help to struggling students |
| 8 | **No Greeting** | Pencil/AI | Tutor didn't greet students |
| 9 | **Explicit Behavior** | Pencil/AI | Inappropriate behavior detected |

## Domain Terminology

| Term | Meaning |
|------|---------|
| **TIP** | Tutor Improvement Plan — formal intervention after 3+ strikes |
| **PIP** | Performance Improvement Plan — escalated from TIP |
| **Tutor Coach** | AI-powered weekly compliance monitoring system |
| **TACT** | Tutor motivation and feedback system (affirmations + growth reflections) |
| **Reflection** | Post-session self-report by tutor (student-level + session-level) |
| **Escalation** | Tutor flags a session for supervisor review via reflection checkbox |
| **Strike** | Accumulated compliance violation (9 behavior categories, 3-strike threshold) |
| **Call-Off** | Tutor cancels a session. Late (< 24h) call-offs are flagged |
| **Fill-In** | Tutor volunteers to cover an open session slot |
| **Shift Swap** | Tutor requests another tutor to cover their session |
| **Lead Tutor** | Senior tutor with mentoring + attendance responsibilities |
| **Affiliation** | University: CMU, Pitt, or Duquesne |
| **Site** | School location where students are based |
| **SMART** | PLUS training system for tutor development |
| **Breakout Room** | Zoom sub-room where tutor works with assigned students |
| **Student Card** | UI component showing student info, engagement, and actions during session |
| **Student Insight** | AI-generated summary of student engagement style and needs |

## Notion Sources

- [Session Sign-Up Redesign](https://www.notion.so/21eb7cca4982806b9820fa3c6c7fd1ab) — Call-off + fill-in flow
- [Session Functionality v2](https://www.notion.so/257b7cca498280118cedce59b8cf2eb1) — Recurring sessions, fill-ins
- [Session v1.5](https://www.notion.so/276b7cca498280589208f53d989e2a7b) — Accidental registration fix
- [Session Cancellation v2.5](https://www.notion.so/1f819b4b51f245699d5aaf5066e6abed) — Session cancellation flow
- [Call-Off Redesign](https://www.notion.so/13cb7cca4982807cbecfc0d415db0d29) — Call-off + shift swap experience
- [Calendar Sync](https://www.notion.so/277b7cca498280609a13d38313b890e4) — Calendar integration for sessions
- [Sidebar Revamp](https://www.notion.so/10db7cca498280609448fb55113831ac) — Toolkit section IA updates
- [Toolkit Page Redesign](https://www.notion.so/157b7cca4982802ab7b6d361724f0bec) — Core toolkit page
- [Toolkit Admin Redesign](https://www.notion.so/9d0eee3cc7644b92b984b1ffc9a2fc6e) — Students tab in admin
