import type { AnubisConfig, RouteProtectionConfig } from '@/types/anubis';

// DEFAULT ANUBIS CONFIGURATION
const DEFAULT_CONFIG: AnubisConfig = {
  enabled: false,
  difficulty: 4,
  jwtSecret: '',
  bypassDevelopment: true,
  protectedRoutes: [
    '/',              // Home page
    '/about',         // About page
    '/expertise',     // Expertise page
    '/projects',      // Projects page
    '/careers',       // Careers page
    '/contact'        // Contact page
  ],
  excludedRoutes: [
    '/api/health',
    '/api/anubis',
    '/api/convex',      // Convex API routes
    '/api/convex/*',    // All Convex endpoints
    '/_next',           // Next.js internal routes
    '/_next/*',         // All Next.js static/internal
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/_vercel/*',       // Vercel internal routes
    '/api/auth/*',      // Authentication routes (NextAuth, etc.)
    '/api/webhooks/*',  // Webhook endpoints
    '/api/trpc/*'       // tRPC endpoints (if used)
  ],
  allowedUserAgents: [
    'Googlebot',
    'Bingbot',
    'Slurp',
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'facebookexternalhit',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'Applebot',
    'Vercel',           // Vercel monitoring
    'vercel-bot'        // Vercel internal bots
  ]
};

// ENVIRONMENT CONFIGURATION LOADER
export function loadAnubisConfig(): AnubisConfig {
  const config: AnubisConfig = {
    ...DEFAULT_CONFIG,
    enabled: process.env.ANUBIS_ENABLED === 'true',
    difficulty: parseInt(process.env.ANUBIS_DIFFICULTY || '4', 10),
    jwtSecret: process.env.ANUBIS_JWT_SECRET || generateDefaultSecret(),
    cookieDomain: process.env.ANUBIS_COOKIE_DOMAIN,
    bypassDevelopment: process.env.ANUBIS_BYPASS_DEVELOPMENT !== 'false'
  };

  // VALIDATE CONFIGURATION
  validateConfig(config);
  
  return config;
}

// CONFIGURATION VALIDATION
function validateConfig(config: AnubisConfig): void {
  if (config.enabled && !config.jwtSecret) {
    throw new Error('ANUBIS_JWT_SECRET is required when Anubis is enabled');
  }
  
  if (config.difficulty < 1 || config.difficulty > 10) {
    throw new Error('ANUBIS_DIFFICULTY must be between 1 and 10');
  }
}

// DEFAULT SECRET GENERATOR (FOR DEVELOPMENT)
function generateDefaultSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT secret must be provided in production');
  }
  return 'dev-secret-' + Math.random().toString(36).substring(2);
}

// ROUTE PROTECTION UTILITIES
export class RouteProtectionManager {
  private protectedRoutes: Map<string, RouteProtectionConfig> = new Map();
  
  constructor(private config: AnubisConfig) {
    this.initializeRoutes();
  }
  
  // INITIALIZE PROTECTED ROUTES
  private initializeRoutes(): void {
    this.config.protectedRoutes.forEach(path => {
      this.protectedRoutes.set(path, {
        path,
        enabled: true,
        description: `Protected route: ${path}`
      });
    });
  }
  
  // CHECK IF ROUTE IS PROTECTED
  isRouteProtected(pathname: string): boolean {
    if (!this.config.enabled) return false;
    
    // CHECK EXCLUDED ROUTES
    if (this.isRouteExcluded(pathname)) return false;
    
    // CHECK PROTECTED ROUTES
    for (const [path, config] of Array.from(this.protectedRoutes.entries())) {
      if (this.matchesPath(pathname, path) && config.enabled) {
        return true;
      }
    }
    
    return false;
  }
  
  // CHECK IF ROUTE IS EXCLUDED
  private isRouteExcluded(pathname: string): boolean {
    return this.config.excludedRoutes.some(excludedPath => 
      this.matchesPath(pathname, excludedPath)
    );
  }
  
  // PATH MATCHING UTILITY
  private matchesPath(pathname: string, pattern: string): boolean {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  }
  
  // ADD PROTECTED ROUTE
  addProtectedRoute(config: RouteProtectionConfig): void {
    this.protectedRoutes.set(config.path, config);
  }
  
  // REMOVE PROTECTED ROUTE
  removeProtectedRoute(path: string): void {
    this.protectedRoutes.delete(path);
  }
  
  // TOGGLE ROUTE PROTECTION
  toggleRouteProtection(path: string, enabled: boolean): void {
    const existing = this.protectedRoutes.get(path);
    if (existing) {
      existing.enabled = enabled;
    } else {
      this.addProtectedRoute({ path, enabled });
    }
  }
  
  // GET ROUTE CONFIGURATION
  getRouteConfig(path: string): RouteProtectionConfig | null {
    return this.protectedRoutes.get(path) || null;
  }
  
  // GET ALL PROTECTED ROUTES
  getAllProtectedRoutes(): RouteProtectionConfig[] {
    return Array.from(this.protectedRoutes.values());
  }
}

// SINGLETON INSTANCE
let routeManager: RouteProtectionManager | null = null;

export function getRouteProtectionManager(): RouteProtectionManager {
  if (!routeManager) {
    const config = loadAnubisConfig();
    routeManager = new RouteProtectionManager(config);
  }
  return routeManager;
} 