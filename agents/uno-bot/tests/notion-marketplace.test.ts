// `notion_create(marketplace)`: one Prototype Marketplace row per ✅ card.
//
// The seam is the tool executor, over the shared Notion fetch stub
// (`helpers/notion-fetch-stub.ts`): what reaches Notion, and what comes back to
// the model. Every route a test leaves unstubbed is a write that must not
// happen — the stub fails the test on an unrouted call.
import { test } from "node:test";
import assert from "node:assert/strict";

import { calls, posted, serve, type Routes } from "./helpers/notion-fetch-stub.js";

function tool(): Promise<typeof import("../src/tools/notion-create")> {
  return import("../src/tools/notion-create.js");
}

const MARKET = "397b7cca49828002826cc45e2baa8e4f";
/** As the Worker holds it, dashed: the Roadmap query URL carries it so. */
const ROADMAP = "2fc01241-1bb5-4770-af51-d5a050bddb75";
const CARD = "24820000000000000000000000000001";
const ROW = "39700000000000000000000000000abc";
const PERSON = "aaaaaaaa000000000000000000000001";

const ENV = {
  NOTION_API_KEY: "ntn_test",
  SLACK_BOT_TOKEN: "xoxb-test",
  NOTION_MARKETPLACE_DB_ID: "397b7cca-4982-8002-826c-c45e2baa8e4f",
  NOTION_ROADMAP_DB_ID: "2fc01241-1bb5-4770-af51-d5a050bddb75",
} as unknown as import("../src/types").Env;

const SLACK = { channel: "D1", threadTs: "1700000000.000001", user: "U1" } as unknown as import("../src/types").SlackContext;

/** The live schema, as `GET /databases/{id}` reports it. */
function schema(opts: { figmaReplica?: boolean; missing?: string[] } = {}) {
  const sel = (names: string[]) => ({ type: "select", select: { options: names.map((name) => ({ name })) } });
  const without = (props: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(props).filter(([name]) => !opts.missing?.includes(name)));
  return {
    id: MARKET,
    properties: without({
      Name: { type: "title" },
      Description: { type: "rich_text" },
      Stage: sel(["Low-fi", "Mid-fi", "High-fi"]),
      "Project card": { type: "relation" },
      "Product Pillar": { type: "rollup" },
      "Design status": { type: "rollup" },
      "Roadmap ID": { type: "rollup" },
      Contributors: { type: "people" },
      "Deployment URL": { type: "url" },
      Loom: { type: "url" },
      "Repo path": { type: "rich_text" },
      "Local path": { type: "rich_text" },
      Upvotes: { type: "number" },
      ...(opts.figmaReplica === false ? {} : { "Figma replica": { type: "url" } }),
    }),
  };
}

const CARD_PAGE = {
  id: CARD,
  url: `https://www.notion.so/Session-review-${CARD}`,
  parent: { type: "database_id", database_id: "2fc01241-1bb5-4770-af51-d5a050bddb75" },
  properties: { Name: { type: "title", title: [{ plain_text: "Session review" }] } },
};

function routes(extra: Routes = {}, opts: { figmaReplica?: boolean; missing?: string[]; existing?: unknown[] } = {}): Routes {
  return {
    [`GET /databases/${MARKET}`]: { body: schema(opts) },
    [`GET /pages/${CARD}`]: { body: CARD_PAGE },
    [`POST /databases/${MARKET}/query`]: { body: { results: opts.existing ?? [], has_more: false } },
    ...extra,
  };
}

const INPUT = {
  surface: "marketplace",
  title: "Session review",
  summary: "A tutor reviews a finished session and flags follow-ups.",
  properties: {
    stage: "mid-fi",
    deployment_url: "https://deploy-preview-1210--plus-uno.netlify.app/session-review",
    project_card: `https://www.notion.so/Session-review-${CARD}`,
    contributors: [PERSON],
    loom: "https://www.loom.com/share/abc",
    repo_path: "prototypes/session-review/",
    figma_replica: "https://www.figma.com/design/F1/Session-review",
  },
};

const ROLLUPS = ["Product Pillar", "Design status", "Roadmap ID"];

