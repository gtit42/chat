const express = require("express");
const { registerRoutes } = require("../server/routes");
const { setupAuth } = require("../server/replitAuth");
const cors = require("cors");

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
  setupAuth(app);
})();

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

module.exports = app;