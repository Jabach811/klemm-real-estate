import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../api/contact.js', import.meta.url), 'utf8');

async function loadHandler() {
  let sends = 0;
  const context = vm.createContext({
    URLSearchParams,
    console: { error() {} },
    process: { env: { RESEND_API_KEY: 'test-key' } },
    fetch: async () => { sends += 1; return { ok: true, status: 200, text: async () => '' }; },
  });
  const mod = new vm.SourceTextModule(source, { context });
  await mod.link(() => {});
  await mod.evaluate();
  return { handler: mod.namespace.default, get sends() { return sends; } };
}

async function request(handler, { method = 'POST', origin, body = { email: 'invalid' } } = {}) {
  const headers = {};
  const result = {};
  const res = {
    setHeader(name, value) { headers[name] = value; },
    status(code) { result.status = code; return this; },
    json(value) { result.body = value; return this; },
    end() { result.ended = true; return this; },
  };
  await handler({ method, headers: origin ? { origin } : {}, body }, res);
  return { headers, result };
}

test('allows the GPT Sites form origin to read a Resend validation response', async () => {
  const app = await loadHandler();
  const response = await request(app.handler, {
    origin: 'https://klemm-real-estate-tracy.jabach0811.chatgpt.site',
  });

  assert.equal(response.result.status, 422);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://klemm-real-estate-tracy.jabach0811.chatgpt.site');
  assert.equal(app.sends, 0);
});

test('does not grant cross-site access to an unrecognized origin', async () => {
  const app = await loadHandler();
  const response = await request(app.handler, { origin: 'https://untrusted.example' });

  assert.equal(response.result.status, 422);
  assert.equal(response.headers['Access-Control-Allow-Origin'], undefined);
  assert.equal(app.sends, 0);
});
