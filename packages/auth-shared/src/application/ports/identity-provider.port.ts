import { User } from '../../domain/entities/user.entity';

export interface IIdentityProvider {
  fetchUser(token?: string, requestedTenantId?: string): Promise<User | null>;
}

