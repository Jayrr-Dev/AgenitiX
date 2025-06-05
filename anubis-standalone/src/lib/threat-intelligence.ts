// ENHANCED THREAT INTELLIGENCE FOR ANUBIS
export interface ThreatIntelResult {
  isMalicious: boolean;
  riskScore: number;
  confidence: number;
  sources: string[];
  blacklistHits: number;
  categories: string[];
  lastSeen?: Date;
  description?: string;
}

// INTERNAL THREAT PATTERNS
interface ThreatPattern {
  name: string;
  pattern: RegExp;
  riskScore: number;
  description: string;
}

export class ThreatIntelligence {
  
  // STATIC THREAT PATTERNS
  private static readonly THREAT_PATTERNS: ThreatPattern[] = [
    {
      name: 'Tor Exit Nodes',
      pattern: /^(185\.220\.|199\.87\.|176\.10\.|51\.15\.|163\.172\.)/,
      riskScore: 85,
      description: 'Known Tor exit node ranges'
    },
    {
      name: 'VPN/Proxy Providers',
      pattern: /^(104\.28\.|172\.67\.|198\.41\.|185\.181\.|91\.232\.)/,
      riskScore: 60,
      description: 'Commercial VPN/proxy service providers'
    },
    {
      name: 'Hosting Providers',
      pattern: /^(198\.199\.|159\.203\.|142\.93\.|167\.99\.|104\.248\.|46\.101\.|138\.68\.|139\.59\.|143\.110\.|165\.227\.|206\.189\.|209\.97\.|178\.62\.|95\.85\.|188\.166\.|134\.209\.|68\.183\.|164\.90\.|157\.245\.|174\.138\.|207\.154\.|161\.35\.|178\.128\.|159\.89\.|128\.199\.|35\.184\.|35\.185\.|35\.186\.|35\.187\.|35\.188\.|35\.189\.|35\.190\.|35\.191\.|35\.192\.|35\.193\.|35\.194\.|35\.195\.|35\.196\.|35\.197\.|35\.198\.|35\.199\.|35\.200\.|35\.201\.|35\.202\.|35\.203\.|35\.204\.|35\.205\.|35\.206\.|35\.207\.|35\.208\.|35\.209\.|35\.210\.|35\.211\.|35\.212\.|35\.213\.|35\.214\.|35\.215\.|35\.216\.|35\.217\.|35\.218\.|35\.219\.|35\.220\.|35\.221\.|35\.222\.|35\.223\.|35\.224\.|35\.225\.|35\.226\.|35\.227\.|35\.228\.|35\.229\.|35\.230\.|35\.231\.|35\.232\.|35\.233\.|35\.234\.|35\.235\.|35\.236\.|35\.237\.|35\.238\.|35\.239\.|35\.240\.|35\.241\.|35\.242\.|35\.243\.|35\.244\.|35\.245\.|35\.246\.|35\.247\.|35\.248\.|35\.249\.|35\.250\.|35\.251\.|35\.252\.|35\.253\.|35\.254\.|35\.255\.)/,
      riskScore: 50,
      description: 'Common cloud hosting and VPS providers'
    },
    {
      name: 'Suspicious Ranges',
      pattern: /^(103\.|125\.|180\.|200\.|46\.|80\.|92\.|93\.)/,
      riskScore: 40,
      description: 'IP ranges frequently associated with abuse'
    }
  ];

  // KNOWN MALICIOUS IP PATTERNS
  private static readonly MALICIOUS_PATTERNS: ThreatPattern[] = [
    {
      name: 'Known Botnet C&C',
      pattern: /^(192\.168\.1\.100|10\.0\.0\.100|172\.16\.0\.100)$/, // Example patterns
      riskScore: 95,
      description: 'Known command and control servers'
    },
    {
      name: 'Scanning Networks',
      pattern: /^(198\.108\.|185\.220\.|199\.87\.)/,
      riskScore: 80,
      description: 'Networks known for scanning activity'
    }
  ];

  // INTERNAL BLACKLIST
  private static readonly INTERNAL_BLACKLIST = new Set([
    // Known bad IPs can be added here
    '127.0.0.1', // Example - never actually block localhost in real use
  ]);

  // WHITELIST FOR LEGITIMATE SERVICES
  private static readonly WHITELIST = new Set([
    // Google
    '8.8.8.8', '8.8.4.4',
    // Cloudflare
    '1.1.1.1', '1.0.0.1',
    // Legitimate crawlers (example IPs)
    '66.249.66.1', // Googlebot
  ]);

