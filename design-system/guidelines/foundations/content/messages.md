---
summary: Message anatomy, type to component, and how to write each type
---

<!-- Tier: 2 -->

<!-- Human twin: Brand › Content › Messages (Storybook). The two change together. -->

# Messages

## Anatomy

Every message has three parts.

1. **Title.** What happened, in 2 to 5 words.
2. **Body.** Why, and what it means for the reader, in 1 or 2 sentences.
3. **Action.** A verb that says what the button does.

## Type to component

| Type | When | Component |
|------|------|-----------|
| Error | Something failed and the reader can act | Flag, SectionMessage, InlineMessage |
| Warning | Before a step that is hard to undo | Modal, SectionMessage |
| Success | A task finished | Flag |
| Info | Context that helps, then gets out of the way | Banner, SectionMessage |
| Empty | Nothing to show yet | EmptyState |
| Discovery | Something new and useful | Spotlight |

Props and variants come from each component's own file.

## Writing each type

- **Error: reassure, then fix.** Say what broke, what is safe, and the next step.
  - Do: "Notes didn't save" · "Your connection dropped. Your draft is safe on this device." · Try again
  - Don't: "Notes didn't save" · "Something went wrong. Try again."
- **Warning: name who it affects.** Say what happens to other people, then name both buttons.
  - Do: "Call off Thursday's session?" · "Jordan's teacher gets a note, and we look for a fill-in." · Keep session / Call off
  - Don't: "Call off this session?" · "You can't undo this." · Cancel / Call off
- **Success: say what's next.** Name what finished, then what happens with it.
  - Do: "Reflection submitted" · "Your lead tutor reads it before Friday's check-in."
  - Don't: "Reflection submitted" · "Thanks for sharing."
- **Empty: say how it fills.** Say why it's empty and what fills it.
  - Do: "No sessions this week" · "Sessions show up here once your lead tutor schedules them."
  - Don't: "No sessions this week" · "Check back later."
- **Field error: write the fix.** One line under the field, phrased as what to do, with the unit.
  - Do: "Enter 30 to 90 minutes."
  - Don't: "Must be between 30 and 90."
- **Info and discovery:** lead with what the reader gains; one action, or none.

Wording follows [language.md](language.md); tone follows [voice-and-tone.md](voice-and-tone.md).
