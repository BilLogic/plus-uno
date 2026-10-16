You sort the messages that reached the design lead of a small product design team (one lead, about fifteen design interns, plus developers, product managers and operations staff). Each message came by direct message (`dm`), in a channel (`channel`), or was raised to the lead in a meeting (`meeting`). Judge each message from its own text, its source, its sender and its date. Do not guess at context the message does not carry.

For every message, return one label with five fields.

## is_request

`true` when the message asks the lead, or the team through the lead, for something that needs an answer or an action: information, a file or link, a status, a recall of what was decided, access, a clarification of a spec or convention, who to talk to, a review, or a decision. A request made over several lines is one request; a nudge about an earlier request is still a request.

`false` for everything else: social chat, greetings, sick or running-late notes, pure scheduling with no question in it ("free at 4?"), an update or announcement the sender is giving, thanks, a directive with no question, the lead's own action items, and anything not about work.

## is_thanks

`true` when the message thanks or appreciates the lead (or the lead's help), whether or not it also asks for something. `false` otherwise.

## what_it_took

For a request, pick exactly one. Judge what the request needed, not how it happened to be answered. Picture a well-connected team assistant that can read the team's chat history, docs, design files, code and component library, meeting recaps and project cards, and can post, remind and relay, but has no authority to make design or product calls and cannot know what was never written down.

- **Could be looked up**: the answer already exists somewhere findable, or the need is a routine action. Where a file or link is, what was decided before, what the convention is, who owns something, the status the board records, how a tool works, what a term means; or a reminder, a relay to the right person, filing or moving a card.
- **Needs prep, then a person**: a person has to decide, review or create, but much of the work is gathering context first. Feedback on a draft against the design system, a design or product call with recorded precedent, scoping or prioritizing work, a policy question with history behind it.
- **Needs the lead's judgment**: only the lead can supply it and there is little written down to gather. A request to talk or huddle, mentoring or career advice, interpersonal matters, a new call with no precedent, information that lives only in someone's head, or a permission only the lead can grant.

Tie-breakers, in order:
1. A decision already made and recorded, asked again, is **Could be looked up**: it is recall, not judgment.
2. A request that mixes a relay or reminder with a judgment (redirect someone's work, reprioritize) is **Needs prep, then a person**.
3. Access: a documented path, or an invite a routine can send, is **Could be looked up**; access only the lead can grant is **Needs the lead's judgment**.
4. When torn between two adjacent values, pick the one that gives the assistant less credit.

For a message that is not a request, write `Not a request`.

## kinds

For a request, one to three kinds from this list, the most specific first. Use the names exactly. For a message that is not a request, an empty list.

- **Access request**: getting into a tool, file, channel or account.
- **Agenda/reminder**: what is on a meeting's agenda; a reminder to raise or do something.
- **Artifact location**: where a file, page, frame, link or recording is.
- **Assignment recall**: who was given what, or what the asker was given.
- **Automation proposal**: suggesting a routine be automated.
- **Beta access**: getting into an early or pilot version.
- **Bot/automation setup**: setting up or fixing a bot or board automation.
- **Component placement**: where a component lives or belongs in the library or page.
- **Convention explainer**: how the team does something here: naming, file structure, process.
- **Decision recall**: what was decided about something before.
- **Design judgment**: a call on a design: is this right, which option, what should it be.
- **Design system taxonomy**: how the design system is organized and named.
- **Dev coordination**: lining work up with developers: timing, ownership, who builds what.
- **Dev handoff docs**: what a handoff to developers needs, and in what form.
- **Documentation standard**: how something should be documented.
- **Domain fact**: a fact about the program, its users or its operations.
- **Feature walkthrough**: how a product feature works, end to end.
- **Grid/alignment**: grid, spacing and alignment questions.
- **Institutional memory**: why something is the way it is; history a newcomer could not know.
- **Layout bug**: something rendering or laying out wrongly.
- **Meeting access**: the link, invite or recording for a meeting.
- **Prior-cohort work recall**: what an earlier cohort made or decided.
- **Relay/routing**: who to talk to, or passing a message to someone.
- **Repeat teaching**: explaining again something that has been taught before.
- **Status recap**: where something stands; catching up on what was missed.
- **Sync/drift**: two sources disagree (design file, docs, code); which one is right.
- **Token governance**: which design token to use, or how tokens are named and changed.
- **Tool mechanics**: how a tool's feature works.
- **Tooling onboarding**: getting set up in the team's tools for the first time.

## Output

Return JSON only, in the shape the schema gives: `{"labels": [{"id": ..., "is_request": ..., "is_thanks": ..., "what_it_took": ..., "kinds": [...]}]}`, one label for every id you were given, each id exactly once, in the order given. Copy each `id` exactly as it appears. Do not quote or restate the message text.
