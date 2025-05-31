// ADAPTIVE RISK ENGINE FOR ANUBIS
export interface RiskFactors {
  ipReputation: number;        // 0-100 (100 = known bad)
  geolocation: number;         // 0-100 (100 = high-risk country)
  userAgent: number;           // 0-100 (100 = suspicious/bot-like)
  requestPattern: number;      // 0-100 (100 = automated pattern)
  timeOfDay: number;          // 0-100 (100 = unusual hours)
  sessionHistory: number;      // 0-100 (100 = multiple failures)
  deviceFingerprint: number;   // 0-100 (100 = suspicious device)
  networkBehavior: number;     // 0-100 (100 = proxy/VPN/hosting)
}

export interface RiskLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'DANGEROUS';
  score: number;
  color: string;
  description: string;
}

export interface AdaptiveConfig {
  optimisticEnabled: boolean;
  gracePeriod: number;
  challengeDifficulty: number;
  maxFailures: number;
  sessionTimeout: number;
  requiresInteraction: boolean;
  blockingMode: boolean;
}

// RISK LEVEL DEFINITIONS
export const RISK_LEVELS: Record<number, RiskLevel> = {
  1: {
    level: 1,
    name: 'LOW',
    score: 0,
    color: '#10b981', // green
    description: 'Trusted user, minimal security measures'
  },
  2: {
    level: 2,
    name: 'MODERATE',
    score: 25,
    color: '#3b82f6', // blue
    description: 'Standard user, balanced security'
  },
  3: {
    level: 3,
    name: 'ELEVATED',
    score: 50,
    color: '#f59e0b', // yellow
    description: 'Suspicious activity, immediate verification required'
  },
  4: {
    level: 4,
    name: 'HIGH',
    score: 75,
    color: '#ef4444', // red
    description: 'High threat, strict verification required'
  },
  5: {
    level: 5,
    name: 'DANGEROUS',
    score: 90,
    color: '#7c2d12', // dark red
    description: 'Extreme threat, maximum security measures'
  }
};

// ADAPTIVE CONFIGURATIONS BY RISK LEVEL
export const ADAPTIVE_CONFIGS: Record<number, AdaptiveConfig> = {
  1: { // LOW RISK - Maximum Optimism
    optimisticEnabled: true,
    gracePeriod: 60000,        // 60 seconds
    challengeDifficulty: 2,     // Very easy
    maxFailures: 5,
    sessionTimeout: 7200000,    // 2 hours
    requiresInteraction: false,
    blockingMode: false
  },
  2: { // MODERATE RISK - Standard Optimism
    optimisticEnabled: true,
    gracePeriod: 30000,        // 30 seconds
    challengeDifficulty: 3,     // Easy
    maxFailures: 3,
    sessionTimeout: 3600000,    // 1 hour
    requiresInteraction: false,
    blockingMode: false
  },
  3: { // ELEVATED RISK - NO OPTIMISM
    optimisticEnabled: false,   // DISABLED - immediate challenge
    gracePeriod: 0,            // No grace period
    challengeDifficulty: 4,     // Medium difficulty (~1-2 seconds)
    maxFailures: 2,
    sessionTimeout: 1800000,    // 30 minutes
    requiresInteraction: true,
    blockingMode: false
  },
  4: { // HIGH RISK - NO OPTIMISM
    optimisticEnabled: false,   // DISABLED - immediate challenge
    gracePeriod: 0,            // No grace period
    challengeDifficulty: 6,     // Hard difficulty (~5-15 seconds)
    maxFailures: 1,
    sessionTimeout: 900000,     // 15 minutes
    requiresInteraction: true,
    blockingMode: false
  },
  5: { // DANGEROUS - NO OPTIMISM
    optimisticEnabled: false,   // DISABLED - immediate challenge
    gracePeriod: 0,            // No grace period
    challengeDifficulty: 8,     // Maximum difficulty (~30-120 seconds)
    maxFailures: 1,
    sessionTimeout: 300000,     // 5 minutes
    requiresInteraction: true,
    blockingMode: true
  }
};

// RISK CALCULATION ENGINE
export class RiskEngine {
  
