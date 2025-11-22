# TonyStack Starter - Blog API

A lightweight, modular REST API starter built with Deno + Hono + Drizzle, featuring built-in authentication, role-based access control, and a dynamic site settings system.

## 1. Overview

This is a lightweight REST API built on Deno + Hono + Drizzle (PostgreSQL) with:

- Modular, entity‑centric folder structure (`src/entities/<feature>`)
- Built‑in authentication (JWT, user roles)
- Seed scripts for users and site settings
- Typed database access via Drizzle ORM
- Clear environment & migration workflow
- Comprehensive test tasks (setup, migrate, seed, run, coverage)

## 2. Stack

- Runtime: Deno
- Web: Hono
- ORM: Drizzle + PostgreSQL
- Validation: Zod
- Auth: JWT (HS256) + role checks (user, superadmin)

## 3. Requirements

- Deno (latest 2.x)
- PostgreSQL 14+
- Bash / Docker (optional for local DB)

## 4. Environment Variables

Create one of: `.env.development.local` (preferred) or `.env`.

| Variable          | Required  | Default                   | Notes                                         |
| ----------------- | --------- | ------------------------- | --------------------------------------------- |
| `DATABASE_URL`    | ✅        | —                         | Postgres connection string (must exist)       |
| `PORT`            | ❌        | 8000                      | HTTP port                                     |
| `ENVIRONMENT`     | ❌        | development               | Allowed values: development, test, production |
| `ALLOWED_ORIGINS` | ❌        | <http://localhost:3000>   | Comma separated list                          |
| `JWT_SECRET`      | ✅ (prod) | `change-me-in-production` | Replace in production                         |
| `JWT_ISSUER`      | ❌        | tonystack                 | Token issuer name                             |
| `JWT_EXPIRY`      | ❌        | 1h                        | e.g. `1h`, `30m`, `7d`                        |

Load order (highest priority first): system env → `.env.<env>.local` → `.env`.

## 5. Project Structure

```text
src/
  main.ts                # App bootstrap (mount routes, middleware)
  config/                # env + database setup
  auth/                  # auth routes, services, models
  entities/              # feature domains (add your own here)
    articles/            # example content entity
    site_settings/       # dynamic configuration system
  shared/                # errors, jwt, validation, middleware helpers
migrations/              # Drizzle migration files (generated)
scripts/                 # Migration, seed, utility scripts
tests/                   # (If present) higher‑level or docs for tests
deno.json                # Tasks & dependency mapping
```

## 6. Core Tasks (deno.json)

| Task                           | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `deno task dev`                | Run with watch & all permissions         |
| `deno task start`              | Run once (no watch)                      |
| `deno task env:validate`       | Check required env vars                  |
| `deno task migrate:generate`   | Create migration from current schema     |
| `deno task migrate:run`        | Apply pending migrations                 |
| `deno task db:studio`          | Open Drizzle Studio (schema browser)     |
| `deno task db:seed`            | Seed all default data (users + settings) |
| `deno task db:seed:superadmin` | Seed only superadmin user                |
| `deno task db:seed:alpha`      | Seed demo regular user                   |
| `deno task db:seed:user`       | Seed generic regular user                |
| `deno task db:seed:site`       | Seed system site settings                |
| `deno task setup`              | Validate env → migrate → seed            |
| `deno task test:full`          | Full test DB setup then run tests        |
| `deno task test`               | Run tests + cleanup test DB              |
| `deno task test:setup`         | Create test DB + apply migrations        |
| `deno task test:migrate`       | Migrate test DB only                     |
| `deno task test:seed`          | Seed test data                           |
| `deno task test:reset`         | Recreate + migrate + seed test DB        |
| `deno task test:watch`         | Watch mode tests                         |
| `deno task test:coverage`      | Coverage report to `coverage/`           |
| `deno task test:check`         | Health check (DB + basic readiness)      |
| `deno task cleanup:test-db`    | Remove test database artifacts           |
| `deno task fmt`                | Format source                            |
| `deno task lint`               | Lint source                              |

