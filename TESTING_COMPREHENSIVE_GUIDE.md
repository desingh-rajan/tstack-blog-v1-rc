# Testing Guide

## Overview

This project has comprehensive test coverage demonstrating best practices for testing base abstractions and entity implementations in a Deno + Hono API.

## Test Structure

```
src/
├── shared/
│   ├── services/
│   │   └── base.service.test.ts       # BaseService unit tests (27 test cases)
│   └── middleware/
│       └── errorHandler.test.ts       # Error handling tests
├── entities/
│   ├── articles/
│   │   ├── article.test.ts           # Article integration tests (14 test cases)
│   │   └── article.admin.test.ts     # Article admin panel tests
│   └── site_settings/
│       ├── site-setting.test.ts      # Site settings integration tests
│       └── site-setting.admin.test.ts # Site settings admin panel tests
└── auth/
    └── auth.test.ts                  # Authentication tests
```

## Running Tests

```bash
# Run all tests
deno task test

# Run specific test file
deno test src/shared/services/base.service.test.ts --allow-all

# Run tests with coverage
deno task test:coverage
```

## Test Coverage

### ✅ BaseService (Unit Tests)
**File:** `src/shared/services/base.service.test.ts`  
**Test Count:** 27 test cases  
**Purpose:** Validate CRUD operations and lifecycle hooks

**What's Tested:**
- **CRUD Operations:**
  - `create()`: Insert with validation and hooks
  - `getAll()`: List all records
  - `getById()`: Fetch single record
  - `update()`: Modify existing records with timestamp
  - `delete()`: Remove records

- **Lifecycle Hooks:**
  - `beforeCreate` / `afterCreate`: Data transformation
  - `beforeUpdate` / `afterUpdate`: Audit trails
  - `beforeDelete` / `afterDelete`: Cleanup operations

**Key Patterns Demonstrated:**
```typescript
// Testing hook execution order
it("should execute beforeCreate and afterCreate hooks", async () => {
  const result = await hooksService.create({ name: "hook test" });
  
  // Verify data transformation
  assertEquals(result.name, "HOOK TEST"); // beforeCreate uppercased it
  
  // Verify hook execution order
  assertEquals(hooksCalled, ["beforeCreate", "afterCreate"]);
});
```

### ✅ Article Entity (Integration Tests)
**File:** `src/entities/articles/article.test.ts`  
**Test Count:** 14 test cases  
**Purpose:** Full-stack integration testing with real HTTP requests

**What's Tested:**
- **Public Access:** Unauthenticated users can list/view published articles
- **Authentication:** JWT token validation for protected routes
- **Authorization:** Ownership checks (users can only edit their own articles)
- **Validation:** Zod schema validation and custom business rules
- **Service Features:**
  - Auto-slug generation from titles
  - Author joins (SQL relationships)
  - Published vs draft filtering

