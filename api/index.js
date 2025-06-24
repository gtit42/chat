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
(async () => {
  await registerRoutes(app);
  await setupAuth(app);
})();

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;