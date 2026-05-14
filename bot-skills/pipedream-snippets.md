# Pipedream Code-Step Snippets

> Paste-ready JavaScript for each step of the UNO Bot Pipedream workflow described in [pipedream-workflow.md](pipedream-workflow.md). One section per step. Copy the code block into a new Pipedream code step in the order shown.
>
> All snippets target Pipedream's Node.js runtime (Node 20+) using the `defineComponent` pattern. They use `fetch` (built-in) for HTTP — no SDK dependencies needed.

## Prerequisites

Before pasting any snippet:

1. **Create a Pipedream project** for `uno-bot-v2`.
2. **Set environment variables** in Pipedream → Settings → Environment Variables:
   - `ANTHROPIC_API_KEY` — Anthropic API key (org-managed per §4.6 when available; per-user OK for sandbox)
   - `SLACK_BOT_TOKEN` — Slack bot user OAuth token (`xoxb-...`)
   - `GITHUB_PAT` — GitHub personal access token with `repo` scope for the plus-uno repo
   - `BOT_SKILLS_BASE_URL` — defaults to `https://raw.githubusercontent.com/BilLogic/plus-uno/main/bot-skills` (override for branch testing or repo location changes)
3. **Create the workflow** with the trigger: Slack — New Message in Channel, listening on `#figma-sync` (add other channels as the bot expands).

---

## Shared Utility: `parseSkill()`

This is the JavaScript port of `bot-skills/lib/skill-loader.js` — parses SKILL.md frontmatter, strips meta sections, returns a usable system prompt. **Copy this function into the top of every skill worker code step (Steps 5b and 5c).** The implement worker (Step 5a) doesn't need it because it dispatches to GitHub Actions, where the Node skill-loader runs.

```javascript
// ============================================================
// parseSkill(rawText) — JS port of bot-skills/lib/skill-loader.js
// Returns { frontmatter, body } from a SKILL.md string.
// Strips meta sections so the body is a clean system prompt.
// ============================================================
function parseSkill(rawText) {
  const META_HEADINGS = [
    'Cost Profile', 'Migration TODO', 'Migration TODO (Week 2)',
    'TODO Before Production', 'TODO Before Production (Week 3)',
    'TODO Before Production (Week 4)', 'Related Skills', 'Sample Invocations',
  ];
  const stripQuotes = (s) =>
    (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))
      ? s.slice(1, -1) : s;

  // --- Split frontmatter from body ---
  const trimmed = rawText.replace(/^﻿/, '');
  let frontmatter = {}, body = trimmed;
  if (trimmed.startsWith('---\n') || trimmed.startsWith('---\r\n')) {
    const closingIdx = trimmed.indexOf('\n---\n', 4);
    if (closingIdx !== -1) {
      const fmText = trimmed.slice(4, closingIdx);
      body = trimmed.slice(closingIdx + 5).replace(/^\s+/, '');

      // --- Parse frontmatter (minimal YAML subset) ---
      const lines = fmText.split('\n');
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
        const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*(?:#.*)?$/);
        if (!m) { i++; continue; }
        const [, key, rawValue] = m;
        const value = rawValue.trim();
        if (value === '>' || value === '|') {
          const collected = [];
          i++;
          while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
            if (lines[i].trim()) collected.push(lines[i].replace(/^\s+/, ''));
            i++;
          }
          frontmatter[key] = collected.join(' ').trim();
          continue;
        }
        if (value === '') {
          i++;
          const items = []; const nested = {};
          while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
            const sub = lines[i];
            if (!sub.trim() || sub.trim().startsWith('#')) { i++; continue; }
            const seq = sub.match(/^\s+-\s+(.+?)\s*(?:#.*)?$/);
            if (seq) { items.push(stripQuotes(seq[1])); }
            else {
              const kv = sub.match(/^\s+([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*(?:#.*)?$/);
              if (kv) nested[kv[1]] = stripQuotes(kv[2]);
            }
            i++;
          }
          frontmatter[key] = items.length ? items : nested;
          continue;
        }
        frontmatter[key] = stripQuotes(value);
        i++;
      }
    }
  }

  // --- Strip meta sections from body ---
  const fenceMatch = body.match(/<!--\s*={2,}\s*Sections below[\s\S]*?-->/);
  if (fenceMatch) body = body.slice(0, fenceMatch.index);
  for (const heading of META_HEADINGS) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\n##\\s+${escaped}\\b[\\s\\S]*?(?=\\n##\\s|$)`, 'g');
    body = body.replace(re, '');
  }
  return { frontmatter, body: body.trim() + '\n' };
}

