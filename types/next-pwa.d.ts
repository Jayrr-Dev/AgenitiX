declare module "next-pwa" {
	import type { NextConfig } from "next";

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
				cacheKeyWillBeUsed?: (options: { request: Request; mode: string }) =>
					| string
					| Promise<string>;
				cacheWillUpdate?: (options: { request: Request; response: Response }) =>
					| boolean
					| Promise<boolean>;
				cacheResponseWillBeUsed?: (options: { request: Request; response: Response }) =>
					| Response
					| Promise<Response>;
				requestWillFetch?: (options: { request: Request }) => Request | Promise<Request>;
				fetchDidFail?: (options: {
					originalRequest: Request;
					error: Error;
				}) => void | Promise<void>;
				fetchDidSucceed?: (options: { request: Request; response: Response }) =>
					| Response
					| Promise<Response>;
			};
		}>;
		buildExcludes?: Array<string | RegExp>;
		exclude?: Array<string | RegExp>;
		include?: Array<string | RegExp>;
		manifestTransforms?: Array<
			(manifestEntries: Array<{ url: string; revision: string | null }>) => {
				manifest: Array<{ url: string; revision: string | null }>;
				warnings?: string[];
			}
		>;
		modifyURLPrefix?: Record<string, string>;
		additionalManifestEntries?: Array<{ url: string; revision: string | null }>;
		dontCacheBustURLsMatching?: RegExp;
		navigateFallback?: string;
		navigateFallbackDenylist?: RegExp[];
		navigateFallbackAllowlist?: RegExp[];
		offlineGoogleAnalytics?: boolean | object;
		cleanupOutdatedCaches?: boolean;
		clientsClaim?: boolean;
		skipWaiting?: boolean;
		directoryIndex?: string;
		ignoreURLParametersMatching?: RegExp[];
		importWorkboxFrom?: "cdn" | "local" | "disabled";
		mode?: "production" | "development";
		scope?: string;
		swSrc?: string;
	}

	function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
	export default withPWA;
}
