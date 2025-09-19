Record Access — Implementation guide

Overview
- Purpose: reusable "Record Access" panel used in Add Lead and other create/edit flows. Provides Region, Branch, Counsellor and Admission Officer controls with role- and branch-aware behavior.
- Location of the canonical implementation: frontend/src/components/add-lead-form.tsx (Record Access Card)

UI structure
- A Card with CardHeader / CardTitle "Record Access" and CardContent with a responsive grid.
- Grid layout changed to two dropdowns per row: classes used: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4".
- Fields (React Hook Form controlled):
  - regionId (SearchableSelectV2)
  - branchId (SearchableComboboxV3)
  - counsellorId (SearchableComboboxV3)
  - admissionOfficerId (SearchableComboboxV3)

Components & primitives used
- Form: react-hook-form with zodResolver for validation (form = useForm<AddLeadFormData>).
- UI primitives: Card, CardContent, CardHeader, CardTitle (components/ui/card.tsx), FormField/FormControl/FormItem/FormLabel/FormMessage (components/ui/form), SearchableSelectV2, SearchableComboboxV3 (components/ui/*), Button, Input, Textarea, RadioGroup etc.
- react-query (useQuery) to fetch dropdowns and lists; useMutation for createLead.

State & helpers
- normalizeRole(r) — normalizes role strings for comparison (lowercase, spaces -> underscores).
- State flags introduced:
  - autoRegionDisabled: boolean — true when region was auto-resolved (JWT or user) and should be disabled.
  - autoBranchDisabled: boolean — true when branch was auto-resolved from JWT and should be disabled.
- Form field watchers used: form.watch('regionId'), form.watch('branchId') to drive dependent behavior.

Data fetching (react-query) and query keys
- Dropdowns (module):
  - queryKey: ['/api/dropdowns/module/Leads']
  - service: DropdownsService.getModuleDropdowns('Leads')
  - Used to map display labels (Status, Source, Type) to keys.
- Regions list:
  - queryKey: ['/api/regions']
  - service: RegionsService.listRegions()
  - Expected: Region[] with { id, regionName, regionHeadId }
- Branches list:
  - queryKey: ['/api/branches']
  - service: BranchesService.listBranches()
  - Expected: Branch[] with { id, branchName, regionId }
- Branch employees (mapping table):
  - queryKey: ['/api/branch-emps']
  - service: BranchEmpsService.listBranchEmps()
  - Expected: BranchEmp[] with { id, branchId, userId }
- Users list (for counsellors/officers):
  - queryKey: ['/api/users']
  - service: UsersService.getUsers()
  - Expected: User[] with { id, firstName, lastName, email, role or role_name }

API contracts and expectations
- /api/regions -> array of region objects: { id, regionName, regionHeadId }
- /api/branches -> array of branch objects: { id, branchName, regionId }
- /api/branch-emps -> array of branch-employee links: { id, branchId, userId }
- /api/users -> array of users: { id, firstName, lastName, email, role or role_name }
- /api/dropdowns/module/Leads -> object mapping group names to arrays: { Status: [...], Source: [...], Type: [...], ... }
- POST /api/leads (create) expects payload matching InsertLead schema (see backend/shared/schema.ts), returns created lead object. createLeadMutation uses LeadsService.createLead.

Behavior rules implemented
- Region auto-selection
  - On form mount, we attempt to decode JWT from localStorage key 'auth_token'. We parse payload.role_details.region_id and branch_id if present.
  - If token provides region_id/branch_id, the form sets them and sets autoRegionDisabled/autoBranchDisabled to true so the user cannot change them. Branch is cleared if token doesn't provide it.
  - If token doesn't provide values, fall back to user context: useAuth() value (user.regionId or user.region_id), or find region where user is regionHead, or derive region from user's branch link.
- Branch options filtering
  - branchOptions are derived from branchesList and filtered by selectedRegionId: only branches with branch.regionId === regionId are shown.
- Counsellor & Admission Officer options
  - Both are populated only when a branch is selected. We filter usersList by role (normalizeRole) and by branch linkage via branchEmps.
  - If selectedBranchId is empty, options are empty and no preselection occurs.
  - When a branch is selected, the combobox shows "please select" placeholder and opens to display the branch-linked users.
- Disabled logic
  - When regionId or branchId are auto-set from JWT/user, those fields are disabled using the disabled prop on SearchableSelect/SearchableCombobox.
  - If the user manually changes region/branch from the UI (onValueChange), we clear the auto-disabled flags (allowing edits thereafter).

Key implementation notes & gotchas
- JWT decoding: the code decodes the second JWT segment (payload) using atob; it does not verify signature (client-side only). If your auth uses cookie-based session tokens, adapt to read token from cookie or the appropriate localStorage key.
- Roles: backend may return role names in multiple shapes (role, role_name, roleName); code checks all three fields and normalizes values. Accepts both "counselor" and "counsellor" spelling variations.
- Display format: Combobox options for counsellor and admission officer use the user's full name as the primary label (firstName + lastName or full_name) and show the email as a subtitle beneath the name. The option object sets both `label` and `subtitle`/`email` for consistent rendering in SearchableComboboxV3.
- Do NOT auto-populate counsellor/admission officer unless branch is selected. Previously there was logic to auto-fill; this was removed due to UX correctness.
- The combobox components accept a disabled prop; ensure any other screens reuse the same components or pass equivalent props.
- When implementing the panel across multiple screens, reuse the following building blocks:
  - regionOptions builder (map regionsList -> { label, value })
  - branchOptions builder (filter branchesList by regionId)
  - user-role filters (filter usersList by normalized role)
  - branch_emps lookup (filter branchEmps by branchId then map to users)

How to reuse on other screens
1. Import these services and hooks: RegionsService, BranchesService, BranchEmpsService, UsersService, useAuth, useQuery from react-query.
2. Copy the Record Access markup (Card with FormFields) and wire it into your form using react-hook-form (matching field names: regionId, branchId, counsellorId, admissionOfficerId).
3. Use the same query keys so the app caching is consistent (['/api/regions'], ['/api/branches'], ['/api/branch-emps'], ['/api/users']).
4. Reuse the auto-select JWT logic only where appropriate (admin/regional flows); be mindful of security/verification needs.
5. Provide disabled behavior: pass disabled={autoRegionDisabled} / disabled={autoBranchDisabled} to the dropdown components and clear flags on manual change.

Example snippets
- regionOptions: regionsList.map(r => ({ label: r.regionName || r.name, value: r.id }))
- branchOptions: branchesList.filter(b => String(b.regionId) === String(selectedRegionId)).map(b => ({ label: b.branchName || b.name, value: b.id }))
- counselor options: usersList.filter(u => normalizeRole(u.role) in ['counselor','counsellor'] && branchEmps.some(be => be.branchId===selectedBranchId && be.userId===u.id))

Testing checklist
- Case: Regional Manager JWT contains region_id only -> Region auto-selected and disabled; branch unset & enabled; counsellor/admission empty until branch selected.
- Case: JWT contains both region_id and branch_id -> both pre-selected and disabled; counsellor/admission empty until branch selected (or you can optionally auto-select when exactly one matching user exists).
- Case: No JWT -> fallback to useAuth() and existing user mapping (regionHead mapping, branchHead mapping).
- Case: Branch changes -> counsellor/admission fields clear and options refresh for selected branch.

Potential improvements / next steps
- Centralize the Record Access into a small reusable component (e.g., components/record-access/RecordAccessPanel.tsx) that accepts props: form, autoSelectFromToken:boolean, lockOnAuto:boolean. This reduces duplication across screens.
- Provide an API endpoint that directly returns branch employees enriched with user data for a branch: GET /api/branches/:id/employees -> [{ userId, id, firstName, lastName, role_name, email }]. That saves client-side joins and reduces data transfer.
- Add unit/integration tests for the panel behaviors (disabled flags, options filtering, JWT fallback).

Where to look in the codebase for my changes
- frontend/src/components/add-lead-form.tsx (primary implementation)
- frontend/src/components/ui/searchable-select-v2.tsx (select UI)
- frontend/src/components/ui/searchable-combobox-v3.tsx (combobox UI)
- frontend/src/services/regions.ts, frontend/src/services/branches.ts, frontend/src/services/branchEmps.ts, frontend/src/services/users.ts, frontend/src/services/dropdowns.ts

If you want I can:
- Extract the panel into a reusable component and open a draft PR for review.
- Create a backend endpoint GET /api/branches/:id/employees and update frontend to use it.