async function fetchSkill(skillName, baseUrl) {
  const url = `${baseUrl}/${skillName}/SKILL.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return parseSkill(await res.text());
}
```

---

## Step 1: Slack Event Source

**Not code** — configure in Pipedream UI:

- **App:** Slack
- **Source:** New Message in Channel
- **Channel:** `#figma-sync` (plus any other channels approved later; add `app_mention` event in the Slack app for `@uno-bot` in other channels)
- **Connect** the Slack account with OAuth.

---

## Step 2: Filter

**Type:** Code step (Node.js). Drops messages that shouldn't be processed.

```javascript
export default defineComponent({
  async run({ steps, $ }) {
    const event = steps.trigger.event;

    // Drop bot messages and channel-join/leave events
    if (event.bot_id) return $.flow.exit('Ignored: bot message');
    if (event.subtype && event.subtype !== 'thread_broadcast') {
      return $.flow.exit(`Ignored: subtype=${event.subtype}`);
    }

    const message = event.text || '';
    if (!message.trim()) return $.flow.exit('Ignored: empty message');

    // Either we're in a bot-listening channel OR the message @-mentions the bot.
    const BOT_LISTENING_CHANNELS = (process.env.BOT_LISTENING_CHANNELS || '').split(',').filter(Boolean);
    const BOT_USER_ID = process.env.SLACK_BOT_USER_ID; // e.g., "U07XXXXXXXX"
    const channel = event.channel;
    const inListeningChannel = BOT_LISTENING_CHANNELS.includes(channel);
    const mentionsBot = BOT_USER_ID && message.includes(`<@${BOT_USER_ID}>`);

    if (!inListeningChannel && !mentionsBot) {
      return $.flow.exit('Ignored: not in bot-listening channel and no @-mention');
    }

    // Strip @-mention prefix from message so the router sees clean intent
    const cleanMessage = BOT_USER_ID
      ? message.replace(new RegExp(`<@${BOT_USER_ID}>\\s*`, 'g'), '').trim()
      : message;

    return {
      message_text: cleanMessage,
      raw_message: message,
      channel,
      thread_ts: event.thread_ts || event.ts, // reply in thread, or start a thread on the original message
      user: event.user,
      ts: event.ts,
      mentions_bot: mentionsBot,
    };
  },
});
```

**Wiring notes:**
- Set `BOT_LISTENING_CHANNELS` env var to a comma-separated list of channel IDs (e.g. `C07XXXXXXXX,C08YYYYYYYY`).
- Set `SLACK_BOT_USER_ID` env var to the bot's user ID (from Slack app config or `auth.test` API call).
- Pipedream's data-store can cache `SLACK_BOT_USER_ID` if you don't want to hardcode it.

---

## Step 3: Router

**Type:** Code step. Calls Claude Haiku with the skill registry, returns `{ skill, confidence, params }`.

```javascript
export default defineComponent({
  async run({ steps, $ }) {
    const parsed = steps.filter.$return_value; // adjust name to match Step 2's step name
    if (!parsed) return $.flow.exit('No parsed message from filter');

    const ROUTER_SYSTEM_PROMPT = `You are the UNO Bot router. Pick exactly one skill from the registry below based on the user's message. Respond with JSON only:
{ "skill": "<name>", "confidence": 0.0-1.0, "params": {...} }

Skills:
- uno-implement: Implements a design-system change end-to-end (component
  source + stories). Trigger words: "implement", "update", "build",
  "make", references to a Notion PRD or a specific component name.
- uno-critique: Reviews a design artifact (Figma frame, prototype, doc)
  and gives grounded feedback. Trigger words: "critique", "review",
  "feedback on", "look at", "what do you think of".
- uno-assist: Answers questions about the Plus Uno design system,
  components, conventions, or terminology. Trigger words: "what is",
  "how does", "where can I find", "explain", "difference between".

## Disambiguation Rules (resolve in order)

1. ARTIFACT + ACTION verb → check action type.
   An artifact is a Figma URL, prototype URL, marketplace 4-digit ID
   (e.g. "1008"), Notion link, or GitHub PR link.
   - Artifact + "critique/review/feedback/audit/look at/evaluate" → uno-critique
   - Artifact + "implement/build/apply/fix/update" → uno-implement
   - Artifact + "what is/explain/tell me about" → uno-assist
   - Artifact alone with no verb → ask clarifying question (return uno-assist with confidence 0.3 and params.ask_clarification: true)

2. EXPLICIT COMMAND keywords beat heuristics.
   - Starts with "implement " + component name → uno-implement
   - Starts with "/critique" or "/review" → uno-critique
   - Starts with "/help" or "/explain" → uno-assist

3. QUESTION FORMAT → uno-assist.
   "What", "How", "Why", "Where", "When", "Which" leading a sentence
   without an artifact → uno-assist.

4. AMBIGUITY → uno-assist at confidence 0.3.

5. OUT OF SCOPE → uno-assist with params.decline: true.

Examples:
- "implement Badge" → {"skill":"uno-implement","confidence":0.95,"params":{"component":"Badge"}}
- "critique https://figma.com/..." → {"skill":"uno-critique","confidence":0.95,"params":{"artifact_url":"..."}}
- "what's the difference between Card and Surface?" → {"skill":"uno-assist","confidence":0.9}

Return ONLY the JSON object. No markdown fence, no preamble.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: [
          { type: 'text', text: ROUTER_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
        ],
        messages: [{ role: 'user', content: parsed.message_text }],
      }),
    });
    if (!res.ok) throw new Error(`Router Claude call failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const raw = data.content?.[0]?.text || '{}';

    // Defensive JSON parse — the prompt asks for pure JSON but trim fences if model adds them
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
    let routed;
    try { routed = JSON.parse(cleaned); }
    catch (e) {
      console.warn('Router returned non-JSON, falling back to uno-assist:', raw);
      routed = { skill: 'uno-assist', confidence: 0.0, params: { fallback: true } };
    }

    // Confidence floor — anything below 0.6 routes to assist with the original question intact
    if (routed.confidence < 0.6 && routed.skill !== 'uno-assist') {
      console.log(`Low confidence ${routed.confidence} on ${routed.skill} — falling back to uno-assist`);
      routed = { skill: 'uno-assist', confidence: routed.confidence, params: { low_confidence_fallback: true, original: routed } };
    }

    return {
      ...parsed,        // pass through filter's output
      ...routed,        // overlay routing decision
    };
  },
});
```

**Wiring notes:**
- Model: `claude-haiku-4-5-20251001` — verify this is the current Haiku ID at runtime; bump as needed.
- Latency budget: ~0.7s for the Haiku call + ~10ms for the Switch. Stays under 1s total routing overhead.
- Cost per call: ~$0.0001 after cache warm-up (system prompt is ~500 tokens, output ~50 tokens, cached at 0.1×).

---

## Step 4: Switch Operator

**Not code** — configure in Pipedream UI:

- **Operator:** Switch
- **Input:** `{{ steps.router.$return_value.skill }}`
- **Cases:**
  - `uno-implement` → Step 5a
  - `uno-critique` → Step 5b
  - `uno-assist` → Step 5c (default)

The Switch operator is in beta as of 2026-05. If unstable, replace with an If/Else chain.

---

## Step 5a: `uno-implement` Worker

**Type:** HTTP request. Dispatches to GitHub Actions (`figma-implement.yml`), which already runs `scripts/implement-figma-changes.js` — and that script now reads `bot-skills/uno-implement/SKILL.md` via the skill-loader (per sub-task C). No Claude call here; the Action does it.

```javascript
export default defineComponent({
  async run({ steps, $ }) {
    const routed = steps.router.$return_value;
    if (!routed || routed.skill !== 'uno-implement') {
      return $.flow.exit('Wrong skill for this branch');
    }

    // Post a Slack ack immediately so the user sees the bot is working.
    // The GitHub Action will post a more detailed result later.
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: routed.channel,
        thread_ts: routed.thread_ts,
        text: `🔧 Working on \`${routed.params?.component || 'change'}\` — I'll update this thread when the draft PR is ready.`,
      }),
    });

    // Dispatch to the GitHub Action.
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'implement-figma-changes',
          client_payload: {
            component: routed.params?.component || routed.message_text,
            trigger_source: 'slack',
            user_id: routed.user,
            channel: routed.channel,
            thread_ts: routed.thread_ts,
            message_ts: routed.ts,
            spec_text: routed.message_text,
            notion_prd_id: routed.params?.notion_prd_id || null,
          },
        }),
      }
    );
    if (!dispatchRes.ok) {
      throw new Error(`GitHub dispatch failed: ${dispatchRes.status} ${await dispatchRes.text()}`);
    }

    return {
      dispatched: true,
      component: routed.params?.component,
      ack_posted: true,
    };
  },
});
```

**Wiring notes:**
- Set `GITHUB_OWNER` (e.g. `BilLogic`) and `GITHUB_REPO` (e.g. `plus-uno`) env vars.
- This branch matches the live behavior today — no functional change to the implementation path. What changed is *how* the inline prompt in the script became SKILL.md-driven (per sub-task C).
- The Action posts its own threaded reply with the draft PR link on completion (see `figma-implement.yml` lines 172-198).

---

## Step 5b: `uno-critique` Worker

**Type:** Code step. Runs the full critique in Pipedream — fetches SKILL.md + always-load references, fetches the artifact, calls Sonnet, posts threaded reply.

```javascript
// [Paste the parseSkill + fetchSkill functions from "Shared Utility" at the top]

