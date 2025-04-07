// utils/auth-utils.ts
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  aud: string;
  exp: number;
  sub: string;
  email: string;
  phone: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: Record<string, any>;
  role: string;
  user_role: string;
  aal: string;
  amr: {
    method: string;
    timestamp: number;
  }[];
  is_anonymous: boolean;
  iss: string;
  session_id: string;
  iat: number;
  [key: string]: any;
}

/**
 * Decodes the JWT token and returns the payload
 * @param token JWT token string
 * @returns Decoded JWT payload
 */
export const decodeJWT = (token: string): JWTPayload => {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    throw new Error('Invalid JWT token');
  }
};

/**
 * Extracts custom claims from a Supabase session
 * @param session Supabase session object
 * @returns Object with extracted custom claims
 */
export const getCustomClaims = (session: any) => {
  if (!session || !session.access_token) {
    return null;
  }

  try {
    const decoded = decodeJWT(session.access_token);
    // Extract relevant claims
    const { role, ...otherClaims } = decoded;
    
    // Return an object with all custom claims
    return {
      role,
      // Add any other custom claims you need to extract
      ...otherClaims
    };
  } catch (error) {
    console.error('Error extracting custom claims:', error);
    return null;
  }
};

/**
 * Gets the user role from the session
 * @param session Supabase session object 
 * @returns User role string or null if not found
 */
export const getUserRole = (session: any): string | null => {
  if (!session || !session.access_token) {
    return null;
  }

  try {
    const decoded = decodeJWT(session.access_token);
    return decoded.user_role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};