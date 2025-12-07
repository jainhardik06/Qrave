export type UserRole = 'SUPER_ADMIN' | 'TENANT_OWNER' | 'MANAGER' | 'CHEF' | 'CUSTOMER';

export interface UserIdentity {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
}
