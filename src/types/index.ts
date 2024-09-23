export type Role = 'ADMIN' | 'STAFF' | 'STUDENT';
export type GetUserType = {
  id: string;
  role: Role;
  email: string;
};
export type RestrictProperties<T, U> = {
  [K in keyof T]: K extends keyof U ? T[K] : never;
} & Required<U>;
