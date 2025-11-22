import { AdminController } from "./admin.controller.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";
import { requireSuperadmin } from "../shared/middleware/requireRole.ts";
import { BaseRouteFactory } from "../shared/routes/base-route.factory.ts";
import { CreateAdminSchema, UpdateUserSchema } from "./admin.dto.ts";

/**
 * Admin Routes
 *
 * All routes require authentication + superadmin role
 * Only the system-defined superadmin can manage users and admins
 */

const adminRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/admin/users",
  controller: {
    getAll: AdminController.getAllUsers,
    getById: AdminController.getUserById,
    create: AdminController.createAdmin,
    update: AdminController.updateUser,
    delete: AdminController.deleteUser,
  },
  schemas: {
    create: CreateAdminSchema,
    update: UpdateUserSchema,
  },
  publicRoutes: [],
  middleware: {
    auth: requireAuth,
    role: requireSuperadmin,
  },
});

export default adminRoutes;
