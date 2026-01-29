/**
 * ============================================
 * DISABLED: Settings Schema (Phase 2+)
 * ============================================
 *
 * All settings tables are disabled for MVP.
 * Tables: settings_subscription, billing_history, settings_notification,
 *         settings_integration, settings_mcp_server
 *
 * Uncomment when Settings feature is enabled.
 */

// import {
//   pgTable,
//   uuid,
//   text,
//   timestamp,
//   boolean,
//   decimal,
// } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm";
// import {
//   subscriptionPlanEnum,
//   subscriptionStatusEnum,
//   billingCycleEnum,
//   paymentStatusEnum,
//   integrationProviderEnum,
//   integrationStatusEnum,
//   mcpStatusEnum,
// } from "../../drizzle/enums";
// import { users } from "../auth/auth-schema";
// import { tubegaiSchema } from "../../drizzle/schema-def";

// export const subscriptions = tubegaiSchema.table("settings_subscription", { ... });
// export const billingHistory = tubegaiSchema.table("billing_history", { ... });
// export const notificationSettings = tubegaiSchema.table("settings_notification", { ... });
// export const integrations = tubegaiSchema.table("settings_integration", { ... });
// export const mcpServers = tubegaiSchema.table("settings_mcp_server", { ... });
