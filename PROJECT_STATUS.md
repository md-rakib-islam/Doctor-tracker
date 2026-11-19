# PROJECT_STATUS

_Last updated: 2026-11-19_

## Completed
- [x] Spec analysed (PDF "Doctor Tracker – Project Specification"); checklist below.
- [x] Backend: Express 5 + TypeScript + Mongoose, modular (routes → validators → controllers → services → models).
- [x] Auth: bcrypt (12 rounds), JWT in HttpOnly cookie, `authenticate` middleware, login rate-limit, Origin guard, admin CLI.
- [x] Doctors: CRUD, search, filters (specialization, hospital, date range), sort, server-side pagination, patient counts, doctor's patients list / add patient.
- [x] Patients: CRUD, search (name/phone/email/doctor), filters (condition, gender, doctor, date range) that combine, sort, pagination.
- [x] Safe doctor deletion policy (409 → reassign or explicit cascade).
- [x] Dashboard APIs (aggregation pipelines) + 4 stat cards + 5 Recharts charts, date range + interval controls.
- [x] Frontend: Next.js 16 App Router, Tailwind v4, shadcn/ui (Base UI), TanStack Query, RHF + Zod, Sonner, responsive shell with mobile drawer.
- [x] Seed (idempotent, synthetic) + admin creation script + `dev:db` zero-install MongoDB.
- [x] 27 backend integration tests (auth, CRUD, validation, filtering, deletion policy, dashboard).
- [x] Backend `tsc` build, frontend `next build`, ESLint, `tsc --noEmit` all clean.
- [x] Manual browser verification (see Testing).
- [x] README with architecture diagram, 2 technical decisions, API docs, real screenshots.
- [x] Deployment config: `render.yaml`, `/api/health`, env examples.

## Not done / needs the owner
- [ ] **Live deployment** – no hosting/Atlas credentials were available. Config is ready; steps in README → Deployment. Not claimed as deployed.
- [ ] Frontend automated tests (UI verified manually only).

## Known limitations
- Search is case-insensitive substring regex (can't use an index efficiently); fine at this scale, see README for the Atlas Search upgrade path.
- No admin management UI (admins are created via CLI by design).
- Doctor deletion is not wrapped in a transaction (standalone Mongo in dev); ordering guarantees no orphans.
- Light theme only.

## Testing results
| Area | Result |
|---|---|
| Backend `vitest` | 27/27 pass (mongodb-memory-server) |
| Backend `tsc` build | pass |
| Frontend `next build` / `tsc` / `eslint` | pass |
| Login valid/invalid, protected route redirect, logout | verified in browser + API tests |
| Doctor create (validation + success), view details, delete with patients (cascade) | verified in browser |
| Add patient under doctor (selects, validation) | verified in browser |
| Patient URL-driven combined filters, pagination | verified in browser |
| Dashboard cards/charts against seeded data | verified in browser; values match API |
| Mobile (390px) dashboard, doctors, drawer, login | verified in browser |

Bug found & fixed during manual testing: `DataTable` crashed once rows existed when no `sort` prop was passed.

## Requirement checklist (PDF)
2.1 Auth ✔ · 2.2 Doctor mgmt (create fields, list, search, filter date+other, paginate, view patients, add/delete patients) ✔ · 2.3 Patient page (list, edit, delete, pagination, search, filters date/condition/other) ✔ · 3 Dashboard (totals, patients/doctor, date stats, charts) ✔ · 4 UI/UX incl. Dashboard/Doctors/Patients nav ✔ · 5 Indexing/efficient queries/re-render care/reusable components/validation ✔ · 6 Next.js client + Express server + MongoDB + REST ✔ · README sections ✔ · Project link ✘ (deployment pending owner).

## Technical decisions
See README → Technical Decisions.
