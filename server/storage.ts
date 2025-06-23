import {
  users,
  chatSessions,
  userReports,
  type User,
  type UpsertUser,
  type ChatSession,
  type InsertChatSession,
  type InsertUserReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  updateUserSubscription(userId: string, isSubscribed: boolean, expiresAt?: Date): Promise<User>;
  
  // Chat session operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  findWaitingUser(country: string, excludeUserId: string): Promise<ChatSession | undefined>;
  updateChatSessionPartner(sessionId: number, partnerId: string): Promise<ChatSession>;
  endChatSession(sessionId: number): Promise<void>;
  getUserActiveSessions(userId: string): Promise<ChatSession[]>;
  
  // Report operations
  createUserReport(reporterId: string, report: InsertUserReport): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, isSubscribed: boolean, expiresAt?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isSubscribed,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [chatSession] = await db
      .insert(chatSessions)
      .values(session)
      .returning();
    return chatSession;
  }

  async findWaitingUser(country: string, excludeUserId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.status, "waiting"),
          isNull(chatSessions.partnerId),
          country === "any" ? undefined : eq(chatSessions.country, country)
        )
      )
      .limit(1);
    return session;
  }

  async updateChatSessionPartner(sessionId: number, partnerId: string): Promise<ChatSession> {
    const [session] = await db
      .update(chatSessions)
      .set({
        partnerId,
        status: "connected",
      })
      .where(eq(chatSessions.id, sessionId))
      .returning();
    return session;
  }

  async endChatSession(sessionId: number): Promise<void> {
    await db
      .update(chatSessions)
      .set({
        status: "ended",
        endedAt: new Date(),
      })
      .where(eq(chatSessions.id, sessionId));
  }

  async getUserActiveSessions(userId: string): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.userId, userId),
          eq(chatSessions.status, "connected")
        )
      );
  }

  async createUserReport(reporterId: string, report: InsertUserReport): Promise<void> {
    await db
      .insert(userReports)
      .values({
        reporterId,
        ...report,
      });
  }
}

export const storage = new DatabaseStorage();
