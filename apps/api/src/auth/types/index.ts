/**
 * JWT Payload interface for authentication
 */
export interface JwtPayload {
  sub: string; // User ID (subject)
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * OAuth Profile interface
 */
export interface OAuthProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
  provider: string;
}
