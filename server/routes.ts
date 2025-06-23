import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertChatSessionSchema, insertUserReportSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

// WebSocket connection management
const connectedUsers = new Map<string, WebSocket>();
const userSessions = new Map<string, number>(); // userId -> sessionId

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      }

      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'usd',
            unit_amount: 300, // $3.00
            product: 'ChatConnect Premium',
            recurring: {
              interval: 'month',
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Chat session routes
  app.post('/api/chat/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChatSessionSchema.parse({
        userId,
        country: req.body.country || "any"
      });
      const { country } = validatedData;

      // End any existing sessions for this user
      const activeSessions = await storage.getUserActiveSessions(userId);
      for (const session of activeSessions) {
        await storage.endChatSession(session.id);
      }

      // Create new session
      const session = await storage.createChatSession({
        userId,
        country,
      });

      userSessions.set(userId, session.id);

      // Try to find a waiting user
      const waitingUser = await storage.findWaitingUser(country, userId);
      if (waitingUser?.userId) {
        await storage.updateChatSessionPartner(waitingUser.id, userId);
        await storage.updateChatSessionPartner(session.id, waitingUser.userId);
        
        // Notify both users via WebSocket
        const partnerWs = connectedUsers.get(waitingUser.userId);
        const userWs = connectedUsers.get(userId);
        
        if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
          partnerWs.send(JSON.stringify({
            type: 'match_found',
            partnerId: userId,
            sessionId: waitingUser.id,
          }));
        }
        
        if (userWs && userWs.readyState === WebSocket.OPEN) {
          userWs.send(JSON.stringify({
            type: 'match_found',
            partnerId: waitingUser.userId,
            sessionId: session.id,
          }));
        }
      }

      res.json(session);
    } catch (error: any) {
      console.error('Chat start error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/chat/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = userSessions.get(userId);
      
      if (sessionId) {
        await storage.endChatSession(sessionId);
        userSessions.delete(userId);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Chat end error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/users/report', isAuthenticated, async (req: any, res) => {
    try {
      const reporterId = req.user.claims.sub;
      const report = insertUserReportSchema.parse(req.body);

      await storage.createUserReport(reporterId, report);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Report error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time signaling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId: string | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'auth':
            if (data.userId && typeof data.userId === 'string') {
              userId = data.userId;
              connectedUsers.set(userId, ws);
            }
            break;
            
          case 'webrtc_offer':
          case 'webrtc_answer':
          case 'webrtc_candidate':
            if (data.targetUserId && typeof data.targetUserId === 'string') {
              const targetWs = connectedUsers.get(data.targetUserId);
              if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({
                  ...data,
                  fromUserId: userId,
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        connectedUsers.delete(userId);
        userSessions.delete(userId);
      }
    });
  });

  return httpServer;
}