test("publishing a new prototype creates one row with every field it was given and no rollup", async () => {
  serve(routes({ "POST /pages": { body: { id: ROW, url: `https://www.notion.so/${ROW}` } } }));
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.ok, true);
  assert.equal(out.status, "created");
  const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/v1/pages"))!;
  assert.deepEqual(post.body!.parent, { database_id: MARKET });
  const props = post.body!.properties as Record<string, unknown>;
  assert.deepEqual(props.Name, { title: [{ type: "text", text: { content: "Session review" } }] });
  assert.deepEqual(props.Description, {
    rich_text: [{ type: "text", text: { content: "A tutor reviews a finished session and flags follow-ups." } }],
  });
  // The stored spelling, not the one typed.
  assert.deepEqual(props.Stage, { select: { name: "Mid-fi" } });
  assert.deepEqual(props["Project card"], { relation: [{ id: CARD }] });
  assert.deepEqual(props.Contributors, { people: [{ id: PERSON }] });
  assert.deepEqual(props["Deployment URL"], { url: INPUT.properties.deployment_url });
  assert.deepEqual(props.Loom, { url: INPUT.properties.loom });
  assert.deepEqual(props["Repo path"], { rich_text: [{ type: "text", text: { content: "prototypes/session-review/" } }] });
  assert.deepEqual(props["Figma replica"], { url: INPUT.properties.figma_replica });
  assert.deepEqual(props.Upvotes, { number: 0 });
  for (const rollup of ROLLUPS) assert.equal(rollup in props, false, `${rollup} is Notion's to fill`);
  assert.match(posted.at(-1)!, /Prototype Marketplace/);
});

test("publishing a prototype already in the catalogue updates its row instead of adding a second", async () => {
  const existing = [{ id: ROW, url: `https://www.notion.so/${ROW}`, properties: { Name: { type: "title", title: [{ plain_text: "Session review" }] } } }];
  serve(routes({ [`PATCH /pages/${ROW}`]: { body: { id: ROW, url: `https://www.notion.so/${ROW}` } } }, { existing }));
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.ok, true);
  assert.equal(out.status, "updated");
  assert.equal(calls.some((c) => c.method === "POST" && c.url.endsWith("/v1/pages")), false);
  // The same prototype is found by its name or its deployment link.
  const query = calls.find((c) => c.url.includes(`/databases/${MARKET}/query`))!;
  assert.deepEqual(query.body!.filter, {
    or: [
      { property: "Name", title: { equals: "Session review" } },
      { property: "Deployment URL", url: { equals: INPUT.properties.deployment_url } },
    ],
  });
  const patch = calls.find((c) => c.method === "PATCH")!;
  const props = patch.body!.properties as Record<string, unknown>;
  assert.deepEqual(props.Stage, { select: { name: "Mid-fi" } });
  // An update keeps the votes it has, and never sends a body.
  assert.equal("Upvotes" in props, false);
  assert.equal("children" in patch.body!, false);
  for (const rollup of ROLLUPS) assert.equal(rollup in props, false);
});

test("a row found only by its deployment link under another name is asked about, never renamed", async () => {
  const existing = [{ id: ROW, url: `https://www.notion.so/${ROW}`, properties: { Name: { type: "title", title: [{ plain_text: "Tutor notes" }] } } }];
  serve(routes({}, { existing }));
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.ok, false);
  assert.equal(out.status, "needs_input");
  assert.match(out.question, /Tutor notes/);
  assert.match(out.question, /Session review/);
  assert.equal(calls.some((c) => c.method === "PATCH" || c.url.endsWith("/v1/pages")), false);
});

test("a Stage the database does not offer comes back as a question, and nothing is written", async () => {
  serve(routes());
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(
    await executeNotionCreate(ENV, { ...INPUT, properties: { ...INPUT.properties, stage: "Polished" } }, SLACK),
  );

  assert.equal(out.ok, false);
  assert.equal(out.status, "needs_input");
  assert.match(out.question, /Stage/);
  assert.match(out.question, /Low-fi · Mid-fi · High-fi/);
  assert.equal(calls.some((c) => c.method === "PATCH" || c.url.endsWith("/v1/pages")), false);
});

test("a Project card that is not a Roadmap card comes back as a question, and nothing is written", async () => {
  serve(
    routes({
      [`GET /pages/${CARD}`]: { body: { ...CARD_PAGE, parent: { type: "database_id", database_id: MARKET } } },
    }),
  );
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.ok, false);
  assert.equal(out.status, "needs_input");
  assert.match(out.question, /Roadmap card/);
  assert.equal(calls.some((c) => c.method === "PATCH" || c.url.endsWith("/v1/pages")), false);
});

