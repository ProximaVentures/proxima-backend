# 🧪 Swagger UI — Step-by-Step Testing Guide

> **URL:** http://localhost:5000/api-docs
> **Date:** March 18, 2026
> **Total Endpoints to Test:** 23

---

## 🔐 STEP 0: Get Your Auth Token

Before anything else, you need a JWT token. Do this FIRST.

### 0.1 — Open Swagger UI

1. Make sure your backend is running (`npm run dev`)
2. Open your browser: **http://localhost:5000/api-docs**

### 0.2 — Login to Get Token

1. Scroll to **Authentication** section
2. Click on **POST /api/auth/login**
3. Click the green **"Try it out"** button
4. Paste this in the Request Body:

```json
{
  "email": "admin@proven.com",
  "password": "your_admin_password_here"
}
```

5. Click **"Execute"**
6. In the response, **copy the `token` value** (the long string starting with `eyJ...`)

### 0.3 — Set the Token in Swagger

1. Scroll all the way to the **TOP** of the Swagger page
2. Click the **🔓 Authorize** button (green lock icon, top right)
3. In the popup, type: `Bearer ` followed by your token
   - Example: `Bearer eyJhbGciOiJIUzI1NiIs...`
   - ⚠️ Make sure there's a **space** between `Bearer` and the token
4. Click **"Authorize"**, then **"Close"**

✅ You're now authenticated! All endpoints will use this token.

---

## 🔵 STEP 1: Set Up Project Budget & Config

> **Section:** Admin Sprint Management
> **Endpoint:** `PATCH /api/admin/projects/{projectId}/budget`

You need a **Project ID** first. If you don't know it:
- Go to **Admin** section → **GET /api/admin/projects** → Execute
- Copy the `id` of the project you want to test with

**YOUR PROJECT ID:** `__________________________` ← Write it here for reference

### How to test:

1. Find **PATCH /api/admin/projects/{projectId}/budget** in the **Admin Sprint Management** section
2. Click **"Try it out"**
3. Paste your Project ID in the `projectId` field
4. Paste this in the Request Body:

```json
{
  "totalBudget": 10000,
  "budgetUsed": 0,
  "versionLabel": "v1.0 MVP",
  "timelineStart": "2026-03-18T00:00:00.000Z",
  "timelineEnd": "2026-05-30T00:00:00.000Z"
}
```

5. Click **"Execute"**
6. ✅ Expected: **200 OK**

---

## 🔵 STEP 2: Create Sprint 1

> **Endpoint:** `POST /api/admin/projects/{projectId}/sprints`

1. Find **POST /api/admin/projects/{projectId}/sprints**
2. Click **"Try it out"**
3. Paste your **Project ID** in the `projectId` field
4. Paste this in the Request Body:

```json
{
  "title": "Sprint 1 — Foundation & Setup",
  "description": "Set up project infrastructure, CI/CD pipeline, database schema, and authentication system. This sprint establishes the technical foundation for all future work.",
  "startDate": "2026-03-18T00:00:00.000Z",
  "dueDate": "2026-04-01T00:00:00.000Z",
  "projectWeight": 25,
  "progress": 65,
  "status": "ACTIVE",
  "budget": 2500,
  "duration": "2 weeks",
  "richText": "<h2>Sprint 1: Foundation</h2><p>This sprint focuses on building the core infrastructure.</p><ul><li>Git repository setup</li><li>Database design</li><li>Auth system</li><li>Staging deployment</li></ul>",
  "objectives": [
    {
      "title": "Set up Git repository and CI/CD pipeline",
      "description": "Initialize repo with GitHub Actions for automated testing and deployment",
      "isCompleted": true
    },
    {
      "title": "Design and implement database schema",
      "description": "Create Prisma schema with all core models: User, Project, Profile, Sprint",
      "isCompleted": true
    },
    {
      "title": "Implement JWT authentication system",
      "description": "Login, register, OTP verification, social auth, token refresh",
      "isCompleted": true
    },
    {
      "title": "Deploy staging environment",
      "description": "Set up Render hosting with auto-deploy from main branch",
      "isCompleted": false
    }
  ]
}
```

5. Click **"Execute"**
6. ✅ Expected: **201 Created**
7. 📌 **COPY THE `id` FROM THE RESPONSE** — You'll need it!

**YOUR SPRINT 1 ID:** `__________________________` ← Write it here

---

## 🔵 STEP 3: Create Sprint 2

> Same endpoint: `POST /api/admin/projects/{projectId}/sprints`

