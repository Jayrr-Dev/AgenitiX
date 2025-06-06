// ADAPTIVE RISK ENGINE FOR ANUBIS
import { ThreatIntelligence } from './threat-intelligence';
import type { ThreatIntelResult } from './threat-intelligence';

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
    console.log(`🌐 Starting enhanced IP reputation check for: ${ip}`);
    
    // LOCAL/PRIVATE IPS (SAFE)
    if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
      console.log(`🏠 Local/private IP detected: ${ip}`);
      return 0;
    }

    try {
      // USE ENHANCED THREAT INTELLIGENCE
      const threatResult = await ThreatIntelligence.checkIPReputation(ip);
      
      if (threatResult.isMalicious) {
        console.log(`🚨 Malicious IP detected: ${ip} - Risk: ${threatResult.riskScore}, Confidence: ${threatResult.confidence}, Sources: ${threatResult.sources.join(', ')}, Blacklist hits: ${threatResult.blacklistHits}`);
        return threatResult.riskScore;
      }

      // NOT IN THREAT FEEDS - CHECK ADDITIONAL PATTERNS
      return this.checkAdditionalIPPatterns(ip);

    } catch (error) {
      console.error(`❌ Error checking IP reputation for ${ip}:`, error);
      // FALLBACK TO BASIC CHECKS
      return this.checkAdditionalIPPatterns(ip);
    }
  }

  // ADDITIONAL IP PATTERN CHECKS (FALLBACK)
  private static checkAdditionalIPPatterns(ip: string): number {
    // TOR EXIT NODES PATTERNS (BACKUP CHECK)
    const torPatterns = [
      /^185\.220\./,    // Common Tor range
      /^199\.87\./,     // Common Tor range
      /^176\.10\./,     // Common Tor range
      /^51\.15\./,      // Some Tor exits
      /^163\.172\./     // Some Tor exits
    ];
    
    if (torPatterns.some(pattern => pattern.test(ip))) {
      console.log(`🧅 Potential Tor exit node (backup check): ${ip}`);
      return 85;
    }
    
    // HOSTING PROVIDER RANGES
    const hostingRanges = [
      /^5\./,           // Many VPS providers
      /^104\./,         // US hosting/CDN
      /^185\./,         // European hosting
      /^172\.(?!1[6-9]|2[0-9]|3[01])\./,  // Hosting (excluding private 172.16-31)
      /^198\.199\./,    // DigitalOcean
      /^159\.203\./,    // DigitalOcean
      /^142\.93\./,     // DigitalOcean
      /^167\.99\./      // DigitalOcean
    ];
    
    if (hostingRanges.some(pattern => pattern.test(ip))) {
      console.log(`🏢 Hosting provider range detected: ${ip}`);
      return 60;
    }
    
    // SUSPICIOUS RANGES
    const suspiciousRanges = [
      /^103\./,         // APNIC region, often abused
      /^125\./,         // APNIC region
      /^180\./,         // APNIC region
      /^200\./,         // LACNIC region
      /^46\./,          // RIPE region, some abuse
      /^80\./,          // RIPE region
      /^92\./,          // RIPE region
      /^93\./           // RIPE region
    ];
    
    if (suspiciousRanges.some(pattern => pattern.test(ip))) {
      console.log(`⚠️ Suspicious IP range detected: ${ip}`);
      return 40;
    }
    
    console.log(`✅ IP appears clean: ${ip}`);
    return 15; // Low risk for unknown but clean IPs
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
    // ANALYZE REQUEST TIMING, FREQUENCY, AND PATTERNS
    console.log(`⏱️ Request pattern analysis`);
    
    let riskScore = 0;
    const headers = request.headers || {};
    
    // CHECK FOR AUTOMATION INDICATORS IN HEADERS
    const automationHeaders = [
      'x-requested-with',
      'x-automation',
      'x-test',
      'x-selenium',
      'x-webdriver'
    ];
    
    const hasAutomationHeaders = automationHeaders.some(header => 
      headers[header] || headers[header.toLowerCase()]
    );
    
    if (hasAutomationHeaders) {
      console.log(`🤖 Automation headers detected`);
      riskScore += 40;
    }
    
    // CHECK FOR MISSING STANDARD BROWSER HEADERS
    const expectedHeaders = ['accept', 'accept-language', 'accept-encoding'];
    const missingHeaders = expectedHeaders.filter(header => 
      !headers[header] && !headers[header.toLowerCase()]
    );
    
    if (missingHeaders.length > 0) {
      console.log(`📄 Missing standard headers: ${missingHeaders.join(', ')}`);
      riskScore += missingHeaders.length * 15;
    }
    
    // CHECK FOR SUSPICIOUS HEADER VALUES
    const acceptHeader = headers['accept'] || headers['Accept'] || '';
    if (acceptHeader === '*/*' && !headers['accept-language']) {
      console.log(`⚠️ Generic accept header without language preference`);
      riskScore += 25;
    }
    
    // CHECK FOR UNUSUAL HEADER COMBINATIONS
    const userAgent = headers['user-agent'] || headers['User-Agent'] || '';
    const acceptLanguage = headers['accept-language'] || headers['Accept-Language'] || '';
    
    // Chrome browser should have accept-language
    if (userAgent.includes('Chrome') && !acceptLanguage) {
      console.log(`🌐 Chrome without accept-language header`);
      riskScore += 30;
    }
    
    // CHECK FOR RAPID SEQUENTIAL REQUESTS (if timestamp data available)
    // This would require session tracking implementation
    // const requestFrequency = analyzeRequestFrequency(request);
    // if (requestFrequency > threshold) riskScore += 50;
    
    // CHECK FOR SUSPICIOUS CONNECTION PATTERNS
    const connection = headers['connection'] || headers['Connection'] || '';
    if (connection.toLowerCase() === 'close' && userAgent.includes('Mozilla')) {
      console.log(`🔌 Suspicious connection header for browser`);
      riskScore += 20;
    }
    
    return Math.min(riskScore, 100); // Cap at 100
  }

  private static analyzeTimeOfDay(timestamp: number): number {
    const hour = new Date(timestamp).getHours();
    // Higher risk during typical bot hours (2-6 AM)
    if (hour >= 2 && hour <= 6) {
      console.log(`🌙 High-risk time detected: ${hour}:00`);
      return 60; // Increased from 40
    }
    console.log(`☀️ Normal time: ${hour}:00`);
    return 20; // Increased from 10
  }

  private static analyzeSessionHistory(history: any): number {
    if (!history) return 15; // Increased from 10 - no history = slight risk
    
    console.log(`📜 Session history analysis`);
    
    // ANALYZE PREVIOUS FAILURES, CHALLENGE ATTEMPTS, ETC.
    const failures = history.failures || 0;
    const challenges = history.challenges || 0;
    
    // PROGRESSIVE RISK BASED ON FAILURE COUNT
    if (failures >= 3) {
      console.log(`🚨 Multiple failures detected: ${failures}`);
      return 85; // High risk for repeated failures
    } else if (failures >= 2) {
      console.log(`⚠️ Some failures detected: ${failures}`);
      return 65; // Moderate-high risk
    } else if (failures >= 1) {
      console.log(`📊 Single failure detected: ${failures}`);
      return 45; // Moderate risk
    }
    
    // CHALLENGE COMPLETION RATE
    if (challenges > 0) {
      const successRate = ((challenges - failures) / challenges) * 100;
      if (successRate < 50) {
        console.log(`📉 Low challenge success rate: ${successRate}%`);
        return 70;
      }
    }
    
    return 20; // Increased from 15 - default for clean history
  }

  private static analyzeDeviceFingerprint(headers: Record<string, string>): number {
    console.log(`🖥️ Device fingerprint analysis`);
    
    let riskScore = 0;
    
    // CHECK FOR MISSING BROWSER CAPABILITIES
    const expectedBrowserHeaders = [
      'accept',
      'accept-encoding',
      'accept-language',
      'cache-control',
      'upgrade-insecure-requests'
    ];
    
    const missingBrowserHeaders = expectedBrowserHeaders.filter(header => 
      !headers[header] && !headers[header.toLowerCase()]
    );
    
    if (missingBrowserHeaders.length > 2) {
      console.log(`📱 Missing browser headers: ${missingBrowserHeaders.join(', ')}`);
      riskScore += 30;
    }
    
    // CHECK FOR SUSPICIOUS COMBINATIONS
    const userAgent = headers['user-agent'] || headers['User-Agent'] || '';
    const acceptEncoding = headers['accept-encoding'] || headers['Accept-Encoding'] || '';
    
    // Real browsers typically support gzip
    if (userAgent.includes('Mozilla') && !acceptEncoding.includes('gzip')) {
      console.log(`🗜️ Browser without gzip support`);
      riskScore += 25;
    }
    
    return Math.min(riskScore, 100);
  }

  private static async analyzeNetworkBehavior(ip: string): Promise<number> {
    console.log(`🌐 Network behavior analysis for: ${ip}`);
    
    // IMPLEMENT PROXY/VPN/HOSTING DETECTION
    // This could be enhanced with external services
    return 25; // Increased from 20 - default moderate risk
  }
}

