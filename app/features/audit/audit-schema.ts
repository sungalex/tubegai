/**
 * ============================================
 * Audit Schema - Phase 3.2
 * ============================================
 *
 * Tables:
 * - audit_log: Track all data changes for compliance and debugging
 *
 * Purpose:
 * - Record who changed what and when
 * - Enable audit trail for compliance
 * - Debug data issues
 * - Rollback support
 */

import { uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "../auth/auth-schema";
import { tubegaiSchema } from "../../drizzle/schema-def";

// ============================================
// Audit Log Table
// ============================================

export const auditLogs = tubegaiSchema.table(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // User who performed the action
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    // Action details
    action: text("action").notNull(), // "create", "update", "delete"
    entityType: text("entity_type").notNull(), // "project", "script", "storyboard", etc.
    entityId: uuid("entity_id").notNull(),

    // Change details (JSON string)
    changes: text("changes"), // JSON object with before/after values

    // Request metadata
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Timestamp
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Performance indexes
    userIdx: index("idx_audit_user").on(table.userId),
    entityIdx: index("idx_audit_entity").on(table.entityType, table.entityId),
    createdIdx: index("idx_audit_created").on(table.createdAt.desc()),
  })
);

// ============================================
// Relations
// ============================================

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
