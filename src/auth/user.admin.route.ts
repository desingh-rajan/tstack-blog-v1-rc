import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../config/database.ts";
import { users } from "./user.model.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";
import { AdminRouteFactory } from "../shared/routes/admin-route.factory.ts";

const ADMIN_BASE_URL = "/ts-admin/users";

const ormAdapter = new DrizzleAdapter(users, {
  db,
  idColumn: "id",
  idType: "number",
});

const userAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "user",
  entityNamePlural: "users",
  columns: [
    "id",
    "email",
    "username",
    "role",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["email", "username"],
  sortable: ["id", "email", "username", "role", "createdAt"],
  allowedRoles: ["superadmin"],
  baseUrl: ADMIN_BASE_URL,
});

const userAdminRoutes = AdminRouteFactory.createAdminRoutes({
  baseUrl: ADMIN_BASE_URL,
  adapter: userAdmin,
  authMiddleware: [requireAuth],
});

export default userAdminRoutes;
