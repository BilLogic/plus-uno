# Which Figma API facts hold for this token and the Education plan?

Research for the "uno-bot in Figma" map. Checked 2026-09-30.

**Sources.** Figma's developer docs at developers.figma.com, plus two Figma Help Center pages where the developer docs are silent. The probe was a throwaway draft PR carrying a `pull_request` workflow. It sent GET requests only, with `FIGMA_ACCESS_TOKEN` (Bill's personal token), against the Universal team (`1279226364199713409`) and the design-system file (`FIGMA_FILE_KEY`). It printed status codes, counts and field names, never comment text, handles or emails. Nothing was created.

**Confidence.** **High** means a doc quote and the probe agree, or a doc quote is unambiguous. **Medium** means the docs imply it but nothing confirmed it. **Low** means the docs are silent and this is inference.

## Probe output (verbatim, trimmed)

```
200  GET /v2/teams/:id/folders — top keys=folders,name; folders=5; folder keys=id,name,parent_folder_id
403  GET /v1/teams/:id/projects — Invalid scope: ["current_user:read", "file_comments:read", "file_comments:write", ... "file_dev_resources:read", "file_dev_resources:write", ...
200  GET /v2/folders/:id/files — top keys=files,name; files=21; file keys=key,last_modified,name,thumbnail_url
403  GET /v1/projects/:id/files — Invalid scope: [...]
200  GET /v2/webhooks?context=team — top keys=webhooks; webhooks=0
400  GET /v2/webhooks (no context) — Missing required parameter context
200  GET /v1/files/:key/dev_resources — count=1; entry keys=file_key,id,name,node_id,url; max per node=1
200  GET /v1/files/:key/comments — count=439; comment keys=client_meta,created_at,file_key,id,message,order_id,parent_id,reactions,resolved_at,user,uuid;
     user keys=handle,id,img_url; client_meta keys=comment_pin_corner,node_id,node_offset,region_height,region_width,stable_path;
     replies(parent_id set)=142; replies with client_meta=0; top-level with node_id=297; resolved=231; distinct authors=16
200  GET /v1/files/:key/versions — version keys=created_at,description,id,label,thumbnail_url,user; user keys=handle,id,img_url
200  GET /v1/me — me keys=email,handle,id,img_url
```

No 200 response carried a rate-limit header. The only Figma header was `x-figma-rest-api-request-id`.

## 1. Folders with `folders:read`

**Answer.** Yes. `GET /v2/teams/:id/folders` and `GET /v2/folders/:id/files` both return 200 on this token. The deprecated v1 `projects` endpoints return 403, because the token has `folders:read` and not `projects:read`. A folder carries `id`, `name` and `parent_folder_id`. A folder file carries `key`, `name`, `last_modified` and `thumbnail_url`. The team call returns only top-level folders, so nested folders need a walk. Team ids cannot be discovered through the API.

