import express from "express";
import { registerRoutes } from "../server/routes.js";
import { setupAuth } from "../server/replitAuth.js";
import cors from "cors";

const app = express();

// CORS configuration for Vercel
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://chatconnect-vercel.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes and auth
let initialized = false;

const initializeApp = async () => {
  if (!initialized) {
    const server = await registerRoutes(app);
    await setupAuth(app);
    initialized = true;
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Vercel serverless function handler
export default async (req, res) => {
  await initializeApp();
  return app(req, res);
};