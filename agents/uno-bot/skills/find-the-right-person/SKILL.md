---
name: find-the-right-person
embodiment: uno-bot
disclosure: reference
summary: Bot skill — name the person who can help (an SME, an app's admin, a doc's owner) with the reason and a ready request.
description: who should I talk to about X, who knows X, who grants access to or admins tool Y, who owns this doc, who is Coco — read before naming a person for a topic, an access request or a page.
---

# Find the right person

Someone needs a person: an expert on a topic, the admin who grants access to a tool, the owner of a page. The deliverable is the name, the reason they fit, and the next move ready to send, so the asker goes straight to them.

## Steps

1. **Sort the ask.** Access to a tool or app · expertise on a topic · the owner of a linked page · who a named teammate is. An ask that is two of these is two lookups in one step. Done when each part has its lookup.
2. **Access.** `notion_search` with scope apps; its description sets the whole deliverable: the Application Admin who grants, Power Users for how-to questions, a short request the asker can paste, and the app's directory page. Done when the admin is named with the request drafted, or the app is reported as unlisted with the closest listed names.
3. **Expertise.** `notion_search` with scope team returns the roster of current members, Past Collaborators left out. Match the topic against each person's role and bio; a bio that names the work is the evidence. Where the roster is thin, `slack_search` for who has discussed the topic and cite the permalinks. Done when you hold two to four people, each with a one-line reason drawn from their bio or a linked message, or have found none.
4. **A page's owner.** `source_read` the link and report its Owner and people properties. Done when the owner is named from the page, or the page has no owner property and you said so.
5. **A named teammate.** `slack_user_profile` by name; several matches → ask which one. Done when one person is resolved.
6. **Reply.** Strongest fit first: name · role · the reason · LinkedIn when the roster carries it. Tag a person as `<@U…>` from the roster's Slack id; with no id, name them. No clear match → say so and name the closest group with two people from it. Done when every person in the reply came back from a lookup this turn.

## Shape

```
For *{topic}*, talk to:
- **{Name}** — {role}. {why, from their bio}. [LinkedIn]({linkedin})
```

An access answer leads with the admin, then the request in a quote block, then the directory link. Two or more people from one lookup go in a result table or answer cards: `docs/connectors/slack/shapes` § Answer shapes.

## Exit

- **answer** — the people, each with a reason and a link, or the plain finding that no one fits and the closest group. An intro the asker wants sent for them continues in relay-a-message.
- **hand off** — a question that needs more than three docs, a study guide, or a data pull: a ready-to-paste IDE prompt naming uno-research, the topic, and what was already checked.
