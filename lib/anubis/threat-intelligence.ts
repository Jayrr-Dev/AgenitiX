// THREAT INTELLIGENCE INTEGRATION FOR ANUBIS
// Integrates with IPsum and other threat feeds for real-time IP reputation

export interface ThreatIntelligenceResult {
  isMalicious: boolean;
  riskScore: number;        // 0-100
  sources: string[];        // Which threat feeds flagged this IP
  blacklistHits: number;    // Number of blacklists that flagged this IP
  lastSeen: Date | null;    // When this IP was last seen as malicious
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IPsumEntry {
  ip: string;
  hits: number;             // Number of blacklists that flagged this IP
}

// THREAT INTELLIGENCE CLASS
export class ThreatIntelligence {
  private static ipsumCache: Map<string, IPsumEntry> = new Map();
  private static lastUpdate: number = 0;
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly IPSUM_URL = 'https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt';

  // MAIN IP REPUTATION CHECK
  static async checkIPReputation(ip: string): Promise<ThreatIntelligenceResult> {
    console.log(`🔍 Checking threat intelligence for IP: ${ip}`);

    // ENSURE IPSUM DATA IS FRESH
    await this.updateIPsumData();

    // CHECK IPSUM FEED
    const ipsumResult = this.checkIPsumFeed(ip);
    
    // CHECK OTHER THREAT SOURCES
    const additionalChecks = await this.checkAdditionalSources(ip);

    // COMBINE RESULTS
    const combinedResult = this.combineResults(ip, ipsumResult, additionalChecks);

    console.log(`🎯 Threat intelligence result for ${ip}:`, {
      isMalicious: combinedResult.isMalicious,
      riskScore: combinedResult.riskScore,
      confidence: combinedResult.confidence,
      blacklistHits: combinedResult.blacklistHits
    });

    return combinedResult;
  }

