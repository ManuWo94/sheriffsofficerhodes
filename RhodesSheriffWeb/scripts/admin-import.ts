#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { storage } from '../server/storage';

async function run() {
  const inPath = process.argv[2] || path.join(process.cwd(), 'data', 'storage-export.json');
  if (!fs.existsSync(inPath)) {
    console.error('File not found:', inPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(inPath, 'utf8');
  const parsed = JSON.parse(raw);
  const validation = await storage.validateState(parsed);
  if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    process.exit(1);
  }
  await storage.importState(parsed);
  console.log('Imported from', inPath);
}

run().catch(e => { console.error(e); process.exit(1); });
