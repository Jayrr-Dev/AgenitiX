import type { AnubisConfig, RouteProtectionConfig } from '../types/anubis';

// DEFAULT ANUBIS CONFIGURATION
const DEFAULT_CONFIG: AnubisConfig = {
  enabled: true,                // 🔥 ENABLED BY DEFAULT for comprehensive protection
  difficulty: 4,
  jwtSecret: '',
  bypassDevelopment: false,     // 🔥 DISABLE BYPASS for consistent protection
  protectedRoutes: [
    '/',                    // Home page ✅ Working
    '/about',               // About Us page
    '/expertise',           // Expertise page  
    '/projects',            // Projects page
    '/careers',             // Careers page
    '/contact',             // Contact page
    '/admin',               // Admin dashboard
    '/dashboard',           // User dashboard
    '/talent-acquisition',  // Talent acquisition page
    '/blog',                // Blog section (if exists)
    '/services',            // Services page (if exists)
    '/portfolio',           // Portfolio page (if exists)
    '/team',                // Team page (if exists)
    '/pricing',             // Pricing page (if exists)
    '/case-studies',        // Case studies (if exists)
    '/resources',           // Resources section (if exists)
    '/news',                // News section (if exists)
    '/events',              // Events page (if exists)
    // 🛡️ FORM SUBMISSION PROTECTION
    '/api/contact',         // Contact form submissions
    '/api/forms/*',         // All form submission endpoints
    '/api/submit/*',        // Alternative form submission endpoints
    '/api/newsletter',      // Newsletter signups
    '/api/subscribe',       // Subscription forms
    '/api/feedback',        // Feedback forms
    '/api/quote',           // Quote request forms
    '/api/demo',            // Demo request forms
    '/api/consultation'     // Consultation request forms
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
    '/sitemap.xml',     // SEO sitemap file (must be accessible)
    '/_vercel/*',       // Vercel internal routes
    '/api/auth/*',      // Authentication routes (NextAuth, etc.)
    '/api/webhooks/*',  // Webhook endpoints
    '/api/trpc/*'       // tRPC endpoints (if used)
  ],
  allowedUserAgents: [
    // 🔍 SEARCH ENGINES (Always Allow)
    'Googlebot',
    'Bingbot', 
    'Slurp',                  // Yahoo
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'Applebot',
    'Vercel',                 // Vercel monitoring
    'vercel-bot',             // Vercel internal bots
    
    // 📱 SOCIAL MEDIA PLATFORMS (Marketing Critical)
    'facebookexternalhit',    // Facebook link previews
    'Twitterbot',             // Twitter cards
    'LinkedInBot',            // LinkedIn previews
    'WhatsApp',               // WhatsApp link previews
    'Discordbot',             // Discord link previews
    'Slackbot',               // Slack link previews
    'Telegrambot',            // Telegram previews
    'SkypeUriPreview',        // Skype previews
    'PinterestBot',           // Pinterest pins
    'redditbot',              // Reddit link sharing
    'TikTokBot',              // TikTok sharing
    'SnapchatBot',            // Snapchat sharing
    
    // 📧 EMAIL MARKETING PLATFORMS (Conversion Critical)
    'MailChimp',              // MailChimp campaigns
    'Constant Contact',       // Constant Contact
    'ConvertKit',             // ConvertKit
    'ActiveCampaign',         // ActiveCampaign
    'Mailgun',                // Mailgun delivery
    'SendGrid',               // SendGrid delivery
    'Klaviyo',                // Klaviyo ecommerce
    'Campaign Monitor',       // Campaign Monitor
    'AWeber',                 // AWeber
    'GetResponse',            // GetResponse
    
    // 🎯 ADVERTISING PLATFORMS (PPC Critical) 
    'Google-Ads-Bot',         // Google Ads crawler
    'Facebook-Ads-Bot',       // Facebook Ads crawler
    'Microsoft-Ads-Bot',      // Bing Ads
    'Twitter-Ads-Bot',        // Twitter Ads
    'Pinterest-Ads',          // Pinterest Ads
    'TikTok-Ads-Bot',         // TikTok Ads
    
    // 📊 ANALYTICS & TRACKING (Attribution Critical)
    'Google Analytics',       // GA tracking
    'Adobe Analytics',        // Adobe tracking  
    'Mixpanel',               // Mixpanel analytics
    'Hotjar',                 // Hotjar heatmaps
    'FullStory',              // FullStory recordings
    'LogRocket',              // LogRocket sessions
    'Segment',                // Segment tracking
    'Amplitude',              // Amplitude analytics
    
    // 🔗 LINK SHORTENERS & REDIRECTS (Traffic Flow Critical)
    'bit.ly',                 // Bitly redirects
    'tinyurl',                // TinyURL
    'ow.ly',                  // Hootsuite links
    'buff.ly',                // Buffer links
    't.co',                   // Twitter short links
    'lnkd.in',                // LinkedIn short links
    'fb.me',                  // Facebook short links
    'short.link',             // Generic shorteners
    
    // 📱 MOBILE APP BROWSERS (High Conversion Value)
    'Instagram',              // Instagram in-app browser
    'FBAN',                   // Facebook mobile app
    'FBAV',                   // Facebook app variations
    'Twitter for iPhone',     // Twitter iOS app
    'Twitter for Android',    // Twitter Android app
    'LinkedIn',               // LinkedIn mobile app
    'Pinterest',              // Pinterest mobile app
    'TikTok',                 // TikTok in-app browser
    'Snapchat',               // Snapchat browser
    'Telegram',               // Telegram browser
    'Discord',                // Discord browser
    'Medium',                 // Medium app browser
    'Reddit',                 // Reddit app browser
    
    // 💼 BUSINESS TOOLS (B2B Marketing)
    'Salesforce',             // Salesforce tracking
    'HubSpot',                // HubSpot tracking
    'Marketo',                // Marketo automation
    'Pardot',                 // Pardot B2B tracking
    'Eloqua',                 // Oracle Eloqua
    'Mailchimp',              // Mailchimp tracking
    'Intercom',               // Intercom chat
    'Drift',                  // Drift chat
    'Zendesk',                // Zendesk widgets
    'Calendly',               // Calendly scheduling
    
    // 🎬 CONTENT PLATFORMS (Content Marketing)
    'YouTube',                // YouTube embeds/traffic
    'Vimeo',                  // Vimeo embeds
    'Medium',                 // Medium referrals
    'Substack',               // Newsletter traffic
    'Ghost',                  // Ghost blog platform
    'WordPress',              // WordPress referrals
    'Wix',                    // Wix platform
    'Squarespace',            // Squarespace platform
    
    // 🛒 E-COMMERCE & REVIEWS (Trust Building)
    'Shopify',                // Shopify integrations
    'Trustpilot',             // Trustpilot reviews
    'Google My Business',     // GMB traffic
    'Yelp',                   // Yelp reviews
    'Better Business Bureau', // BBB listings
    'Glassdoor',              // Company reviews
    
    // 🔧 DEVELOPMENT & MONITORING (Technical)
    'Pingdom',                // Uptime monitoring
    'StatusPage',             // Status page checks
    'New Relic',              // Performance monitoring
    'DataDog',                // Monitoring services
    'UptimeRobot'             // Uptime monitoring
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