import { IIdentityProvider, User } from "@repo/auth-shared";
import { createClerkClient, verifyToken } from "@clerk/backend";

export class ClerkIdentityAdapter implements IIdentityProvider {
  private clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  async fetchUser(token?: string, requestedTenantId?: string): Promise<User | null> {
    try {
      if (!token) return null;
      const verified = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const activeTenantId = (verified.org_id as string) || null;

      if (requestedTenantId && activeTenantId !== requestedTenantId) {
        throw new Error("User token does not match the requested domain/tenant");
      }

      // 3. Fetch full profile
      const clerkUser = await this.clerk.users.getUser(verified.sub);
      
      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        tenantId: activeTenantId, // Dynamically injected from the token payload
        claims: {
          role: (clerkUser.publicMetadata.role as 'admin' | 'editor' | 'viewer') ?? 'viewer',
          permissions: (clerkUser.publicMetadata.permissions as string[]) ?? [],
          plan: clerkUser.publicMetadata.plan as string | undefined,
        }
      }

    } catch (err) {
      return null;
    }
  }
}
