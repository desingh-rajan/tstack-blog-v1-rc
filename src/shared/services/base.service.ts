import { eq } from "drizzle-orm";
import { db } from "../../config/database.ts";

/**
 * Base Service providing standard CRUD operations
 * Returns all columns by default - override for custom queries/joins
 */
export abstract class BaseService<T, CreateDTO, UpdateDTO, ResponseDTO> {
  constructor(
    // deno-lint-ignore no-explicit-any
    protected table: any,
    protected tableName: string,
  ) { }

  /**
   * Get all records
   */
  async getAll(): Promise<ResponseDTO[]> {
    const result = await db.select().from(this.table);
    return result as ResponseDTO[];
  }

  /**
   * Get single record by ID
   */
  async getById(id: number): Promise<ResponseDTO | null> {
    const result = await db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    return result.length === 0 ? null : (result[0] as ResponseDTO);
  }

  /**
   * Create a new record
   */
  async create(data: CreateDTO): Promise<ResponseDTO> {
    const processedData = this.beforeCreate
      ? await this.beforeCreate(data)
      : data;

    const [newRecord] = await db
      .insert(this.table)
      // deno-lint-ignore no-explicit-any
      .values(processedData as any)
      .returning();

    const result = newRecord as ResponseDTO;

    return this.afterCreate ? await this.afterCreate(result) : result;
  }

  /**
   * Update an existing record
   */
  async update(id: number, data: UpdateDTO): Promise<ResponseDTO | null> {
    // Call beforeUpdate hook if implemented
    const processedData = this.beforeUpdate
      ? await this.beforeUpdate(id, data)
      : data;

    const updated = await db
      .update(this.table)
      .set({
        ...processedData,
        updatedAt: new Date(),
      })
      .where(eq(this.table.id, id))
      .returning();

    if (updated.length === 0) {
      return null;
    }

    const result = updated[0] as ResponseDTO;

    // Call afterUpdate hook if implemented
    return this.afterUpdate ? await this.afterUpdate(result) : result;
  }

  /**
   * Delete a record
   */
  async delete(id: number): Promise<boolean> {
    // Call beforeDelete hook if implemented
    if (this.beforeDelete) {
      await this.beforeDelete(id);
    }

    const deleted = await db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();

    const success = deleted.length > 0;

    // Call afterDelete hook if implemented
    if (this.afterDelete && success) {
      await this.afterDelete(id);
    }

    return success;
  }

  // ============================================================================
  // Lifecycle Hooks (override in subclasses for custom behavior)
  // ============================================================================

  /**
   * Hook called before creating a record
   * Override to add custom validation or data transformation
   */
  protected beforeCreate?(data: CreateDTO): Promise<CreateDTO> | CreateDTO;

  /**
   * Hook called after creating a record
   * Override to add post-creation logic (notifications, etc.)
   */
  protected afterCreate?(
    result: ResponseDTO,
  ): Promise<ResponseDTO> | ResponseDTO;

  /**
   * Hook called before updating a record
   * Override to add custom validation or data transformation
   */
  protected beforeUpdate?(
    id: number,
    data: UpdateDTO,
  ): Promise<UpdateDTO> | UpdateDTO;

  /**
   * Hook called after updating a record
   * Override to add post-update logic
   */
  protected afterUpdate?(
    result: ResponseDTO,
  ): Promise<ResponseDTO> | ResponseDTO;

  /**
   * Hook called before deleting a record
   * Override to add custom validation or cleanup logic
   */
  protected beforeDelete?(id: number): Promise<void> | void;

  /**
   * Hook called after deleting a record
   * Override to add post-deletion cleanup
   */
  protected afterDelete?(id: number): Promise<void> | void;
}
