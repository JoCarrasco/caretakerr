import { UserClaims } from '../value-objects/user-claims.vo';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly tenantId: string | null;
  readonly claims: UserClaims;
}
