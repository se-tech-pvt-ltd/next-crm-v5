# Reports Revamp - Task Tracker

This file tracks the requested Reports revamp. Each item will be checked when completed.

## General
- [x] Add tabs: Overall Performance, Events, Students, Applications, Admissions, Partners
- [x] Add global filters visible in all tabs: Date Range, Branch, Counsellor
- [x] Add Export Page to PDF option (prints current view)

## Overall
- [x] Metrics: Total Leads, Students, Applications, Admissions (filter-aware)
- [ ] Metrics: Total Interactions (needs backend endpoint to list activities globally)
- [x] Graphs: Leads by Status (filter-aware)
- [x] Graphs: Applications by Status (filter-aware)
- [ ] Performance: Total Interactions (needs backend)
- [ ] Performance: Total Interactions by Branch (needs backend)

## Events
- [x] Specific Filters: Events (uses global filters + event date)
- [x] Metrics: Total Events, Total Registrations, Total Leads, Total Attended
- [x] Graphs: Registrations by Event, Conversions by Event

## Leads
- [x] Specific Filters: (uses global filters)
- [x] Metrics: Total Leads, Total Active Leads, Total Lost Leads
- [x] Graphs: By Status, Branch, Source, Counsellor

## Students
- [x] Specific Filters: (uses global filters)
- [x] Metrics: Total Students, Total Active Students
- [x] Graphs: By Status, Branch, Source, Counsellor

## Applications
- [x] Specific Filters: (uses global filters)
- [x] Metrics: Total Applications
- [x] Graphs: Applications by Status, Source, Branch, Intake, Country, University, Counsellor

## Admissions
- [x] Specific Filters: (uses global filters)
- [x] Metrics: Total Admissions, Total Deposits, Total Visa
- [x] Graphs: By Status, Branch, Source, Intake, Country, University, Counsellor

## Notes / Follow-ups
- Total Interactions metrics require a backend API to fetch activities across all entities. Recommend adding `/api/activities/summary` or `/api/activities?from&to&branchId&counsellorId`.
- Export uses browser print to PDF for reliability without extra dependencies.
