# Finance Dashboard Backend API

## 1. Project Overview
 
This backend powers a **finance dashboard system** where different users interact with financial records based on their assigned role. The system manages financial entries (income and expenses), enforces role-based permissions, and provides aggregated analytics for dashboard consumption.
 
**Core capabilities:**
- Secure JWT-based authentication with role-aware authorization
- Full financial records management with filtering, pagination, and soft deletion
- Dashboard analytics — totals, category breakdowns, monthly trends, recent activity
- Audit logging on every mutation for full traceability
- Rate limiting, request validation, and structured error responses throughout
 
**Design philosophy:** Every decision in this codebase prioritizes clarity over cleverness. Business logic lives in services, HTTP concerns live in controllers, access rules live in one auditable constants file. A new developer should be able to understand any flow within minutes of reading the code.
 
---


## 2. Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | v20.17.0 | JavaScript runtime environment |
| TypeScript | v5.2.2 | Static typing for enterprise stability |
| Express.js | v4.18.2 | Lightweight HTTP web framework |
| Prisma ORM | 5.22.0 | Type-safe database client and migrations |
| PostgreSQL | v18.3 | Relational database for persistent storage |
| Zod | 3.22.4 | Strict schema validation |
| **Swagger/OpenAPI 3.0** | — | Self-documenting API. Any consumer (frontend, QA, client) can explore endpoints without reading source code. |

--- 

## 3. System Architecture
 
### Request Lifecycle
 
Every API request flows through the same deterministic pipeline:
 
```
Client Request
      │
      ▼
  Rate Limiter          ← Blocks abuse before any logic runs
      │
      ▼
  Helmet (Security)     ← Sets HTTP security headers
      │
      ▼
  Body Parser           ← 10kb limit, rejects malformed JSON
      │
      ▼
  authenticateToken     ← Verifies JWT, attaches req.user
      │
      ▼
  authorizeRoles()      ← Checks req.user.role against PERMISSIONS constant
      │
      ▼
  validate(schema)      ← Runs Zod parse on req.body or query params
      │
      ▼
  Controller            ← Extracts data from req, calls service
      │
      ▼
  Service               ← Pure business logic, throws AppError on domain violations
      │
      ▼
  Prisma ORM            ← Type-safe DB query
      │
      ▼
  Response / Error      ← Unified response shape or global error handler
```
 
### 4. Layered Architecture
 
The system follows a strict three-layer architecture. Each layer has a single responsibility and no layer reaches past the one adjacent to it.
 
```
┌─────────────────────────────────────────────┐
│               ROUTE LAYER                   │
│  Declares endpoints. Applies middleware.     │
│  No logic. Pure wiring.                      │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│             CONTROLLER LAYER                │
│  Handles HTTP concerns only.                │
│  Reads req, calls service, writes res.      │
│  No business logic. No DB access.           │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│              SERVICE LAYER                  │
│  All business logic lives here.             │
│  Pure functions: data in, data out.         │
│  Throws AppError for domain violations.     │
│  No req/res. Fully testable in isolation.   │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│               DATA LAYER                   │
│  Prisma ORM. Type-safe queries.             │
│  Schema as single source of truth.          │
└─────────────────────────────────────────────┘
```
 
**Why this separation matters:** When a business rule changes (e.g., "Analysts can now create records"), only `permissions.ts` changes. When a DB query needs optimization, only the service changes. Controllers never need to know about DB internals.
 
---

## 5. Access Control Design (RBAC)
 
### The Permission Architecture
 
All permissions are declared in a single file: `src/constants/permissions.ts`. This is the most important architectural decision in the access control system.
 
**Why a constants file?**
When permissions are scattered as inline role arrays across 15 route files, changing a permission requires a codebase search. When they live in one file, the entire permission model is visible at a glance and changes in one place propagate everywhere.

## 6. Assumptions Made
1. **Implicit Deletion Handling:** Soft deletion (`isDeleted` boolean flag) is preferred over hard cascades to protect the integrity of financial trend data and audit continuity.
2. **Global Pagination Limits:** Hard-capped bounds on limit schemas restrict page scraping abuse (Max 100 limit, offset bounds cap at 10,000 via Error throws). Max bounds force frontend search parameters for distant historical ranges. 
3. **Registration Escalation Safety:** All publicly instantiated accounts intentionally default to `VIEWER` access. Privilege elevation requires a direct manual database flag mutation or backend tooling unavailable to the public.
4. **Trend Gap Interpolation:** When executing raw SQL aggregations (Monthly trends), if mathematical grouping discovers zero data in an interval, the backend maps computationally generated 0-filled gaps locally instead of passing a sparse array directly to the client.

