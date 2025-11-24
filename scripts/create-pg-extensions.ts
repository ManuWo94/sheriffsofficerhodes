#!/usr/bin/env tsx
import { Client } from 'pg';
import dns from 'dns/promises';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

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
    ssl: {
      rejectUnauthorized: false,
      servername: host,
    } as any,
  });
  return client;
}

async function run() {
  const client = await createClientUsingIPv4(databaseUrl);
  await client.connect();
  try {
    console.log('Creating extension pgcrypto if not exists...');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('Extension ensured.');
  } finally {
    await client.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
