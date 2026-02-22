import { IIdentityProvider, User } from '@repo/auth-shared';

export class GuestIdentityAdapter implements IIdentityProvider {
  async fetchUser(token?: string, requestedTenantId?: string): Promise<User | null> {
    return {
      id: 'local-guest-id',
      email: 'guest@localhost',
      tenantId: null,
      claims: {
        role: 'admin',
        permissions: ['*'],
      }
    }
  }
}