test("a Project card named by its title is linked only on an exact Roadmap match", async () => {
  serve(
    routes({
      [`POST /databases/${ROADMAP}/query`]: {
        body: {
          results: [
            { id: CARD, url: `https://www.notion.so/${CARD}`, properties: { Name: { type: "title", title: [{ plain_text: "Session review" }] } } },
            { id: "24820000000000000000000000000002", url: "https://www.notion.so/x", properties: { Name: { type: "title", title: [{ plain_text: "Session review v2" }] } } },
          ],
          has_more: false,
        },
      },
      "POST /pages": { body: { id: ROW, url: `https://www.notion.so/${ROW}` } },
    }),
  );
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(
    await executeNotionCreate(ENV, { ...INPUT, properties: { ...INPUT.properties, project_card: "session review" } }, SLACK),
  );

  assert.equal(out.ok, true);
  const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/v1/pages"))!;
  assert.deepEqual((post.body!.properties as Record<string, unknown>)["Project card"], { relation: [{ id: CARD }] });
});

test("a Figma replica link waits in the body while the database has no such property", async () => {
  serve(routes({ "POST /pages": { body: { id: ROW, url: `https://www.notion.so/${ROW}` } } }, { figmaReplica: false }));
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.ok, true);
  const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/v1/pages"))!;
  assert.equal("Figma replica" in (post.body!.properties as Record<string, unknown>), false);
  assert.match(JSON.stringify(post.body!.children), /figma\.com\/design\/F1/);
});

test("an update keeps the Figma replica link on the page while the database has no such property", async () => {
  const existing = [{ id: ROW, url: `https://www.notion.so/${ROW}`, properties: { Name: { type: "title", title: [{ plain_text: "Session review" }] } } }];
  serve(
    routes(
      {
        [`PATCH /pages/${ROW}`]: { body: { id: ROW, url: `https://www.notion.so/${ROW}` } },
        [`GET /blocks/${ROW}/children`]: { body: { results: [], has_more: false } },
        [`PATCH /blocks/${ROW}/children`]: { body: { results: [] } },
      },
      { figmaReplica: false, existing },
    ),
  );
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.status, "updated");
  const patch = calls.find((c) => c.method === "PATCH" && c.url.includes(`/pages/${ROW}`))!;
  assert.equal("Figma replica" in (patch.body!.properties as Record<string, unknown>), false);
  const append = calls.find((c) => c.method === "PATCH" && c.url.includes(`/blocks/${ROW}/children`));
  assert.ok(append, "the link is appended to the page body");
  assert.match(JSON.stringify(append!.body), /figma\.com\/design\/F1/);
});

test("an update appends the Figma replica link once: a page that already holds it is left as is", async () => {
  const existing = [{ id: ROW, url: `https://www.notion.so/${ROW}`, properties: { Name: { type: "title", title: [{ plain_text: "Session review" }] } } }];
  const held = {
    type: "paragraph",
    paragraph: { rich_text: [{ plain_text: `Figma replica: ${INPUT.properties.figma_replica}`, text: { content: "x" } }] },
  };
  serve(
    routes(
      {
        [`PATCH /pages/${ROW}`]: { body: { id: ROW, url: `https://www.notion.so/${ROW}` } },
        [`GET /blocks/${ROW}/children`]: { body: { results: [held], has_more: false } },
      },
      { figmaReplica: false, existing },
    ),
  );
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.status, "updated");
  assert.equal(calls.some((c) => c.method === "PATCH" && c.url.includes("/children")), false);
});

test("a given field whose property the live schema lacks waits in the body, as the replica link does", async () => {
  serve(routes({ "POST /pages": { body: { id: ROW, url: `https://www.notion.so/${ROW}` } } }, { missing: ["Loom", "Repo path"] }));
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.ok, true);
  const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/v1/pages"))!;
  const props = post.body!.properties as Record<string, unknown>;
  assert.equal("Loom" in props || "Repo path" in props, false);
  const body = JSON.stringify(post.body!.children);
  assert.match(body, /Loom:/);
  assert.match(body, /loom\.com\/share\/abc/);
  assert.match(body, /Repo path:/);
  assert.match(body, /prototypes\/session-review\//);
});

