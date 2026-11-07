# Call-off confirmation, brought current

`src/CallOffConfirmation.jsx` is what a tutor sees after calling off a session, written against the old component library, and `src/App.jsx` renders it. An `Alert` warns that a call-off less than 24 hours before the session is a late call-off and counts as a strike, a `Badge` marks the call-off *Late*, the buttons take `size="small"`, `fill` and `variant`, a `Toast` confirms that the supervisor has been notified, and the styles read `--size-element-*` and `--color-surface-container` tokens.

Bring it current in `src/`, with the PLUS design system: the same content and behavior, in the names the system has today.

When you are done, write `NOTES.md` with one paragraph on what you built and any old name you could not map.
