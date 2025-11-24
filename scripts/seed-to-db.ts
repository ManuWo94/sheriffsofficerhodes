#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dns from 'dns/promises';

async function createClientUsingIPv4(urlStr: string) {
  const url = new URL(urlStr);
  const host = url.hostname;
  let address = host;
  try {
    const rec = await dns.lookup(host, { family: 4 });
    address = rec.address;
    console.log('Resolved host', host, '->', address);
  } catch (e) {
    console.warn('Could not resolve IPv4 for host, using hostname directly:', host, e);
    address = host;
  }

  const client = new Client({
    host: address,
    port: parseInt(url.port || '5432', 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname ? url.pathname.slice(1) : undefined,
    ssl: { rejectUnauthorized: false, servername: host } as any,
  });
  return client;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function upsert(client: Client, table: string, columns: string[], values: any[]) {
  // build parameter list
  const cols = columns.join(', ');
  const params = values.map((_, i) => `$${i + 1}`).join(', ');
  // build conflict update (set all columns = excluded.col)
  const updates = columns.map((c) => `${c} = EXCLUDED.${c}`).join(', ');
  const sql = `INSERT INTO ${table} (${cols}) VALUES (${params}) ON CONFLICT (id) DO UPDATE SET ${updates}`;
  await client.query(sql, values);
}

function toISO(v: any) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toISOString();
}

async function run() {
  const file = process.argv[2] || path.join(process.cwd(), 'RhodesSheriffWeb', 'data', 'storage.seed.json');
  if (!fs.existsSync(file)) {
    console.error('Seed file not found:', file);
    process.exit(1);
  }

  const raw = fs.readFileSync(file, 'utf8');
  const state = JSON.parse(raw);

  const client = await createClientUsingIPv4(databaseUrl);
  await client.connect();
  try {
    await client.query('BEGIN');

    if (Array.isArray(state.users)) {
      for (const u of state.users) {
        await upsert(client, 'users', ['id','username','password','rank','must_change_password'], [u.id, u.username, u.password, u.rank, u.mustChangePassword ?? 0]);
      }
    }

    if (Array.isArray(state.cases)) {
      for (const c of state.cases) {
        await upsert(client, 'cases', [
          'id','case_number','person_name','crime','status','notes','photo','characteristics','handler','created_at','updated_at'
        ], [c.id, c.caseNumber, c.personName, c.crime, c.status, c.notes ?? null, c.photo ?? null, c.characteristics ?? null, c.handler ?? null, toISO(c.createdAt) ?? new Date().toISOString(), toISO(c.updatedAt) ?? new Date().toISOString()]);
      }
    }

    if (Array.isArray(state.jailRecords)) {
      for (const j of state.jailRecords) {
        await upsert(client, 'jail_records', ['id','person_name','crime','duration_minutes','start_time','handler','released','released_at'], [j.id, j.personName, j.crime, j.durationMinutes, toISO(j.startTime) ?? new Date().toISOString(), j.handler, j.released ?? 0, toISO(j.releasedAt)]);
      }
    }

    if (Array.isArray(state.fines)) {
      for (const f of state.fines) {
        await upsert(client, 'fines', ['id','violation','amount','remarks'], [f.id, f.violation, f.amount, f.remarks ?? null]);
      }
    }

    if (state.cityLaws) {
      const cl = state.cityLaws;
      // ensure singleton id
      await upsert(client, 'city_laws', ['id','content','updated_at','updated_by'], [cl.id ?? 'singleton', cl.content ?? '', toISO(cl.updatedAt) ?? new Date().toISOString(), cl.updatedBy ?? '']);
    }

    if (Array.isArray(state.weapons)) {
      for (const w of state.weapons) {
        await upsert(client, 'weapons', ['id','serial_number','weapon_type','owner','category','status','status_changed_at','created_at','created_by','updated_at','updated_by'], [w.id, w.serialNumber, w.weaponType, w.owner, w.category, w.status, toISO(w.statusChangedAt) ?? new Date().toISOString(), toISO(w.createdAt) ?? new Date().toISOString(), w.createdBy ?? '', toISO(w.updatedAt) ?? new Date().toISOString(), w.updatedBy ?? '']);
      }
    }

    if (Array.isArray(state.tasks)) {
      for (const t of state.tasks) {
        await upsert(client, 'tasks', ['id','title','description','assigned_to','assigned_by','status','created_at','updated_at'], [t.id, t.title, t.description, t.assignedTo, t.assignedBy, t.status, toISO(t.createdAt) ?? new Date().toISOString(), toISO(t.updatedAt) ?? new Date().toISOString()]);
      }
    }

    if (Array.isArray(state.globalNotes)) {
      for (const n of state.globalNotes) {
        await upsert(client, 'global_notes', ['id','content','author','created_at','updated_at','updated_by'], [n.id, n.content, n.author, toISO(n.createdAt) ?? new Date().toISOString(), toISO(n.updatedAt) ?? new Date().toISOString(), n.updatedBy ?? n.author]);
      }
    }

    if (Array.isArray(state.userNotes)) {
      for (const n of state.userNotes) {
        await upsert(client, 'user_notes', ['id','user_id','content','created_at','updated_at'], [n.id, n.userId ?? n.user_id ?? null, n.content, toISO(n.createdAt) ?? new Date().toISOString(), toISO(n.updatedAt) ?? new Date().toISOString()]);
      }
    }

    if (Array.isArray(state.auditLogs)) {
      for (const a of state.auditLogs) {
        await upsert(client, 'audit_logs', ['id','action','entity','entity_id','details','username','timestamp'], [a.id, a.action, a.entity, a.entityId ?? a.entity_id ?? null, a.details, a.username, toISO(a.timestamp) ?? new Date().toISOString()]);
      }
    }

    await client.query('COMMIT');
    console.log('Seed imported successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed import failed', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
