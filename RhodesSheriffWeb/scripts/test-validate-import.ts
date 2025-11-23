import { storage } from '../server/storage';

async function run() {
  console.log('Testing validateState with good sample...');
  const good = await storage.exportState();
  const v1 = await storage.validateState(good);
  console.log('Good validation:', v1);

  console.log('Testing validateState with bad sample...');
  const bad = { users: 'not-an-array' };
  const v2 = await storage.validateState(bad);
  console.log('Bad validation:', v2);
}

run().catch(e => { console.error(e); process.exit(1); });
