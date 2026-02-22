export interface UserClaims {
  readonly role: 'admin' | 'editor' | 'viewer';
  readonly permissions: string[];
  readonly plan?: string;
}





