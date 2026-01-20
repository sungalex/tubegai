import { pgTable, uuid, text, timestamp, pgSchema } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tubegaiSchema } from "../../drizzle/schema-def";

// Define the Supabase 'auth' schema to reference the existing users table
const authSchema = pgSchema("auth");

// Don't Create this table, it already exists
export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  createdAt: timestamp("created_at"),
});

export const profiles = tubegaiSchema.table("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").unique().notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  twitterHandle: text("twitter_handle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
}));
