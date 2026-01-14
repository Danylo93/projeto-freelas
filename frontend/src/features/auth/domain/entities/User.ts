export enum UserType {
  PRESTADOR = "PRESTADOR",
  CLIENTE = "CLIENTE",
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  avatarUrl?: string;
}