export default defineComponent({
  async run({ steps, $ }) {
    const routed = steps.router.$return_value;
    if (!routed || routed.skill !== 'uno-critique') return $.flow.exit('Wrong skill');

    const baseUrl = process.env.BOT_SKILLS_BASE_URL || 'https://raw.githubusercontent.com/BilLogic/plus-uno/main/bot-skills';

    // Ack first
    await postSlack(routed.channel, routed.thread_ts,
      '🔍 Reading the artifact and pulling relevant Plus docs — a moment.');

    // Load skill + always-load references in parallel
    const [skill, agentsRes, principles, cheatSheet] = await Promise.all([
      fetchSkill('uno-critique', baseUrl),
      fetch(`${baseUrl}/AGENTS.md`).then(r => r.text()),
      fetch(`${baseUrl.replace('/bot-skills', '')}/docs/context/design-system/foundations/principles.md`).then(r => r.text()),
      fetch(`${baseUrl.replace('/bot-skills', '')}/docs/context/design-system/components/cheat-sheet.md`).then(r => r.text()),
    ]);

    const systemPrompt = [
      agentsRes,
      '\n\n---\n\n',
      skill.body,
      '\n\n## Reference: Plus design principles (from docs/context/design-system/foundations/principles.md)\n\n',
      principles,
      '\n\n## Reference: Component cheat sheet (from docs/context/design-system/components/cheat-sheet.md)\n\n',
      cheatSheet,
    ].join('');

    // Attempt to fetch the artifact (Figma / Notion / GitHub) — implementation per artifact_url shape
    const artifactContext = await fetchArtifactContext(routed.params?.artifact_url, routed.message_text);

    const userMessage = [
      'User message:',
      routed.message_text,
      '',
      'Artifact context:',
      artifactContext || '(none — work from the message alone)',
    ].join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: skill.frontmatter.model_default || 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: [
          { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }
        ],
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) throw new Error(`Critique Claude call failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const reply = data.content?.[0]?.text || '(critique returned empty)';

    // Long-output → Gist
    let finalText = reply;
    if (reply.length > 1500) {
      const gistUrl = await postGist(reply, `uno-critique for ${routed.channel}`);
      finalText = reply.split('\n').slice(0, 5).join('\n') +
        `\n\n*Critique is long — full text in this Gist:* ${gistUrl}`;
    }

    await postSlack(routed.channel, routed.thread_ts, finalText);
    return { critique_posted: true, length: reply.length };

    // ---- helpers ----
    async function postSlack(channel, thread_ts, text) {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({ channel, thread_ts, text, mrkdwn: true }),
      });
    }
    async function postGist(content, description) {
      const r = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          description,
          public: false,
          files: { 'critique.md': { content } },
        }),
      });
      const j = await r.json();
      return j.html_url;
    }
    async function fetchArtifactContext(artifactUrl, fallbackText) {
      if (!artifactUrl) return null;
      // Figma URL → use Figma MCP if available (not implemented in v1 — ask user for screenshot)
      if (artifactUrl.includes('figma.com')) {
        return `Figma URL provided: ${artifactUrl}\n(Bot v1 cannot fetch Figma context directly via Pipedream — designer should paste a screenshot in thread if visual review is needed.)`;
      }
      // Notion URL → fetch via Notion API (requires NOTION_API_KEY)
      if (artifactUrl.includes('notion.so')) {
        // Implementation: extract page ID, call notion.pages.retrieve + notion.blocks.children.list
        // Stubbed for now — implement in Sprint 3 when uno-critique is wired live
        return `Notion URL provided: ${artifactUrl} (fetch not implemented in v1)`;
      }
      // GitHub PR URL → use gh API
      if (artifactUrl.includes('github.com') && artifactUrl.includes('/pull/')) {
        const m = artifactUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
        if (m) {
          const [, owner, repo, num] = m;
          const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${num}`, {
            headers: { 'Authorization': `token ${process.env.GITHUB_PAT}` },
          });
          const j = await r.json();
          return `GitHub PR #${num} in ${owner}/${repo}:\nTitle: ${j.title}\nBody: ${j.body}`;
        }
      }
      return null;
    }
  },
});
```

**Wiring notes:**
- Sonnet ID `claude-sonnet-4-6` is a placeholder — pull the actual ID from `skill.frontmatter.model_default` once verified. Falls back to that constant if frontmatter is missing.
- Figma MCP integration is **deliberately stubbed in v1** because Pipedream code steps can't easily talk to MCP servers. For v1, the bot asks the designer to paste a screenshot instead. Sprint 3+ can add real Figma fetch if it proves necessary.
- Gist threshold is 1500 chars; tune based on actual critique length distribution.

---

## Step 5c: `uno-assist` Worker

**Type:** Code step. Same shape as critique but with knowledge-map preload + dynamic doc fetch based on the question type.

```javascript
// [Paste the parseSkill + fetchSkill functions from "Shared Utility" at the top]

