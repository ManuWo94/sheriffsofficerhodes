import express from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

export function startAdminServer(port = 5001) {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  function requireAdminKey(req: any, res: any, next: any) {
    const key = process.env.ADMIN_API_KEY;
    if (!key) return next();
    const provided = req.headers['x-admin-key'];
    if (!provided || provided !== key) return res.status(403).json({ message: 'Ungültiger Admin-Key' });
    next();
  }

  app.get('/export', async (_req, res) => {
    try {
      const state = await storage.exportState();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="storage-export.json"');
      res.send(JSON.stringify(state, null, 2));
    } catch (e) {
      res.status(500).json({ message: String(e) });
    }
  });

  app.post('/import', requireAdminKey, async (req, res) => {
    try {
      const dryRun = req.query?.dryRun === '1' || req.query?.dryRun === 'true';
      const validation = await storage.validateState(req.body);
      if (dryRun) return res.json({ dryRun: true, ...validation });
      if (!validation.valid) return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
      await storage.importState(req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: String(e) });
    }
  });

  app.post('/reset', requireAdminKey, async (_req, res) => {
    try {
      await storage.resetToSeed();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: String(e) });
    }
  });

  app.post('/save', requireAdminKey, async (_req, res) => {
    try {
      await storage.saveNow();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: String(e) });
    }
  });

  app.get('/status', async (_req, res) => {
    try {
      const file = path.join(process.cwd(), 'data', 'storage.json');
      if (!fs.existsSync(file)) return res.json({ exists: false });
      const stat = fs.statSync(file);
      res.json({ exists: true, size: stat.size, mtime: stat.mtime });
    } catch (e) {
      res.status(500).json({ message: String(e) });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`[admin] server listening on port ${port}`);
  });
}

export default startAdminServer;
