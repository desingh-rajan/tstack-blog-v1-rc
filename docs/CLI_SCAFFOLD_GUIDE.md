# tstack-kit CLI Scaffold Generation Guide

## 🎯 Purpose

This guide explains how **tstack-kit CLI** should generate entity scaffolds based on the base abstractions pattern implemented in this repository.

Reference: `docs/BASE_ABSTRACTIONS_ARCHITECTURE.md`

---

## 🚀 CLI Commands

### Basic Entity Generation

```bash
# Generate complete entity with default options
tstack-kit generate entity <entity-name>

# Examples
tstack-kit generate entity article
tstack-kit generate entity product
tstack-kit generate entity comment
```

### Advanced Options

```bash
tstack-kit generate entity <entity-name> [options]

Options:
  --with-admin              Generate admin panel routes (@tstack/admin)
  --with-tests              Generate integration test file
  --public-routes=<routes>  Comma-separated list of public routes (default: none)
                            Values: getAll, getById
  --disabled-routes=<routes> Comma-separated list of routes to disable
                            Values: getAll, getById, create, update, delete
  --auth=<type>             Authorization type (default: none)
                            Values: none, ownership, role, custom
  --ownership-field=<field> Field for ownership checks (default: userId)
                            Example: authorId, ownerId, createdBy
  --roles=<roles>           Comma-separated list of allowed roles
                            Example: admin,superadmin
  --hooks=<hooks>           Comma-separated list of lifecycle hooks to generate
                            Values: beforeCreate, afterCreate, beforeUpdate, 
                                    afterUpdate, beforeDelete, afterDelete
  --skip-migration          Don't generate database migration
  --with-fresh-ui           Generate Fresh UI components and routes
```

### Examples

```bash
# Public blog with ownership checks
tstack-kit generate entity article \
  --with-admin \
  --with-tests \
  --public-routes=getAll,getById \
  --auth=ownership \
  --ownership-field=authorId \
  --hooks=beforeCreate

# Admin-only users management
tstack-kit generate entity user \
  --with-admin \
  --auth=role \
  --roles=admin,superadmin

# Read-only public API
tstack-kit generate entity category \
  --public-routes=getAll,getById \
  --disabled-routes=create,update,delete

# Internal API with custom auth
tstack-kit generate entity internal-log \
  --auth=custom \
  --disabled-routes=getAll
```

---

## 📦 Generated Files Structure

```
src/entities/<entity-name>/
├── <entity>.model.ts        # Drizzle schema
├── <entity>.dto.ts          # Zod schemas + TypeScript types
├── <entity>.service.ts      # Service extending BaseService
├── <entity>.controller.ts   # Controller extending BaseController
├── <entity>.route.ts        # CRUD routes using BaseRouteFactory
├── <entity>.admin.route.ts  # [if --with-admin] Admin panel routes
└── <entity>.test.ts         # [if --with-tests] Integration tests

migrations/
└── XXXX_create_<entity>_table.sql  # [if not --skip-migration]
```

---

## 📝 File Generation Templates

### 1. Model File (`article.model.ts`)

```typescript
import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "../auth/user.model.ts";

export const {{entityNamePlural}} = pgTable("{{tableName}}", {
  id: serial("id").primaryKey(),
  
  // TODO: Add your columns here
  // Example fields below - customize as needed:
  title: text("title").notNull(),
  content: text("content").notNull(),
  
  {{#if ownershipField}}
  {{ownershipField}}: integer("{{ownershipFieldSnake}}").notNull().references(() => users.id),
  {{/if}}
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type {{EntityName}} = typeof {{entityNamePlural}}.$inferSelect;
export type New{{EntityName}} = typeof {{entityNamePlural}}.$inferInsert;
```

### 2. DTO File (`article.dto.ts`)

```typescript
import { z } from "zod";

// TODO: Customize validation rules for your entity
export const Create{{EntityName}}Schema = z.object({
  // Example fields - replace with your own:
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters"),
  
  // Add more fields as needed
});

export const Update{{EntityName}}Schema = Create{{EntityName}}Schema.partial();

export type Create{{EntityName}}DTO = z.infer<typeof Create{{EntityName}}Schema>;
export type Update{{EntityName}}DTO = z.infer<typeof Update{{EntityName}}Schema>;
```