export default defineComponent({
  async run({ steps, $ }) {
    const routed = steps.router.$return_value;
    if (!routed || routed.skill !== 'uno-assist') return $.flow.exit('Wrong skill');

    const baseUrl = process.env.BOT_SKILLS_BASE_URL || 'https://raw.githubusercontent.com/BilLogic/plus-uno/main/bot-skills';
    const docsBase = baseUrl.replace('/bot-skills', '');

    // If router routed here as a "decline" (out of scope), respond accordingly
    if (routed.params?.decline) {
      await postSlack(routed.channel, routed.thread_ts,
        "That's outside my scope — I'm tuned for the Plus Uno design system and product context, not general questions. For general Q&A the in-IDE agent (Claude Code) is better.");
      return { declined: true };
    }

    // Ack
    await postSlack(routed.channel, routed.thread_ts, '📚 Checking the docs — a moment.');

    // Load skill + AGENTS.md
    const [skill, agentsRes] = await Promise.all([
      fetchSkill('uno-assist', baseUrl),
      fetch(`${baseUrl}/AGENTS.md`).then(r => r.text()),
    ]);

    // Knowledge map (small, ~500 tokens) is part of the SKILL.md body already.
    // Step 1: classify question type, pick docs to fetch.
    const classification = await callClaude(
      'claude-haiku-4-5-20251001',
      `You are a doc router for Plus Uno. Given the user's question, list 1-3 specific doc paths to fetch from this repo to answer it well. Respond as JSON: { "paths": ["docs/context/...", ...] }. Paths must be from the knowledge map below.\n\n${skill.body.match(/### Step 2: Load the knowledge map[\s\S]*?(?=###|##\s|$)/)?.[0] || ''}\n\nReturn ONLY JSON. No prose.`,
      routed.message_text,
      300
    );
    let pickedPaths = [];
    try { pickedPaths = (JSON.parse(classification.replace(/^```json\s*|\s*```$/g, '').trim()).paths || []).slice(0, 3); }
    catch { pickedPaths = ['docs/context/conventions/terminology.md']; } // safe fallback

    // Step 2: fetch the picked docs in parallel
    const fetchedDocs = await Promise.all(
      pickedPaths.map(async (path) => {
        try {
          const r = await fetch(`${docsBase}/${path}`);
          if (!r.ok) return null;
          return { path, content: await r.text() };
        } catch { return null; }
      })
    );
    const docContext = fetchedDocs
      .filter(Boolean)
      .map(d => `## From ${d.path}\n\n${d.content}`)
      .join('\n\n---\n\n');

    // Step 3: compose the answer
    const systemPrompt = [agentsRes, '\n\n---\n\n', skill.body].join('');
    const userMessage = [
      'User question:',
      routed.message_text,
      '',
      'Fetched docs:',
      docContext || '(none could be fetched)',
    ].join('\n');

    const answer = await callClaude(
      skill.frontmatter.model_default || 'claude-sonnet-4-6',
      systemPrompt,
      userMessage,
      1500
    );

    // Long-output → Gist (less likely for assist since defaults are short)
    let finalText = answer;
    if (answer.length > 1000) {
      const gistUrl = await postGist(answer, `uno-assist for ${routed.channel}`);
      finalText = answer.split('\n').slice(0, 5).join('\n') +
        `\n\n*Full answer:* ${gistUrl}`;
    }
    await postSlack(routed.channel, routed.thread_ts, finalText);
    return { answer_posted: true, paths_used: pickedPaths };

    // ---- helpers ----
    async function callClaude(model, system, userMsg, maxTokens) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: userMsg }],
        }),
      });
      if (!res.ok) throw new Error(`Claude call failed: ${res.status} ${await res.text()}`);
      const data = await res.json();
      return data.content?.[0]?.text || '';
    }
    async function postSlack(channel, thread_ts, text) {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}` },
        body: JSON.stringify({ channel, thread_ts, text, mrkdwn: true }),
      });
    }
    async function postGist(content, description) {
      const r = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: { 'Authorization': `token ${process.env.GITHUB_PAT}`, 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ description, public: false, files: { 'answer.md': { content } } }),
      });
      const j = await r.json();
      return j.html_url;
    }
  },
});
```

