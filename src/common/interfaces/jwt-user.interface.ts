export interface JwtUser {
  id: number;
  email: string;
  roles: string[]; // dynamic role names from the database, e.g. ['admin', 'manager', 'user']
}
export interface JwtAdmin {
  id: number;
  email: string;
  roles: string[]; // dynamic role names from the database, e.g. ['admin', 'manager']
}
export interface JwtPayload {
  sub: number;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}
