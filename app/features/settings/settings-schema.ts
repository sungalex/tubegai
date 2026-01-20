import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  subscriptionPlanEnum,
  subscriptionStatusEnum,
  billingCycleEnum,
  paymentStatusEnum,
  integrationProviderEnum,
  integrationStatusEnum,
  mcpStatusEnum,
} from "../../drizzle/enums";
import { users } from "../auth/auth-schema";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  plan: subscriptionPlanEnum("plan").default("free").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  price: decimal("price"),
  billingCycle: billingCycleEnum("billing_cycle"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const billingHistory = pgTable("billing_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  invoiceId: text("invoice_id").unique().notNull(),
  amount: decimal("amount").notNull(),
  currency: text("currency").default("USD"),
  status: paymentStatusEnum("status").default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const billingHistoryRelations = relations(billingHistory, ({ one }) => ({
  user: one(users, {
    fields: [billingHistory.userId],
    references: [users.id],
  }),
}));

export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  emailMarketing: boolean("email_marketing").default(false),
  emailProjectUpdates: boolean("email_project_updates").default(true),
  emailSecurity: boolean("email_security").default(true),
  pushEverything: boolean("push_everything").default(false),
  pushComments: boolean("push_comments").default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationSettingsRelations = relations(
  notificationSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationSettings.id],
      references: [users.id],
    }),
  }),
);

export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  provider: integrationProviderEnum("provider").notNull(),
  status: integrationStatusEnum("status").default("inactive"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accountName: text("account_name"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  endpointUrl: text("endpoint_url").notNull(),
  accessToken: text("access_token"),
  status: mcpStatusEnum("status").default("disconnected"),
  lastConnectedAt: timestamp("last_connected_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mcpServersRelations = relations(mcpServers, ({ one }) => ({
  user: one(users, {
    fields: [mcpServers.userId],
    references: [users.id],
  }),
}));