**Wiring notes:**
- This step makes **two** Claude calls per invocation (classification on Haiku, answer on Sonnet). Cost-wise this is still cheap (~$0.01-0.03 per question) and gets us progressive disclosure — only the relevant docs get loaded into Sonnet's context.
- If classification routinely picks the same 1-2 docs, consider hardcoding those in the always-load path and removing the classification step.

---

## Step 6: Metrics Logging (Cross-cutting side effect)

**Type:** Code step. Runs after every worker branch. Logs to a Google Sheet for §4.10 metrics.

```javascript
export default defineComponent({
  async run({ steps, $ }) {
    const routed = steps.router.$return_value;
    const startTs = steps.trigger.event?.event_time || Date.now();
    const latencyMs = Date.now() - startTs;

    // Determine which worker ran and pull its return value for token info
    const workerOutput =
      steps.uno_implement?.$return_value ||
      steps.uno_critique?.$return_value ||
      steps.uno_assist?.$return_value || {};

    const row = {
      timestamp: new Date().toISOString(),
      user_id: routed?.user || 'unknown',
      channel: routed?.channel || 'unknown',
      skill: routed?.skill || 'unknown',
      confidence: routed?.confidence ?? 0,
      latency_ms: latencyMs,
      input_tokens: workerOutput.input_tokens || null,
      output_tokens: workerOutput.output_tokens || null,
      success: !workerOutput.error,
      error_category: workerOutput.error_category || null,
    };

    // POST to Google Sheets via Apps Script webhook (set up the sheet + script once)
    if (process.env.METRICS_WEBHOOK_URL) {
      await fetch(process.env.METRICS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
    }

    return row;
  },
});
```

