import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertChatSessionSchema, insertUserReportSchema, updateUserPermissionsSchema } from "@shared/schema";
import { matchingSystem } from "./matchingSystem";
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

  // Auth routes - allow unauthenticated access to check auth status
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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

  // Admin middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      req.adminUser = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking admin status" });
    }
  };

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const users = await storage.getAllUsers(parseInt(limit), parseInt(offset));
      res.json(users);
    } catch (error: any) {
      console.error('Admin users error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/admin/users/permissions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const permissions = updateUserPermissionsSchema.parse(req.body);
      const updatedUser = await storage.updateUserPermissions(permissions);
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Admin permissions error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/chat-sessions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const sessions = await storage.getAllActiveChatSessions();
      res.json(sessions);
    } catch (error: any) {
      console.error('Admin chat sessions error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/reports', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const reports = await storage.getUserReports(parseInt(limit), parseInt(offset));
      res.json(reports);
    } catch (error: any) {
      console.error('Admin reports error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced admin routes
  app.post('/api/admin/ban-user', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, reason, duration } = req.body;
      const adminId = req.user.claims.sub;
      
      await storage.banUser({ userId, reason, duration }, adminId);
      res.json({ success: true, message: 'User banned successfully' });
    } catch (error: any) {
      console.error('Ban user error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/unban-user', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const adminId = req.user.claims.sub;
      
      await storage.unbanUser(userId, adminId);
      res.json({ success: true, message: 'User unbanned successfully' });
    } catch (error: any) {
      console.error('Unban user error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/actions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const actions = await storage.getAdminActions(parseInt(limit), parseInt(offset));
      res.json(actions);
    } catch (error: any) {
      console.error('Admin actions error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/review-report', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { reportId, status, adminAction } = req.body;
      const adminId = req.user.claims.sub;
      
      await storage.updateReportStatus(reportId, status, adminAction, adminId);
      res.json({ success: true, message: 'Report reviewed successfully' });
    } catch (error: any) {
      console.error('Review report error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/server-stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const activeChatSessions = await storage.getAllActiveChatSessions();
      const serverPools = await storage.getServerPools();
      
      // Import matching system to get queue stats
      const { matchingSystem } = await import('./matchingSystem');
      const queueStats = matchingSystem.getQueueStats();
      
      res.json({
        totalUsers: users.length,
        activeChats: activeChatSessions.length,
        queueStats,
        serverPools,
      });
    } catch (error: any) {
      console.error('Server stats error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/server-pools', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { region, countries, capacity } = req.body;
      const pool = await storage.createServerPool({ region, countries, capacity });
      res.json(pool);
    } catch (error: any) {
      console.error('Create server pool error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Online users count route
  app.get('/api/stats/online-users', async (req, res) => {
    try {
      const onlineCount = connectedUsers.size;
      res.json({ count: onlineCount });
    } catch (error: any) {
      console.error('Online users count error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin monitoring route - join any active chat session
  app.post('/api/admin/monitor-session', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      const adminUserId = req.user.claims.sub;
      
      // Notify users in the session that admin is monitoring
      const adminWs = connectedUsers.get(adminUserId);
      if (adminWs && adminWs.readyState === WebSocket.OPEN) {
        adminWs.send(JSON.stringify({
          type: 'admin_monitor',
          sessionId,
          message: 'Admin monitoring enabled for this session'
        }));
      }
      
      res.json({ success: true, message: 'Monitoring session' });
    } catch (error: any) {
      console.error('Admin monitor error:', error);
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
