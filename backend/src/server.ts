import express from "express";
import { registerRoutes } from "./routes/index.js";
import { requestLogger, log } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use(requestLogger);

// Register all routes
const server = await registerRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const port = process.env.PORT || 3001;
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  log(`serving on port ${port}`);
});
