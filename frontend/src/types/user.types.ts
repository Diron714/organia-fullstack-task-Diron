export type Role = "ADMIN" | "USER";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt?: string;
}
