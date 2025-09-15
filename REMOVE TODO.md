# Remove TODO

The following files appear unused and can be removed after verification:

- backend/src/middlewares/auth.ts
  - Reason: `requireAuth` is not imported/used by any route or server middleware.
- backend/src/utils/index.ts
  - Reason: Barrel re-export not imported anywhere; modules import helpers/validation directly.
- backend/src/utils/validation.ts
  - Reason: No imports found; utilities not referenced.
- backend/src/controllers/UploadController.ts
  - Reason: Upload routes use middleware inline; controller not imported.

Notes
- Frontend: no clearly unused TS/TSX files detected under frontend/src (all pages/components referenced by App.tsx or other modules).
- Before deletion, run typecheck/build and search again to confirm no dynamic usage.
