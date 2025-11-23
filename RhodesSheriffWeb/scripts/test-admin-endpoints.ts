import fetch from 'node-fetch';
import { storage } from '../server/storage';

async function run() {
  console.log('Exporting state via storage.exportState()...');
  const state = await storage.exportState();
  console.log('Exported keys:', Object.keys(state));

  console.log('Saving via saveNow()...');
  await storage.saveNow();
  console.log('Saved.');
}

run().catch(e => { console.error(e); process.exit(1); });
