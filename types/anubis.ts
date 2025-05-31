// ANUBIS TYPE DEFINITIONS
export interface AnubisConfig {
  enabled: boolean;
  difficulty: number;
  jwtSecret: string;
  cookieDomain?: string;
  bypassDevelopment: boolean;
  protectedRoutes: string[];
  excludedRoutes: string[];
  allowedUserAgents: string[];
}

// CHALLENGE INTERFACES
export interface AnubisChallenge {
  challenge: string;
  difficulty: number;
  timestamp: number;
  clientFingerprint: string;
}

export interface AnubisChallengeResponse {
  nonce: number;
  hash: string;
  challenge: string;
  timestamp: number;
}

// JWT PAYLOAD INTERFACE
export interface AnubisJWTPayload {
  fingerprint: string;
  exp: number;
  iat: number;
  difficulty: number;
}

// ROUTE PROTECTION CONFIGURATION
export interface RouteProtectionConfig {
  path: string;
  enabled: boolean;
  customDifficulty?: number;
  description?: string;
}

// ANUBIS CONTEXT INTERFACE
export interface AnubisContextType {
  isEnabled: boolean;
  isProtected: boolean;
  currentRoute: string;
  toggleProtection: (path: string, enabled: boolean) => void;
  updateConfig: (config: Partial<AnubisConfig>) => void;
  getRouteConfig: (path: string) => RouteProtectionConfig | null;
} 