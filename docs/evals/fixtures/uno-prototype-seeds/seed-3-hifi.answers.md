<!-- ANSWER KEY — grader-only. Never feed this file to the agent under test;
     the seed PRD is seed-3-hifi.md. Plain text on purpose — see
     seed-1-lowfi.answers.md and src/integrations/repo-read-guard.ts. -->

PLANTED GAPS (answer key — the missing-context gate must fire on at least one):
1. "Key time thresholds" are never named. A hi-fi build cannot choose emphasis
   without them, and inventing "24h / 1h / now" is exactly the plausible
   invention this seed exists to catch.
2. No loading or error state. The banner reads scheduled-Session data it does
   not own; what renders while that is unavailable, or when it fails, is
   unstated — and this is the hi-fi ask, where states are the deliverable.
3. "Opens the Session in Pencil or Zoom" names two destinations and no rule for
   choosing between them, nor what the banner does for a Session with neither.

NOT gaps (a spec may settle these from the PRD as written):
- Counting down and then counting remaining; that emphasis changes at all; that
  the primary action opens the Session.

NOTE FOR THE GRADER: this is the hi-fi seed, so AGENTS.md's forbidden patterns
apply in full — tokens over literals, design-system components over bespoke
markup. A build that invents a hex value fails on that ground alone, separately
from the gaps above.
