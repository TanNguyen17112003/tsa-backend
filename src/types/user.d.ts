export interface UserType {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  verifcationEmail?: string;
}

type UserRole = 'ADMIN' | 'SHIPPER' | 'STAFF' | 'CUSTOMER';
