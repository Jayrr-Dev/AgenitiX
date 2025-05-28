declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    sw?: string;
    runtimeCaching?: Array<{
      urlPattern: RegExp | string;
      handler: string;
      options?: {
        cacheName?: string;
        expiration?: {
          maxEntries?: number;
          maxAgeSeconds?: number;
        };
        cacheKeyWillBeUsed?: any;
        cacheWillUpdate?: any;
        cacheResponseWillBeUsed?: any;
        requestWillFetch?: any;
        fetchDidFail?: any;
        fetchDidSucceed?: any;
      };
    }>;
    buildExcludes?: Array<string | RegExp>;
    exclude?: Array<string | RegExp>;
    include?: Array<string | RegExp>;
    manifestTransforms?: Array<any>;
    modifyURLPrefix?: Record<string, string>;
    additionalManifestEntries?: Array<any>;
    dontCacheBustURLsMatching?: RegExp;
    navigateFallback?: string;
    navigateFallbackDenylist?: Array<RegExp>;
    navigateFallbackAllowlist?: Array<RegExp>;
    offlineGoogleAnalytics?: boolean | object;
    cleanupOutdatedCaches?: boolean;
    clientsClaim?: boolean;
    skipWaiting?: boolean;
    directoryIndex?: string;
    ignoreURLParametersMatching?: Array<RegExp>;
    importWorkboxFrom?: 'cdn' | 'local' | 'disabled';
    mode?: 'production' | 'development';
    scope?: string;
    swSrc?: string;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
} 