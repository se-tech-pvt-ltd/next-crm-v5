import express from "express";
import helmet from "helmet";
import cors, { type CorsOptions } from "cors";
import { registerRoutes } from "./routes/index.js";
import { requestLogger, log } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiLogger, errorLoggerHandler } from "./middlewares/apiLogger.js";

const app = express();

// Expose server start time for diagnostics
process.env.SERVER_STARTED_AT = new Date().toISOString();

// Security hardening
app.disable("x-powered-by");
const isProd = process.env.NODE_ENV === "production";

// Configure allowed CORS origins via env (comma-separated) or FRONTEND_URL. In dev, default to localhost unless FRONTEND_URL provided.
const allowedOriginsFromEnv = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const frontendUrl = (process.env.FRONTEND_URL || '').trim();
const defaultLocalhosts = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set<string>([
  ...(frontendUrl ? [frontendUrl] : []),
  ...allowedOriginsFromEnv,
  ...(isProd ? [] : defaultLocalhosts),
]);

app.use(
  helmet({
    // Content Security Policy: strict in prod, relaxed in dev to work in preview iframes/proxies
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
            imgSrc: ["'self'", "data:"],
            scriptSrc: ["'self'"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", ...Array.from(allowedOrigins)],
          },
        }
      : false,
    // Prevent MIME type sniffing
    noSniff: true,
    // Clickjacking protection (disable in dev to allow preview iframe)
    frameguard: isProd ? { action: "deny" } : false,
    // HSTS only in production
    hsts: isProd
      ? { maxAge: 15552000, includeSubDomains: true, preload: false }
      : false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration: allow same-origin (no Origin header) and restrict to allowlist in prod
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin (same-origin, server-to-server, health checks)
    if (!origin) return callback(null, true);
    // In development, allow any origin to support local proxies/preview iframes
    if (!isProd) return callback(null, true);
    // In production, restrict to explicit allowlist
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use(requestLogger);

// API file logging middleware (logs to user-specific log files)
app.use(apiLogger);

// Register all routes
const server = await registerRoutes(app);

// Error logger middleware (before main error handler)
app.use(errorLoggerHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const port = process.env.PORT || 3001;
server.listen(
  {
    port,
    host: "0.0.0.0",
    reusePort: true,
  },
  () => {
    log(`serving on port ${port}`);
  }
);
