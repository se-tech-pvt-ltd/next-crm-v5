Modal Migration — Remaining Work

Overview

We introduced a ModalManager to centralize modal transitions and avoid unmount/race issues when one modal closes and another opens. The goal now is to finish migrating remaining modals/pages, run smoke tests for key flows, and document the approach.

Current status (from task tracker)

- Completed
  - Migrate StudentProfileModal / StudentProfileModalNew to use ModalManager.openModal for transitions

- In progress
  - Update pages (students, applications, admissions, leads, events, header, user-menu) to open modals via ModalManager and render modal placeholders at page level
  - Migrate AddApplicationModal and ApplicationDetailsModal to use ModalManager consistently

- Pending
  - Migrate AddAdmissionModal and other admission-related modals
  - Run smoke tests for common flows and fix runtime/import issues
  - Document modal manager usage and add a short developer guide (DEV_NOTE)

Remaining tasks — plan and steps

1) Finish migrating admission-related modals (priority)
   - Files to update
     - frontend/src/components/add-admission-modal.tsx
     - frontend/src/components/admission-details-modal-new.tsx (if present)
     - frontend/src/pages/add-admission.tsx
     - frontend/src/pages/admission-details.tsx (already partially updated)
   - What to change
     - Replace any pattern that closes a modal then calls setTimeout to open another modal with ModalManager.openModal(() => openFn()) so the manager closes all registered modals first then runs openFn.
     - Use the shared helper openStudentProfile(studentId, navigateFn) when opening student profiles from pages or modals.
   - Tests/verification
     - /admissions modal flows: open admission modal → click student → profile opens; open application from admission → application details open; add admission → application list updates.

2) Migrate remaining pages to call ModalManager instead of ad‑hoc reopening
   - Files to update (representative)
     - frontend/src/pages/events.tsx
     - frontend/src/pages/leads.tsx
     - frontend/src/pages/applications.tsx (mostly done)
     - frontend/src/pages/students.tsx (mostly wired)
     - frontend/src/components/header.tsx
     - frontend/src/components/user-menu.tsx
   - What to change
     - Where pages or components currently set local modal state then rely on children to reopen others, switch to calling useModalManager().openModal(() => openPageModalFn()) or use the openStudentProfile helper.
     - Ensure pages render the modal placeholders (e.g., <StudentProfileModal/>, <AddApplicationModal/>, etc.) with controlled open state so the ModalManager close/open sequence works.
   - Tests/verification
     - For each page, exercise the flows previously failing: open modal A → click link to open modal B → modal B mounts; add new record → count updates without full refresh.

3) Global fallbacks and shared helpers
   - Ensure openStudentProfile helper is available and used from any place that previously dispatched custom events or called setLocation directly.
   - Ensure Dialog (ui/dialog.tsx) registers/unregisters with ModalManager to allow manager to close open dialogs.

4) Smoke tests and fixes
   - Run manual smoke checks (or automated if test harness exists) covering flows:
     - Students list → View profile → Add application → Student profile reopened with updated application count
     - Applications list → View details → Click student → Student profile opens; from profile click application → application details open
     - Admissions flows and lead conversion flows
   - Fix any import/ReferenceError occurrences by adding missing imports and passing handlers (onOpenStudentProfile/onOpenAddApplication) to page-level components.

5) Finalize and document
   - Add a short DEV_NOTE describing ModalManager usage patterns, examples, and rules:
     - Always call ModalManager.openModal(fn) when transitioning between modals
     - Prefer page-level modal mounts (pages/components render modal placeholders)
     - Use openStudentProfile helper for consistent behavior & fallback
   - Commit and push changes as atomic logical commits (grouped by feature/page), and request a review or run test pipeline.

Rollout and risk mitigation

- Roll out incrementally by migrating one functional area at a time (students → applications → admissions → leads → events/header). This narrows regression scope and eases debugging.
- Keep legacy fallback behavior (CustomEvent and setLocation) until all callers migrated; remove fallback after full migration and verification.

Estimated effort

- Finish modal migrations (remaining pages & modals): 1–2 working days (depending on manual smoke testing).
- Final documentation and cleanup: 2–4 hours.

If you want, I will now continue and complete the remaining migrations in the repository (I will:
- finish admission-related modal migrations,
- update events/leads/header modals,
- run quick smoke checks on the key flows,
- fix any runtime errors,
- add DEV_NOTE) and push changes incrementally. Proceed? (You already told me to continue; I will proceed.)

test