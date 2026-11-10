import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { createTokenSource, vertexEndpoint, callVertex } from './vertex.mjs';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const env = { GEMINI_SA_EMAIL: 'sa@hcii-plus.iam.gserviceaccount.com', GEMINI_SA_PRIVATE_KEY: pem, GEMINI_PROJECT_ID: 'hcii-plus' };
const decode = (s) => JSON.parse(Buffer.from(s, 'base64url').toString());
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('token exchange signs an RS256 JWT with the service-account claims', async () => {
    let seen;
    const fetch = async (url, init) => { seen = { url, init }; return json({ access_token: 'tok', expires_in: 3600 }); };
    const source = createTokenSource({ env, fetch, now: () => 1_000_000 });
    assert.equal(await source(), 'tok');
    assert.equal(seen.url, 'https://oauth2.googleapis.com/token');
    const form = new URLSearchParams(seen.init.body);
    assert.equal(form.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    const [h, c, s] = form.get('assertion').split('.');
    assert.deepEqual(decode(h), { alg: 'RS256', typ: 'JWT' });
    assert.deepEqual(decode(c), {
        iss: env.GEMINI_SA_EMAIL, scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token', iat: 1000, exp: 4600,
    });
    const ok = createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, Buffer.from(s, 'base64url'));
    assert.equal(ok, true);
});

test('token is cached until near expiry, then re-minted', async () => {
    let calls = 0;
    let t = 0;
    const fetch = async () => { calls += 1; return json({ access_token: `t${calls}`, expires_in: 3600 }); };
    const source = createTokenSource({ env, fetch, now: () => t });
    assert.equal(await source(), 't1');
    t = 1000 * 1000;
    assert.equal(await source(), 't1');
    t = 3400 * 1000; // inside the 5 minute margin
    assert.equal(await source(), 't2');
});

test('a key written with literal \\n escapes still signs', async () => {
    const fetch = async () => json({ access_token: 'tok', expires_in: 60 });
    const escaped = { ...env, GEMINI_SA_PRIVATE_KEY: pem.replace(/\n/g, '\\n') };
    assert.equal(await createTokenSource({ env: escaped, fetch, now: () => 0 })(), 'tok');
});

test('missing credentials and a refused exchange throw without echoing the key', async () => {
    await assert.rejects(createTokenSource({ env: {}, fetch: async () => json({}), now: () => 0 })(), /not configured/);
    const fetch = async () => json({ error: 'invalid_grant', error_description: 'bad' }, 400);
    await assert.rejects(createTokenSource({ env, fetch, now: () => 0 })(), (e) => {
        assert.match(e.message, /token exchange failed \(400\)/);
        assert.ok(!e.message.includes('PRIVATE KEY'));
        return true;
    });
});

test('endpoint: global region, project from env, default model', () => {
    assert.equal(
        vertexEndpoint(env),
        'https://aiplatform.googleapis.com/v1/projects/hcii-plus/locations/global/publishers/google/models/gemini-3.8-flash:generateContent',
    );
    assert.match(vertexEndpoint({ ...env, GEMINI_MODEL: 'm-x' }), /models\/m-x:generateContent$/);
});

test('callVertex sends system prompt, contents and output cap with a bearer token; returns text and status', async () => {
    let seen;
    const fetch = async (url, init) => {
        seen = { url, init };
        return json({ candidates: [{ content: { parts: [{ text: 'A ' }, { text: 'thought', thought: true }, { text: 'B' }] } }] });
    };
    const r = await callVertex({
        env, fetch, token: 'tok', system: 'SYS', maxOutputTokens: 300,
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
    });
    assert.deepEqual(r, { ok: true, status: 200, text: 'A B', calls: [] });
    assert.equal(seen.init.headers.authorization, 'Bearer tok');
    const body = JSON.parse(seen.init.body);
    assert.equal(body.systemInstruction.parts[0].text, 'SYS');
    assert.equal(body.generationConfig.maxOutputTokens, 300);
    assert.deepEqual(body.generationConfig.thinkingConfig, { thinkingLevel: 'low' });
    assert.equal(body.contents[0].parts[0].text, 'hi');
});

test('callVertex maps a 429 and other failures to ok:false with the status', async () => {
    const quota = await callVertex({ env, token: 't', system: '', contents: [], maxOutputTokens: 1, fetch: async () => json({ error: { message: 'quota' } }, 429) });
    assert.deepEqual([quota.ok, quota.status], [false, 429]);
    const down = await callVertex({ env, token: 't', system: '', contents: [], maxOutputTokens: 1, fetch: async () => { throw new Error('boom'); } });
    assert.equal(down.ok, false);
    assert.equal(down.status, undefined);
});

test('callVertex sends the tools it is given and returns the function calls', async () => {
    let body;
    const fetch = async (_url, init) => {
        body = JSON.parse(init.body);
        return new Response(JSON.stringify({ candidates: [{ content: { parts: [
            { text: 'Here it is.' },
            { functionCall: { name: 'open_page', args: { title: 'Components/Forms and inputs/Button/Button' } } },
        ] } }] }), { status: 200 });
    };
    const tools = [{ functionDeclarations: [{ name: 'open_page' }] }];
    const r = await callVertex({ env: { GEMINI_PROJECT_ID: 'p' }, fetch, token: 'tok', system: 'SYS', contents: [], tools, maxOutputTokens: 10 });
    assert.deepEqual(body.tools, tools);
    assert.equal(r.text, 'Here it is.');
    assert.deepEqual(r.calls, [{ name: 'open_page', args: { title: 'Components/Forms and inputs/Button/Button' } }]);
});
