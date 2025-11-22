import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { AdminRouteFactory } from "../../shared/routes/admin-route.factory.ts";

/**
 * REFERENCE IMPLEMENTATION: Article Admin Routes
 *
 * This file demonstrates how to create an admin panel for your entities using @tstack/admin.
 * The admin panel provides a full-featured CRUD JSON API with:
 * - RESTful JSON API at /ts-admin/articles
 * - Pagination, search, and sorting
 * - Role-based access control
 *
 * When you scaffold a new entity with `tstack scaffold products`,
 * a similar file (product.admin.route.ts) will be automatically generated.
 *
 * TODO for developers:
 * 1. Customize the `columns` array to match your entity's fields
 * 2. Update `searchable` to include fields you want to search
 * 3. Configure `sortable` for columns that should be sortable
 * 4. Adjust `allowedRoles` based on your access control needs
 * 5. See article.admin.test.ts for how to test admin routes
 */

const ADMIN_BASE_URL = "/ts-admin/articles";

const ormAdapter = new DrizzleAdapter(articles, {
  db,
  idColumn: "id",
  idType: "number",
});

const articleAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "article",
  entityNamePlural: "articles",
  columns: [
    "id",
    "title",
    "slug",
    "content",
    "excerpt",
    "isPublished",
    "authorId",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["title", "slug", "content", "excerpt"],
  sortable: ["id", "title", "isPublished", "createdAt", "updatedAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

const articleAdminRoutes = AdminRouteFactory.createAdminRoutes({
  baseUrl: ADMIN_BASE_URL,
  adapter: articleAdmin,
  authMiddleware: [requireAuth],
});

export default articleAdminRoutes;