### 3. Service File (`article.service.ts`)

```typescript
import { eq, and } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { BaseService } from "../../shared/services/base.service.ts";
import { db } from "../../config/database.ts";
import { {{entityNamePlural}}, type {{EntityName}} } from "./{{entityName}}.model.ts";
import { type Create{{EntityName}}DTO, type Update{{EntityName}}DTO } from "./{{entityName}}.dto.ts";
{{#if needsUserImport}}
import { users } from "../auth/user.model.ts";
{{/if}}

export class {{EntityName}}Service extends BaseService<
  {{EntityName}},
  Create{{EntityName}}DTO,
  Update{{EntityName}}DTO,
  {{EntityName}}
> {
  constructor() {
    super({{entityNamePlural}}, "{{entityNamePlural}}");
  }

  {{#if hasGetAllOverride}}
  // Override for custom queries (joins, filters, etc.)
  override async getAll(): Promise<{{EntityName}}[]> {
    const result = await db
      .select({
        ...getTableColumns({{entityNamePlural}}),
        // TODO: Add custom fields or joins here
        {{#if ownershipField}}
        ownerName: users.username,  // Example join
        {{/if}}
      })
      .from({{entityNamePlural}})
      {{#if ownershipField}}
      .leftJoin(users, eq({{entityNamePlural}}.{{ownershipField}}, users.id))
      {{/if}}
      // TODO: Add filters if needed
      // .where(eq({{entityNamePlural}}.published, true))
      ;
    
    return result;
  }
  {{/if}}

  {{#each hooks}}
  {{#if (eq this "beforeCreate")}}
  // Execute logic BEFORE creating entity
  protected override async beforeCreate(data: Create{{EntityName}}DTO): Promise<Create{{EntityName}}DTO> {
    // TODO: Add custom logic here
    // Examples:
    // - Generate slugs
    // - Check uniqueness
    // - Transform data
    // - Validate business rules
    
    return data;
  }
  {{/if}}

  {{#if (eq this "afterCreate")}}
  // Execute logic AFTER creating entity
  protected override async afterCreate(entity: {{EntityName}}): Promise<void> {
    // TODO: Add custom logic here
    // Examples:
    // - Send notifications
    // - Update related entities
    // - Invalidate caches
    // - Log audit trail
  }
  {{/if}}

  {{#if (eq this "beforeUpdate")}}
  // Execute logic BEFORE updating entity
  protected override async beforeUpdate(
    id: number,
    data: Update{{EntityName}}DTO
  ): Promise<Update{{EntityName}}DTO> {
    // TODO: Add custom logic here
    
    return data;
  }
  {{/if}}

  {{#if (eq this "afterUpdate")}}
  // Execute logic AFTER updating entity
  protected override async afterUpdate(entity: {{EntityName}}): Promise<void> {
    // TODO: Add custom logic here
  }
  {{/if}}

  {{#if (eq this "beforeDelete")}}
  // Execute logic BEFORE deleting entity
  protected override async beforeDelete(id: number): Promise<void> {
    // TODO: Add custom logic here
    // Examples:
    // - Check if entity can be deleted
    // - Throw error if deletion not allowed
  }
  {{/if}}

  {{#if (eq this "afterDelete")}}
  // Execute logic AFTER deleting entity (only called on successful deletion)
  protected override async afterDelete(id: number): Promise<void> {
    // TODO: Add custom logic here
    // Examples:
    // - Clean up related entities
    // - Update counters
  }
  {{/if}}
  {{/each}}
}

export const {{entityName}}Service = new {{EntityName}}Service();
```

### 4. Controller File (`article.controller.ts`)

