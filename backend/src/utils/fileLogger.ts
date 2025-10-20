import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Format date as DDMMYY for log filename
 */
function formatDateForFilename(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

/**
 * Get the log file path for a user
 */
function getLogFilePath(userId: string): string {
  const dateStr = formatDateForFilename(new Date());
  const filename = `Logs-${dateStr}-${userId}.log`;
  return path.join(LOGS_DIR, filename);
}

/**
 * Write a message to the user's log file
 */
export function writeLog(userId: string | undefined, message: string): void {
  if (!userId) return;

  try {
    const filePath = getLogFilePath(userId);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    fs.appendFileSync(filePath, logEntry, 'utf-8');
  } catch (error) {
    console.error(`Failed to write log for user ${userId}:`, error);
  }
}

/**
 * Log API request start
 */
export function logApiStart(userId: string | undefined, apiName: string, method: string, path: string): void {
  if (!userId) return;
  const message = `START OF API - [${apiName}] ${method} ${path}`;
  writeLog(userId, message);
}

/**
 * Log API request details
 */
export function logApiRequest(userId: string | undefined, method: string, path: string, query: Record<string, any>, body: Record<string, any>): void {
  if (!userId) return;
  
  const queryStr = Object.keys(query).length > 0 ? JSON.stringify(query) : 'none';
  const bodyStr = Object.keys(body).length > 0 ? JSON.stringify(body) : 'none';
  
  const message = `REQUEST - Method: ${method}, Path: ${path}, Query: ${queryStr}, Body: ${bodyStr}`;
  writeLog(userId, message);
}

/**
 * Log API response
 */
export function logApiResponse(userId: string | undefined, statusCode: number, responseBody: any): void {
  if (!userId) return;
  
  const bodyStr = responseBody ? JSON.stringify(responseBody) : 'none';
  const message = `RESPONSE - Status: ${statusCode}, Body: ${bodyStr}`;
  writeLog(userId, message);
}

/**
 * Log API end
 */
export function logApiEnd(userId: string | undefined, apiName: string): void {
  if (!userId) return;
  const message = `END OF API - [${apiName}]`;
  writeLog(userId, message);
}

/**
 * Log API error
 */
export function logApiError(userId: string | undefined, apiName: string, error: any): void {
  if (!userId) return;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  const message = `ERROR - [${apiName}] ${errorMessage}${errorStack ? '\n' + errorStack : ''}`;
  writeLog(userId, message);
}
