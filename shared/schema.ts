import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Ranks in the Sheriff's Office (exact order as specified)
export const RANKS = [
  "Trainee",
  "Deputy Junior",
  "Deputy Sheriff",
  "Deputy Senior",
  "Deputy Sergeant",
  "Chief Deputy",
  "Sheriff"
] as const;

export type Rank = typeof RANKS[number];

// Roles that can delete records
export const DELETE_PERMISSIONS: Rank[] = ["Sheriff", "Chief Deputy", "Deputy Sergeant"];

// Roles that can assign tasks
export const TASK_ASSIGN_PERMISSIONS: Rank[] = ["Sheriff", "Deputy Sheriff", "Deputy Sergeant"];

// Case status options
export const CASE_STATUS = ["offen", "in Bearbeitung", "abgeschlossen"] as const;
export type CaseStatus = typeof CASE_STATUS[number];

// Weapon status options
export const WEAPON_STATUS = ["vergeben", "im Waffenschrank", "verloren gegangen"] as const;
export type WeaponStatus = typeof WEAPON_STATUS[number];

// Task status options
export const TASK_STATUS = ["offen", "in Bearbeitung", "erledigt"] as const;
export type TaskStatus = typeof TASK_STATUS[number];

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  rank: text("rank").notNull().$type<Rank>(),
  mustChangePassword: integer("must_change_password").notNull().default(0), // 0 = false, 1 = true
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Cases table
export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: text("case_number").notNull().unique(),
  personName: text("person_name").notNull(),
  crime: text("crime").notNull(),
  status: text("status").notNull().$type<CaseStatus>(),
  notes: text("notes"),
  photo: text("photo"), // data URL
  characteristics: text("characteristics"),
  handler: text("handler").notNull(), // username of assigned deputy
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaseSchema = createInsertSchema(cases).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

// Jail records table
export const jailRecords = pgTable("jail_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personName: text("person_name").notNull(),
  crime: text("crime").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  startTime: timestamp("start_time").notNull(),
  handler: text("handler").notNull(), // username of deputy
  released: integer("released").notNull().default(0), // 0 = false, 1 = true
  releasedAt: timestamp("released_at"),
});

export const insertJailRecordSchema = createInsertSchema(jailRecords).omit({ 
  id: true, 
  released: true, 
  releasedAt: true 
});
export type InsertJailRecord = z.infer<typeof insertJailRecordSchema>;
export type JailRecord = typeof jailRecords.$inferSelect;

// Fines table
export const fines = pgTable("fines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  violation: text("violation").notNull(),
  amount: integer("amount").notNull(),
  remarks: text("remarks"),
});

export const insertFineSchema = createInsertSchema(fines).omit({ id: true });
export type InsertFine = z.infer<typeof insertFineSchema>;
export type Fine = typeof fines.$inferSelect;

// City laws (single record for all laws)
export const cityLaws = pgTable("city_laws", {
  id: varchar("id").primaryKey().default("singleton"),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by").notNull(),
});

export const insertCityLawsSchema = createInsertSchema(cityLaws).omit({ id: true, updatedAt: true });
export type InsertCityLaws = z.infer<typeof insertCityLawsSchema>;
export type CityLaws = typeof cityLaws.$inferSelect;

// Weapons table
export const weapons = pgTable("weapons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serialNumber: text("serial_number").notNull().unique(),
  weaponType: text("weapon_type").notNull(),
  owner: text("owner").notNull(),
  category: text("category").notNull(), // "Bürgerwaffe" or "Dienstwaffe"
  status: text("status").notNull().$type<WeaponStatus>(),
  statusChangedAt: timestamp("status_changed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by").notNull(),
});

export const insertWeaponSchema = createInsertSchema(weapons).omit({ 
  id: true, 
  statusChangedAt: true, 
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});
export type InsertWeapon = z.infer<typeof insertWeaponSchema>;
export type Weapon = typeof weapons.$inferSelect;

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assignedTo: text("assigned_to").notNull(), // username
  assignedBy: text("assigned_by").notNull(), // username
  status: text("status").notNull().$type<TaskStatus>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Global notes table
export const globalNotes = pgTable("global_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  author: text("author").notNull(), // username
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGlobalNoteSchema = createInsertSchema(globalNotes).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertGlobalNote = z.infer<typeof insertGlobalNoteSchema>;
export type GlobalNote = typeof globalNotes.$inferSelect;

// User notes table (private to each user)
export const userNotes = pgTable("user_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserNoteSchema = createInsertSchema(userNotes).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type UserNote = typeof userNotes.$inferSelect;

// Audit log table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  entity: text("entity").notNull(), // "case", "jail", "weapon", "user", "task", etc.
  entityId: text("entity_id"),
  details: text("details").notNull(),
  username: text("username").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ 
  id: true, 
  timestamp: true 
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Person summary (derived from cases, not stored)
export interface PersonSummary {
  name: string;
  photo?: string;
  characteristics?: string;
  caseCount: number;
  lastCrime?: string;
  lastCaseDate?: Date;
  cases: Case[];
}