```typescript
import { Context } from "hono";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { {{entityName}}Service } from "./{{entityName}}.service.ts";
import { ApiResponse } from "../../shared/utils/apiResponse.ts";

export class {{EntityName}}Controller extends BaseController<typeof {{entityName}}Service> {
  constructor() {
    super({{entityName}}Service, "{{EntityName}}"{{#if hasAuthConfig}}, {
      {{#if authConfig.create}}
      create: {
        {{#if authConfig.create.roles}}
        roles: [{{authConfig.create.roles}}],
        {{/if}}
        {{#if authConfig.create.ownershipCheck}}
        ownershipCheck: (entity, userId) => entity.{{ownershipField}} === userId,
        {{/if}}
      },
      {{/if}}
      {{#if authConfig.update}}
      update: {
        {{#if authConfig.update.roles}}
        roles: [{{authConfig.update.roles}}],
        {{/if}}
        {{#if authConfig.update.ownershipCheck}}
        ownershipCheck: (entity, userId) => entity.{{ownershipField}} === userId,
        {{/if}}
      },
      {{/if}}
      {{#if authConfig.delete}}
      delete: {
        {{#if authConfig.delete.roles}}
        roles: [{{authConfig.delete.roles}}],
        {{/if}}
        {{#if authConfig.delete.ownershipCheck}}
        ownershipCheck: (entity, userId) => entity.{{ownershipField}} === userId,
        {{/if}}
      },
      {{/if}}
    }{{/if}});
  }

  {{#if needsCreateOverride}}
  // Override create to inject user-specific data
  override create = async (c: Context) => {
    const validatedData = c.get("validatedData");
    const user = c.get("user");
    
    const {{entityName}} = await this.service.create({
      ...validatedData,
      {{ownershipField}}: user.id,  // Inject from JWT
    });
    
    return c.json(
      ApiResponse.success({{entityName}}, "{{EntityName}} created successfully"),
      201
    );
  };
  {{/if}}
}

const controller = new {{EntityName}}Controller();
export const {{EntityName}}ControllerStatic = controller.toStatic();
```

### 5. Route File (`article.route.ts`)

```typescript
import { BaseRouteFactory } from "../../shared/routes/base-route.factory.ts";
import { {{EntityName}}ControllerStatic } from "./{{entityName}}.controller.ts";
import { Create{{EntityName}}Schema, Update{{EntityName}}Schema } from "./{{entityName}}.dto.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
{{#if roles}}
import { requireRole } from "../../shared/middleware/requireRole.ts";
{{/if}}

const {{entityName}}Routes = BaseRouteFactory.createCrudRoutes({
  basePath: "/{{entityNamePlural}}",
  controller: {{EntityName}}ControllerStatic,
  schemas: {
    create: Create{{EntityName}}Schema,
    update: Update{{EntityName}}Schema,
  },
  {{#if publicRoutes}}
  publicRoutes: [{{publicRoutes}}],
  {{/if}}
  {{#if disabledRoutes}}
  disabledRoutes: [{{disabledRoutes}}],
  {{/if}}
  {{#if hasMiddleware}}
  middleware: {
    {{#if needsAuth}}
    auth: requireAuth,
    {{/if}}
    {{#if roles}}
    role: requireRole({{roles}}),
    {{/if}}
  },
  {{/if}}
});

export default {{entityName}}Routes;
```

### 6. Admin Route File (`article.admin.route.ts`) [if --with-admin]

```typescript
import { HonoAdminAdapter } from "@tstack/admin/adapters";
import { DrizzleAdapter } from "@tstack/admin/orm";
import { AdminRouteFactory } from "../../shared/routes/admin-route.factory.ts";
import { {{entityNamePlural}} } from "./{{entityName}}.model.ts";
import { db } from "../../config/database.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
{{#if roles}}
import { requireRole } from "../../shared/middleware/requireRole.ts";
{{/if}}

const adminAdapter = new HonoAdminAdapter({
  ormAdapter: new DrizzleAdapter({{entityNamePlural}}, { db }),
  entityName: "{{entityName}}",
  entityNamePlural: "{{entityNamePlural}}",
  columns: ["id", /* TODO: Add visible columns */],
  searchable: [/* TODO: Add searchable columns */],
  sortable: ["id", "createdAt"],
  {{#if roles}}
  allowedRoles: [{{roles}}],
  {{/if}}
  baseUrl: "/ts-admin/{{entityNamePlural}}",
});

const adminRoutes = AdminRouteFactory.createAdminRoutes({
  baseUrl: "/ts-admin/{{entityNamePlural}}",
  adapter: adminAdapter,
  authMiddleware: [
    requireAuth,
    {{#if roles}}
    requireRole({{roles}}),
    {{/if}}
  ],
  {{#if hasCustomHandlers}}
  customHandlers: {
    // TODO: Add custom handlers if needed
    // update: {{EntityName}}ControllerStatic.update,
    // delete: {{EntityName}}ControllerStatic.delete,
  },
  {{/if}}
});

export default adminRoutes;
```

