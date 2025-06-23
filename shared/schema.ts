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
  isAdmin: boolean("is_admin").default(false),
  canPromoteUsers: boolean("can_promote_users").default(false),
  isBanned: boolean("is_banned").default(false),
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
  status: varchar("status").default("pending"), // pending, reviewed, resolved
  adminAction: text("admin_action"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Server pools for load balancing
export const serverPools = pgTable("server_pools", {
  id: serial("id").primaryKey(),
  region: varchar("region").notNull(),
  countries: text("countries").array(),
  capacity: integer("capacity").default(100),
  currentLoad: integer("current_load").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat rooms for better matching
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code").notNull(),
  region: varchar("region"),
  maxUsers: integer("max_users").default(2),
  currentUsers: integer("current_users").default(0),
  isActive: boolean("is_active").default(true),
  serverId: integer("server_id").references(() => serverPools.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin actions log
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // ban_user, unban_user, promote_user, etc.
  targetUserId: varchar("target_user_id").references(() => users.id),
  targetSessionId: integer("target_session_id").references(() => chatSessions.id),
  details: jsonb("details"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User ban history
export const userBans = pgTable("user_bans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bannedBy: varchar("banned_by").references(() => users.id).notNull(),
  reason: text("reason"),
  duration: integer("duration_hours"), // null for permanent
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
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

export const updateUserPermissionsSchema = z.object({
  userId: z.string(),
  isAdmin: z.boolean().optional(),
  canPromoteUsers: z.boolean().optional(),
  isBanned: z.boolean().optional(),
});

export const insertServerPoolSchema = createInsertSchema(serverPools).pick({
  region: true,
  countries: true,
  capacity: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  countryCode: true,
  region: true,
  maxUsers: true,
  serverId: true,
});

export const insertAdminActionSchema = createInsertSchema(adminActions).pick({
  action: true,
  targetUserId: true,
  targetSessionId: true,
  details: true,
  reason: true,
});

export const insertUserBanSchema = createInsertSchema(userBans).pick({
  userId: true,
  reason: true,
  duration: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ServerPool = typeof serverPools.$inferSelect;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type AdminAction = typeof adminActions.$inferSelect;
export type UserBan = typeof userBans.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;
export type InsertServerPool = z.infer<typeof insertServerPoolSchema>;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type InsertUserBan = z.infer<typeof insertUserBanSchema>;
export type UpdateUserPermissions = z.infer<typeof updateUserPermissionsSchema>;
