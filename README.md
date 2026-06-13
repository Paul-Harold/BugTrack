# 🐞 BugTrack — Software QA Management System

A Jira/TestRail hybrid for managing the full QA lifecycle: test cases, test suites, test runs with execution tracking, bug reports with a role-based workflow, and a live metrics dashboard with release-readiness scoring.

## Features

**Projects**
- Multiple projects with short keys (`SHOP`, `BANK`) and auto-numbered artifacts (`SHOP-TC12`, `SHOP-BUG3`)
- Test suites that group related test cases
- Test cases with preconditions, ordered steps and expected results, priority, and lifecycle status
- Test runs: pick the cases for a build, then record Pass / Fail / Blocked / Skip results with notes
- Bug reports with severity, priority, assignee, linked test case, and threaded comments

**Dashboard (Recharts)**
- Release-readiness gauge — weighted score from pass rate, execution coverage, and open critical bugs
- Pass/fail donut of all execution results
- Open bugs by severity bar chart
- 30-day bug trend (created vs. resolved) area chart

**Role-based access (enforced server-side and reflected in the UI)**
| Action | QA | Developer | Manager |
|---|---|---|---|
| Create/edit projects | — | — | ✅ |
| Create/edit suites, cases, runs | ✅ | — | ✅ |
| Execute tests (record results) | ✅ | — | ✅ |
| Report bugs / comment | ✅ | ✅ | ✅ |
| Move bug to *in progress* / *resolved* | — | ✅ | ✅ |
| Close / reopen bugs | ✅ | — | ✅ |

## Tech Stack

- **Frontend:** React 19 (Vite), React Router, Tailwind CSS 4, Recharts, Axios
- **Backend:** Node.js, Express 5, JWT auth, bcrypt
- **Database:** MongoDB with Mongoose 9 (aggregation pipelines power the dashboard)

## Getting Started

Requires Node 18+ and a running MongoDB instance (local service or Atlas).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # adjust MONGO_URI / JWT_SECRET if needed
npm run seed                # loads demo users + data
npm run dev                 # http://localhost:5000

# 2. Client (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

### Demo accounts (password: `password123`)

| Email | Role |
|---|---|
| `manager@bugtrack.dev` | Manager |
| `qa@bugtrack.dev` | QA |
| `dev@bugtrack.dev` | Developer |

## API Overview

```
POST   /api/auth/register | login          GET /api/auth/me
GET    /api/projects                       POST/PUT/DELETE (manager)
GET    /api/projects/:id/dashboard         all dashboard metrics in one call
GET    /api/suites?project=                POST/PUT/DELETE (qa, manager)
GET    /api/testcases?project=&suite=&priority=&search=
GET    /api/runs?project=                  POST (qa, manager)
PATCH  /api/runs/:id/executions/:caseId    record a result
GET    /api/bugs?project=&status=&severity=
PUT    /api/bugs/:id                       role-checked status transitions
POST   /api/bugs/:id/comments
```