### 7. Test File (`article.test.ts`) [if --with-tests]

```typescript
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import app from "../../main.ts";
import { createTestUser } from "../../_test_setup.ts";
import { db } from "../../config/database.ts";
import { {{entityNamePlural}} } from "./{{entityName}}.model.ts";

describe("{{EntityName}} Integration Tests", () => {
  let {{entityName}}Id: number;
  {{#if ownershipField}}
  let ownerToken: string;
  let otherUserToken: string;
  let superadminToken: string;
  {{else}}
  let userToken: string;
  {{/if}}

  beforeAll(async () => {
    {{#if ownershipField}}
    // Setup test users
    const owner = await createTestUser("owner@test.local", "password", "user");
    ownerToken = owner.token;

    const other = await createTestUser("other@test.local", "password", "user");
    otherUserToken = other.token;

    const admin = await createTestUser("admin@test.local", "password", "superadmin");
    superadminToken = admin.token;
    {{else}}
    const user = await createTestUser("user@test.local", "password", "user");
    userToken = user.token;
    {{/if}}
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete({{entityNamePlural}}).execute();
  });

  {{#if hasPublicGetAll}}
  describe("GET /{{entityNamePlural}}", () => {
    it("should allow public access to list {{entityNamePlural}}", async () => {
      const res = await app.request("/{{entityNamePlural}}");
      assertEquals(res.status, 200);
    });
  });
  {{/if}}

  {{#if hasPublicGetById}}
  describe("GET /{{entityNamePlural}}/:id", () => {
    it("should allow public access to view {{entityName}}", async () => {
      // TODO: Create test entity first
      const res = await app.request(`/{{entityNamePlural}}/${{{entityName}}Id}`);
      assertEquals(res.status, 200);
    });
  });
  {{/if}}

  describe("POST /{{entityNamePlural}}", () => {
    {{#if needsAuth}}
    it("should require authentication", async () => {
      const res = await app.request("/{{entityNamePlural}}", {
        method: "POST",
        body: JSON.stringify({ /* TODO: Add test data */ }),
      });
      assertEquals(res.status, 401);
    });

    it("should create {{entityName}} with valid data", async () => {
      const res = await app.request("/{{entityNamePlural}}", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${{{#if ownershipField}}ownerToken{{else}}userToken{{/if}}}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // TODO: Add valid test data
        }),
      });
      assertEquals(res.status, 201);

      const json = await res.json();
      {{entityName}}Id = json.data.id;
    });

    it("should validate required fields", async () => {
      const res = await app.request("/{{entityNamePlural}}", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${{{#if ownershipField}}ownerToken{{else}}userToken{{/if}}}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      assertEquals(res.status, 400);
    });
    {{else}}
    it("should create {{entityName}} without authentication", async () => {
      const res = await app.request("/{{entityNamePlural}}", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // TODO: Add valid test data
        }),
      });
      assertEquals(res.status, 201);
    });
    {{/if}}
  });

  describe("PUT /{{entityNamePlural}}/:id", () => {
    {{#if ownershipCheck}}
    it("should allow owner to update their {{entityName}}", async () => {
      const res = await app.request(`/{{entityNamePlural}}/${{{entityName}}Id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${ownerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // TODO: Add update data
        }),
      });
      assertEquals(res.status, 200);
    });

    it("should deny non-owner from updating", async () => {
      const res = await app.request(`/{{entityNamePlural}}/${{{entityName}}Id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${otherUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // TODO: Add update data
        }),
      });
      assertEquals(res.status, 403);
    });

    it("should allow superadmin to update any {{entityName}}", async () => {
      const res = await app.request(`/{{entityNamePlural}}/${{{entityName}}Id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${superadminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // TODO: Add update data
        }),
      });
      assertEquals(res.status, 200);
    });
    {{else}}
    it("should update {{entityName}}", async () => {
      const res = await app.request(`/{{entityNamePlural}}/${{{entityName}}Id}`, {
        method: "PUT",
        headers: {
          {{#if needsAuth}}
          "Authorization": `Bearer ${userToken}`,
          {{/if}}
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // TODO: Add update data
        }),
      });
      assertEquals(res.status, 200);
    });
    {{/if}}
  });

  describe("DELETE /{{entityNamePlural}}/:id", () => {
    {{#if ownershipCheck}}
    it("should allow owner to delete their {{entityName}}", async () => {
      const res = await app.request(`/{{entityNamePlural}}/${{{entityName}}Id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${ownerToken}` },
      });
      assertEquals(res.status, 200);
    });
    {{else}}
    it("should delete {{entityName}}", async () => {
      const res = await app.request(`/{{entityNamePlural}}/${{{entityName}}Id}`, {
        method: "DELETE",
        {{#if needsAuth}}
        headers: { "Authorization": `Bearer ${userToken}` },
        {{/if}}
      });
      assertEquals(res.status, 200);
    });
    {{/if}}
  });

  // TODO: Add more test cases as needed
  // - Test validation rules
  // - Test business logic in lifecycle hooks
  // - Test edge cases
});
```

### 8. Migration File (`XXXX_create_article_table.sql`)

```sql
-- Create {{entityNamePlural}} table
CREATE TABLE {{tableName}} (
  id SERIAL PRIMARY KEY,
  
  -- TODO: Add your columns here
  -- Example fields below - customize as needed:
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  {{#if ownershipField}}
  {{ownershipFieldSnake}} INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  {{/if}}
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
{{#if ownershipField}}
CREATE INDEX idx_{{tableName}}_{{ownershipFieldSnake}} ON {{tableName}}({{ownershipFieldSnake}});
{{/if}}
CREATE INDEX idx_{{tableName}}_created_at ON {{tableName}}(created_at);

-- TODO: Add more indexes as needed for queries
```

---

## 🔧 CLI Implementation Logic

### Template Variable Calculation

```typescript
interface TemplateContext {
  entityName: string;              // "article"
  EntityName: string;              // "Article" 
  entityNamePlural: string;        // "articles"
  tableName: string;               // "articles"
  ownershipField?: string;         // "authorId"
  ownershipFieldSnake?: string;    // "author_id"
  publicRoutes?: string[];         // ["getAll", "getById"]
  disabledRoutes?: string[];       // ["delete"]
  authType: "none" | "ownership" | "role" | "custom";
  roles?: string[];                // ["admin", "superadmin"]
  hooks?: string[];                // ["beforeCreate", "afterCreate"]
  
  // Computed flags
  hasAuthConfig: boolean;
  needsAuth: boolean;
  needsUserImport: boolean;
  ownershipCheck: boolean;
  hasPublicGetAll: boolean;
  hasPublicGetById: boolean;
  needsCreateOverride: boolean;
  hasGetAllOverride: boolean;
  hasMiddleware: boolean;
  hasCustomHandlers: boolean;
}

function buildContext(options: CLIOptions): TemplateContext {
  const entityName = options.entityName.toLowerCase();
  const EntityName = capitalize(entityName);
  const entityNamePlural = pluralize(entityName);
  const tableName = entityNamePlural;
  
  const ownershipField = options.ownershipField || (options.auth === "ownership" ? "userId" : undefined);
  const ownershipFieldSnake = ownershipField ? toSnakeCase(ownershipField) : undefined;
  
  const publicRoutes = options.publicRoutes || [];
  const disabledRoutes = options.disabledRoutes || [];
  const authType = options.auth || "none";
  const roles = options.roles ? options.roles.split(",") : undefined;
  const hooks = options.hooks ? options.hooks.split(",") : [];
  
  // Computed flags
  const hasAuthConfig = authType !== "none";
  const needsAuth = !publicRoutes.includes("create") && authType !== "none";
  const needsUserImport = !!ownershipField;
  const ownershipCheck = authType === "ownership";
  const hasPublicGetAll = publicRoutes.includes("getAll");
  const hasPublicGetById = publicRoutes.includes("getById");
  const needsCreateOverride = !!ownershipField;
  const hasGetAllOverride = needsUserImport; // If has ownership, likely needs joins
  const hasMiddleware = needsAuth || !!roles;
  const hasCustomHandlers = false; // User adds manually
  
  return {
    entityName,
    EntityName,
    entityNamePlural,
    tableName,
    ownershipField,
    ownershipFieldSnake,
    publicRoutes,
    disabledRoutes,
    authType,
    roles,
    hooks,
    hasAuthConfig,
    needsAuth,
    needsUserImport,
    ownershipCheck,
    hasPublicGetAll,
    hasPublicGetById,
    needsCreateOverride,
    hasGetAllOverride,
    hasMiddleware,
    hasCustomHandlers,
  };
}
```

### Template Rendering

Use a templating engine like **Handlebars** or **EJS**:

```typescript
import Handlebars from "handlebars";

// Register helpers
Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("capitalize", (str) => str.charAt(0).toUpperCase() + str.slice(1));

// Compile templates
const templates = {
  model: Handlebars.compile(modelTemplate),
  dto: Handlebars.compile(dtoTemplate),
  service: Handlebars.compile(serviceTemplate),
  controller: Handlebars.compile(controllerTemplate),
  route: Handlebars.compile(routeTemplate),
  adminRoute: Handlebars.compile(adminRouteTemplate),
  test: Handlebars.compile(testTemplate),
  migration: Handlebars.compile(migrationTemplate),
};

// Render files
const context = buildContext(options);
const files = {
  model: templates.model(context),
  dto: templates.dto(context),
  service: templates.service(context),
  controller: templates.controller(context),
  route: templates.route(context),
  adminRoute: options.withAdmin ? templates.adminRoute(context) : null,
  test: options.withTests ? templates.test(context) : null,
  migration: !options.skipMigration ? templates.migration(context) : null,
};

// Write files to disk
for (const [name, content] of Object.entries(files)) {
  if (content) {
    writeFile(getFilePath(name, context), content);
  }
}
```

---

## 🎓 Reference Examples from This Repository

### Simple Entity (Articles)

- **Service:** `src/entities/articles/article.service.ts` (~125 lines)
- **Controller:** `src/entities/articles/article.controller.ts` (~55 lines)
- **Routes:** `src/entities/articles/article.route.ts` (~18 lines)
- **Tests:** `src/entities/articles/article.test.ts` (14 integration tests)
- **Patterns:**
  - Public read access (getAll, getById)
  - Ownership-based write access
  - Lifecycle hook (beforeCreate for slug generation)
  - SQL join (author name)

### Complex Entity (Site Settings)

- **Service:** `src/entities/site_settings/site-setting.service.ts` (~145 lines)
- **Controller:** `src/entities/site_settings/site-setting.controller.ts` (~115 lines)
- **Routes:** `src/entities/site_settings/site-setting.route.ts` (~25 lines)
- **Admin Routes:** `src/entities/site_settings/site-setting.admin.route.ts` (~96 lines)
- **Tests:** 40+ tests across public + admin test files
- **Patterns:**
  - Public read access (published settings only)
  - Protected write access (admin only)
  - System setting protection (cannot delete, must reset)
  - Schema validation (JSON validation against dynamic schemas)
  - Custom admin handlers (override update/delete)

---

## ✅ Post-Generation Steps

After generating files, CLI should:

1. **Auto-register routes** in `src/main.ts`:

   ```typescript
   import {{entityName}}Routes from "./entities/{{entityNamePlural}}/{{entityName}}.route.ts";
   {{#if withAdmin}}
   import {{entityName}}AdminRoutes from "./entities/{{entityNamePlural}}/{{entityName}}.admin.route.ts";
   {{/if}}
   
   app.route("/", {{entityName}}Routes);
   {{#if withAdmin}}
   app.route("/", {{entityName}}AdminRoutes);
   {{/if}}
   ```

2. **Run migration** (if not skipped):

   ```bash
   deno task db:migrate
   ```

3. **Format code**:

   ```bash
   deno fmt
   ```

4. **Run type check**:

   ```bash
   deno task check
   ```

5. **Run tests** (if generated):

   ```bash
   deno task test src/entities/{{entityNamePlural}}/{{entityName}}.test.ts
   ```

6. **Print success message**:

   ```
   ✅ Successfully generated {{EntityName}} entity!
   
   Files created:
   - src/entities/{{entityNamePlural}}/{{entityName}}.model.ts
   - src/entities/{{entityNamePlural}}/{{entityName}}.dto.ts
   - src/entities/{{entityNamePlural}}/{{entityName}}.service.ts
   - src/entities/{{entityNamePlural}}/{{entityName}}.controller.ts
   - src/entities/{{entityNamePlural}}/{{entityName}}.route.ts
   {{#if withAdmin}}
   - src/entities/{{entityNamePlural}}/{{entityName}}.admin.route.ts
   {{/if}}
   {{#if withTests}}
   - src/entities/{{entityNamePlural}}/{{entityName}}.test.ts
   {{/if}}
   
   Routes registered:
   - GET    /{{entityNamePlural}}
   - GET    /{{entityNamePlural}}/:id
   - POST   /{{entityNamePlural}}
   - PUT    /{{entityNamePlural}}/:id
   - DELETE /{{entityNamePlural}}/:id
   {{#if withAdmin}}
   - Admin panel: /ts-admin/{{entityNamePlural}}
   {{/if}}
   
   Next steps:
   1. Customize the generated files (marked with TODO comments)
   2. Run: deno task db:migrate
   3. Run: deno task test
   4. Start server: deno task dev
   ```

---

## 🚀 Integration with tstack-kit

### Phase 1: Backend Scaffold

- ✅ Generate entity files based on this guide
- ✅ Support all CLI options
- ✅ Auto-register routes
- ✅ Run migrations

### Phase 2: Fresh UI Scaffold (if --with-fresh-ui)

- Generate Fresh UI components:
  - List page (`routes/{{entityNamePlural}}/index.tsx`)
  - Detail page (`routes/{{entityNamePlural}}/[id].tsx`)
  - Create page (`routes/{{entityNamePlural}}/new.tsx`)
  - Edit page (`routes/{{entityNamePlural}}/[id]/edit.tsx`)
- Generate entity config (`config/entities/{{entityNamePlural}}.config.tsx`)
- Generate API service (`entities/{{entityNamePlural}}/{{entityName}}.service.ts`)
- Generate TypeScript types (`entities/{{entityNamePlural}}/{{entityName}}.types.ts`)

### Phase 3: AI Assistance

- Provide this repository as reference context
- AI can analyze existing entities to understand patterns
- AI can suggest appropriate options for new entities
- AI can customize generated code based on user requirements

---

## 📝 Developer Experience

### Workflow

1. Developer runs: `tstack-kit generate entity article --with-admin --public-routes=getAll,getById --auth=ownership --ownership-field=authorId`
2. CLI generates 6 files with TODO comments
3. Developer customizes:
   - Add specific columns to model
   - Add validation rules to DTOs
   - Add custom queries to service
   - Add business logic to lifecycle hooks
4. Run migration, test, and deploy

### Time Savings

- ❌ Manual: ~2-3 hours to write boilerplate for new entity
- ✅ With CLI: ~10-15 minutes to customize generated scaffold
- **90% time reduction!**

---

This guide provides everything needed for tstack-kit CLI to generate production-ready entity scaffolds! 🎉
