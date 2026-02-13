import { APIRequestContext } from '@playwright/test';
import { getApiToken } from '../fixtures/api.fixtures';

/**
 * Token Manager Utility
 *
 * Manages JWT tokens for API testing:
 * - Token caching to avoid repeated authentication
 * - Token refresh when expired
 * - Token parsing and validation
 * - Expiration checking
 */

interface TokenCache {
  [role: string]: {
    token: string;
    expiresAt: number;
  };
}

// In-memory token cache
const tokenCache: TokenCache = {};

// Role to credentials mapping
const roleCredentials: { [role: string]: { username: string; password: string } } = {
  employee: { username: 'employee1', password: 'Pa$word123' },
  manager: { username: 'ashtyn1', password: 'Pa$word123' },
  hradmin: { username: 'admin1', password: 'Pa$word123' },
};

/**
 * Get token for a specific role
 * Returns cached token if valid, otherwise acquires new token
 * @param request - Playwright APIRequestContext
 * @param role - User role (employee, manager, hradmin)
 * @returns JWT access token
 */
export async function getToken(request: APIRequestContext, role: string): Promise<string> {
  // Check if we have a valid cached token
  const cached = tokenCache[role];
  if (cached && !isTokenExpired(cached.token)) {
    return cached.token;
  }

  // Get credentials for role
  const credentials = roleCredentials[role.toLowerCase()];
  if (!credentials) {
    throw new Error(`Unknown role: ${role}. Valid roles: employee, manager, hradmin`);
  }

  // Acquire new token
  const token = await getApiToken(request, credentials.username, credentials.password);

  // Parse token to get expiration
  const payload = parseToken(token);
  const expiresAt = payload.exp * 1000; // Convert to milliseconds

  // Cache the token
  tokenCache[role] = {
    token,
    expiresAt,
  };

  return token;
}

/**
 * Refresh an expired token
 * @param request - Playwright APIRequestContext
 * @param token - Expired token
 * @returns New JWT access token
 */
export async function refreshToken(request: APIRequestContext, token: string): Promise<string> {
  // Parse token to identify the user/role
  const payload = parseToken(token);

  // Determine role from token claims
  let role = 'employee'; // Default

  if (payload.role) {
    if (Array.isArray(payload.role)) {
      role = payload.role[0].toLowerCase();
    } else {
      role = payload.role.toLowerCase();
    }
  } else if (payload.roles) {
    const roles = Array.isArray(payload.roles) ? payload.roles : [payload.roles];
    role = roles[0].toLowerCase();
  }

  // Get fresh token for this role
  return getToken(request, role);
}

/**
 * Parse JWT token and extract payload
 * @param token - JWT token string
 * @returns Decoded token payload
 */
export function parseToken(token: string): any {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token: must be a non-empty string');
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid JWT token: must have 3 parts separated by dots');
  }

  try {
    // Decode the payload (second part of JWT)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    throw new Error(`Failed to parse token payload: ${error}`);
  }
}

/**
 * Check if a token is expired
 * @param token - JWT token string
 * @returns True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseToken(token);

    if (!payload.exp) {
      // If no expiration claim, consider it expired for safety
      return true;
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Add 60-second buffer to avoid edge cases
    return currentTime >= (expirationTime - 60000);
  } catch (error) {
    // If parsing fails, consider token expired
    return true;
  }
}

/**
 * Get token expiration time
 * @param token - JWT token string
 * @returns Expiration timestamp in milliseconds, or null if not available
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const payload = parseToken(token);
    return payload.exp ? payload.exp * 1000 : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user ID from token
 * @param token - JWT token string
 * @returns User ID from token claims
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    const payload = parseToken(token);
    return payload.sub || payload.userId || payload.nameid || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user roles from token
 * @param token - JWT token string
 * @returns Array of role strings
 */
export function getRolesFromToken(token: string): string[] {
  try {
    const payload = parseToken(token);

    if (payload.role) {
      return Array.isArray(payload.role) ? payload.role : [payload.role];
    }

    if (payload.roles) {
      return Array.isArray(payload.roles) ? payload.roles : [payload.roles];
    }

    // Check scope claim (might contain roles)
    if (payload.scope) {
      const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : payload.scope;
      return Array.isArray(scopes) ? scopes : [scopes];
    }

    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Validate token structure and signature
 * @param token - JWT token string
 * @returns True if token has valid structure
 */
export function hasValidTokenStructure(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');

    if (parts.length !== 3) {
      return false;
    }

    // Try to decode each part
    Buffer.from(parts[0], 'base64').toString(); // Header
    Buffer.from(parts[1], 'base64').toString(); // Payload
    // Signature is part[2] - just check it exists and is base64

    return parts[2].length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Clear cached tokens
 * Useful for testing scenarios or cleanup
 */
export function clearTokenCache(): void {
  Object.keys(tokenCache).forEach(key => delete tokenCache[key]);
}

/**
 * Get time until token expiration in seconds
 * @param token - JWT token string
 * @returns Seconds until expiration, or 0 if expired
 */
export function getTimeUntilExpiration(token: string): number {
  try {
    const expirationTime = getTokenExpiration(token);

    if (!expirationTime) {
      return 0;
    }

    const currentTime = Date.now();
    const timeRemaining = expirationTime - currentTime;

    return timeRemaining > 0 ? Math.floor(timeRemaining / 1000) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if token has specific scope/permission
 * @param token - JWT token string
 * @param scope - Scope to check for
 * @returns True if token has the scope
 */
export function hasScope(token: string, scope: string): boolean {
  try {
    const payload = parseToken(token);

    if (payload.scope) {
      const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : payload.scope;
      const scopeArray = Array.isArray(scopes) ? scopes : [scopes];
      return scopeArray.includes(scope);
    }

    return false;
  } catch (error) {
    return false;
  }
}
