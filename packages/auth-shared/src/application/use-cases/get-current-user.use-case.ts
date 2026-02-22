import { IIdentityProvider } from '../ports/identity-provider.port';
import { User} from '../../domain/entities/user.entity';

export class GetCurrentUserUseCase {
  constructor(private readonly identityProvider: IIdentityProvider) {}

  async execute(token?: string, requestedTenantId?: string): Promise<User | null> {
    if (!token) return null;
    return await this.identityProvider.fetchUser(token, requestedTenantId);
  }
}