  // CALCULATE OVERALL RISK SCORE
  static calculateRiskScore(factors: Partial<RiskFactors>): number {
    const weights: Record<keyof RiskFactors, number> = {
      ipReputation: 0.20,        // Reduced from 0.25
      geolocation: 0.08,         // Reduced from 0.10
      userAgent: 0.35,           // INCREASED from 0.15 - most important for bot detection
      requestPattern: 0.15,      // Reduced from 0.20
      timeOfDay: 0.05,           // Same
      sessionHistory: 0.10,      // Reduced from 0.15
      deviceFingerprint: 0.04,   // Reduced from 0.05
      networkBehavior: 0.03      // Reduced from 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(factors).forEach(([key, value]) => {
      if (value !== undefined && weights[key as keyof RiskFactors]) {
        totalScore += value * weights[key as keyof RiskFactors];
        totalWeight += weights[key as keyof RiskFactors];
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  // DETERMINE RISK LEVEL FROM SCORE
  static getRiskLevel(score: number): RiskLevel {
    // GET THRESHOLDS FROM ENVIRONMENT VARIABLES OR USE DEFAULTS
    const thresholds = {
      moderate: parseInt(process.env.ANUBIS_RISK_THRESHOLD_LOW || '20', 10),
      elevated: parseInt(process.env.ANUBIS_RISK_THRESHOLD_MODERATE || '40', 10),
      high: parseInt(process.env.ANUBIS_RISK_THRESHOLD_ELEVATED || '55', 10),
      dangerous: parseInt(process.env.ANUBIS_RISK_THRESHOLD_HIGH || '70', 10)
    };

    console.log(`🎯 Risk thresholds: MODERATE=${thresholds.moderate}, ELEVATED=${thresholds.elevated}, HIGH=${thresholds.high}, DANGEROUS=${thresholds.dangerous}`);
    console.log(`📊 Current score: ${score}`);

    if (score >= thresholds.dangerous) return RISK_LEVELS[5]; // DANGEROUS
    if (score >= thresholds.high) return RISK_LEVELS[4]; // HIGH
    if (score >= thresholds.elevated) return RISK_LEVELS[3]; // ELEVATED
    if (score >= thresholds.moderate) return RISK_LEVELS[2]; // MODERATE
    return RISK_LEVELS[1]; // LOW
  }

  // GET ADAPTIVE CONFIG FOR RISK LEVEL
  static getAdaptiveConfig(riskLevel: number): AdaptiveConfig {
    return ADAPTIVE_CONFIGS[riskLevel] || ADAPTIVE_CONFIGS[2];
  }

  // ANALYZE REQUEST AND RETURN RISK ASSESSMENT
  static async analyzeRequest(request: {
    ip: string;
    userAgent: string;
    headers: Record<string, string>;
    sessionHistory?: any;
    timestamp: number;
  }): Promise<{ riskLevel: RiskLevel; config: AdaptiveConfig; factors: RiskFactors }> {
    
    console.log(`🔍 Starting risk analysis for: ${request.userAgent}`);
    
    const factors: RiskFactors = {
      ipReputation: await this.checkIPReputation(request.ip),
      geolocation: await this.checkGeolocation(request.ip),
      userAgent: this.analyzeUserAgent(request.userAgent),
      requestPattern: this.analyzeRequestPattern(request),
      timeOfDay: this.analyzeTimeOfDay(request.timestamp),
      sessionHistory: this.analyzeSessionHistory(request.sessionHistory),
      deviceFingerprint: this.analyzeDeviceFingerprint(request.headers),
      networkBehavior: await this.analyzeNetworkBehavior(request.ip)
    };

    console.log(`📊 Risk factors:`, factors);

    const score = this.calculateRiskScore(factors);
    const riskLevel = this.getRiskLevel(score);
    const config = this.getAdaptiveConfig(riskLevel.level);

    console.log(`🎯 Final risk assessment: ${riskLevel.name} (Level ${riskLevel.level}) - Score: ${score}`);

    return { riskLevel, config, factors };
  }

  // INDIVIDUAL RISK FACTOR ANALYZERS
  private static async checkIPReputation(ip: string): Promise<number> {
    // Known bad IPs database check
    const knownBadIPs = new Set<string>([
      // Add known bad IPs here
    ]);
    
    if (knownBadIPs.has(ip)) return 100;
    if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) return 0;
    
    // Check for hosting providers and cloud services (higher risk)
    const hostingProviders = [
      /amazonaws\.com/i, /googlecloud/i, /azure/i, /digitalocean/i,
      /vultr/i, /linode/i, /ovh/i, /hetzner/i
    ];
    
    // This would normally do a reverse DNS lookup
    // For now, we'll use a moderate default for unknown IPs
    console.log(`🌐 IP reputation check for: ${ip}`);
    return 30; // Increased from 10 - unknown IPs are more suspicious
  }

  private static async checkGeolocation(ip: string): Promise<number> {
    // High-risk countries/regions
    const highRiskCountries = new Set(['CN', 'RU', 'KP', 'IR']);
    
    try {
      // Implement geolocation lookup
      // const geo = await geolocateIP(ip);
      // if (highRiskCountries.has(geo.country)) return 80;
      console.log(`🗺️ Geolocation check for: ${ip}`);
      return 35; // Increased from 20 - default moderate risk
    } catch {
      return 45; // Increased from 30 - unknown location = higher risk
    }
  }

  private static analyzeUserAgent(userAgent: string): number {
    if (!userAgent) return 95; // No user agent = very suspicious
    
    // AGGRESSIVE BOT DETECTION PATTERNS
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i,
      /requests/i, /urllib/i, /httpx/i, /aiohttp/i,
      /scrapy/i, /beautifulsoup/i, /mechanize/i
    ];
    
    // HEADLESS BROWSER AND AUTOMATION PATTERNS
    const headlessPatterns = [
      /headless/i, /phantom/i, /selenium/i, /webdriver/i,
      /puppeteer/i, /playwright/i, /chromedriver/i,
      /automated/i, /test/i
    ];

    // SUSPICIOUS CHARACTERISTICS
    const suspiciousPatterns = [
      /^[a-zA-Z0-9\-\.\/\s]{1,20}$/, // Very short user agents
      /^Mozilla\/[0-9]\.[0-9]$/, // Minimal Mozilla strings
      /Windows NT [0-9]+\.[0-9]+\)$/, // Incomplete Windows strings
    ];

    // LEGITIMATE BROWSER PATTERNS (lower risk)
    const legitimateBrowsers = [
      /Chrome\/[0-9]{2,3}\.[0-9]+\.[0-9]+\.[0-9]+.*Safari\/[0-9]+/,
      /Firefox\/[0-9]{2,3}\.[0-9]+/,
      /Safari\/[0-9]+.*Version\/[0-9]+/,
      /Edge\/[0-9]+/,
      /Opera\/[0-9]+/
    ];

    // CHECK FOR KNOWN BOTS (highest risk)
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      console.log(`🤖 Bot detected: ${userAgent}`);
      return 98; // Very high risk for obvious bots
    }
    
