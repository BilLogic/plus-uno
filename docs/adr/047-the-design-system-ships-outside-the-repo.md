---
embodiment: ide
summary: The design system ships outside the repo as one package, @plus-uno/cli, a copy-in registry plus the ds lookup and MCP over one baked snapshot.
status: active
verified: 2026-11-13
---

# ADR-047: The design system ships outside the repo (2026-11-13)

**Decision.** The design system is available to projects outside plus-uno through one npm package, `@plus-uno/cli`. Its command `ds` finds, reads, adds and checks; `ds mcp` serves the same lookup as an MCP server. `ds add` copies registry items (foundation, components, patterns, page templates, charts) into the consuming project with their dependencies. This supersedes [ADR-006](006-strip-npm-publishing-from-design-system-package.md): the `design-system/` package stays private, and the published artifact is the CLI.

**Why.** Prototypes and product code outside this repo had only the hosted MCP and Storybook to read, and no way to take the components. ADR-006 removed publishing because nothing consumed a package; something does now. One package, not two, because the CLI and the MCP share one lookup and one baked snapshot, and splitting them would ship the snapshot twice. The copy-in registry (as shadcn does) leaves the consumer owning the files, so no runtime dependency on the design system is added.

**Constraints.** The package name lives in one constant (`packages/cli/src/constants.mjs`); the README install lines read it, so a rename is one line. Publishing goes through npm trusted publishing over OIDC, with provenance and no token secret, and the first publish waits for a release Bill calls. The MCP SDK is the one runtime dependency, pinned to the version the repo already uses.

**What would reopen it.** A consumer that needs live updates rather than copied files, or a snapshot too large to ship, calls for a new decision on the package shape.