## 7. First Run

```bash
# 1. Create environment file from example
cp .env.example .env.development.local
# Edit .env.development.local with your database credentials

# 2. Start PostgreSQL (using Docker Compose)
docker compose up -d postgres

# 3. Validate environment configuration
deno task env:validate

# 4. Run migrations to set up database schema
deno task migrate:run

# 5. Seed core data (users + site settings)
deno task db:seed

# 6. Start development server with hot reload
deno task dev
```

Visit: `http://localhost:8000`

**Note:** If migrations already exist, skip step 3's generation. The starter comes with initial migrations ready to apply.

## 8. Entities & Conventions

Each scaffolded entity consists of multiple files following a consistent pattern:

### Standard Entity Files

```text
<entity>.model.ts       # Drizzle table definition
<entity>.dto.ts         # Zod schemas (create/update/query)
<entity>.service.ts     # Business logic / data access layer
<entity>.controller.ts  # HTTP handlers (thin layer)
<entity>.route.ts       # Public API route registration
<entity>.test.ts        # Unit/integration tests for entity
```

### Admin Panel Files (Optional)

For entities requiring admin panel support:

```text
<entity>.admin.route.ts # Admin-specific routes (/ts-admin/<entity>)
<entity>.admin.test.ts  # Admin route tests
```

Admin routes automatically mount under `/ts-admin/` prefix and require superadmin role.

### File Organization

```text
src/entities/
  articles/
    article.model.ts
    article.dto.ts
    article.service.ts
    article.controller.ts
    article.route.ts          # Public routes: GET/POST /articles
    article.admin.route.ts    # Admin routes: /ts-admin/articles
    article.test.ts
    article.admin.test.ts
    article.interface.ts      # (optional) TypeScript interfaces
```

### Naming Conventions

- **Directory**: Plural (e.g., `articles/`, `products/`)
- **Table**: Plural (e.g., `articles`, `products`)
- **Routes**: Plural (e.g., `/articles`, `/products`)
- **Files**: Singular prefix (e.g., `article.model.ts`, `product.dto.ts`)

**Best Practice:** Add new fields to models BEFORE generating first migration to keep history clean.

## 9. Database & Migrations

- Edit models in `src/entities/**/<name>.model.ts`.
- Generate migration AFTER changes: `deno task migrate:generate`.
- Apply: `deno task migrate:run`.
- Inspect: `deno task db:studio`.

Never hand‑edit generated SQL unless absolutely necessary; prefer evolving the
model then regenerating a new migration.

## 10. Seeding

Full seed (users + settings): `deno task db:seed`.

Users created:

- Superadmin: `superadmin@tstack.in` (full privileges)
- Alpha user: `alpha@tstack.in` (regular)
- Regular user (script) for additional testing.

System site settings auto‑seed & self‑heal on access (see settings section).

## 11. Authentication

### Overview

- Login / Register endpoints under `src/auth/` routes.
- JWT (HS256) header: `Authorization: Bearer <token>`.
- Token payload includes `userId` + `email` + `role`.
- Change `JWT_SECRET` before production; rotate by updating env and forcing logout (delete tokens table rows).

### Example: Login

**Request:**

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@tstack.in", "password": "password123"}'
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "superadmin@tstack.in",
    "role": "superadmin"
  }
}
```

### Using the Token

Include in all protected requests:

```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:8000/articles
```

### Register New User

**Request:**

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "secure123"}'
```

## 12. Site Settings System

Dynamic configuration with protected "system" keys:

- Auto‑seed on first read
- Zod validated (cannot store invalid JSON)
- Reset endpoints: `/site-settings/<key>/reset` & `/site-settings/reset-all`
- Public vs private settings (frontend can fetch only public)