**Wiring notes:**
- Create a Google Sheet → Extensions → Apps Script → publish a webhook endpoint that appends rows. Paste that URL into `METRICS_WEBHOOK_URL` env var.
- Alternative storage: Postgres via Pipedream's connection, or just a flat JSON log in Pipedream's data store. Sheet is simplest for v1.
- This step is optional but Sprint 3 should include it — otherwise §4.10 metrics never accrue.

---

## Step 7: Slack Reactions (auxiliary, recommended for Sprint 2)

**Type:** Code step. Adds a ⚙️ reaction to the user's original message when work starts, swaps to ✅/ℹ️/❌ at the end. Mirrors what `figma-implement.yml` already does for the implement path, extended to all skills.

```javascript
// Use at the start of each worker (after the ack but before the heavy work)
async function addReaction(channel, ts, name) {
  await fetch('https://slack.com/api/reactions.add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    body: JSON.stringify({ channel, name, timestamp: ts }),
  });
}
async function removeReaction(channel, ts, name) {
  await fetch('https://slack.com/api/reactions.remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    body: JSON.stringify({ channel, name, timestamp: ts }),
  });
}

// At start of any worker:
//   await addReaction(routed.channel, routed.ts, 'gear');
//
// At end of any worker (success):
//   await removeReaction(routed.channel, routed.ts, 'gear');
//   await addReaction(routed.channel, routed.ts, 'white_check_mark');
//
// At end (info / no-op):
//   await removeReaction(routed.channel, routed.ts, 'gear');
//   await addReaction(routed.channel, routed.ts, 'information_source');
//
// On error:
//   await removeReaction(routed.channel, routed.ts, 'gear');
//   await addReaction(routed.channel, routed.ts, 'x');
```