  /**
   * CHECK IP REPUTATION USING MULTIPLE SOURCES
   */
  static async checkIPReputation(ip: string): Promise<ThreatIntelResult> {
    console.log(`🛡️ Starting comprehensive threat intelligence check for: ${ip}`);
    
    const result: ThreatIntelResult = {
      isMalicious: false,
      riskScore: 0,
      confidence: 0,
      sources: [],
      blacklistHits: 0,
      categories: []
    };

    // QUICK WHITELIST CHECK
    if (this.WHITELIST.has(ip)) {
      console.log(`✅ IP ${ip} is whitelisted`);
      result.riskScore = 0;
      result.confidence = 100;
      result.sources.push('internal-whitelist');
      return result;
    }

    // INTERNAL BLACKLIST CHECK
    if (this.INTERNAL_BLACKLIST.has(ip)) {
      console.log(`🚨 IP ${ip} found in internal blacklist`);
      result.isMalicious = true;
      result.riskScore = 95;
      result.confidence = 100;
      result.sources.push('internal-blacklist');
      result.blacklistHits = 1;
      result.categories.push('blacklisted');
      return result;
    }

    // CHECK AGAINST MALICIOUS PATTERNS
    const maliciousMatch = this.MALICIOUS_PATTERNS.find(pattern => pattern.pattern.test(ip));
    if (maliciousMatch) {
      console.log(`🚨 IP ${ip} matches malicious pattern: ${maliciousMatch.name}`);
      result.isMalicious = true;
      result.riskScore = maliciousMatch.riskScore;
      result.confidence = 85;
      result.sources.push('internal-patterns');
      result.blacklistHits = 1;
      result.categories.push(maliciousMatch.name);
      result.description = maliciousMatch.description;
      return result;
    }

    // CHECK AGAINST THREAT PATTERNS
    const threatMatch = this.THREAT_PATTERNS.find(pattern => pattern.pattern.test(ip));
    if (threatMatch) {
      console.log(`⚠️ IP ${ip} matches threat pattern: ${threatMatch.name}`);
      result.riskScore = threatMatch.riskScore;
      result.confidence = 70;
      result.sources.push('internal-patterns');
      result.categories.push(threatMatch.name);
      result.description = threatMatch.description;
      
      // High risk scores are considered malicious
      if (threatMatch.riskScore >= 80) {
        result.isMalicious = true;
        result.blacklistHits = 1;
      }
      
      return result;
    }

    // TRY EXTERNAL THREAT INTELLIGENCE SOURCES
    try {
      const externalResults = await Promise.allSettled([
        this.checkVirusTotal(ip),
        this.checkAbuseIPDB(ip),
        this.checkThreatCrowd(ip)
      ]);

      externalResults.forEach((resultPromise, index) => {
        if (resultPromise.status === 'fulfilled' && resultPromise.value) {
          const sourceResult = resultPromise.value;
          result.sources.push(sourceResult.source);
          
          if (sourceResult.isMalicious) {
            result.isMalicious = true;
            result.blacklistHits += 1;
            result.riskScore = Math.max(result.riskScore, sourceResult.riskScore);
            result.categories.push(...sourceResult.categories);
          }
        }
      });

      // CALCULATE CONFIDENCE BASED ON NUMBER OF SOURCES
      result.confidence = Math.min(result.sources.length * 25, 100);
      
    } catch (error) {
      console.error(`❌ Error checking external threat intelligence:`, error);
    }

    // DEFAULT ASSESSMENT FOR UNKNOWN IPs
    if (result.sources.length === 0) {
      result.riskScore = 20; // Default moderate risk for unknown IPs
      result.confidence = 10;
      result.sources.push('default-assessment');
    }

    console.log(`📊 Threat intelligence result for ${ip}:`, result);
    return result;
  }

  /**
   * CHECK VIRUSTOTAL (MOCK IMPLEMENTATION)
   */
  private static async checkVirusTotal(ip: string): Promise<{ source: string; isMalicious: boolean; riskScore: number; categories: string[] } | null> {
    // In a real implementation, you would call the VirusTotal API
    // For this standalone version, we'll return null to indicate no external service
    return null;
  }

  /**
   * CHECK ABUSEIPDB (MOCK IMPLEMENTATION)
   */
  private static async checkAbuseIPDB(ip: string): Promise<{ source: string; isMalicious: boolean; riskScore: number; categories: string[] } | null> {
    // In a real implementation, you would call the AbuseIPDB API
    // For this standalone version, we'll return null to indicate no external service
    return null;
  }

  /**
   * CHECK THREATCROWD (MOCK IMPLEMENTATION)
   */
  private static async checkThreatCrowd(ip: string): Promise<{ source: string; isMalicious: boolean; riskScore: number; categories: string[] } | null> {
    // In a real implementation, you would call the ThreatCrowd API
    // For this standalone version, we'll return null to indicate no external service
    return null;
  }

  /**
   * ADD IP TO INTERNAL BLACKLIST
   */
  static addToBlacklist(ip: string): void {
    this.INTERNAL_BLACKLIST.add(ip);
    console.log(`🚨 Added ${ip} to internal blacklist`);
  }

  /**
   * REMOVE IP FROM INTERNAL BLACKLIST
   */
  static removeFromBlacklist(ip: string): void {
    this.INTERNAL_BLACKLIST.delete(ip);
    console.log(`✅ Removed ${ip} from internal blacklist`);
  }

  /**
   * ADD IP TO WHITELIST
   */
  static addToWhitelist(ip: string): void {
    this.WHITELIST.add(ip);
    console.log(`✅ Added ${ip} to whitelist`);
  }

  /**
   * REMOVE IP FROM WHITELIST
   */
  static removeFromWhitelist(ip: string): void {
    this.WHITELIST.delete(ip);
    console.log(`🚨 Removed ${ip} from whitelist`);
  }

  /**
   * GET THREAT STATISTICS
   */
  static getThreatStats(): { blacklistedIPs: number; whitelistedIPs: number; patterns: number } {
    return {
      blacklistedIPs: this.INTERNAL_BLACKLIST.size,
      whitelistedIPs: this.WHITELIST.size,
      patterns: this.THREAT_PATTERNS.length + this.MALICIOUS_PATTERNS.length
    };
  }
} 