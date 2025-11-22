import { ArticleControllerStatic } from "./article.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { CreateArticleSchema, UpdateArticleSchema } from "./article.dto.ts";
import { BaseRouteFactory } from "../../shared/routes/base-route.factory.ts";

const articleRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/articles",
  controller: ArticleControllerStatic,
  schemas: {
    create: CreateArticleSchema,
    update: UpdateArticleSchema,
  },
  publicRoutes: ["getAll", "getById"],
  middleware: {
    auth: requireAuth,
  },
});

export default articleRoutes;
