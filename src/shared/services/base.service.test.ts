/**
 * REFERENCE IMPLEMENTATION: BaseService Test Suite
 *
 * This test demonstrates comprehensive testing of the BaseService class,
 * which provides standard CRUD operations and lifecycle hooks for all entities.
 *
 * TESTING PATTERNS DEMONSTRATED:
 * ================================
 *
 * 1. Testing Abstract Base Classes:
 *    - Create concrete test implementation to test abstract class
 *    - Test default behavior without overrides
 *    - Test lifecycle hook execution order
 *    - Test hook override behavior
 *
 * 2. CRUD Operation Testing:
 *    - Create: Insert new records
 *    - Read: getAll(), getById()
 *    - Update: Modify existing records with updatedAt timestamp
 *    - Delete: Remove records and verify
 *
 * 3. Lifecycle Hook Testing:
 *    - beforeCreate/afterCreate: Data transformation and side effects
 *    - beforeUpdate/afterUpdate: Validation and notifications
 *    - beforeDelete/afterDelete: Cleanup and cascading operations
 *    - Hook execution order validation
 *
 * 4. Database Integration Testing:
 *    - Real database operations (not mocked)
 *    - Transaction isolation per test
 *    - Proper cleanup in afterEach/afterAll
 *
 * WHY THIS IS IMPORTANT:
 * ======================
 * BaseService is the foundation for all entity services. These tests:
 * - Validate that CRUD operations work correctly
 * - Document how lifecycle hooks work
 * - Provide confidence when refactoring
 * - Serve as examples for developers extending the base class
 *
 * LEARN MORE:
 * ===========
 * - Base Service: src/shared/services/base.service.ts
 * - Lifecycle Hooks Pattern: Rails ActiveRecord callbacks
 */

