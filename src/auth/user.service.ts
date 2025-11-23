import { BaseService } from "../shared/services/base.service.ts";
import { users, type SafeUser } from "./user.model.ts";
import { hashPassword } from "../shared/utils/password.ts";

interface CreateUserDTO {
  email: string;
  username?: string;
  password: string;
  role?: "user" | "admin" | "moderator" | "superadmin";
  isActive?: boolean;
  phone?: string;
}

/**
 * UserService - Handles user CRUD operations with password hashing
 */
export class UserService extends BaseService<
  SafeUser,
  CreateUserDTO,
  Partial<CreateUserDTO>,
  SafeUser
> {
  constructor() {
    super(users, "users");
  }

  /**
   * Hash password before creating user
   */
  protected override beforeCreate(
    data: CreateUserDTO,
  ): Promise<CreateUserDTO> {
    // Hash the password before storing
    return hashPassword(data.password).then((hashedPassword) => ({
      ...data,
      password: hashedPassword,
    }));
  }

  /**
   * Hash password before updating user (if password is being changed)
   */
  protected override beforeUpdate(
    _id: number,
    data: Partial<CreateUserDTO>,
  ): Promise<Partial<CreateUserDTO>> {
    // If password is being updated, hash it
    if (data.password) {
      return hashPassword(data.password).then((hashedPassword) => ({
        ...data,
        password: hashedPassword,
      }));
    }

    return Promise.resolve(data);
  }
}

export const userService = new UserService();
