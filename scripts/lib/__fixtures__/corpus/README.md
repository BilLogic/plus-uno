# corpus fixture tree

The tree `scripts/lib/corpus.test.mjs` reads instead of the live repo. #469's
rule: a checker takes a root, so its test can own a corpus nobody else edits —
planting a fixture in the real tree makes every other sweep read it too.

Each file here exists for one case, named in the test beside the assertion:

| File | Case |
|---|---|
| `docs/plain.md` | no frontmatter; links; backticked paths that are not links |
| `docs/folded.md` | folded `>` and `\|` blocks, a quoted value |
| `docs/unterminated.md` | an opening fence with no close — all body, no meta |
| `docs/brackets.md` | an unquoted flow sequence — rejected with a clear error |
| `docs/nested/deep.md` | a file one level down, for the recursive walk |
| `docs/notes.txt` | not markdown — outside the default extension set |
| `page.mdx` | the heading outline, including a heading inside a fence |

The ignore rules are NOT fixtures here: `node_modules/`, `dist/` and
`coverage/` are gitignored repo-wide, so a tracked fixture cannot carry them.
The test builds that tree in a temp directory instead.