  // UPDATE IPSUM DATA FROM GITHUB
  private static async updateIPsumData(): Promise<void> {
    const now = Date.now();
    
    // CHECK IF UPDATE IS NEEDED
    if (now - this.lastUpdate < this.CACHE_DURATION && this.ipsumCache.size > 0) {
      return; // Data is still fresh
    }

    try {
      console.log(`📥 Updating IPsum threat intelligence data...`);
      
      const response = await fetch(this.IPSUM_URL, {
        headers: {
          'User-Agent': 'AgenitiX-Anubis-Bot-Protection/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch IPsum data: ${response.status}`);
      }

      const data = await response.text();
      this.parseIPsumData(data);
      this.lastUpdate = now;

      console.log(`✅ IPsum data updated: ${this.ipsumCache.size} malicious IPs loaded`);

    } catch (error) {
      console.error(`❌ Failed to update IPsum data:`, error);
      // Continue with cached data if available
    }
  }

  // PARSE IPSUM TEXT DATA
  private static parseIPsumData(data: string): void {
    const lines = data.split('\n');
    this.ipsumCache.clear();

    for (const line of lines) {
      // SKIP COMMENTS AND EMPTY LINES
      if (line.startsWith('#') || line.trim() === '') {
        continue;
      }

      // PARSE IP AND HIT COUNT
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const ip = parts[0];
        const hits = parseInt(parts[1], 10);

        if (this.isValidIP(ip) && !isNaN(hits)) {
          this.ipsumCache.set(ip, { ip, hits });
        }
      }
    }
  }

  // CHECK IP AGAINST IPSUM FEED
  private static checkIPsumFeed(ip: string): Partial<ThreatIntelligenceResult> {
    const entry = this.ipsumCache.get(ip);
    
    if (!entry) {
      return {
        isMalicious: false,
        riskScore: 0,
        sources: [],
        blacklistHits: 0
      };
    }

    // CALCULATE RISK SCORE BASED ON BLACKLIST HITS
    // More hits = higher confidence and risk
    let riskScore = 0;
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    if (entry.hits >= 10) {
      riskScore = 100;
      confidence = 'CRITICAL';
    } else if (entry.hits >= 7) {
      riskScore = 95;
      confidence = 'HIGH';
    } else if (entry.hits >= 5) {
      riskScore = 85;
      confidence = 'HIGH';
    } else if (entry.hits >= 3) {
      riskScore = 70;
      confidence = 'MEDIUM';
    } else if (entry.hits >= 2) {
      riskScore = 50;
      confidence = 'MEDIUM';
    } else {
      riskScore = 30;
      confidence = 'LOW';
    }

    return {
      isMalicious: true,
      riskScore,
      sources: ['IPsum'],
      blacklistHits: entry.hits,
      confidence
    };
  }

  // CHECK ADDITIONAL THREAT SOURCES
  private static async checkAdditionalSources(ip: string): Promise<Partial<ThreatIntelligenceResult>> {
    const results: Partial<ThreatIntelligenceResult> = {
      isMalicious: false,
      riskScore: 0,
      sources: [],
      blacklistHits: 0
    };

    // CHECK FOR TOR EXIT NODES
    if (this.isTorExitNode(ip)) {
      results.isMalicious = true;
      results.riskScore = Math.max(results.riskScore || 0, 85);
      results.sources?.push('Tor Exit Node');
      results.blacklistHits = (results.blacklistHits || 0) + 1;
    }

    // CHECK FOR HOSTING PROVIDERS
    if (this.isHostingProvider(ip)) {
      results.riskScore = Math.max(results.riskScore || 0, 60);
      results.sources?.push('Hosting Provider');
    }

    // CHECK FOR SUSPICIOUS RANGES
    if (this.isSuspiciousRange(ip)) {
      results.riskScore = Math.max(results.riskScore || 0, 40);
      results.sources?.push('Suspicious Range');
    }

    return results;
  }

  // COMBINE RESULTS FROM MULTIPLE SOURCES
  private static combineResults(
    ip: string,
    ipsumResult: Partial<ThreatIntelligenceResult>,
    additionalResult: Partial<ThreatIntelligenceResult>
  ): ThreatIntelligenceResult {
    
    const isMalicious = ipsumResult.isMalicious || additionalResult.isMalicious || false;
    const maxRiskScore = Math.max(ipsumResult.riskScore || 0, additionalResult.riskScore || 0);
    const combinedSources = [...(ipsumResult.sources || []), ...(additionalResult.sources || [])];
    const totalHits = (ipsumResult.blacklistHits || 0) + (additionalResult.blacklistHits || 0);

    // DETERMINE CONFIDENCE LEVEL
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (totalHits >= 10 || maxRiskScore >= 95) {
      confidence = 'CRITICAL';
    } else if (totalHits >= 5 || maxRiskScore >= 80) {
      confidence = 'HIGH';
    } else if (totalHits >= 2 || maxRiskScore >= 50) {
      confidence = 'MEDIUM';
    }

    return {
      isMalicious,
      riskScore: maxRiskScore,
      sources: combinedSources,
      blacklistHits: totalHits,
      lastSeen: isMalicious ? new Date() : null,
      confidence
    };
  }

  // HELPER METHODS FOR IP ANALYSIS
  private static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  }

  private static isTorExitNode(ip: string): boolean {
    const torPatterns = [
      /^185\.220\./,    // Common Tor range
      /^199\.87\./,     // Common Tor range  
      /^176\.10\./,     // Common Tor range
      /^51\.15\./,      // Some Tor exits
      /^163\.172\./     // Some Tor exits
    ];
    
    return torPatterns.some(pattern => pattern.test(ip));
  }

  private static isHostingProvider(ip: string): boolean {
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
    
    return hostingRanges.some(pattern => pattern.test(ip));
  }

  private static isSuspiciousRange(ip: string): boolean {
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
    
    return suspiciousRanges.some(pattern => pattern.test(ip));
  }

  // GET CACHE STATISTICS
  static getCacheStats(): { size: number; lastUpdate: Date | null; isStale: boolean } {
    const now = Date.now();
    const isStale = (now - this.lastUpdate) > this.CACHE_DURATION;
    
    return {
      size: this.ipsumCache.size,
      lastUpdate: this.lastUpdate > 0 ? new Date(this.lastUpdate) : null,
      isStale
    };
  }

  // FORCE CACHE REFRESH
  static async refreshCache(): Promise<void> {
    this.lastUpdate = 0; // Force refresh
    await this.updateIPsumData();
  }
} 