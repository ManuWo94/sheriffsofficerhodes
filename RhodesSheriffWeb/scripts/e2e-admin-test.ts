import fs from 'fs';

const base = 'http://localhost:5000';

async function req(path: string, opts: any = {}) {
  const res = await fetch(base + path, opts);
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch (e) { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}

async function run() {
  console.log('E2E: login as sheriff');
  const login = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sheriff', password: 'admin123' }),
  });
  console.log('LOGIN', login.status, login.body);
  if (login.status !== 200) process.exit(1);
  const token = login.body.sessionToken;

  console.log('\nE2E: status before');
  const status1 = await req('/api/admin/storage/status', { headers: { 'x-session-token': token } });
  console.log('STATUS1', status1.status, status1.body);

  console.log('\nE2E: export');
  const exportRes = await fetch(base + '/api/admin/storage/export', { headers: { 'x-session-token': token } });
  const exportedText = await exportRes.text();
  console.log('EXPORT status', exportRes.status);
  fs.writeFileSync('/tmp/storage-export.json', exportedText, 'utf8');
  console.log('Wrote /tmp/storage-export.json');

  console.log('\nE2E: save');
  const save = await req('/api/admin/storage/save', { method: 'POST', headers: { 'x-session-token': token } });
  console.log('SAVE', save.status, save.body);

  console.log('\nE2E: import dry-run');
  const importDry = await req('/api/admin/storage/import?dryRun=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-token': token },
    body: exportedText,
  });
  console.log('IMPORT dry-run', importDry.status, importDry.body);

  console.log('\nE2E: import actual');
  const importAct = await req('/api/admin/storage/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-token': token },
    body: exportedText,
  });
  console.log('IMPORT', importAct.status, importAct.body);

  console.log('\nE2E: reset to seed');
  const reset = await req('/api/admin/storage/reset', { method: 'POST', headers: { 'x-session-token': token } });
  console.log('RESET', reset.status, reset.body);

  console.log('\nE2E: status after');
  const status2 = await req('/api/admin/storage/status', { headers: { 'x-session-token': token } });
  console.log('STATUS2', status2.status, status2.body);

  console.log('\nE2E completed');
}

run().catch(e => { console.error('E2E error', e); process.exit(1); });