### Example: Fetch Public Settings

**Request (no auth needed):**

```bash
curl http://localhost:8000/site-settings
```

**Response:**

```json
[
  {
    "id": 1,
    "key": "site_info",
    "value": {"siteName": "My Blog", "description": "A blog"},
    "isPublic": true
  },
  {
    "id": 2,
    "key": "theme_config",
    "value": {"primaryColor": "#007bff"},
    "isPublic": true
  }
]
```

### Add New System Setting

1. Create schema in `src/entities/site_settings/schemas/` (e.g., `payment.schemas.ts`):

```typescript
import { z } from "zod";

export const paymentConfigSchema = z.object({
  stripePublicKey: z.string(),
  stripeSecretKey: z.string().optional(),
});

export const defaultPaymentConfig = {
  stripePublicKey: "pk_test_",
  stripeSecretKey: "",
};
```

2. Register in `src/entities/site_settings/schemas/index.ts`:

```typescript
import { paymentConfigSchema, defaultPaymentConfig } from "./payment.schemas.ts";

export const SYSTEM_SETTINGS = {
  payment_config: {
    schema: paymentConfigSchema,
    default: defaultPaymentConfig,
  },
  // ... other settings
};
```

3. Restart server – auto-seeded on first access

## 13. Role-Based Access Control

| Role       | Permissions                                            |
|------------|--------------------------------------------------------|
| `superadmin` | Full access to all resources; can create/edit/delete any content; admin panel access |
| `user`     | Create own articles; read all public content; update/delete own articles |
| (unauthenticated) | Read-only access to public content & site settings |

---

## 13.5. API Quick Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `POST` | `/auth/login` | ❌ | Login with email/password |
| `POST` | `/auth/register` | ❌ | Create new user account |

### Articles (Public)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/articles` | ❌ | List all articles |
| `GET` | `/articles/:id` | ❌ | Get single article |
| `POST` | `/articles` | ✅ | Create article (user role) |
| `PUT` | `/articles/:id` | ✅ | Update own article |
| `DELETE` | `/articles/:id` | ✅ | Delete own article |

### Articles (Admin)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/ts-admin/articles` | ✅ superadmin | List all articles with filters |
| `POST` | `/ts-admin/articles` | ✅ superadmin | Create any article |
| `PUT` | `/ts-admin/articles/:id` | ✅ superadmin | Update any article |
| `DELETE` | `/ts-admin/articles/:id` | ✅ superadmin | Delete any article |
| `POST` | `/ts-admin/articles/bulk-delete` | ✅ superadmin | Bulk delete articles |

### Site Settings (Public)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/site-settings` | ❌ | List public settings |
| `GET` | `/site-settings/:idOrKey` | ❌ | Get setting by ID or key |
| `POST` | `/site-settings/:key/reset` | ✅ superadmin | Reset to defaults |
| `POST` | `/site-settings/reset-all` | ✅ superadmin | Reset all system settings |

---

### Articles Example Entity

Demonstrates protected write operations vs public read. Use it as a pattern for ownership + role checks.

**Public Read:**

```bash
curl http://localhost:8000/articles
```

**Create Article (auth required, user role):**

```bash
curl -X POST http://localhost:8000/articles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Post", "content": "Hello world"}'
```

**Delete Own Article:**

```bash
curl -X DELETE http://localhost:8000/articles/1 \
  -H "Authorization: Bearer <token>"
```

**Admin Operations:**

```bash
curl http://localhost:8000/ts-admin/articles \
  -H "Authorization: Bearer <superadmin-token>"
```

## 14. Testing Workflow

### What Gets Tested

- **Auth routes**: Login, register, token validation
- **Articles**: CRUD operations, ownership checks, role-based access
- **Site Settings**: Public/private access, validation, system setting protection
- **Error handling**: Proper error responses and validation

### Test Tasks

**Full cycle (recommended for CI):**

