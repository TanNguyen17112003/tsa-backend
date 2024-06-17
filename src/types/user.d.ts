export interface UserType {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  verifcationEmail?: string;
}

enum UserRole {
  CUSTOMER,
  SHIPPER,
  STAFF,
  ADMIN
}
