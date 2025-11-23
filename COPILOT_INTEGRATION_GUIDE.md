# 🤖 tstack-kit Copilot Integration Guide

## 📋 Overview

This repository (`tstack-blog-v1-rc`) serves as the **reference implementation** for tstack-kit CLI's intelligent scaffold generation system. It demonstrates the **Base Abstractions Pattern** that eliminates 70-80% of backend boilerplate code.

**Repository URL:** <https://github.com/desingh-rajan/tstack-blog-v1-rc>

---

## 🎯 Purpose for tstack-kit Copilot

This repository should be used as:

1. **Reference Context** - Copilot can analyze this codebase to understand patterns
2. **Template Source** - CLI uses these patterns to generate entity scaffolds
3. **Documentation Hub** - Comprehensive guides for scaffold generation
4. **Test Examples** - Living examples of test patterns for generated code

---

## 📚 Key Documentation Files

### 1. Architecture Overview

**File:** `docs/BASE_ABSTRACTIONS_ARCHITECTURE.md` (~800 lines)

**What it explains:**

- Complete architecture of BaseService, BaseController, and Route Factories
- Lifecycle hooks pattern (beforeCreate, afterCreate, etc.)
- Declarative authorization pattern (ownership checks, role-based access)
- Code reduction metrics (70-80% less boilerplate)
- Step-by-step entity creation workflow
- Real-world examples from this repository

**Use this for:** Understanding the overall architecture and patterns

### 2. CLI Scaffold Generation

**File:** `docs/CLI_SCAFFOLD_GUIDE.md` (~900 lines)

**What it explains:**

- CLI command structure and all available options
- Complete file generation templates with Handlebars syntax
- Template variable calculation logic
- Post-generation automation steps
- Integration with tstack-kit phases

**Use this for:** Implementing the actual scaffold generation in CLI

### 3. Fresh UI Generation

**File:** `docs/FRESH_UI_GENERATION_GUIDE.md` (~700 lines)

**What it explains:**

- Fresh UI admin panel generation
- Component templates (DataTable, GenericForm, ShowPage, Pagination)
- Entity config structure
- Public vs admin page patterns
- API service generation

**Use this for:** Generating Fresh UI components and routes

### 4. Testing Patterns

**File:** `TESTING_COMPREHENSIVE_GUIDE.md` (~350 lines)

**What it explains:**

- Test patterns for lifecycle hooks
- Authorization testing (ownership, roles, superadmin bypass)
- Validation testing (Zod schemas + business rules)
- Integration testing patterns
- Best practices and anti-patterns

**Use this for:** Generating test files for entities

---

## 🏗️ Base Abstractions Components

### Layer 1: BaseService

**File:** `src/shared/services/base.service.ts` (~185 lines)

**Provides:**

- Generic CRUD operations (getAll, getById, create, update, delete)
- 6 lifecycle hooks (before/after for create/update/delete)
- Automatic updatedAt timestamps
- Type-safe with TypeScript generics

**Test Coverage:** 27 test cases in `src/shared/services/base.service.test.ts`

### Layer 2: BaseController

**File:** `src/shared/controllers/base.controller.ts` (~300 lines)

**Provides:**

- Generic HTTP handlers for CRUD operations
- Declarative authorization (authConfig in constructor)
- Role-based access control
- Ownership checks
- Superadmin bypass
- Custom authorization logic support

**Test Coverage:** Integration tests in entity test files (e.g., `article.test.ts`)

### Layer 3: Route Factories

**Files:**

- `src/shared/routes/base-route.factory.ts` (~75 lines) - CRUD routes
- `src/shared/routes/admin-route.factory.ts` (~60 lines) - Admin panel routes

**Provides:**

- Auto-registration of routes
- `publicRoutes` configuration (routes accessible without auth)
- `disabledRoutes` configuration (routes not exposed)
- Automatic middleware chain (auth + role + validation)

---

## 🔍 Reference Entity Implementations

### Simple Entity: Articles

**Location:** `src/entities/articles/*`

**Files:**

- `article.model.ts` - Drizzle schema
- `article.dto.ts` - Zod schemas
- `article.service.ts` - Service with lifecycle hooks (125 lines)
- `article.controller.ts` - Controller with ownership checks (55 lines)
- `article.route.ts` - Routes with public read access (18 lines)
- `article.admin.route.ts` - Admin panel routes
- `article.test.ts` - 14 integration tests

**Patterns Demonstrated:**

