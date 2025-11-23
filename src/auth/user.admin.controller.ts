import { Context } from "hono";
import { userService } from "./user.service.ts";
import { ApiResponse } from "../shared/utils/response.ts";
import { ValidationError } from "../shared/utils/errors.ts";

export class UserAdminController {
  /**
   * Create a new user (with password hashing)
   */
  static async create(c: Context) {
    const body = await c.req.json();

    // Validate required fields
    if (!body.email || !body.password) {
      throw new ValidationError("Email and password are required");
    }

    const result = await userService.create(body);

    return c.json(ApiResponse.success(result, "User created successfully"), 201);
  }

  /**
   * Get all users
   */
  static async getAll(c: Context) {
    const result = await userService.getAll();
    return c.json(ApiResponse.success(result));
  }

  /**
   * Get user by ID
   */
  static async getById(c: Context) {
    const id = parseInt(c.req.param("id"));
    const result = await userService.getById(id);

    if (!result) {
      return c.json(ApiResponse.error("User not found"), 404);
    }

    return c.json(ApiResponse.success(result));
  }

  /**
   * Update user
   */
  static async update(c: Context) {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const result = await userService.update(id, body);

    if (!result) {
      return c.json(ApiResponse.error("User not found"), 404);
    }

    return c.json(ApiResponse.success(result, "User updated successfully"));
  }

  /**
   * Delete user
   */
  static async delete(c: Context) {
    const id = parseInt(c.req.param("id"));
    const success = await userService.delete(id);

    if (!success) {
      return c.json(ApiResponse.error("User not found"), 404);
    }

    return c.json(ApiResponse.success(null, "User deleted successfully"));
  }
}
