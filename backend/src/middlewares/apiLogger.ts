import type { Request, Response, NextFunction } from "express";
import { logApiStart, logApiRequest, logApiResponse, logApiEnd, logApiError } from "../utils/fileLogger.js";

// Helper to extract API name from request path
function extractApiName(path: string): string {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'api') {
    return parts[1];
  }
  return 'unknown';
}

export function apiLogger(req: Request, res: Response, next: NextFunction) {
  // Only log API endpoints
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const userId = (req.user as any)?.id;
  const apiName = extractApiName(req.path);
  const method = req.method;
  const path = req.path;
  const query = req.query;
  const body = req.body || {};

  const start = Date.now();
  let capturedJsonResponse: any = undefined;

  // Log API start
  logApiStart(userId, apiName, method, path);

  // Log request details
  logApiRequest(userId, method, path, query as Record<string, any>, body as Record<string, any>);

  // Intercept json response
  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Handle response completion
  res.on('finish', () => {
    try {
      const statusCode = res.statusCode;
      
      // Log response
      logApiResponse(userId, statusCode, capturedJsonResponse);

      // Log API end
      logApiEnd(userId, apiName);
    } catch (error) {
      logApiError(userId, apiName, error);
    }
  });

  // Handle errors
  res.on('error', (error: any) => {
    logApiError(userId, apiName, error);
  });

  next();
}

// Global error handler to log uncaught errors
export function errorLoggerHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api')) {
    const userId = (req.user as any)?.id;
    const apiName = extractApiName(req.path);
    logApiError(userId, apiName, err);
  }
  next(err);
}
