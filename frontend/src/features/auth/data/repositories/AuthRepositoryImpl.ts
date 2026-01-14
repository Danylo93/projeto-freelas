import { AuthRepository } from "../../domain/repositories/AuthRepository";
import { User, UserType } from "../../domain/entities/User";

const API_URL = "http://localhost:8000/auth";

export class AuthRepositoryImpl implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error("Login failed");

    const data = await response.json();
    // Assuming API returns { user_data: ... }
    return this.mapUser(data.user_data);
  }

  async register(user: Omit<User, "id">, password: string): Promise<User> {
    // Implementation
    return {} as User;
  }

  async logout(): Promise<void> {
    // Clear tokens
  }

  async getCurrentUser(): Promise<User | null> {
    return null;
  }

  private mapUser(data: any): User {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      userType: data.user_type as UserType,
    };
  }
}
