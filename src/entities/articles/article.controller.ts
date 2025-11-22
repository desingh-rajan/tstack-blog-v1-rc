import { Context } from "hono";
import { ArticleService } from "./article.service.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";

const articleService = new ArticleService();

export class ArticleController extends BaseController<typeof articleService> {
  constructor() {
    super(articleService, "Article", {
      update: {
        ownershipCheck: (article, userId) => article.authorId === userId,
      },
      delete: {
        ownershipCheck: (article, userId) => article.authorId === userId,
      },
    });
  }

  /**
   * Create article with authenticated user as author
   */
  override create = async (c: Context) => {
    const user = c.get("user");
    if (!user) {
      throw new BadRequestError("User not authenticated");
    }

    const validatedData = c.get("validatedData");
    const articleData = {
      ...validatedData,
      isPublished: validatedData.isPublished ?? false,
    };

    const article = await articleService.createArticle(articleData, user.id);
    return c.json(
      ApiResponse.success(article, "Article created successfully"),
      201,
    );
  };
}

// Export static methods for backward compatibility with routes
const controller = new ArticleController();
export const ArticleControllerStatic = controller.toStatic();