**Key Patterns Demonstrated:**
```typescript
// Testing ownership authorization
it("should deny non-owner from updating article", async () => {
  const res = await app.request(`/articles/${testArticleId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${otherUserToken}`, // Different user
    },
    body: JSON.stringify({ title: "Hacked Title" }),
  });

  assertEquals(res.status, 403); // Forbidden
  assert(data.error?.message.includes("permission"));
});
```

### ✅ Site Settings (Integration Tests)
**Files:** `site-setting.test.ts` + `site-setting.admin.test.ts`  
**Purpose:** Test custom business logic and admin panel integration

**What's Tested:**
- Public read access for all site settings
- Superadmin-only write access (RBAC)
- System setting protection (cannot delete, only reset)
- Custom validation for system setting schemas
- Admin panel CRUD operations (@tstack/admin)

### ✅ Authentication (Integration Tests)
**File:** `src/auth/auth.test.ts`  
**Purpose:** Test user registration, login, and JWT flow

## Test Patterns Reference

### 1. Unit Testing Base Classes

**When to use:** Testing abstract base classes in isolation

```typescript
// Create concrete implementation for testing
class TestEntityService extends BaseService<...> {
  constructor() {
    super(testTable, "test_entities");
  }
}

// Test default behavior
it("should create a new record", async () => {
  const service = new TestEntityService();
  const result = await service.create({ name: "Test" });
  
  assertExists(result.id);
  assertEquals(result.name, "Test");
});
```

### 2. Integration Testing Entities

**When to use:** Testing entire HTTP request → controller → service → database flow

```typescript
// Setup: Create test users with tokens
beforeAll(async () => {
  const user = await createTestUser("test@example.com", "password");
  userToken = user.token;
});

// Test: Make real HTTP request
it("should allow authenticated user to create resource", async () => {
  const res = await app.request("/articles", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: "Test Article" }),
  });

  assertEquals(res.status, 201);
});
```

### 3. Testing Lifecycle Hooks

**Pattern:** Track hook execution with static properties

```typescript
class TestServiceWithHooks extends BaseService<...> {
  static hooksCalled: string[] = [];

  protected override beforeCreate(data: DTO): DTO {
    TestServiceWithHooks.hooksCalled.push("beforeCreate");
    return { ...data, transformed: true };
  }
}

it("should execute hooks in order", async () => {
  await service.create({ name: "Test" });
  
  assertEquals(hooksCalled, ["beforeCreate", "afterCreate"]);
});
```

### 4. Testing Authorization

**Pattern:** Test different user roles and ownership scenarios

```typescript
// Test 1: Owner can modify their own resource
it("should allow owner to update", async () => {
  const res = await app.request("/articles/1", {
    method: "PUT",
    headers: { "Authorization": `Bearer ${ownerToken}` },
    body: JSON.stringify({ title: "Updated" }),
  });

  assertEquals(res.status, 200);
});

// Test 2: Non-owner cannot modify
it("should deny non-owner from updating", async () => {
  const res = await app.request("/articles/1", {
    method: "PUT",
    headers: { "Authorization": `Bearer ${otherUserToken}` },
    body: JSON.stringify({ title: "Hacked" }),
  });

  assertEquals(res.status, 403);
});

// Test 3: Superadmin can modify anything
it("should allow superadmin to bypass ownership", async () => {
  const res = await app.request("/articles/1", {
    method: "PUT",
    headers: { "Authorization": `Bearer ${superadminToken}` },
    body: JSON.stringify({ title: "Admin Override" }),
  });

  assertEquals(res.status, 200);
});
```

### 5. Testing Validation

**Pattern:** Test schema validation and custom business rules

```typescript
it("should reject invalid data", async () => {
  const res = await app.request("/articles", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "AB", // Too short (min 3 characters)
      content: "Valid content",
    }),
  });

  assertEquals(res.status, 400);

  const data = await res.json();
  assertEquals(data.success, false);
  assertExists(data.error?.errors); // Array of validation errors
});
```

### 6. Testing Error Handling

**Pattern:** Verify proper HTTP status codes and error messages

```typescript
it("should return 404 for non-existent resource", async () => {
  const res = await app.request("/articles/99999");

  assertEquals(res.status, 404);

  const data = await res.json();
  assertEquals(data.success, false);
  assertExists(data.error?.message);
});

it("should return 400 for invalid ID format", async () => {
  const res = await app.request("/articles/invalid-id");

  assertEquals(res.status, 400);

  const data = await res.json();
  assert(data.error?.message.includes("Invalid ID"));
});
```

## Best Practices

### ✅ DO

1. **Use BDD-style describe/it blocks** for readability
2. **Test real HTTP requests** for integration tests
3. **Create test users in beforeAll** to avoid repetition
4. **Clean up test data in afterAll** to prevent pollution
5. **Test both success and failure scenarios**
6. **Test authorization for all roles** (user, admin, superadmin)
7. **Test edge cases** (null values, invalid IDs, etc.)

### ❌ DON'T

1. **Don't mock the database** in integration tests
2. **Don't share state between tests** (use beforeEach/afterEach)
3. **Don't test implementation details** (test behavior, not internals)
4. **Don't skip error case testing**
5. **Don't hardcode IDs** (use variables from test data creation)

## Test Coverage Summary

| Component | Test Type | Test Cases | Status |
|-----------|-----------|------------|--------|
| BaseService | Unit | 27 | ✅ Pass |
| Article Entity | Integration | 14 | ✅ Pass |
| Site Settings | Integration | 40+ | ✅ Pass |
| Site Settings Admin | Integration | 25+ | ✅ Pass |
| Authentication | Integration | 20+ | ✅ Pass |
| Error Handler | Unit | 5+ | ✅ Pass |
| **TOTAL** | - | **138** | **✅ All Pass** |

## Educational Value

These tests serve as **living documentation** for developers:

1. **How to test base abstractions** (BaseService, BaseController)
2. **How to test lifecycle hooks** (execution order, data transformation)
3. **How to test authorization** (ownership, roles, custom checks)
4. **How to test full HTTP flow** (request → response)
5. **How to structure integration tests** (setup, teardown, isolation)

## Next Steps

### Additional Test Coverage Needed

- [ ] BaseController unit tests (complex due to Hono context mocking)
- [ ] BaseRouteFactory tests (route registration, middleware application)
- [ ] AdminRouteFactory tests (custom handlers, adapter integration)
- [ ] Validation middleware tests (Zod schema integration)
- [ ] Performance tests (load testing, stress testing)

### Improvements

- [ ] Add test coverage reporting (e.g., `deno coverage`)
- [ ] Add E2E tests with Playwright
- [ ] Add API contract tests (OpenAPI validation)
- [ ] Add database migration tests

## References

- [Deno Testing Documentation](https://docs.deno.com/runtime/fundamentals/testing/)
- [BDD Testing Style](https://docs.deno.com/runtime/fundamentals/testing/#bdd-style)
- [Hono Testing Guide](https://hono.dev/docs/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)