```bash
deno task test:full        # Setup test DB + run all tests + cleanup
deno task test:coverage    # Run tests with coverage report
```

**Fast inner loop while coding:**

```bash
deno task test:watch       # Auto-rerun on file changes
```

**Health check:**

```bash
deno task test:check       # Verify DB + basic readiness
```

**Manual test flow:**

```bash
deno task test:setup       # Create test DB + apply migrations
deno task test:seed        # Seed test data (users, settings)
deno task test             # Run all tests
deno task test:reset       # Clean and rebuild test DB
```

### Testing Conventions

#### File Structure

Place test files alongside the code they test:

```text
src/entities/articles/
  article.model.ts
  article.service.ts
  article.controller.ts
  article.test.ts           # Tests for public routes
  article.admin.test.ts     # Tests for admin routes
```

#### Test File Naming

- **Entity tests**: `<entity>.test.ts` (e.g., `article.test.ts`)
- **Admin tests**: `<entity>.admin.test.ts` (e.g., `article.admin.test.ts`)
- **Utility tests**: `<utility>.test.ts` (e.g., `errorHandler.test.ts`)

#### Test Structure Pattern

Follow BDD-style testing with `describe` and `it`:

```typescript
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";

describe("Article API", () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Setup: login and get auth token
    const response = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "pass123" }),
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    authToken = data.token;
  });

  describe("Create Operations", () => {
    it("should create article with valid data", async () => {
      const response = await app.request("/articles", {
        method: "POST",
        body: JSON.stringify({ title: "Test", content: "Content" }),
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        }
      });
      
      assertEquals(response.status, 201);
      const article = await response.json();
      assertExists(article.id);
    });
  });
  
  afterAll(async () => {
    // Cleanup: remove test data
  });
});
```

#### Test Environment

- Tests run in isolated test database (configured via `ENVIRONMENT=test`)
- Database automatically created, migrated, and cleaned up
- Use `beforeAll` for setup, `afterAll` for cleanup
- Tests should be independent and idempotent

#### Best Practices

1. **Group related tests** with nested `describe` blocks
2. **Use descriptive test names** starting with "should..."
3. **Test both success and error cases**
4. **Clean up test data** to avoid affecting other tests
5. **Use meaningful assertions** that explain what's being tested
6. **Test permissions** for protected routes (auth/roles)

Tests run automatically with `deno task test`.

## 15. Error Handling

Central error utilities live under `shared/utils/errors.ts`. Throw typed errors
(`BadRequestError`, `UnauthorizedError`, etc.) from services/controllers – the
global handler converts them to structured JSON responses.

## 16. Formatting & Linting

```bash
deno task fmt
deno task lint
```

Run before commits to maintain consistency and catch drift early.

## 17. Deployment (Docker Compose)

```bash
export ENVIRONMENT=production
cp .env .env.production.local  # or create fresh
# Edit secrets (JWT_SECRET, DATABASE_URL)
docker compose up --build -d
docker compose exec app deno task migrate:run
docker compose exec app deno task db:seed
```

External database build:

```bash
docker build -t my-api .
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="replace-with-strong-secret" \
  --name my-api \
  my-api
```

## 18. Maintenance Tips

- Always modify models BEFORE first migration generation.
- Keep seed scripts idempotent (current scripts are safe to re‑run).
- Avoid leaking secrets: never mark sensitive settings `isPublic`.
- Rotate JWT secret → revoke existing tokens (truncate `auth_tokens`).

## 19. Customizing Further

- Add new middleware under `shared/`.
- Introduce caching layer (e.g., Redis) behind services.
- Generate additional entities via CLI (from the toolkit) or manually following
  the pattern.

## 20. License

MIT – see root `LICENSE`.

## 21. Support

Toolkit issues / discussions: upstream repository. For this project, manage via
your own issue tracker.

---

Happy building! Replace placeholder names above and start shipping.