// RISK MONITORING CLASS
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
    
    // CHECK FOR RISK ESCALATION
    this.checkRiskEscalation(identifier, history);
  }

  private static checkRiskEscalation(identifier: string, history: RiskLevel[]) {
    if (history.length >= 3) {
      const recentLevels = history.slice(-3).map(r => r.level);
      const isEscalating = recentLevels.every((level, index) => 
        index === 0 || level >= recentLevels[index - 1]
      );
      
      if (isEscalating && recentLevels[recentLevels.length - 1] >= 4) {
        console.warn(`🚨 Risk escalation detected for ${identifier}: ${recentLevels.join(' → ')}`);
      }
    }
  }

  static getRiskTrend(identifier: string): 'increasing' | 'decreasing' | 'stable' {
    const history = this.riskHistory.get(identifier);
    if (!history || history.length < 2) return 'stable';
    
    const recent = history.slice(-3);
    const avg = recent.reduce((sum, r) => sum + r.level, 0) / recent.length;
    const earlier = history.slice(-6, -3);
    
    if (earlier.length === 0) return 'stable';
    
    const earlierAvg = earlier.reduce((sum, r) => sum + r.level, 0) / earlier.length;
    
    if (avg > earlierAvg + 0.5) return 'increasing';
    if (avg < earlierAvg - 0.5) return 'decreasing';
    return 'stable';
  }
} 