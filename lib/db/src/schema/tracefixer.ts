import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    uniqueIndex("users_email_unique").on(table.email),
  ],
);

export const debugSessionsTable = pgTable(
  "debug_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    language: varchar("language", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    codeSnippet: text("code_snippet").notNull(),
    errorLog: text("error_log").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("debug_sessions_user_created_idx").on(table.userId, table.createdAt),
    index("debug_sessions_user_status_idx").on(table.userId, table.status),
  ],
);

export const aiDiagnosesTable = pgTable(
  "ai_diagnoses",
  {
    id: serial("id").primaryKey(),
    debugSessionId: integer("debug_session_id")
      .notNull()
      .references(() => debugSessionsTable.id, { onDelete: "cascade" }),
    rootCause: text("root_cause").notNull(),
    severity: varchar("severity", { length: 20 }).notNull(),
    category: varchar("category", { length: 30 }).notNull(),
    stepByStepFix: jsonb("step_by_step_fix").$type<string[]>().notNull(),
    correctedCode: text("corrected_code").notNull(),
    preventionTips: text("prevention_tips").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ai_diagnoses_session_unique").on(table.debugSessionId)],
);

export const sessionMessagesTable = pgTable(
  "session_messages",
  {
    id: serial("id").primaryKey(),
    debugSessionId: integer("debug_session_id")
      .notNull()
      .references(() => debugSessionsTable.id, { onDelete: "cascade" }),
    sender: varchar("sender", { length: 20 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("session_messages_session_created_idx").on(table.debugSessionId, table.createdAt)],
);

export const usersRelations = relations(usersTable, ({ many }) => ({
  debugSessions: many(debugSessionsTable),
}));

export const debugSessionsRelations = relations(debugSessionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [debugSessionsTable.userId],
    references: [usersTable.id],
  }),
  diagnosis: one(aiDiagnosesTable),
  messages: many(sessionMessagesTable),
}));

export const aiDiagnosesRelations = relations(aiDiagnosesTable, ({ one }) => ({
  debugSession: one(debugSessionsTable, {
    fields: [aiDiagnosesTable.debugSessionId],
    references: [debugSessionsTable.id],
  }),
}));

export const sessionMessagesRelations = relations(sessionMessagesTable, ({ one }) => ({
  debugSession: one(debugSessionsTable, {
    fields: [sessionMessagesTable.debugSessionId],
    references: [debugSessionsTable.id],
  }),
}));

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export const insertDebugSessionSchema = createInsertSchema(debugSessionsTable).omit({
  id: true,
  createdAt: true,
});
export const insertDiagnosisSchema = createInsertSchema(aiDiagnosesTable).omit({
  id: true,
  createdAt: true,
});
export const insertSessionMessageSchema = createInsertSchema(sessionMessagesTable).omit({
  id: true,
  createdAt: true,
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DebugSession = typeof debugSessionsTable.$inferSelect;
export type InsertDebugSession = z.infer<typeof insertDebugSessionSchema>;
export type Diagnosis = typeof aiDiagnosesTable.$inferSelect;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type SessionMessage = typeof sessionMessagesTable.$inferSelect;
export type InsertSessionMessage = z.infer<typeof insertSessionMessageSchema>;
