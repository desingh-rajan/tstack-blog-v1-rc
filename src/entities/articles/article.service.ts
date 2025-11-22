import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { users } from "../../auth/user.model.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import type {
  Article,
  ArticleResponseDTO,
  CreateArticleDTO,
  UpdateArticleDTO,
} from "./article.dto.ts";

export class ArticleService extends BaseService<
  Article,
  CreateArticleDTO & { authorId: number },
  UpdateArticleDTO,
  ArticleResponseDTO
> {
  constructor() {
    super(articles, "articles");
  }

  /**
   * Override to include author join and filter published articles
   */
  override async getAll(): Promise<ArticleResponseDTO[]> {
    const results = await db
      .select({
        ...getTableColumns(articles),
        authorName: users.username,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.isPublished, true));

    return results.map((row) => ({
      ...row,
      authorName: row.authorName ?? undefined,
    }));
  }

  /**
   * Override to include author join
   */
  override async getById(id: number): Promise<ArticleResponseDTO | null> {
    const result = await db
      .select({
        ...getTableColumns(articles),
        authorName: users.username,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return {
      ...result[0],
      authorName: result[0].authorName ?? undefined,
    };
  }

  /**
   * Generate slug before creation
   */
  protected override async beforeCreate(
    data: CreateArticleDTO & { authorId: number },
  ): Promise<CreateArticleDTO & { authorId: number }> {
    const slug = data.slug || this.generateSlug(data.title);

    const existing = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestError(`Article with slug "${slug}" already exists`);
    }

    return {
      ...data,
      slug,
      isPublished: data.isPublished ?? false,
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async createArticle(
    data: CreateArticleDTO,
    authorId: number,
  ): Promise<ArticleResponseDTO> {
    const result = await this.create({ ...data, authorId });

    return {
      ...result,
      authorName: undefined,
      isPublished: result.isPublished,
    };
  }
}
