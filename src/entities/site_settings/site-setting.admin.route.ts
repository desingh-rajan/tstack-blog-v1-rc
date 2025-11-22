/**
 * Admin CRUD Routes for Site Settings
 * Auto-generated admin interface using @tstack/admin
 * 
 * IMPORTANT: Custom Handler Overrides
 * ====================================
 * This route uses custom handlers for update/delete operations instead of the default
 * adapter methods. This demonstrates how to override default CRUD behavior when you need:
 * 
 * 1. Custom validation logic (e.g., prevent deletion of system settings)
 * 2. Additional business rules (e.g., schema validation for system settings)
 * 3. Authorization checks beyond role-based access
 * 4. Side effects (e.g., logging, notifications, cascading updates)
 * 
 * HOW TO OVERRIDE ROUTES:
 * -----------------------
 * Pass `customHandlers` to AdminRouteFactory.createAdminRoutes():
 * 
 * ```typescript
 * customHandlers: {
 *   update: YourController.customUpdate,  // Called instead of adapter.update()
 *   delete: YourController.customDelete,  // Called instead of adapter.destroy()
 * }
 * ```
 * 
 * WHY THIS EXAMPLE NEEDS OVERRIDES:
 * ----------------------------------
 * - System settings (isSystem=true) cannot be deleted, only reset
 * - System setting values must be validated against their schema
 * - Default adapter methods don't know about these business rules
 * 
 * WHEN TO USE CUSTOM HANDLERS:
 * -----------------------------
 * - ✅ Complex validation beyond schema (e.g., uniqueness checks, state transitions)
 * - ✅ Authorization checks based on entity state (e.g., ownership, status)
 * - ✅ Side effects (audit logs, webhooks, cache invalidation)
 * - ❌ Simple CRUD with just role-based auth (use adapter defaults)
 * - ❌ Read-only operations (adapter methods are usually sufficient)
 */

import { HonoAdminAdapter } from "@tstack/admin";
import { DrizzleAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { siteSettings } from "./site-setting.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { SiteSettingController } from "./site-setting.controller.ts";
import { requireSuperadmin } from "../../shared/middleware/requireRole.ts";
import { AdminRouteFactory } from "../../shared/routes/admin-route.factory.ts";

const ADMIN_BASE_URL = "/ts-admin/site_settings";

const adminAdapter = new HonoAdminAdapter({
  ormAdapter: new DrizzleAdapter(siteSettings, { db }),
  entityName: "site_setting",
  entityNamePlural: "site_settings",
  columns: [
    "id",
    "key",
    "category",
    "value",
    "isPublic",
    "description",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["key", "category", "description"],
  sortable: ["id", "key", "category", "createdAt", "updatedAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Use factory with custom handlers for update/delete operations
const app = AdminRouteFactory.createAdminRoutes({
  baseUrl: ADMIN_BASE_URL,
  adapter: adminAdapter,
  authMiddleware: [requireAuth],
  // Override update/delete to enforce system setting protection
  customHandlers: {
    update: SiteSettingController.update, // Validates system setting schemas
    delete: SiteSettingController.delete, // Prevents deletion of system settings
  },
});

// Custom routes for system settings reset functionality
// (These are domain-specific routes not part of standard CRUD)
app.post(
  `${ADMIN_BASE_URL}/:key/reset`,
  requireSuperadmin,
  SiteSettingController.resetToDefault,
);
app.post(
  `${ADMIN_BASE_URL}/reset-all`,
  requireSuperadmin,
  SiteSettingController.resetAllToDefaults,
);

export default app;