1. Same steps as above, paste your **Project ID**
2. Use this Request Body:

```json
{
  "title": "Sprint 2 — Core Features",
  "description": "Build the main user-facing features including the client dashboard, project management system, professional vetting workflow, and real-time notifications.",
  "startDate": "2026-04-01T00:00:00.000Z",
  "dueDate": "2026-04-15T00:00:00.000Z",
  "projectWeight": 40,
  "progress": 20,
  "status": "PLANNED",
  "budget": 4000,
  "duration": "2 weeks",
  "objectives": [
    {
      "title": "Build client dashboard with project overview",
      "isCompleted": false
    },
    {
      "title": "Implement project CRUD with status workflow",
      "isCompleted": false
    },
    {
      "title": "Build real-time notification system",
      "isCompleted": true
    },
    {
      "title": "Create professional vetting admin panel",
      "isCompleted": false
    },
    {
      "title": "Write unit tests for all core modules",
      "isCompleted": false
    }
  ]
}
```

3. Click **"Execute"**
4. 📌 **COPY THE `id`**

**YOUR SPRINT 2 ID:** `__________________________` ← Write it here

---

## 🔵 STEP 4: Create Sprint 3

```json
{
  "title": "Sprint 3 — Polish, QA & Launch",
  "description": "Final quality assurance, performance optimization, security audit, documentation, and production deployment. This sprint prepares the product for client handoff.",
  "startDate": "2026-04-15T00:00:00.000Z",
  "dueDate": "2026-04-30T00:00:00.000Z",
  "projectWeight": 35,
  "progress": 0,
  "status": "PLANNED",
  "budget": 3500,
  "duration": "2 weeks",
  "objectives": [
    {
      "title": "Complete end-to-end QA testing"
    },
    {
      "title": "Performance optimization and load testing"
    },
    {
      "title": "Security audit and vulnerability fixes"
    },
    {
      "title": "Write comprehensive API documentation"
    },
    {
      "title": "Production deployment and DNS setup"
    }
  ]
}
```

**YOUR SPRINT 3 ID:** `__________________________` ← Write it here

---

## 🔵 STEP 5: Update Sprint 1 Progress

> **Endpoint:** `PUT /api/admin/sprints/{id}`

1. Find **PUT /api/admin/sprints/{id}**
2. Click **"Try it out"**
3. Paste your **Sprint 1 ID** in the `id` field
4. Request Body:

```json
{
  "progress": 75,
  "description": "Updated: Foundation work is 75% complete. Auth system and DB schema done. Staging deploy in progress."
}
```

5. Click **"Execute"**
6. ✅ Expected: **200 OK** — Check that `progress` is now 75

---

## 🔵 STEP 6: Add Extra Objective to Sprint 1

> **Endpoint:** `POST /api/admin/sprints/{id}/objectives`

1. Find **POST /api/admin/sprints/{id}/objectives**
2. Paste your **Sprint 1 ID** in the `id` field
3. Request Body:

```json
{
  "title": "Set up error monitoring with Sentry",
  "description": "Integrate Sentry SDK for real-time error tracking and alerting in production",
  "isCompleted": false
}
```

4. Click **"Execute"**
5. ✅ Expected: **201 Created**
6. 📌 **COPY THE OBJECTIVE `id`**

**YOUR OBJECTIVE ID:** `__________________________` ← Write it here

---

## 🔵 STEP 7: Update That Objective

> **Endpoint:** `PUT /api/admin/objectives/{id}`

1. Paste your **Objective ID** in the `id` field
2. Request Body:

```json
{
  "title": "Set up error monitoring (Sentry + LogRocket)",
  "description": "Integrate both Sentry for errors and LogRocket for session replay"
}
```

3. ✅ Expected: **200 OK**

---

## 🔵 STEP 8: Toggle Objective Complete/Incomplete

> **Endpoint:** `PATCH /api/admin/objectives/{id}/toggle`

1. Paste your **Objective ID** in the `id` field
2. **No request body needed** — just click Execute
3. ✅ Expected: **200 OK** — `isCompleted` flips to `true`
4. Click Execute **again** and it flips back to `false`

---

## 🔵 STEP 9: Add Deliverables to Sprint 1

> **Endpoint:** `POST /api/admin/sprints/{id}/deliverables`

### Deliverable 1 — Code Repository:

1. Paste your **Sprint 1 ID** in the `id` field
2. Request Body:

