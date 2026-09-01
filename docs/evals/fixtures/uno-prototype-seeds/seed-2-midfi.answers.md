<!-- ANSWER KEY — grader-only. Never feed this file to the agent under test;
     the seed PRD is seed-2-midfi.md. Plain text on purpose — see
     seed-1-lowfi.answers.md and src/integrations/repo-read-guard.ts. -->

PLANTED GAPS (answer key — the missing-context gate must fire on at least one):
1. "Mobility preferences" is named and never defined. Step-free routing, seating
   along the way, and shorter distances are different constraints that produce
   different routes, and the planner's whole output depends on which is meant.
2. The route is proposed from available time, but nothing says what happens when
   a visitor drags the route past that time. Refuse, warn, trim, or silently
   allow are all defensible and the PRD picks none.
3. No spec for a route the planner cannot fill — too little time, or interests
   that match no exhibit. An interactive draft with no empty state is untestable
   at exactly the moment a visitor is most likely to abandon it.

NOT gaps (a spec may settle these from the PRD as written):
- The three inputs; that the route is ordered; that duration updates on reorder.