**Wiring notes:**
- Bill's Sprint 2 priority #2 was reaction integration. This is the basic ack-pattern; the richer "contextual sentiment reactions" (Pattern B from my prior message) is a separate Sprint 2 spec.
- Reactions are non-blocking (catch + ignore errors so reaction failure doesn't kill the workflow).

---

## Workflow Assembly Checklist

When wiring these in Pipedream, verify:

- [ ] Slack source connected, listening on `#figma-sync` + any other approved channels
- [ ] Step 2 (filter) drops bot messages and channel-join events
- [ ] Step 3 (router) returns JSON with confidence floor handling
- [ ] Step 4 (switch) has 3 cases + default → uno-assist
- [ ] Step 5a posts ack + dispatches to GitHub Actions
- [ ] Step 5b fetches SKILL.md + always-load references + (stubbed) artifact context, calls Sonnet, posts threaded reply
- [ ] Step 5c does two-pass classify→fetch→answer with knowledge map
- [ ] Step 6 (metrics) runs after every branch, writes to the Google Sheet
- [ ] Step 7 (reactions) wraps each worker with ⚙️ → ✅/ℹ️/❌
- [ ] Env vars set: `ANTHROPIC_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_BOT_USER_ID`, `GITHUB_PAT`, `GITHUB_OWNER`, `GITHUB_REPO`, `BOT_SKILLS_BASE_URL`, `BOT_LISTENING_CHANNELS`, `METRICS_WEBHOOK_URL` (optional)
- [ ] Workflow concurrency capped at 5 (Pipedream UI → Settings → Concurrency) to prevent thundering herd

## Open Items for Sprint 2-3

1. **Real Figma context fetching.** Current critique stubs Figma — the designer pastes a screenshot in thread. For v2, evaluate either (a) a Figma webhook that pre-fetches context when a Figma URL is shared, or (b) a custom Pipedream step that calls Figma REST API directly.
2. **Notion fetch implementation.** Stubbed in Step 5b's `fetchArtifactContext`. Real impl needs `NOTION_API_KEY` and the `extractNotionPageId` + `notion.pages.retrieve` + `notion.blocks.children.list` chain.
3. **Knowledge-map auto-regen.** The map currently lives inline in `uno-assist/SKILL.md`. A script that scans `docs/context/` and `docs/knowledge/` and regenerates the map weekly would prevent drift.
4. **Classification cost optimization.** The two-pass Haiku-then-Sonnet pattern in uno-assist is ~$0.01-0.03/call. If usage scales, consider caching classifications per-question-text or skipping classification when the question is short (<50 chars usually maps to terminology lookup).