```json
{
  "title": "Backend API Repository",
  "description": "Express.js + TypeScript backend with Prisma ORM, JWT auth, and RESTful API. Includes 45+ endpoints across auth, admin, projects, sprints, and client dashboard.",
  "type": "CODE_REPO",
  "fileUrl": "https://github.com/ProximaVentures/proxima-backend",
  "commitCount": 87,
  "status": "SUBMITTED"
}
```

3. ✅ Expected: **201 Created**
4. 📌 **COPY THE DELIVERABLE `id`**

**YOUR DELIVERABLE 1 ID:** `__________________________`

### Deliverable 2 — Design File:

Same endpoint, same Sprint ID, new body:

```json
{
  "title": "UI/UX Design System — Figma",
  "description": "Complete design system with component library, page layouts, color palette, typography, and interactive prototypes for all major flows.",
  "type": "DESIGN_FILE",
  "fileUrl": "https://figma.com/file/abc123/proven-design-system",
  "fileName": "ProVen_Design_System_v2.fig",
  "fileSize": "34.2 MB",
  "status": "APPROVED"
}
```

### Deliverable 3 — Documentation:

```json
{
  "title": "Technical Architecture Document",
  "description": "System architecture overview including ERD diagrams, API flow charts, deployment topology, and tech stack decisions.",
  "type": "DOCUMENT",
  "fileUrl": "https://docs.google.com/document/d/abc123",
  "fileName": "ProVen_Architecture_v1.pdf",
  "fileSize": "2.8 MB",
  "status": "SUBMITTED"
}
```

---

## 🔵 STEP 10: Update Deliverable

> **Endpoint:** `PUT /api/admin/deliverables/{id}`

1. Paste your **Deliverable 1 ID**
2. Request Body:

```json
{
  "commitCount": 102,
  "description": "Updated: Now includes client dashboard endpoints, swagger docs, and comprehensive error handling."
}
```

3. ✅ Expected: **200 OK**

---

## 🔵 STEP 11: Update Deliverable Status

> **Endpoint:** `PATCH /api/admin/deliverables/{id}/status`

1. Paste your **Deliverable 1 ID**
2. Request Body:

```json
{
  "status": "APPROVED"
}
```

3. ✅ Expected: **200 OK** — Notice `reviewedAt` is auto-filled

---

## 🔵 STEP 12: Create Sprint Payment

> **Endpoint:** `POST /api/admin/sprints/{id}/payment`

1. Paste your **Sprint 1 ID**
2. Request Body:

```json
{
  "totalAmount": 2500,
  "amountPaid": 1250,
  "status": "PARTIAL",
  "transactionRef": "TXN-PV-2026-0318-001",
  "receiptUrl": "https://pay.stripe.com/receipts/proven-sprint1-partial"
}
```

3. ✅ Expected: **200 OK**
4. 📌 **COPY THE PAYMENT `id`**

**YOUR PAYMENT ID:** `__________________________`

---

## 🔵 STEP 13: Update Payment to Fully Paid

> **Endpoint:** `PATCH /api/admin/payments/{id}`

1. Paste your **Payment ID**
2. Request Body:

```json
{
  "amountPaid": 2500,
  "status": "PAID",
  "transactionRef": "TXN-PV-2026-0318-002"
}
```

3. ✅ Expected: **200 OK** — Notice `paidAt` is now filled in

---

## 🔵 STEP 14: Add Sprint Payment for Sprint 2

> Same endpoint: `POST /api/admin/sprints/{id}/payment`

1. Paste your **Sprint 2 ID**
2. Request Body:

```json
{
  "totalAmount": 4000,
  "amountPaid": 0,
  "status": "UNPAID"
}
```

---

## 🔵 STEP 15: Admin Adds Comment to Sprint

> **Endpoint:** `POST /api/admin/sprints/{id}/comments`

1. Paste your **Sprint 1 ID**
2. Request Body:

```json
{
  "content": "Great progress on Sprint 1! The auth system is solid and the database schema covers all our needs. I'm preparing the staging environment now — should be live by tomorrow. Let me know if you'd like a walkthrough of the codebase."
}
```

3. ✅ Expected: **201 Created**

Add another comment:

```json
{
  "content": "Staging environment is now live at staging.proven.app — all automated tests passing. Ready for your review whenever you are."
}
```

---

## 🔵 STEP 16: Get All Sprints (Verify Everything)

> **Section:** Sprints
> **Endpoint:** `GET /api/projects/{projectId}/sprints`

