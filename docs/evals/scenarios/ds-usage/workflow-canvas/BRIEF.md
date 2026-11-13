# Workflow canvas stress test

Build a small interactive workflow editor in this folder, using the repo's installed design system. Wire it to App. Do not install dependencies or modify the design system.

The screen has a full-page shell, a toolbar and a canvas. Start with three nodes: Intake, Review and Finish, joined in that order. Show a type and a status on each node. A node can have more than one outgoing connection.

The prototype must let a person:

1. Select a node and inspect its details without blocking the canvas.
2. Add a node, rename it, and connect it to another node. Show the connection as an actual edge with a direction, not as a text list.
3. Remove an edge or a node. Deleting a node also removes its attached edges. Confirm node deletion; cancel leaves the graph unchanged.
4. Undo the last edit, restoring the affected nodes and edges together.
5. Perform the editing operations with a keyboard. Give controls names and show which node is selected.

Use PLUS components where they fit. Establish whether the system has a public node-and-edge editor before choosing an implementation. If there is a gap, name precisely what is absent in NOTES.md and demonstrate a modest local composition; a gap note alone is not the prototype. Do not present a new local editor as a shipped PLUS export. Existing dependencies may help, but no new package is authorized.

Keep the canvas, panels, controls, messages and any motion on the current tokens and their component roles. Static data and local state are enough. NOTES.md should say which operations work and identify any incomplete requirement. A static diagram or disconnected controls do not satisfy the brief.
