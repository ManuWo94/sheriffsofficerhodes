import { storage } from '../server/storage';

async function run() {
  try {
    console.log('Creating test case to trigger save...');
    const c = await storage.createCase({
      caseNumber: `ATOM-${Date.now()}`,
      personName: 'Atomic Test',
      crime: 'Atomic write test',
      status: 'offen',
      notes: '',
      photo: null,
      characteristics: '',
      handler: 'sheriff',
    });
    console.log('Created:', c.id);
    // give some time for save to finish if asynchronous
    setTimeout(() => process.exit(0), 500);
  } catch (e) {
    console.error('Error during test save:', e);
    process.exit(1);
  }
}

run();