1. Paste your **Project ID**
2. Click **Execute**
3. ✅ Verify you see:
   - **3 sprints** with all their data
   - Each sprint has `objectives`, `sprintDeliverables`, `payment`, and `tasks`
   - Sprint 1 has 5 objectives, 3 deliverables, 1 payment (PAID)
   - Sprint 2 has 5 objectives, 0 deliverables, 1 payment (UNPAID)
   - Sprint 3 has 5 objectives, 0 deliverables, no payment

---

## 🟢 STEP 17: Client Dashboard — Full Overview

> **Section:** Client Dashboard
> **Endpoint:** `GET /api/client/projects/{projectId}/dashboard`

This is the **big one** — it powers the entire client dashboard.

1. Paste your **Project ID**
2. Click **Execute**
3. ✅ Verify the response includes:
   - `project.overallProgress` — weighted average of all sprints
   - `project.totalBudget` — 10000
   - `project.timeline.start` / `project.timeline.end`
   - `project.teamMembers` — array of assigned professionals
   - `nextMilestone` — points to Sprint 1 (the active one)
   - `sprints` — array of 3 sprint summaries with:
     - `objectivesCompleted` / `objectivesTotal`
     - `deliverablesCount` / `deliverablesSubmitted`
     - `budget`, `progress`, `status`
   - `sprintCount` — 3

---

## 🟢 STEP 18: Client Dashboard — Sprint Board Detail

> **Endpoint:** `GET /api/client/projects/{projectId}/sprints/{sprintId}`

1. Paste your **Project ID** AND your **Sprint 1 ID**
2. Click **Execute**
3. ✅ Verify the response includes:
   - `sprint` — Full sprint info with budget, status, progress
   - `payment` — `totalAmount`, `amountPaid`, `percentPaid`, `status`
   - `objectives` — Array of 5 checklist items with `isCompleted` flags
   - `deliverables` — Array of 3 items with `type`, `fileUrl`, `status`
   - `reviews` — Empty array (no reviews yet)
   - `comments` — Array with admin comments, each with author name & role
   - `progressSummary` — `deliverablesSubmitted`, `tasksCompleted`, `teamVelocity`

---

## 🟢 STEP 19: Set Sprint 1 to "IN_REVIEW"

Before a client can approve or request changes, the sprint must be in **IN_REVIEW** status.

> **Endpoint:** `PUT /api/admin/sprints/{id}`

1. Paste your **Sprint 1 ID**
2. Request Body:

```json
{
  "status": "IN_REVIEW",
  "progress": 100
}
```

3. ✅ Expected: **200 OK**

---

## 🟢 STEP 20: Client Approves Sprint 1

> **Endpoint:** `POST /api/client/sprints/{sprintId}/approve`

1. Paste your **Sprint 1 ID** in the `sprintId` field
2. Request Body:

```json
{
  "comment": "Everything looks great! The foundation is solid and we're happy with the auth system. Approved to move on to Sprint 2."
}
```

3. ✅ Expected: **200 OK**
4. ✅ Verify: Sprint status changed to `APPROVED`, progress is 100
5. ✅ Check admin notifications — a new notification should appear

---

## 🟢 STEP 21: Set Sprint 2 to "IN_REVIEW"

> **Endpoint:** `PUT /api/admin/sprints/{id}`

1. Paste your **Sprint 2 ID**
2. Request Body:

```json
{
  "status": "IN_REVIEW",
  "progress": 85
}
```

---

## 🟢 STEP 22: Client Requests Changes on Sprint 2

> **Endpoint:** `POST /api/client/sprints/{sprintId}/request-changes`

1. Paste your **Sprint 2 ID**
2. Request Body:

```json
{
  "comment": "The notification system works well, but I'd like a few adjustments:\n\n1. Notifications should group by project instead of showing individually\n2. The unread badge count isn't resetting when I open the panel\n3. Can we add email notifications for important updates?\n\nPlease address these before we finalize Sprint 2."
}
```

3. ✅ Expected: **200 OK**
4. ✅ Verify: Sprint 2 status changed back to `ACTIVE` (not IN_REVIEW anymore)

---

## 🟢 STEP 23: Client Adds Comments

> **Endpoint:** `POST /api/client/sprints/{sprintId}/comments`

### Comment 1:
1. Paste your **Sprint 1 ID**
2. Request Body:

```json
{
  "content": "Can we schedule a call this week to discuss Sprint 2 priorities? I have some ideas about the dashboard layout that I'd like to share with the team."
}
```