**Sources.**
- [Folders endpoints](https://developers.figma.com/docs/rest-api/folders-endpoints/): both endpoints need scope `folders:read` and are Tier 2. The team call "returns top-level folders", and "It is not possible to programmatically obtain team IDs".
- [Projects endpoints](https://developers.figma.com/docs/rest-api/projects-endpoints/): `GET /v1/teams/:team_id/projects` is "Deprecated. Use `GET /v2/teams/:team_id/folders` instead".
- Probe: the 200 and 403 lines above.

**Confidence.** High.

## 2. Webhook payloads and when FILE_UPDATE fires

**FILE_COMMENT** carries these fields: `comment` (an array of `CommentFragment`, each with `text` or with `mention`, a user id), `comment_id`, `mentions` (User[]), `order_id` (top-level comments only), `parent_id` (set on a reply), `created_at`, `resolved_at`, `triggered_by` (User), `file_key`, `file_name`, `passcode`, `timestamp` and `webhook_id`.

It carries **no node anchor**. There is no `client_meta` in the payload. To learn which node a comment is pinned to, call `GET /v1/files/:key/comments` and match on `comment_id`. The event fires "whenever a user comments on a file". Nothing in the docs says resolving a thread fires it, so treat resolution as something only polling sees.

**FILE_UPDATE** carries only `file_key`, `file_name`, `timestamp`, `passcode` and `webhook_id`. It has no user and no change detail. It "Triggers within 30 minutes of editing inactivity in a file."

**FILE_VERSION_UPDATE** carries `version_id`, `label`, `description`, `created_at`, `triggered_by`, `file_key`, `file_name`, `passcode`, `timestamp` and `webhook_id`. It fires "whenever a user creates a named version". An autosave does not fire it.

**Email: none, anywhere.** A User has `id`, `handle` and `img_url`. `email` "will only be present on the `/v1/me` endpoint". The probe agrees: comment and version users carry `handle`, `id` and `img_url`, and only `/v1/me` carries `email`.

**Sources.**
- [Webhook events](https://developers.figma.com/docs/rest-api/webhooks-events/): the field lists and trigger lines quoted above.
- [Webhook types](https://developers.figma.com/docs/rest-api/webhooks-types/): `CommentFragment`.
- [User type](https://developers.figma.com/docs/rest-api/users-types/): the email line.
- Probe: the user keys above.

**Confidence.** High for the fields and the email finding. Medium that resolving a thread does not fire FILE_COMMENT: the docs are silent, and no webhook could be created to test it.

## 3. Webhook mechanics

**Passcode.** Required when a webhook is created, at most 100 characters. It is echoed in every delivery. Reads return it as an empty string. There is no HMAC. The docs say: "If you receive a request with the wrong `passcode`, you should respond with a `400 Bad Request` HTTP response which will immediately stop the webhook." Creating a webhook sends a `PING` unless its status is `PAUSED`.

**Retries.** Three retries: "5 minutes after the first failure … 30 minutes after the second failure … 3 hours after the third failure." The receiver must answer `200 OK`. `GET /v2/webhooks/:id/requests` returns deliveries from the last week.

**Limits.** "Team: 20 webhooks per team, Folder: 5 webhooks per folder, File: 3 webhooks per file." File context is also capped per plan: Professional 150, Organization 300, Enterprise 600.

**Who can create.** "Team admins can create webhooks for a team". Folder and file webhooks need `Can edit`.

**Reach.** Team webhooks "will not notify for files in invite-only folders."

**Scopes.** `webhooks:read` and `webhooks:write`, Tier 2. `GET /v2/teams/:team_id/webhooks` is deprecated in favour of `?context=team&context_id=`.

**Education plan.** The developer docs never mention Education. The Help Center says the Education plan gives "all Figma Professional plan features". The probe's team-context list returned 200 with 0 webhooks, so reading at team context works on this plan. Whether a team-context webhook can be **created** here is not verified. That needs a write (Bill's OK), and Bill must be an admin of each team.

**Sources.**
- [Webhooks V2](https://developers.figma.com/docs/rest-api/webhooks/)
- [Webhook endpoints](https://developers.figma.com/docs/rest-api/webhooks-endpoints/)
- [Webhook security](https://developers.figma.com/docs/rest-api/webhooks-security/)
- [Figma for Education](https://help.figma.com/hc/en-us/articles/360041061214-Figma-for-Education)
- Probe: the team-context webhooks line.

**Confidence.** High for the passcode, retries and limits. Medium for Education: it reads as Professional, and team-context reads work, but no webhook has been created.

## 4. Dev Mode links

**Limits.** 10 per node. The error reads "The node already has the maximum of 10 dev resources". A second link with the same URL on the same node is rejected: "Another dev resource for the node has the same url". The docs state no per-file limit. Writes can partly fail: the response is HTTP 200 with an `errors` array.

**Inheritance.** "If a dev resource is added to a component, the link is inherited by all instances of that component. If a dev resource is added to an instance of a component, the link will only appear for that instance." Nothing is documented for a link on a **component set**, including whether its variants or their instances show it.

**What an entry holds.** `id`, `name`, `url`, `file_key` and `node_id`. There is **no creator field**, so "added by le goat" can only live in `name`. The probe found 1 existing entry on the DS file with exactly those keys. The Help Center says links need "a Full or Dev seat" on a paid plan. No publish step is needed: links are "available immediately".

**Sources.**
- [Dev resources endpoints](https://developers.figma.com/docs/rest-api/dev-resources-endpoints/)
- [Dev resources types](https://developers.figma.com/docs/rest-api/dev-resources-types/)
- [Dev resources overview](https://developers.figma.com/docs/rest-api/dev-resources/)
- [Link Dev resources to layers](https://help.figma.com/hc/en-us/articles/15023231995927-Link-Dev-resources-to-layers-in-Dev-Mode)

**Confidence.** High for the per-node limit, the fields and component-to-instance inheritance. Low for component-set-to-variant behaviour: undocumented, and it needs one test write. Medium that there is no per-file limit, since that rests only on the docs' silence.

## 5. Comment replies over REST

**Shape.** `POST /v1/files/:key/comments` takes `message`, an optional `comment_id` and an optional `client_meta`. `comment_id` is "The comment to reply to, if any. This must be a root comment, that is, you cannot reply to a comment that is a reply itself". Threads are one level deep.

**Pinning.** Only a root comment is pinned. `client_meta` is "The position of where to place the comment". In the probe, all 142 replies on the DS file carry no `client_meta`, while all 297 top-level comments carry a `node_id`. A reply inherits its root's pin. A new pinned comment is a new root, with `client_meta.node_id` and `node_offset`.

**Author.** The author is always the token's owner. Comments are attributed to the authenticated user, and there is no field to post as anyone else. Only the author can delete a comment. Mentions come back as fragments in the webhook. In a REST read, `message` is plain text: GET has no `mentions` field.

**Sources.**
- [Comments endpoints](https://developers.figma.com/docs/rest-api/comments-endpoints/)
- [Comments types](https://developers.figma.com/docs/rest-api/comments-types/)
- Probe: the comments line.

**Confidence.** High.

## 6. Rate limits

**Counting.** Personal access tokens are counted "per-user, per-plan". In the docs' words, "the requests all count toward the same limit", and PATs "are for your whole account, not tied to a specific plan". So **separate personal tokens on Bill's one account share one budget**, per plan whose files they touch. That covers Bill's own IDE/MCP use, uno-bot and any GitHub Action. (OAuth apps get a budget per user per app. Plan access tokens get one per token. Neither is available here.)

**Tiers.** Comments, webhooks, folders, dev resources and versions are Tier 2: "Up to 5/min" on a View/Collab seat, and "25–100/min" on Dev/Full, varying by plan. File and node reads are Tier 1: 10–20/min on Dev/Full, and "Up to 20/month" on View/Collab.

**On a 429.** Figma sends `Retry-After`, `X-Figma-Plan-Tier` (`starter|pro|org|enterprise|student`), `X-Figma-Rate-Limit-Type` (`low|high`) and `X-Figma-Upgrade-Link`. A 200 carries none of these, per the probe. Which tier value Education reports is unverified.

**Sources.**
- [Rate limits](https://developers.figma.com/docs/rest-api/rate-limits/)
- Probe: the headers above.

**Confidence.** High for the shared-budget finding. Medium for the exact per-minute numbers on this plan.

## Design implications

**How notifications reach uno-bot.**
- Put **FILE_COMMENT** team webhooks on each of the six teams, well under the limit of 20 per team. Bill must be an admin of each team. Files in invite-only folders never notify, so the sweep's poll of `GET /comments` stays as the backstop and as the only way to see resolutions.
- Treat a delivery as a doorbell. Fetch the comment over REST for its node anchor and resolved state, verify the passcode, and answer 200 fast, then do the work in `waitUntil`/a queue. A wrong passcode answered with 400 kills the webhook, so never 400 on a slow path.
- **FILE_UPDATE** is enough to trigger the "checked Figma before asking" re-check, 30 minutes after editing stops. It says nothing about who edited or what changed, so the check still diffs the frame.
- Use **FILE_VERSION_UPDATE** only if designers name versions.
- The first team-context create is still unverified on Education. Make it a single write with Bill's OK, and pause it at creation to skip the PING.

**Dev Mode links (C).**
- Attach links to each mapped **component** (for a set, to each variant component or to the set node). Instances then inherit them.
- Test one set node before choosing. That behaviour is undocumented, and it decides the "Dev Mode link scope" open question.
- Each node takes 3 links (Code, Storybook, PR), well under the cap of 10. The same URL twice on a node is rejected, which makes re-runs idempotent.
- There is no creator field, so the "added by le goat" label goes in `name`. Handle `errors[]` on HTTP 200.

**@uno replies (F).**
- Reply with `comment_id` set to the **root** of the thread. When the trigger is itself a reply, use its `parent_id`.
- A reply cannot be re-pinned, and it always posts as Bill. The le goat prefix is the only marker, as the map already assumes.
- **The Figma API never returns another person's email.** A "Figma email" column on Team Members cannot be matched against a commenter. Key the mapping on the Figma **user id**, which is stable, with `handle` for display.
- Mentions of "@uno" arrive as plain text, since Figma cannot mention a non-user. The text trigger stays.
- The Tier 2 budget is shared with Bill's own tools. That argues for a small daily cap in teammate mode and for backoff on `Retry-After`.