    // CHECK FOR HEADLESS BROWSERS (high risk)
    if (headlessPatterns.some(pattern => pattern.test(userAgent))) {
      console.log(`🕷️ Headless browser detected: ${userAgent}`);
      return 85; // High risk for automation tools
    }
    
    // CHECK FOR SUSPICIOUS PATTERNS (moderate-high risk)
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      console.log(`⚠️ Suspicious user agent: ${userAgent}`);
      return 70; // Moderate-high risk for suspicious patterns
    }
    
    // CHECK FOR LEGITIMATE BROWSERS (low risk)
    if (legitimateBrowsers.some(pattern => pattern.test(userAgent))) {
      console.log(`✅ Legitimate browser: ${userAgent}`);
      return 5; // Very low risk for real browsers
    }
    
    // FALLBACK: Unknown user agent patterns
    if (userAgent.length < 30) {
      console.log(`📏 Short user agent: ${userAgent}`);
      return 60; // Moderate risk for short user agents
    }
    
    console.log(`❓ Unknown user agent pattern: ${userAgent}`);
    return 25; // Default moderate risk for unknown patterns
  }

  private static analyzeRequestPattern(request: any): number {
    // Analyze request timing, frequency, etc.
    // This would integrate with your existing request tracking
    console.log(`⏱️ Request pattern analysis`);
    return 40; // Increased from 20 - default moderate risk for unknown patterns
  }

  private static analyzeTimeOfDay(timestamp: number): number {
    const hour = new Date(timestamp).getHours();
    // Higher risk during typical bot hours (2-6 AM)
    if (hour >= 2 && hour <= 6) {
      console.log(`🌙 High-risk time detected: ${hour}:00`);
      return 60; // Increased from 40
    }
    console.log(`☀️ Normal time: ${hour}:00`);
    return 15; // Increased from 10
  }

  private static analyzeSessionHistory(history: any): number {
    if (!history) {
      console.log(`📝 No session history available`);
      return 35; // Increased from 20 - no history is more suspicious
    }
    
    const failures = history.failures || 0;
    const challenges = history.challenges || 0;
    
    if (failures > 3) {
      console.log(`❌ High failure count: ${failures}`);
      return 95; // Increased from 90
    }
    if (failures > 1) {
      console.log(`⚠️ Multiple failures: ${failures}`);
      return 70; // Increased from 60
    }
    if (challenges > 5) {
      console.log(`🔄 Many challenges: ${challenges}`);
      return 50; // Increased from 40
    }
    
    console.log(`✅ Clean session history`);
    return 5; // Decreased from 10 - clean history is very good
  }

  private static analyzeDeviceFingerprint(headers: Record<string, string>): number {
    // Analyze browser capabilities, screen resolution, etc.
    const acceptLanguage = headers['accept-language'];
    const acceptEncoding = headers['accept-encoding'];
    const acceptHeader = headers['accept'];
    
    let suspiciousCount = 0;
    
    if (!acceptLanguage) {
      console.log(`🌐 Missing Accept-Language header`);
      suspiciousCount++;
    }
    if (!acceptEncoding) {
      console.log(`📦 Missing Accept-Encoding header`);
      suspiciousCount++;
    }
    if (!acceptHeader) {
      console.log(`📄 Missing Accept header`);
      suspiciousCount++;
    }
    
    // More missing headers = higher risk
    if (suspiciousCount >= 2) {
      console.log(`🚨 Multiple missing headers: ${suspiciousCount}`);
      return 75; // High risk for missing multiple headers
    }
    if (suspiciousCount === 1) {
      console.log(`⚠️ One missing header`);
      return 45; // Moderate risk for one missing header
    }
    
    console.log(`✅ Complete headers present`);
    return 10; // Low risk for complete headers
  }

  private static async analyzeNetworkBehavior(ip: string): Promise<number> {
    // Check for VPN, proxy, hosting provider
    // This would integrate with services like IPQualityScore
    console.log(`🔗 Network behavior analysis for: ${ip}`);
    return 35; // Increased from 25 - default moderate risk
  }
}

