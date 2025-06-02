import crypto from "crypto";
import fs from "fs";
import path from "path";
import { VERSION_CONFIG } from "./auto-version";

/**
 * VERSION DETECTOR - Automatically detects when to bump versions
 *
 * No manual intervention needed - just save files and versions update
 */

interface FileHash {
  path: string;
  hash: string;
  lastModified: number;
}

interface VersionInfo {
  version: string;
  hash: string;
  timestamp: number;
  changedFiles: string[];
  bumpType: "major" | "minor" | "patch";
}

class AutoVersionDetector {
  private versionFile = ".version-cache.json";
  private lastKnownHashes: Map<string, string> = new Map();

  constructor() {
    this.loadVersionCache();
  }

  /**
   * DETECT VERSION CHANGES - Call this from your build process
   * Returns new version if changes detected, null if no changes
   */
  async detectChanges(): Promise<VersionInfo | null> {
    try {
      const currentHashes = await this.calculateCurrentHashes();
      const changedFiles = this.getChangedFiles(currentHashes);

      if (changedFiles.length === 0) {
        return null; // No changes
      }

      const bumpType = this.determineBumpType(changedFiles);
      const currentVersion = this.getCurrentVersion();
      const newVersion = this.bumpVersion(currentVersion, bumpType);

      // Auto-save new version
      await this.saveVersion({
        version: newVersion,
        hash: this.generateSystemHash(currentHashes),
        timestamp: Date.now(),
        changedFiles,
        bumpType,
      });

      return {
        version: newVersion,
        hash: this.generateSystemHash(currentHashes),
        timestamp: Date.now(),
        changedFiles,
        bumpType,
      };
    } catch (error) {
      console.error("❌ Version detection error:", error);
      return null;
    }
  }

  private async calculateCurrentHashes(): Promise<Map<string, string>> {
    const hashes = new Map<string, string>();

    // Use a simple file discovery instead of glob for now
    const files = this.findFiles("features/business-logic-modern", [
      ".ts",
      ".tsx",
    ]);

    for (const file of files) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, "utf8");
          const hash = crypto.createHash("md5").update(content).digest("hex");
          hashes.set(file, hash);
        } catch (error) {
          console.warn(`⚠️ Could not read file ${file}:`, error);
        }
      }
    }

    return hashes;
  }

  private findFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    try {
      if (!fs.existsSync(dir)) return files;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...this.findFiles(fullPath, extensions));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not read directory ${dir}:`, error);
    }

    return files;
  }

  private getChangedFiles(currentHashes: Map<string, string>): string[] {
    const changed: string[] = [];

    // Fix TypeScript iteration issue
    const hashEntries = Array.from(currentHashes.entries());
    for (const [file, hash] of hashEntries) {
      const lastHash = this.lastKnownHashes.get(file);
      if (!lastHash || lastHash !== hash) {
        changed.push(file);
      }
    }

    return changed;
  }

  private determineBumpType(
    changedFiles: string[]
  ): "major" | "minor" | "patch" {
    // Check for major changes first
    for (const file of changedFiles) {
      if (
        VERSION_CONFIG.bumpRules.major.some((pattern) =>
          this.matchesPattern(file, pattern)
        )
      ) {
        return "major";
      }
    }

    // Check for minor changes
    for (const file of changedFiles) {
      if (
        VERSION_CONFIG.bumpRules.minor.some((pattern) =>
          this.matchesPattern(file, pattern)
        )
      ) {
        return "minor";
      }
    }

    return "patch";
  }

  private bumpVersion(
    current: string,
    type: "major" | "minor" | "patch"
  ): string {
    const [major, minor, patch] = current.split(".").map(Number);

    switch (type) {
      case "major":
        return `${major + 1}.0.0`;
      case "minor":
        return `${major}.${minor + 1}.0`;
      case "patch":
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  private matchesPattern(file: string, pattern: string): boolean {
    // Simple pattern matching - replace with more sophisticated logic if needed
    return file.includes(pattern.replace(/\*/g, ""));
  }

  private loadVersionCache(): void {
    try {
      if (fs.existsSync(this.versionFile)) {
        const cache = JSON.parse(fs.readFileSync(this.versionFile, "utf8"));
        this.lastKnownHashes = new Map(cache.hashes || []);
      }
    } catch (error) {
      console.warn("⚠️ Could not load version cache:", error);
      // First run - no cache exists
    }
  }

  private async saveVersion(info: VersionInfo): Promise<void> {
    try {
      const currentHashes = await this.calculateCurrentHashes();

      const cache = {
        version: info.version,
        timestamp: info.timestamp,
        hashes: Array.from(currentHashes.entries()),
      };

      fs.writeFileSync(this.versionFile, JSON.stringify(cache, null, 2));
      this.lastKnownHashes = currentHashes;

      // Auto-update version constants
      this.updateVersionConstants(info.version);
    } catch (error) {
      console.error("❌ Could not save version:", error);
    }
  }

  private getCurrentVersion(): string {
    try {
      if (fs.existsSync(this.versionFile)) {
        const cache = JSON.parse(fs.readFileSync(this.versionFile, "utf8"));
        return cache.version || "1.0.0";
      }
    } catch (error) {
      console.warn("⚠️ Could not get current version:", error);
    }
    return "1.0.0";
  }

  private generateSystemHash(hashes: Map<string, string>): string {
    const combined = Array.from(hashes.values()).join("");
    return crypto.createHash("md5").update(combined).digest("hex");
  }

  private updateVersionConstants(version: string): void {
    try {
      const [major, minor, patch] = version.split(".").map(Number);
      const content = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
export const VERSION = {
  major: ${major},
  minor: ${minor},
  patch: ${patch},
  full: "${version}",
  generated: "${new Date().toISOString()}"
} as const;
`;

      const versionDir = path.dirname(
        "features/business-logic-modern/infrastructure/versioning/version.ts"
      );
      if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
      }

      fs.writeFileSync(
        "features/business-logic-modern/infrastructure/versioning/version.ts",
        content
      );

      console.log(`✅ Updated version constants to ${version}`);
    } catch (error) {
      console.error("❌ Could not update version constants:", error);
    }
  }
}

export const versionDetector = new AutoVersionDetector();