## 7. Known Limitations
* **No Refresh Tokens:** The API dictates pure short-lived JWTs. The client is forced to authenticate from scratch on expiration, entirely lacking a sliding expiration capability. 
* **Lack of Email Verification Linkage:** The registration flow bypasses automated email SMTP validations natively bridging the gap between fake profiles and real-world linkage. 
* **Central Rate Limiting Constraint:** Rate limiting is implemented using express-rate-limit with in-memory storage, where request tracking is maintained within the Node.js process. In a horizontally scaled, multi-instance environment, this leads to inconsistent enforcement as each instance maintains its own request count. A production-grade solution would involve a centralized store such as Redis to synchronize rate limits across all instances.
* **No real-time updates:** Dashboard requires page refresh; WebSocket layer (Socket.io) pushing balance updates.
* **Single currency:**  No currency field on records | Add `currency` field, implement conversion via exchange rate API.
 
## 8. Folder Strucutre
```
finance-backend/
├── prisma/
│   ├── schema.prisma       # Database schema mappings
│   └── seed.ts             # Initial database seeding script
├── src/
│   ├── config/             # Environment, Database, Swagger, and Rate Limiting
│   ├── constants/          # Static system constants like the RBAC permission matrix
│   ├── controllers/        # HTTP routing handlers
│   ├── middlewares/        # Security, Validation, and Global Error interception
│   ├── routes/             # API routing configuration
│   ├── services/           # Encapsulated pure business logic
│   ├── types/              # Global TypeScript declaration augmentations
│   ├── utils/              # Resuable helpers formatting responses and errors
│   ├── validators/         # Zod schemas mapping expected input payloads
│   ├── app.ts              # Primary Express application initialization
│   └── server.ts           # Server port binding and database boot point
```

## 9. API Reference
*Full Swagger documentation available at: `http://localhost:3000/api/docs`*

| Method | Endpoint | Auth Required | Role | Description |
|---|---|---|---|---|
| **Auth** | | | | |
| POST | `/api/auth/register` | No | Any | Register a new system account (Defaults to VIEWER) |
| POST | `/api/auth/login` | No | Any | Authenticate and obtain JWT Bearer Token |
| **Records** | | | | |
| GET | `/api/records` | Yes | Viewer+ | Retrieve paginated system records |
| POST | `/api/records` | Yes | Admin | Create a new financial payload (`INCOME` / `EXPENSE`) |
| GET | `/api/records/:id` | Yes | Viewer+ | Retrieve singular record details |
| PATCH| `/api/records/:id` | Yes | Admin | Update properties of an existing record |
| DELETE|`/api/records/:id` | Yes | Admin | Soft delete a target financial record |
| **Dashboard** | | | | |
| GET | `/api/dashboard/summary` | Yes | Viewer+ | Calculate Net Balance, Total Income, & Expense Aggregates |
| GET | `/api/dashboard/categories` | Yes | Analyst+ | Aggregate total values filtered by category descriptors |
| GET | `/api/dashboard/trends` | Yes | Analyst+ | Time-series data grouping records generated by month |
| GET | `/api/dashboard/recent-activity`| Yes | Viewer+ | Fetch the immediate most recent transaction payloads |
| **Audit** | | | | |
| GET | `/api/audit` | Yes | Admin | Inspect paginated activity logs recording system events |

## 10. Role Permission Matrix
| Feature | Viewer | Analyst | Admin |
|---------|--------|---------|-------|
| Login / Register | Y | Y | Y |
| View Financial Records | Y | Y | Y |
| Create/Update/Delete Records | N | N | Y |
| View Dashboard Summary | Y | Y | Y |
| View Recent Activity | Y | Y | Y |
| View Analytics/Trends | N | Y | Y |
| View Audit Logs | N | N | Y |

## 11. Prerequisites
* Node.js v20+
* PostgreSQL v15+ (Running locally or a URI)
* npm v10+

## 12. Local Setup
1. **Clone the repository**
```bash
git clone https://github.com/21aansh06/finance-backend.git
cd finance-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Copy the supplied example configuration:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is pointing to a valid running PostgreSQL instance.

4. **Initialize Database**
Run migrations to generate tables, followed by the Prisma client generation:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Seed the Database (Optional)**
Populate the database with default users and mock financial records:
```bash
npm run db:seed
```

6. **Start the API!**
Development mode (auto-refreshing):
```bash
npm run dev
```

## 13. Environment Variables
| Variable | Required | Default | Description |
|----------|----------|----------|-------------|
| PORT | No | 3000 | The HTTP port the Express server binds to |
| DATABASE_URL | Yes | - | Full PostgreSQL connection URI |
| JWT_SECRET | Yes | - | Cryptographic key utilized to sign auth tokens |
| JWT_EXPIRES_IN | Yes | - | Lifespan of the authenticated session (e.g. `1h`, `7d`) |
| NODE_ENV | Yes | development | Operating context (`development` or `production`) |



---
 
**Thank You!!!**



