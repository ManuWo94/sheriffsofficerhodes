import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DELETE_PERMISSIONS, TASK_ASSIGN_PERMISSIONS } from "@shared/schema";

// Helper to create audit log
async function logAudit(
  action: string,
  entity: string,
  entityId: string | null,
  details: string,
  username: string
) {
  await storage.createAuditLog({
    action,
    entity,
    entityId,
    details,
    username,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simple session store (in-memory) with expiration
  const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  const sessions = new Map<string, { userId: string; username: string; rank: string; expiresAt: number }>();
  
  // Cleanup expired sessions every hour
  setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
      if (session.expiresAt < now) {
        sessions.delete(token);
      }
    }
  }, 60 * 60 * 1000);

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Ungültiger Benutzername oder Passwort" });
      }

      // Create session token with expiration
      const sessionToken = `${user.id}_${Date.now()}_${Math.random().toString(36)}`;
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      sessions.set(sessionToken, { userId: user.id, username: user.username, rank: user.rank, expiresAt });

      await logAudit("Login", "user", user.id, `Benutzer ${username} hat sich angemeldet`, username);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, sessionToken });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    try {
      const sessionToken = req.headers['x-session-token'];
      sessions.delete(sessionToken);
      
      await logAudit("Logout", "user", req.session.userId, `Benutzer ${req.session.username} hat sich abgemeldet`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req: any, res) => {
    try {
      const { newPassword } = req.body;
      
      // User can only change their own password
      const userId = req.session.userId;
      
      await storage.updateUserPassword(userId, newPassword);
      
      // Invalidate old session and create new one for security
      const oldSessionToken = req.headers['x-session-token'];
      sessions.delete(oldSessionToken);
      
      const newSessionToken = `${userId}_${Date.now()}_${Math.random().toString(36)}`;
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      sessions.set(newSessionToken, { userId: req.session.userId, username: req.session.username, rank: req.session.rank, expiresAt });
      
      const user = await storage.getUser(userId);
      if (user) {
        await logAudit("Passwort geändert", "user", userId, `Benutzer ${user.username} hat das Passwort geändert`, req.session.username);
      }
      
      res.json({ success: true, sessionToken: newSessionToken });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Middleware to verify session
  function requireAuth(req: any, res: any, next: any) {
    const sessionToken = req.headers['x-session-token'];
    
    if (!sessionToken) {
      return res.status(401).json({ message: "Kein Session-Token" });
    }
    
    const session = sessions.get(sessionToken);
    if (!session) {
      return res.status(401).json({ message: "Session ungültig oder abgelaufen" });
    }
    
    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      sessions.delete(sessionToken);
      return res.status(401).json({ message: "Session abgelaufen" });
    }
    
    req.session = session;
    next();
  }

  // Middleware to check delete permissions
  function requireDeletePermission(req: any, res: any, next: any) {
    if (!DELETE_PERMISSIONS.includes(req.session.rank as any)) {
      return res.status(403).json({ message: "Keine Berechtigung" });
    }
    next();
  }

  // Users routes
  app.get("/api/users", requireAuth, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/users", requireAuth, async (req: any, res) => {
    try {
      // Only Sheriff can create users
      if (req.session.rank !== "Sheriff") {
        return res.status(403).json({ message: "Nur der Sheriff kann Benutzer anlegen" });
      }

      const user = await storage.createUser(req.body);
      
      await logAudit("Benutzer erstellt", "user", user.id, `Neuer Benutzer ${user.username} (${user.rank}) wurde angelegt`, req.session.username);
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Cases routes
  app.get("/api/cases", requireAuth, async (req, res) => {
    try {
      const cases = await storage.getAllCases();
      res.json(cases);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/cases", requireAuth, async (req: any, res) => {
    try {
      const caseData = await storage.createCase(req.body);
      
      await logAudit("Fallakte erstellt", "case", caseData.id, `Fallakte ${caseData.caseNumber} für ${caseData.personName} wurde angelegt`, req.session.username);
      
      res.json(caseData);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.patch("/api/cases/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const caseData = await storage.getCaseById(id);
      if (!caseData) {
        return res.status(404).json({ message: "Fallakte nicht gefunden" });
      }
      
      await storage.updateCase(id, updates);
      
      await logAudit("Fallakte bearbeitet", "case", id, `Fallakte ${caseData.caseNumber} wurde aktualisiert`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.patch("/api/cases/:id/status", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const caseData = await storage.getCaseById(id);
      if (!caseData) {
        return res.status(404).json({ message: "Fallakte nicht gefunden" });
      }
      
      await storage.updateCaseStatus(id, status);
      
      await logAudit("Status geändert", "case", id, `Fallakte ${caseData.caseNumber} Status: ${caseData.status} → ${status}`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.delete("/api/cases/:id", requireAuth, requireDeletePermission, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const caseData = await storage.getCaseById(id);
      if (!caseData) {
        return res.status(404).json({ message: "Fallakte nicht gefunden" });
      }
      
      await storage.deleteCase(id);
      
      await logAudit("Fallakte gelöscht", "case", id, `Fallakte ${caseData.caseNumber} wurde gelöscht`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Persons routes
  app.get("/api/persons", requireAuth, async (req, res) => {
    try {
      const persons = await storage.getPersonsSummary();
      res.json(persons);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Jail routes
  app.get("/api/jail", requireAuth, async (req, res) => {
    try {
      const records = await storage.getAllJailRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/jail", requireAuth, async (req: any, res) => {
    try {
      const record = await storage.createJailRecord(req.body);
      
      await logAudit("Inhaftierung", "jail", record.id, `${record.personName} wurde inhaftiert (${record.durationMinutes} Min., ${record.crime})`, req.session.username);
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.patch("/api/jail/:id/release", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const record = await storage.getJailRecordById(id);
      if (!record) {
        return res.status(404).json({ message: "Eintrag nicht gefunden" });
      }
      
      await storage.releaseInmate(id);
      
      await logAudit("Entlassung", "jail", id, `${record.personName} wurde entlassen`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.delete("/api/jail/:id", requireAuth, requireDeletePermission, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const record = await storage.getJailRecordById(id);
      if (!record) {
        return res.status(404).json({ message: "Eintrag nicht gefunden" });
      }
      
      await storage.deleteJailRecord(id);
      
      await logAudit("Eintrag gelöscht", "jail", id, `Inhaftierung von ${record.personName} wurde gelöscht`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Fines routes
  app.get("/api/fines", requireAuth, async (req, res) => {
    try {
      const fines = await storage.getAllFines();
      res.json(fines);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/fines", requireAuth, async (req: any, res) => {
    try {
      const fine = await storage.createFine(req.body);
      
      await logAudit("Bußgeld erstellt", "fine", fine.id, `Bußgeld "${fine.violation}" ($${fine.amount}) wurde angelegt`, req.session.username);
      
      res.json(fine);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.delete("/api/fines/:id", requireAuth, requireDeletePermission, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteFine(id);
      
      await logAudit("Bußgeld gelöscht", "fine", id, `Bußgeld wurde gelöscht`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // City Laws routes
  app.get("/api/laws", requireAuth, async (req, res) => {
    try {
      const laws = await storage.getCityLaws();
      if (!laws) {
        return res.json({ id: "singleton", content: "", updatedAt: new Date(), updatedBy: "" });
      }
      res.json(laws);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/laws", requireAuth, async (req: any, res) => {
    try {
      // Only Sheriff and Chief Deputy can edit laws
      if (!["Sheriff", "Chief Deputy"].includes(req.session.rank)) {
        return res.status(403).json({ message: "Keine Berechtigung" });
      }

      const laws = await storage.saveCityLaws(req.body);
      
      await logAudit("Gesetze aktualisiert", "law", "singleton", `Stadtgesetze wurden aktualisiert`, req.session.username);
      
      res.json(laws);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Weapons routes
  app.get("/api/weapons", requireAuth, async (req, res) => {
    try {
      const weapons = await storage.getAllWeapons();
      res.json(weapons);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/weapons", requireAuth, async (req: any, res) => {
    try {
      const weapon = await storage.createWeapon(req.body, req.session.username);
      
      await logAudit("Waffe registriert", "weapon", weapon.id, `Waffe ${weapon.serialNumber} (${weapon.weaponType}) für ${weapon.owner} wurde registriert`, req.session.username);
      
      res.json(weapon);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.patch("/api/weapons/:id/status", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const weapon = await storage.getWeaponById(id);
      if (!weapon) {
        return res.status(404).json({ message: "Waffe nicht gefunden" });
      }
      
      await storage.updateWeaponStatus(id, status, req.session.username);
      
      await logAudit("Waffenstatus geändert", "weapon", id, `Waffe ${weapon.serialNumber} Status: ${weapon.status} → ${status}`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.delete("/api/weapons/:id", requireAuth, requireDeletePermission, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const weapon = await storage.getWeaponById(id);
      if (!weapon) {
        return res.status(404).json({ message: "Waffe nicht gefunden" });
      }
      
      await storage.deleteWeapon(id);
      
      await logAudit("Waffe gelöscht", "weapon", id, `Waffe ${weapon.serialNumber} wurde gelöscht`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req: any, res) => {
    try {
      // Check if user has permission to assign tasks
      if (!TASK_ASSIGN_PERMISSIONS.includes(req.session.rank as any)) {
        return res.status(403).json({ message: "Keine Berechtigung zum Zuweisen von Aufgaben" });
      }

      const task = await storage.createTask(req.body);
      
      await logAudit("Aufgabe erstellt", "task", task.id, `Aufgabe "${task.title}" wurde an ${task.assignedTo} vergeben`, req.session.username);
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.patch("/api/tasks/:id/status", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Aufgabe nicht gefunden" });
      }
      
      await storage.updateTaskStatus(id, status);
      
      await logAudit("Aufgabenstatus geändert", "task", id, `Aufgabe "${task.title}" Status: ${task.status} → ${status}`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.patch("/api/tasks/:id/transfer", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      
      // Check if user has permission to assign tasks
      if (!TASK_ASSIGN_PERMISSIONS.includes(req.session.rank as any)) {
        return res.status(403).json({ message: "Keine Berechtigung zum Zuweisen von Aufgaben" });
      }
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Aufgabe nicht gefunden" });
      }
      
      const oldAssignee = task.assignedTo;
      await storage.transferTask(id, assignedTo);
      
      await logAudit("Aufgabe übertragen", "task", id, `Aufgabe "${task.title}" von ${oldAssignee} an ${assignedTo} übertragen`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Notes routes
  app.get("/api/notes/global", requireAuth, async (req, res) => {
    try {
      const notes = await storage.getAllGlobalNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/notes/global", requireAuth, async (req: any, res) => {
    try {
      const note = await storage.createGlobalNote(req.body);
      
      await logAudit("Notiz erstellt", "note", note.id, `Gemeinsame Notiz wurde erstellt`, req.session.username);
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.patch("/api/notes/global/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      await storage.updateGlobalNote(id, content, req.session.username);
      await logAudit("Notiz bearbeitet", "note", id, `Gemeinsame Notiz wurde bearbeitet`, req.session.username);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.delete("/api/notes/global/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGlobalNote(id);
      await logAudit("Notiz gelöscht", "note", id, `Gemeinsame Notiz wurde gelöscht`, req.session.username);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.get("/api/notes/user", requireAuth, async (req: any, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId erforderlich" });
      }
      
      const notes = await storage.getUserNotes(userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.post("/api/notes/user", requireAuth, async (req: any, res) => {
    try {
      const note = await storage.createUserNote(req.body);
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.patch("/api/notes/user/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      await storage.updateUserNote(id, content);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.delete("/api/notes/user/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUserNote(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Audit logs routes
  app.get("/api/audit", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getAllAuditLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  app.get("/api/audit/recent", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getRecentAuditLogs(10);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const cases = await storage.getAllCases();
      const jailRecords = await storage.getAllJailRecords();
      const weapons = await storage.getAllWeapons();

      const activeCases = cases.filter(c => c.status !== "abgeschlossen").length;
      const currentInmates = jailRecords.filter(r => r.released === 0).length;

      res.json({
        activeCases,
        currentInmates,
        registeredWeapons: weapons.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Server-Fehler" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