### Comment 2 (on Sprint 2):
1. Paste your **Sprint 2 ID**

```json
{
  "content": "I noticed the vetting panel is looking really clean. Quick question — can we add a filter to sort professionals by their category? That would be super helpful for project assignments."
}
```

### Comment 3 (follow-up):
1. Paste your **Sprint 1 ID**

```json
{
  "content": "Also, please make sure the staging URL is accessible from my team's network. They tried accessing it yesterday and got a timeout error."
}
```

---

## 🟢 STEP 24: Get Sprint Comments

> **Endpoint:** `GET /api/client/sprints/{sprintId}/comments`

1. Paste your **Sprint 1 ID**
2. Click **Execute**
3. ✅ Verify:
   - You see all comments (admin + client)
   - Each comment has `author.name`, `author.avatarUrl`, `author.role`
   - Comments are in chronological order (oldest first)

---

## 🟢 STEP 25: Get Project Progress Stats

> **Endpoint:** `GET /api/client/projects/{projectId}/progress`

1. Paste your **Project ID**
2. Click **Execute**
3. ✅ Verify the response:

```
overallProgress: ~42 (weighted across 3 sprints)
sprints:        { total: 3, completed: 1, active: 1 }
objectives:     { total: 15, completed: 4 }
deliverables:   { total: 3, submitted: 3 }
tasks:          { total: 0, completed: 0 }
budget:         { total: 10000, paid: 2500, remaining: 7500 }
```

---

## 🔴 BONUS: Test Error Cases

### Test 1 — Create sprint without title:
Endpoint: `POST /api/admin/projects/{projectId}/sprints`
```json
{}
```
✅ Expected: **400** — "Sprint title is required"

### Test 2 — Approve sprint that's not in review:
Endpoint: `POST /api/client/sprints/{sprintId}/approve`
Use Sprint 3 ID (it's still PLANNED):
```json
{ "comment": "test" }
```
✅ Expected: **400** — "Sprint must be in review status to approve"

### Test 3 — Request changes without comment:
Endpoint: `POST /api/client/sprints/{sprintId}/request-changes`
```json
{}
```
✅ Expected: **400** — "A comment explaining the requested changes is required"

### Test 4 — Invalid deliverable status:
Endpoint: `PATCH /api/admin/deliverables/{id}/status`
```json
{ "status": "SUPER_DONE" }
```
✅ Expected: **400** — "Invalid status"

### Test 5 — Access without token:
Remove the Bearer token from Authorize, then try any endpoint.
✅ Expected: **401** — Unauthorized

---

## 📝 ID Reference Sheet

Fill in as you test. Keep this handy!

| Resource | ID |
|---|---|
| **Project ID** | `________________________________` |
| **Sprint 1 ID** | `________________________________` |
| **Sprint 2 ID** | `________________________________` |
| **Sprint 3 ID** | `________________________________` |
| **Objective ID** | `________________________________` |
| **Deliverable 1 ID** | `________________________________` |
| **Payment ID** | `________________________________` |

---

## ✅ Final Verification Checklist

After completing all steps, do a final check:

| Step | What to verify | Done? |
|---|---|---|
| 1 | Budget set: `totalBudget=10000`, `versionLabel="v1.0 MVP"` | ⬜ |
| 2-4 | 3 sprints exist with correct `sprintNumber` (1, 2, 3) | ⬜ |
| 5 | Sprint 1 progress updated to 75 → then 100 | ⬜ |
| 6-8 | Objective CRUD works (add, update, toggle) | ⬜ |
| 9-11 | 3 deliverables on Sprint 1 with correct types | ⬜ |
| 12-14 | Sprint 1 payment PAID, Sprint 2 payment UNPAID | ⬜ |
| 15 | Admin comments appear on Sprint 1 | ⬜ |
| 16 | GET sprints returns all data with nested relations | ⬜ |
| 17 | Dashboard overview shows progress, budget, team, milestones | ⬜ |
| 18 | Sprint board shows payment, objectives, deliverables | ⬜ |
| 19-20 | Client approved Sprint 1 (status = APPROVED) | ⬜ |
| 21-22 | Client requested changes on Sprint 2 (status = ACTIVE) | ⬜ |
| 23-24 | Comments work with author names resolved | ⬜ |
| 25 | Progress stats are computed correctly | ⬜ |
| — | Error cases return proper error messages | ⬜ |

---

**🎉 If all checkboxes are ✅, your backend is fully tested and ready for frontend integration!**