// RISK MONITORING AND ALERTS
export class RiskMonitor {
  private static riskHistory: Map<string, RiskLevel[]> = new Map();

  static trackRisk(identifier: string, riskLevel: RiskLevel) {
    if (!this.riskHistory.has(identifier)) {
      this.riskHistory.set(identifier, []);
    }
    
    const history = this.riskHistory.get(identifier)!;
    history.push(riskLevel);
    
    // Keep only last 10 entries
    if (history.length > 10) {
      history.shift();
    }
    
    // Check for escalating risk
    this.checkRiskEscalation(identifier, history);
  }

  private static checkRiskEscalation(identifier: string, history: RiskLevel[]) {
    if (history.length < 3) return;
    
    const recent = history.slice(-3);
    const isEscalating = recent.every((level, index) => 
      index === 0 || level.level >= recent[index - 1].level
    );
    
    if (isEscalating && recent[recent.length - 1].level >= 4) {
      console.warn(`Risk escalation detected for ${identifier}:`, recent);
      // Implement alerting logic here
    }
  }

  static getRiskTrend(identifier: string): 'increasing' | 'decreasing' | 'stable' {
    const history = this.riskHistory.get(identifier);
    if (!history || history.length < 2) return 'stable';
    
    const recent = history.slice(-5);
    const avgRecent = recent.reduce((sum, r) => sum + r.level, 0) / recent.length;
    const older = history.slice(-10, -5);
    const avgOlder = older.length > 0 ? older.reduce((sum, r) => sum + r.level, 0) / older.length : avgRecent;
    
    if (avgRecent > avgOlder + 0.5) return 'increasing';
    if (avgRecent < avgOlder - 0.5) return 'decreasing';
    return 'stable';
  }
} 