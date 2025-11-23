import { 
  type User, type InsertUser,
  type Case, type InsertCase,
  type JailRecord, type InsertJailRecord,
  type Fine, type InsertFine,
  type CityLaws, type InsertCityLaws,
  type Weapon, type InsertWeapon,
  type Task, type InsertTask,
  type GlobalNote, type InsertGlobalNote,
  type UserNote, type InsertUserNote,
  type AuditLog, type InsertAuditLog,
  type PersonSummary,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, newPassword: string): Promise<void>;

  // Cases
  getAllCases(): Promise<Case[]>;
  getCaseById(id: string): Promise<Case | undefined>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, updates: Partial<Omit<Case, 'id' | 'createdAt'>>): Promise<void>;
  updateCaseStatus(id: string, status: string): Promise<void>;
  deleteCase(id: string): Promise<void>;

  // Persons (derived from cases)
  getPersonsSummary(): Promise<PersonSummary[]>;

  // Jail
  getAllJailRecords(): Promise<JailRecord[]>;
  getJailRecordById(id: string): Promise<JailRecord | undefined>;
  createJailRecord(record: InsertJailRecord): Promise<JailRecord>;
  releaseInmate(id: string): Promise<void>;
  deleteJailRecord(id: string): Promise<void>;

  // Fines
  getAllFines(): Promise<Fine[]>;
  createFine(fine: InsertFine): Promise<Fine>;
  deleteFine(id: string): Promise<void>;

  // City Laws
  getCityLaws(): Promise<CityLaws | undefined>;
  saveCityLaws(laws: InsertCityLaws): Promise<CityLaws>;

  // Weapons
  getAllWeapons(): Promise<Weapon[]>;
  getWeaponById(id: string): Promise<Weapon | undefined>;
  createWeapon(weapon: InsertWeapon, createdBy: string): Promise<Weapon>;
  updateWeaponStatus(id: string, status: string, updatedBy: string): Promise<void>;
  deleteWeapon(id: string): Promise<void>;

  // Tasks
  getAllTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTaskStatus(id: string, status: string): Promise<void>;
  transferTask(id: string, assignedTo: string): Promise<void>;

  // Notes
  getAllGlobalNotes(): Promise<GlobalNote[]>;
  createGlobalNote(note: InsertGlobalNote): Promise<GlobalNote>;
  updateGlobalNote(id: string, content: string, updatedBy: string): Promise<void>;
  deleteGlobalNote(id: string): Promise<void>;
  getUserNotes(userId: string): Promise<UserNote[]>;
  createUserNote(note: InsertUserNote): Promise<UserNote>;
  updateUserNote(id: string, content: string): Promise<void>;
  deleteUserNote(id: string): Promise<void>;

  // Audit Logs
  getAllAuditLogs(): Promise<AuditLog[]>;
  getRecentAuditLogs(limit: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cases: Map<string, Case>;
  private jailRecords: Map<string, JailRecord>;
  private fines: Map<string, Fine>;
  private cityLaws: CityLaws | undefined;
  private weapons: Map<string, Weapon>;
  private tasks: Map<string, Task>;
  private globalNotes: Map<string, GlobalNote>;
  private userNotes: Map<string, UserNote>;
  private auditLogs: Map<string, AuditLog>;

  constructor() {
    this.users = new Map();
    this.cases = new Map();
    this.jailRecords = new Map();
    this.fines = new Map();
    this.weapons = new Map();
    this.tasks = new Map();
    this.globalNotes = new Map();
    this.userNotes = new Map();
    this.auditLogs = new Map();

    // Create default Sheriff user
    const defaultUser: User = {
      id: randomUUID(),
      username: "sheriff",
      password: "admin123",
      rank: "Sheriff",
      mustChangePassword: 0,
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      rank: insertUser.rank as any,
      mustChangePassword: insertUser.mustChangePassword ?? 0,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = newPassword;
      user.mustChangePassword = 0;
      this.users.set(userId, user);
    }
  }

  // Cases
  async getAllCases(): Promise<Case[]> {
    return Array.from(this.cases.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getCaseById(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    const id = randomUUID();
    const now = new Date();
    const caseData: Case = {
      id,
      caseNumber: insertCase.caseNumber,
      personName: insertCase.personName,
      crime: insertCase.crime,
      status: insertCase.status as any,
      notes: insertCase.notes ?? null,
      photo: insertCase.photo ?? null,
      characteristics: insertCase.characteristics ?? null,
      handler: insertCase.handler,
      createdAt: now,
      updatedAt: now,
    };
    this.cases.set(id, caseData);
    return caseData;
  }

  async updateCase(id: string, updates: Partial<Omit<Case, 'id' | 'createdAt'>>): Promise<void> {
    const caseData = this.cases.get(id);
    if (caseData) {
      Object.assign(caseData, updates);
      caseData.updatedAt = new Date();
      this.cases.set(id, caseData);
    }
  }

  async updateCaseStatus(id: string, status: string): Promise<void> {
    const caseData = this.cases.get(id);
    if (caseData) {
      caseData.status = status as any;
      caseData.updatedAt = new Date();
      this.cases.set(id, caseData);
    }
  }

  async deleteCase(id: string): Promise<void> {
    this.cases.delete(id);
  }

  // Persons
  async getPersonsSummary(): Promise<PersonSummary[]> {
    const allCases = await this.getAllCases();
    const personMap = new Map<string, PersonSummary>();

    for (const caseData of allCases) {
      const existingPerson = personMap.get(caseData.personName);
      
      if (!existingPerson) {
        personMap.set(caseData.personName, {
          name: caseData.personName,
          photo: caseData.photo ?? undefined,
          characteristics: caseData.characteristics ?? undefined,
          caseCount: 1,
          lastCrime: caseData.crime,
          lastCaseDate: caseData.createdAt,
          cases: [caseData],
        });
      } else {
        existingPerson.caseCount++;
        existingPerson.cases.push(caseData);
        
        if (!existingPerson.photo && caseData.photo) {
          existingPerson.photo = caseData.photo ?? undefined;
        }
        
        if (!existingPerson.characteristics && caseData.characteristics) {
          existingPerson.characteristics = caseData.characteristics ?? undefined;
        }
        
        if (new Date(caseData.createdAt) > new Date(existingPerson.lastCaseDate!)) {
          existingPerson.lastCrime = caseData.crime;
          existingPerson.lastCaseDate = caseData.createdAt;
        }
      }
    }

    return Array.from(personMap.values()).sort((a, b) => b.caseCount - a.caseCount);
  }

  // Jail
  async getAllJailRecords(): Promise<JailRecord[]> {
    return Array.from(this.jailRecords.values()).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  async getJailRecordById(id: string): Promise<JailRecord | undefined> {
    return this.jailRecords.get(id);
  }

  async createJailRecord(insertRecord: InsertJailRecord): Promise<JailRecord> {
    const id = randomUUID();
    const record: JailRecord = {
      id,
      personName: insertRecord.personName,
      crime: insertRecord.crime,
      durationMinutes: insertRecord.durationMinutes,
      startTime: insertRecord.startTime,
      handler: insertRecord.handler,
      released: 0,
      releasedAt: null,
    };
    this.jailRecords.set(id, record);
    return record;
  }

  async releaseInmate(id: string): Promise<void> {
    const record = this.jailRecords.get(id);
    if (record) {
      record.released = 1;
      record.releasedAt = new Date();
      this.jailRecords.set(id, record);
    }
  }

  async deleteJailRecord(id: string): Promise<void> {
    this.jailRecords.delete(id);
  }

  // Fines
  async getAllFines(): Promise<Fine[]> {
    return Array.from(this.fines.values());
  }

  async createFine(insertFine: InsertFine): Promise<Fine> {
    const id = randomUUID();
    const fine: Fine = {
      id,
      violation: insertFine.violation,
      amount: insertFine.amount,
      remarks: insertFine.remarks ?? null,
    };
    this.fines.set(id, fine);
    return fine;
  }

  async deleteFine(id: string): Promise<void> {
    this.fines.delete(id);
  }

  // City Laws
  async getCityLaws(): Promise<CityLaws | undefined> {
    return this.cityLaws;
  }

  async saveCityLaws(insertLaws: InsertCityLaws): Promise<CityLaws> {
    const laws: CityLaws = {
      id: "singleton",
      content: insertLaws.content,
      updatedAt: new Date(),
      updatedBy: insertLaws.updatedBy,
    };
    this.cityLaws = laws;
    return laws;
  }

  // Weapons
  async getAllWeapons(): Promise<Weapon[]> {
    return Array.from(this.weapons.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getWeaponById(id: string): Promise<Weapon | undefined> {
    return this.weapons.get(id);
  }

  async createWeapon(insertWeapon: InsertWeapon, createdBy: string): Promise<Weapon> {
    const id = randomUUID();
    const now = new Date();
    const weapon: Weapon = {
      id,
      serialNumber: insertWeapon.serialNumber,
      weaponType: insertWeapon.weaponType,
      owner: insertWeapon.owner,
      category: insertWeapon.category,
      status: insertWeapon.status as any,
      statusChangedAt: now,
      createdAt: now,
      createdBy,
      updatedAt: now,
      updatedBy: createdBy,
    };
    this.weapons.set(id, weapon);
    return weapon;
  }

  async updateWeaponStatus(id: string, status: string, updatedBy: string): Promise<void> {
    const weapon = this.weapons.get(id);
    if (weapon) {
      weapon.status = status as any;
      weapon.statusChangedAt = new Date();
      weapon.updatedAt = new Date();
      weapon.updatedBy = updatedBy;
      this.weapons.set(id, weapon);
    }
  }

  async deleteWeapon(id: string): Promise<void> {
    this.weapons.delete(id);
  }

  // Tasks
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      id,
      title: insertTask.title,
      description: insertTask.description,
      assignedTo: insertTask.assignedTo,
      assignedBy: insertTask.assignedBy,
      status: insertTask.status as any,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTaskStatus(id: string, status: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status as any;
      task.updatedAt = new Date();
      this.tasks.set(id, task);
    }
  }

  async transferTask(id: string, assignedTo: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.assignedTo = assignedTo;
      task.updatedAt = new Date();
      this.tasks.set(id, task);
    }
  }

  // Notes
  async getAllGlobalNotes(): Promise<GlobalNote[]> {
    return Array.from(this.globalNotes.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createGlobalNote(insertNote: InsertGlobalNote): Promise<GlobalNote> {
    const id = randomUUID();
    const now = new Date();
    const note: GlobalNote = {
      id,
      content: insertNote.content,
      author: insertNote.author,
      createdAt: now,
      updatedAt: now,
      updatedBy: insertNote.author,
    };
    this.globalNotes.set(id, note);
    return note;
  }

  async updateGlobalNote(id: string, content: string, updatedBy: string): Promise<void> {
    const note = this.globalNotes.get(id);
    if (note) {
      note.content = content;
      note.updatedAt = new Date();
      note.updatedBy = updatedBy;
      this.globalNotes.set(id, note);
    }
  }

  async getUserNotes(userId: string): Promise<UserNote[]> {
    return Array.from(this.userNotes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createUserNote(insertNote: InsertUserNote): Promise<UserNote> {
    const id = randomUUID();
    const now = new Date();
    const note: UserNote = {
      id,
      userId: insertNote.userId,
      content: insertNote.content,
      createdAt: now,
      updatedAt: now,
    };
    this.userNotes.set(id, note);
    return note;
  }

  async updateUserNote(id: string, content: string): Promise<void> {
    const note = this.userNotes.get(id);
    if (note) {
      note.content = content;
      note.updatedAt = new Date();
      this.userNotes.set(id, note);
    }
  }

  async deleteGlobalNote(id: string): Promise<void> {
    this.globalNotes.delete(id);
  }

  async deleteUserNote(id: string): Promise<void> {
    this.userNotes.delete(id);
  }

  // Audit Logs
  async getAllAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getRecentAuditLogs(limit: number): Promise<AuditLog[]> {
    const all = await this.getAllAuditLogs();
    return all.slice(0, limit);
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      id,
      action: insertLog.action,
      entity: insertLog.entity,
      entityId: insertLog.entityId ?? null,
      details: insertLog.details,
      username: insertLog.username,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