import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { db } from "../../config/database.ts";
import { pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { BaseService } from "./base.service.ts";
import { sql } from "drizzle-orm";

// ============================================================================
// TEST SCHEMA & TYPES
// ============================================================================

/**
 * Test table for BaseService testing
 * Simulates a real entity with typical columns
 */
const testEntities = pgTable("test_entities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

interface TestEntity {
  id: number;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateTestEntityDTO {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

interface UpdateTestEntityDTO {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

// ============================================================================
// CONCRETE TEST IMPLEMENTATIONS
// ============================================================================

/**
 * Basic implementation without lifecycle hooks
 * Tests default BaseService behavior
 */
class TestEntityService extends BaseService<
  TestEntity,
  CreateTestEntityDTO,
  UpdateTestEntityDTO,
  TestEntity
> {
  constructor() {
    super(testEntities, "test_entities");
  }
}

/**
 * Implementation with lifecycle hooks
 * Tests hook execution and data transformation
 */
class TestEntityWithHooksService extends BaseService<
  TestEntity,
  CreateTestEntityDTO,
  UpdateTestEntityDTO,
  TestEntity
> {
  // Track hook execution for testing
  static hooksCalled: string[] = [];

  constructor() {
    super(testEntities, "test_entities");
  }

  protected override beforeCreate(data: CreateTestEntityDTO): CreateTestEntityDTO {
    TestEntityWithHooksService.hooksCalled.push("beforeCreate");
    // Transform data: uppercase the name
    return {
      ...data,
      name: data.name.toUpperCase(),
      metadata: { ...data.metadata, transformedBy: "beforeCreate" },
    };
  }

  protected override afterCreate(result: TestEntity): TestEntity {
    TestEntityWithHooksService.hooksCalled.push("afterCreate");
    return result;
  }

  protected override beforeUpdate(id: number, data: UpdateTestEntityDTO): UpdateTestEntityDTO {
    TestEntityWithHooksService.hooksCalled.push("beforeUpdate");
    // Add audit trail
    return {
      ...data,
      metadata: {
        ...data.metadata,
        lastModifiedId: id,
        modifiedBy: "beforeUpdate"
      },
    };
  }

  protected override afterUpdate(result: TestEntity): TestEntity {
    TestEntityWithHooksService.hooksCalled.push("afterUpdate");
    return result;
  }

  protected override async beforeDelete(id: number): Promise<void> {
    TestEntityWithHooksService.hooksCalled.push("beforeDelete");
    // Could perform cleanup or validation here
    console.log(`Preparing to delete entity ${id}`);
  }

  protected override async afterDelete(id: number): Promise<void> {
    TestEntityWithHooksService.hooksCalled.push("afterDelete");
    // Could trigger cascade deletes or notifications here
    console.log(`Successfully deleted entity ${id}`);
  }

  // Reset hook tracking
  static resetHooks() {
    TestEntityWithHooksService.hooksCalled = [];
  }
}

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let basicService: TestEntityService;
let hooksService: TestEntityWithHooksService;

// ============================================================================
// TEST SUITE
// ============================================================================

describe("BaseService", () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Create test table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_entities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        metadata JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    basicService = new TestEntityService();
    hooksService = new TestEntityWithHooksService();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await db.execute(sql`TRUNCATE TABLE test_entities RESTART IDENTITY CASCADE`);
    TestEntityWithHooksService.resetHooks();
  });

  afterAll(async () => {
    // Drop test table
    await db.execute(sql`DROP TABLE IF EXISTS test_entities CASCADE`);

    // Close DB connection
    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // CREATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("create()", () => {
    it("should create a new record with all fields", async () => {
      const data: CreateTestEntityDTO = {
        name: "Test Entity",
        description: "Test description",
        metadata: { key: "value" },
        isActive: true,
      };

      const result = await basicService.create(data);

      assertExists(result.id);
      assertEquals(result.name, "Test Entity");
      assertEquals(result.description, "Test description");
      assertEquals(result.metadata?.key, "value");
      assertEquals(result.isActive, true);
      assertExists(result.createdAt);
      assertExists(result.updatedAt);
    });

    it("should create a record with minimal required fields", async () => {
      const data: CreateTestEntityDTO = {
        name: "Minimal Entity",
      };

      const result = await basicService.create(data);

      assertExists(result.id);
      assertEquals(result.name, "Minimal Entity");
      assertEquals(result.description, null);
      assertEquals(result.isActive, true); // Default value
    });

    it("should execute beforeCreate and afterCreate hooks", async () => {
      const data: CreateTestEntityDTO = {
        name: "hook test",
        metadata: { original: true },
      };

      const result = await hooksService.create(data);

      // Verify beforeCreate transformed the name
      assertEquals(result.name, "HOOK TEST");

      // Verify beforeCreate modified metadata
      assertEquals(result.metadata?.transformedBy, "beforeCreate");
      assertEquals(result.metadata?.original, true);

      // Verify hook execution order
      assertEquals(TestEntityWithHooksService.hooksCalled, [
        "beforeCreate",
        "afterCreate",
      ]);
    });
  });

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  describe("getAll()", () => {
    it("should return empty array when no records exist", async () => {
      const results = await basicService.getAll();

      assertEquals(results, []);
    });

    it("should return all records", async () => {
      // Create test data
      await basicService.create({ name: "Entity 1" });
      await basicService.create({ name: "Entity 2" });
      await basicService.create({ name: "Entity 3" });

      const results = await basicService.getAll();

      assertEquals(results.length, 3);
      assertEquals(results[0].name, "Entity 1");
      assertEquals(results[1].name, "Entity 2");
      assertEquals(results[2].name, "Entity 3");
    });

    it("should return all columns by default", async () => {
      await basicService.create({
        name: "Full Entity",
        description: "Description",
        metadata: { test: true },
      });

      const results = await basicService.getAll();

      assertExists(results[0].id);
      assertExists(results[0].name);
      assertExists(results[0].description);
      assertExists(results[0].metadata);
      assertExists(results[0].isActive);
      assertExists(results[0].createdAt);
      assertExists(results[0].updatedAt);
    });
  });

  describe("getById()", () => {
    it("should return null when record does not exist", async () => {
      const result = await basicService.getById(999);

      assertEquals(result, null);
    });

    it("should return the correct record by ID", async () => {
      const entity1 = await basicService.create({ name: "Entity 1" });
      const entity2 = await basicService.create({ name: "Entity 2" });

      const result = await basicService.getById(entity2.id);

      assertExists(result);
      assertEquals(result.id, entity2.id);
      assertEquals(result.name, "Entity 2");
    });

    it("should return all columns", async () => {
      const entity = await basicService.create({
        name: "Full Entity",
        description: "Test",
        metadata: { key: "value" },
      });

      const result = await basicService.getById(entity.id);

      assertExists(result);
      assertExists(result.id);
      assertExists(result.name);
      assertExists(result.description);
      assertExists(result.metadata);
      assertExists(result.isActive);
      assertExists(result.createdAt);
      assertExists(result.updatedAt);
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("update()", () => {
    it("should return null when record does not exist", async () => {
      const result = await basicService.update(999, { name: "Updated" });

      assertEquals(result, null);
    });

    it("should update a single field", async () => {
      const entity = await basicService.create({ name: "Original" });

      const result = await basicService.update(entity.id, {
        name: "Updated",
      });

      assertExists(result);
      assertEquals(result.name, "Updated");
      assertEquals(result.id, entity.id);
    });

    it("should update multiple fields", async () => {
      const entity = await basicService.create({
        name: "Original",
        description: "Old description",
      });

      const result = await basicService.update(entity.id, {
        name: "Updated Name",
        description: "Updated description",
        isActive: false,
      });

      assertExists(result);
      assertEquals(result.name, "Updated Name");
      assertEquals(result.description, "Updated description");
      assertEquals(result.isActive, false);
    });

    it("should update the updatedAt timestamp", async () => {
      const entity = await basicService.create({ name: "Test" });
      const originalUpdatedAt = entity.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await basicService.update(entity.id, {
        name: "Updated",
      });

      assertExists(result);
      assertNotEquals(
        result.updatedAt.getTime(),
        originalUpdatedAt.getTime(),
      );
    });

    it("should execute beforeUpdate and afterUpdate hooks", async () => {
      const entity = await hooksService.create({ name: "Test" });
      TestEntityWithHooksService.resetHooks(); // Reset from create

      const result = await hooksService.update(entity.id, {
        name: "Updated",
        metadata: { original: true },
      });

      assertExists(result);

      // Verify beforeUpdate modified metadata
      assertEquals(result.metadata?.lastModifiedId, entity.id);
      assertEquals(result.metadata?.modifiedBy, "beforeUpdate");
      assertEquals(result.metadata?.original, true);

      // Verify hook execution order
      assertEquals(TestEntityWithHooksService.hooksCalled, [
        "beforeUpdate",
        "afterUpdate",
      ]);
    });

    it("should preserve fields not included in update", async () => {
      const entity = await basicService.create({
        name: "Original",
        description: "Description",
        metadata: { preserved: true },
      });

      const result = await basicService.update(entity.id, {
        name: "Updated Name Only",
      });

      assertExists(result);
      assertEquals(result.name, "Updated Name Only");
      assertEquals(result.description, "Description"); // Preserved
      assertEquals(result.metadata?.preserved, true); // Preserved
    });
  });

  // --------------------------------------------------------------------------
  // DELETE OPERATIONS
  // --------------------------------------------------------------------------

  describe("delete()", () => {
    it("should return false when record does not exist", async () => {
      const result = await basicService.delete(999);

      assertEquals(result, false);
    });

    it("should delete an existing record", async () => {
      const entity = await basicService.create({ name: "To Delete" });

      const result = await basicService.delete(entity.id);

      assertEquals(result, true);

      // Verify deletion
      const found = await basicService.getById(entity.id);
      assertEquals(found, null);
    });

    it("should execute beforeDelete and afterDelete hooks", async () => {
      const entity = await hooksService.create({ name: "Test" });
      TestEntityWithHooksService.resetHooks();

      const result = await hooksService.delete(entity.id);

      assertEquals(result, true);

      // Verify hook execution order
      assertEquals(TestEntityWithHooksService.hooksCalled, [
        "beforeDelete",
        "afterDelete",
      ]);
    });

    it("should only call afterDelete on successful deletion", async () => {
      const result = await hooksService.delete(999); // Non-existent

      assertEquals(result, false);

      // beforeDelete is called, but afterDelete should not be
      assertEquals(TestEntityWithHooksService.hooksCalled, ["beforeDelete"]);
    });

    it("should not affect other records", async () => {
      const entity1 = await basicService.create({ name: "Entity 1" });
      const entity2 = await basicService.create({ name: "Entity 2" });
      const entity3 = await basicService.create({ name: "Entity 3" });

      await basicService.delete(entity2.id);

      const remaining = await basicService.getAll();
      assertEquals(remaining.length, 2);
      assertEquals(remaining[0].id, entity1.id);
      assertEquals(remaining[1].id, entity3.id);
    });
  });

  // --------------------------------------------------------------------------
  // LIFECYCLE HOOK COMBINATIONS
  // --------------------------------------------------------------------------

  describe("Lifecycle Hook Integration", () => {
    it("should handle multiple operations with hooks correctly", async () => {
      TestEntityWithHooksService.resetHooks();

      // Create
      const entity = await hooksService.create({ name: "test" });
      assertEquals(TestEntityWithHooksService.hooksCalled, [
        "beforeCreate",
        "afterCreate",
      ]);

      // Update
      TestEntityWithHooksService.resetHooks();
      await hooksService.update(entity.id, { name: "updated" });
      assertEquals(TestEntityWithHooksService.hooksCalled, [
        "beforeUpdate",
        "afterUpdate",
      ]);

      // Delete
      TestEntityWithHooksService.resetHooks();
      await hooksService.delete(entity.id);
      assertEquals(TestEntityWithHooksService.hooksCalled, [
        "beforeDelete",
        "afterDelete",
      ]);
    });
  });
});