- Public read access (getAll, getById without auth)
- Ownership-based write access (only author can edit/delete)
- beforeCreate hook (generates slug, checks uniqueness)
- SQL joins (author name from users table)
- Validation (Zod schemas)

**Code Reduction:** 65% reduction in controller, 27% in service

### Complex Entity: Site Settings

**Location:** `src/entities/site_settings/*`

**Files:**

- `site-setting.model.ts` - Drizzle schema with JSONB
- `site-setting.dto.ts` - Zod schemas
- `site-setting.service.ts` - Service with schema validation (145 lines)
- `site-setting.controller.ts` - Controller with custom auth (115 lines)
- `site-setting.route.ts` - Public read, protected write (25 lines)
- `site-setting.admin.route.ts` - Admin panel with custom handlers (96 lines)
- `site-setting.test.ts` - 40+ tests
- `schemas/` - Dynamic JSON schema validation

**Patterns Demonstrated:**

- Public read access (only published settings)
- Protected write access (admin only)
- System setting protection (cannot delete, must reset)
- Custom authorization (customCheck in authConfig)
- JSON schema validation (dynamic validation against schemas)
- Custom admin handlers (override update/delete for special logic)

---

## 🚀 How tstack-kit CLI Should Use This Repository

### Phase 1: Backend Scaffold Generation

**Command:**

```bash
tstack-kit generate entity article \
  --with-admin \
  --with-tests \
  --public-routes=getAll,getById \
  --auth=ownership \
  --ownership-field=authorId \
  --hooks=beforeCreate
```

**Process:**

1. Parse CLI options
2. Build template context (see `docs/CLI_SCAFFOLD_GUIDE.md`)
3. Render templates using Handlebars
4. Generate 6-8 files (model, dto, service, controller, route, admin route, test, migration)
5. Auto-register routes in `src/main.ts`
6. Run migrations, format code, run tests
7. Print success message with next steps

**Templates:** All templates are in `docs/CLI_SCAFFOLD_GUIDE.md` sections 1-9

### Phase 2: Fresh UI Admin Panel Generation

**Command:**

```bash
tstack-kit generate fresh-ui article \
  --api-url=http://localhost:3000 \
  --with-auth \
  --admin-path=/admin \
  --public-pages=list,detail
```

**Process:**

1. Parse CLI options
2. Build Fresh UI context
3. Generate 9 files (config, types, service, 6 route pages)
4. Update navigation in AdminLayout
5. Format code
6. Print success message with URLs

**Templates:** All templates are in `docs/FRESH_UI_GENERATION_GUIDE.md` sections 1-9

### Phase 3: AI-Assisted Customization

**Copilot Integration:**

1. Provide this repository URL as context to AI
2. AI analyzes existing entities to understand patterns
3. AI suggests appropriate CLI options based on user requirements
4. AI can customize generated code (add specific columns, validation rules, business logic)
5. AI explains generated code and how to customize it further

**Example Prompts:**

- "Generate a blog article entity similar to the one in tstack-blog-v1-rc"
- "Create a product entity with image uploads and category relationships"
- "Generate admin panel for managing users with role-based access"

---

## 📊 Benefits & Metrics

### Code Reduction

- **Services:** 27% reduction (Article: 172 → 125 lines)
- **Controllers:** 65% reduction (Article: 157 → 55 lines)
- **Routes:** 40% reduction (Article: 30 → 18 lines)
- **Overall:** 70-80% less boilerplate for new entities

### Time Savings

- **Manual:** 2-3 hours to write boilerplate for new entity
- **With CLI:** 10-15 minutes to customize generated scaffold
- **Reduction:** 90% time savings!

### Quality Improvements

- ✅ Consistent patterns across all entities
- ✅ Type-safe with TypeScript generics
- ✅ Comprehensive test coverage (138 tests passing)
- ✅ Production-ready authorization (ownership + roles + superadmin)
- ✅ Declarative configuration (less imperative code)
- ✅ Maintainable (changes to base classes benefit all entities)

---

## 🧪 Test Coverage

**Total:** 138 test steps across 7 test suites

**Test Suites:**

1. **BaseService** (27 tests) - Unit tests for CRUD + lifecycle hooks
2. **Article** (14 tests) - Integration tests for full HTTP flow
3. **Article Admin** (25+ tests) - Admin panel tests
4. **Site Setting** (40+ tests) - Public + protected routes
5. **Site Setting Admin** (25+ tests) - Admin panel with custom logic
6. **Auth** (20+ tests) - Registration, login, JWT validation
7. **Error Handler** (5+ tests) - Validation and error formatting

