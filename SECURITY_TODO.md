# Security Hardening To‑Do

This checklist captures concrete actions to secure the application. Each item references exact files to change.

## Immediate (High Priority)
- [ ] Remove hardcoded DB credentials and require env var at boot
  - File: backend/src/config/database.ts
  - Actions: Fail fast if `process.env.DATABASE_URL` is missing; do not fallback to a literal connection string; use secrets manager in prod.
- [ ] Use strong JWT secret via env and eliminate insecure default
  - File: backend/src/utils/jwt.ts
  - Actions: Require `JWT_SECRET` (no default), rotate in prod, shorten expiry as needed.
- [ ] Enforce authentication and role-based authorization on sensitive routes
  - Files: backend/src/routes/{userRoutes.ts,branchRoutes.ts,configurationRoutes.ts,uploadRoutes.ts,activityRoutes.ts}
  - Actions: Add `requireAuth` middleware (backend/src/middlewares/auth.ts) and per-route RBAC (e.g., admin-only for user/configuration/branches); validate request bodies with zod.
- [ ] Add server-side logout endpoint and clear cookie
  - Files: backend/src/routes/authRoutes.ts, backend/src/controllers/AuthController.ts
  - Actions: Implement `POST /api/auth/logout` that clears `access_token` cookie; call from frontend on manual logout.
- [ ] Add brute-force protection and rate limiting
  - Files: backend/src/server.ts (middleware setup)
  - Actions: Apply express-rate-limit to `/api/auth/login` and globally; consider account lockout/backoff on repeated failures.
- [ ] Security headers and CORS
  - Files: backend/src/server.ts
  - Actions: Use `helmet` (CSP, HSTS, noSniff, frameguard); restrict CORS origins and methods; disable x-powered-by.
- [ ] CSRF protection for cookie-based auth
  - Files: backend/src/server.ts, backend/src/controllers/AuthController.ts
  - Actions: Prefer SameSite=Strict on `access_token`; if cross-site needed, implement CSRF tokens (double-submit or header-based with same-origin checks) or switch to Authorization header auth.
- [ ] Lock down configuration endpoints and SMTP test
  - Files: backend/src/routes/configurationRoutes.ts, backend/src/controllers/ConfigurationController.ts
  - Actions: Require admin role; strict zod validation; rate-limit SMTP test; prevent leaking secrets in responses.
- [ ] Secure file uploads and static serving
  - Files: backend/src/middlewares/upload.ts, backend/src/routes/uploadRoutes.ts, backend/src/routes/index.ts
  - Actions: Require auth for uploads (unless intentionally public); verify file type with content sniffing (not just mimetype); keep size limits; store outside web root or use randomized paths; consider AV scanning; restrict `/uploads` exposure or serve via signed URLs.
- [ ] Protect user management endpoints
  - Files: backend/src/routes/userRoutes.ts, backend/src/controllers/UserController.ts
  - Actions: Admin-only; avoid exposing PII; add input validation and error handling without leaking internals.
- [ ] Harden cookie settings
  - Files: backend/src/controllers/AuthController.ts
  - Actions: Set `secure: true` in prod, `sameSite: 'strict'` (if viable), short maxAge; consider `__Host-` prefix for cookies on HTTPS.

## Near Term (Medium Priority)
- [ ] Frontend session UX
  - Files: frontend/src/services/http.ts, frontend/src/contexts/AuthContext.tsx
  - Actions: Show “Session expired” toast on auto-logout; redirect to login; consider silent refresh if refresh tokens are added.
- [ ] CSP and inline code review
  - Files: backend/src/server.ts, frontend/src/components/ui/chart.tsx
  - Actions: Add CSP; eliminate or hash-allow `dangerouslySetInnerHTML` usage; avoid inline scripts/styles where possible.
- [ ] Comprehensive input validation
  - Files: All controllers under backend/src/controllers
  - Actions: Apply zod schemas for every endpoint’s params/body/query; centralize validation errors.
- [ ] Secret management and rotation
  - Files: deployment configuration
  - Actions: Move secrets to env/secret store; rotate DB/JWT secrets; remove any committed secrets.
- [ ] Audit logging and monitoring
  - Files: backend/src/middlewares/logger.ts, new audit module
  - Actions: Log auth events (login success/fail, password updates, role changes); integrate Sentry for error monitoring.

## Optional/Architectural
- [ ] Token strategy improvements
  - Actions: Consider short-lived access token + refresh token rotation with revocation list; store refresh token as httpOnly, sameSite=strict.
- [ ] Data minimization
  - Actions: Return only necessary fields in responses; scrub sensitive data from logs.

## Verification Checklist
- [ ] Automated security tests (rate-limit, auth required, RBAC, CSRF)
- [ ] DAST scan in CI and dependency vulnerability scans
- [ ] Manual pen-test of uploads, auth flows, and config endpoints

## Notes (Current Findings)
- Hardcoded DB URL present: backend/src/config/database.ts
- Insecure default JWT secret: backend/src/utils/jwt.ts
- Many routes lack `requireAuth`/RBAC: backend/src/routes/*.ts
- Unauthenticated uploads and broad mimetypes: backend/src/routes/uploadRoutes.ts, backend/src/middlewares/upload.ts
- No helmet/CORS/CSRF configured: backend/src/server.ts
- Frontend stores auth state in localStorage (XSS risk): frontend/src/contexts/AuthContext.tsx; httpOnly cookie used for API auth.
