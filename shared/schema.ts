import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  integer,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isSubscribed: boolean("is_subscribed").default(false),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  preferredCountry: varchar("preferred_country").default("any"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat sessions for tracking active connections
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  partnerId: varchar("partner_id").references(() => users.id),
  status: varchar("status").notNull().default("waiting"), // waiting, connected, ended
  country: varchar("country").default("any"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// User reports for moderation
export const userReports = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  reportedUserId: varchar("reported_user_id").references(() => users.id).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  userId: true,
  country: true,
});

export const insertUserReportSchema = createInsertSchema(userReports).pick({
  reportedUserId: true,
  reason: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;