test("an update appends a given field the live schema lacks to the page body, once", async () => {
  const existing = [{ id: ROW, url: `https://www.notion.so/${ROW}`, properties: { Name: { type: "title", title: [{ plain_text: "Session review" }] } } }];
  const held = { type: "paragraph", paragraph: { rich_text: [{ plain_text: `Repo path: prototypes/session-review/` }] } };
  serve(
    routes(
      {
        [`PATCH /pages/${ROW}`]: { body: { id: ROW, url: `https://www.notion.so/${ROW}` } },
        [`GET /blocks/${ROW}/children`]: { body: { results: [held], has_more: false } },
        [`PATCH /blocks/${ROW}/children`]: { body: { results: [] } },
      },
      { missing: ["Loom", "Repo path"], existing },
    ),
  );
  const { executeNotionCreate } = await tool();

  const out = JSON.parse(await executeNotionCreate(ENV, INPUT, SLACK));

  assert.equal(out.status, "updated");
  const appends = calls.filter((c) => c.method === "PATCH" && c.url.includes(`/blocks/${ROW}/children`));
  assert.equal(appends.length, 1, "one append carries every missing field");
  assert.match(JSON.stringify(appends[0]!.body), /loom\.com\/share\/abc/);
  assert.doesNotMatch(JSON.stringify(appends[0]!.body), /Repo path/, "a line the page already holds is not added again");
});

test("before a card is staged, a publish missing its stage and deployment link asks for exactly those", async () => {
  const { preflight } = await import("../src/agent/preflight.js");

  const ask = await preflight(
    "notion_create",
    { surface: "marketplace", title: "Session review", properties: { description: "A tutor reviews a session." } },
    { env: ENV },
  );

  assert.ok(ask);
  assert.match(ask.ask, /\*stage\*/);
  assert.match(ask.ask, /\*deployment URL\*/);
  assert.doesNotMatch(ask.ask, /\*name\*|\*description\*/);
  serve(routes());
  assert.equal(await preflight("notion_create", INPUT, { env: ENV }), null);
});

test("before a card is staged, a Stage the database does not offer is the ask, and nothing is written", async () => {
  serve(routes());
  const { preflight } = await import("../src/agent/preflight.js");

  const ask = await preflight("notion_create", { ...INPUT, properties: { ...INPUT.properties, stage: "Polished" } }, { env: ENV });

  assert.ok(ask);
  assert.match(ask.ask, /Stage "Polished"/);
  assert.match(ask.ask, /Low-fi · Mid-fi · High-fi/);
  assert.equal(calls.some((c) => c.method !== "GET" && !c.url.includes("/query")), false, "preflight reads, never writes");
});

test("before a card is staged, a Project card that is not a Roadmap card is the ask", async () => {
  serve(routes({ [`GET /pages/${CARD}`]: { body: { ...CARD_PAGE, parent: { type: "database_id", database_id: MARKET } } } }));
  const { preflight } = await import("../src/agent/preflight.js");

  const ask = await preflight("notion_create", INPUT, { env: ENV });

  assert.ok(ask);
  assert.match(ask.ask, /Roadmap card/);
});

test("before a card is staged, a contributor no workspace member is called is the ask", async () => {
  serve(routes({ "GET /users": { body: { results: [{ id: PERSON, type: "person", name: "Sarah Kim" }], has_more: false } } }));
  const { preflight } = await import("../src/agent/preflight.js");

  const ask = await preflight(
    "notion_create",
    { ...INPUT, properties: { ...INPUT.properties, contributors: ["Sarah Kim", "Nobody Here"] } },
    { env: ENV },
  );

  assert.ok(ask);
  assert.match(ask.ask, /"Nobody Here"/);
  assert.doesNotMatch(ask.ask, /Sarah Kim/);
  assert.equal(calls.filter((c) => c.url.includes("/users")).length, 1, "one member listing serves every name");
});

test("the exact-match checks cost preflight the schema and the card read, and are skipped when the budget cannot cover them", async () => {
  serve(routes());
  const { preflight } = await import("../src/agent/preflight.js");
  const { runMetered, withSubrequestLimit } = await import("../src/net.js");
  const { MARKETPLACE_CHECK_COST } = await import("../src/integrations/notion-marketplace.js");

  assert.equal(await preflight("notion_create", INPUT, { env: ENV }), null);
  assert.deepEqual(
    calls.map((c) => `${c.method} ${new URL(c.url).pathname}`),
    [`GET /v1/databases/${MARKET}`, `GET /v1/pages/${CARD}`],
  );

  serve(routes());
  const polished = { ...INPUT, properties: { ...INPUT.properties, stage: "Polished" } };
  const skipped = await runMetered(() =>
    withSubrequestLimit(MARKETPLACE_CHECK_COST - 1, () => preflight("notion_create", polished, { env: ENV })),
  );
  assert.equal(skipped, null, "too little budget: execution's own check is the net");
  assert.deepEqual(calls, []);
});
