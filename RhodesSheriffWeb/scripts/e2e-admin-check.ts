#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE || 'http://localhost:5000';
const exportPath = process.argv[2] || path.join(process.cwd(), 'data', 'e2e-storage-export.json');

async function wait(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchJson(url: string, opts: any = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; } catch (e) { return { status: res.status, bodyText: text }; }
}

async function run() {
  console.log('[e2e] base:', BASE);

  // wait for server
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(BASE + '/api/admin/storage/status', { method: 'GET' });
      if (r.status !== 0) break;
    } catch (e) {
      // ignore
    }
    await wait(500);
  }

  console.log('[e2e] logging in as sheriff');
  const login = await fetchJson(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sheriff', password: 'admin123' }),
  });
  if (login.status !== 200 || !login.body || !login.body.sessionToken) {
    console.error('[e2e] login failed', login);
    process.exit(2);
  }
  const token = login.body.sessionToken;
  console.log('[e2e] got sessionToken');

  console.log('[e2e] requesting export');
  const exp = await fetchJson(BASE + '/api/admin/storage/export', {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'x-session-token': token },
  });
  if (exp.status !== 200) {
    console.error('[e2e] export failed', exp);
    process.exit(3);
  }
  const state = exp.body;
  fs.writeFileSync(exportPath, JSON.stringify(state, null, 2), 'utf8');
  console.log('[e2e] export saved to', exportPath);

  console.log('[e2e] running dry-run import');
  const dry = await fetchJson(BASE + '/api/admin/storage/import?dryRun=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-token': token },
    body: JSON.stringify(state),
  });
  console.log('[e2e] dry-run status', dry.status, dry.body || dry.bodyText);
  if (dry.status !== 200) {
    console.error('[e2e] dry-run import failed');
    process.exit(4);
  }

  console.log('[e2e] performing real import');
  const imp = await fetchJson(BASE + '/api/admin/storage/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-token': token },
    body: JSON.stringify(state),
  });
  console.log('[e2e] import status', imp.status, imp.body || imp.bodyText);
  if (imp.status !== 200) {
    console.error('[e2e] import failed');
    process.exit(5);
  }

  console.log('[e2e] fetching status');
  const status = await fetchJson(BASE + '/api/admin/storage/status', {
    method: 'GET', headers: { 'x-session-token': token }
  });
  console.log('[e2e] status', status.status, status.body || status.bodyText);

  console.log('[e2e] completed successfully');
}

run().catch(e => { console.error(e); process.exit(1); });
