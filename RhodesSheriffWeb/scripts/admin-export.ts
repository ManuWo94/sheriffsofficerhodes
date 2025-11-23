#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { storage } from '../server/storage';

async function run() {
  const state = await storage.exportState();
  const out = JSON.stringify(state, null, 2);
  const outPath = process.argv[2] || path.join(process.cwd(), 'data', 'storage-export.json');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Exported to', outPath);
}

run().catch(e => { console.error(e); process.exit(1); });