**Run Tests:**

```bash
deno task test
```

**Expected Output:**

```
ok | 7 passed (138 steps) | 0 failed (4s)
```

---

## 📖 Quick Start for Developers

### 1. Clone & Setup

```bash
git clone git@github.com:desingh-rajan/tstack-blog-v1-rc.git
cd tstack-blog-v1-rc
cp .env.example .env.development.local
# Edit .env.development.local with your database credentials
deno task db:create
deno task db:migrate
deno task seed:superadmin
```

### 2. Run Development Server

```bash
deno task dev
```

### 3. Run Tests

```bash
deno task test
```

### 4. Study the Code

1. Read `docs/BASE_ABSTRACTIONS_ARCHITECTURE.md` (architecture overview)
2. Review `src/shared/services/base.service.ts` (base service)
3. Review `src/shared/controllers/base.controller.ts` (base controller)
4. Review `src/entities/articles/*` (simple entity example)
5. Review `src/entities/site_settings/*` (complex entity example)
6. Run tests to see patterns in action

---

## 🎓 Learning Path for New Developers

### Beginner (Day 1)

1. Read `README.md` - Project overview
2. Read `docs/BASE_ABSTRACTIONS_ARCHITECTURE.md` - Understand the patterns
3. Review `src/entities/articles/article.service.ts` - Simple entity service
4. Run tests: `deno task test src/entities/articles/article.test.ts`

### Intermediate (Day 2-3)

1. Study `src/shared/services/base.service.ts` - Base service implementation
2. Study `src/shared/controllers/base.controller.ts` - Base controller implementation
3. Review lifecycle hooks pattern in `base.service.test.ts`
4. Review authorization patterns in `article.test.ts`

### Advanced (Day 4-5)

1. Study `src/entities/site_settings/*` - Complex entity with custom logic
2. Review `docs/CLI_SCAFFOLD_GUIDE.md` - Understand CLI generation
3. Review `docs/FRESH_UI_GENERATION_GUIDE.md` - Understand UI generation
4. Read `TESTING_COMPREHENSIVE_GUIDE.md` - Master testing patterns

---

## 🔗 Related Resources

### Official Documentation

- **tstack-kit CLI:** [npm package / GitHub repo]
- **@tstack/admin:** Admin panel library
- **@tstack/fresh-ui:** Fresh UI components

### Technologies Used

- **Deno 2.x** - Runtime
- **Hono** - Web framework
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Zod** - Schema validation
- **Fresh** - UI framework (in blog-v1-ui)

### Community

- **Discord:** [Link to tstack Discord]
- **GitHub Discussions:** Use this repo's discussions for questions

---

## 🎯 Next Steps for tstack-kit Integration

### For CLI Developers

1. ✅ Review all documentation files in `docs/`
2. ✅ Implement template rendering with Handlebars
3. ✅ Add CLI commands for entity and fresh-ui generation
4. ✅ Test generation against this reference repository
5. ✅ Integrate AI assistance for customization

### For AI/Copilot Integration

1. ✅ Provide this repository URL as context
2. ✅ Allow AI to analyze entity patterns
3. ✅ Let AI suggest appropriate CLI options
4. ✅ Enable AI to customize generated scaffolds
5. ✅ Train AI on testing patterns from this repo

### For Documentation Writers

1. ✅ Use this repository in tutorials
2. ✅ Reference specific files as examples
3. ✅ Link to test files for validation
4. ✅ Show before/after code comparisons

---

## 📝 Contributing

This is a reference implementation repository. If you find issues or have suggestions:

1. Open an issue with detailed description
2. Reference specific files and line numbers
3. Suggest improvements with code examples
4. Test your suggestions against the test suite

---

## 📄 License

[Add your license here]

---

## 🙏 Acknowledgments

This repository demonstrates best practices from:

- Rails (convention over configuration)
- NestJS (decorator-based architecture)
- Spring Boot (lifecycle hooks)
- Laravel (declarative authorization)

All adapted for **Deno + Hono + TypeScript**! 🎉

---

## 📞 Contact

For questions about tstack-kit integration, reach out to:

- **GitHub Issues:** Use this repository's issue tracker
- **Email:** [Your email]
- **Discord:** [Discord server link]

---

**Ready to eliminate 70-80% of your backend boilerplate?** Start using tstack-kit CLI with this reference repository today! 🚀
