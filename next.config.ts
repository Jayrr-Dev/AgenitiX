import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		domains: ["placehold.co", "d63wj7axnd.ufs.sh", "86apvmagmm.ufs.sh", "images.unsplash.com"],
	},
	// WEBPACK CACHE OPTIMIZATION
	webpack: (config, { dev, isServer }) => {
		// Optimize cache for better performance with large strings
		if (!dev) {
			config.cache = {
				...config.cache,
				type: "filesystem",
				compression: "gzip",
				maxMemoryGenerations: 1,
				allowCollectingMemory: true,
				// Reduce cache size to prevent large string serialization issues
				maxAge: 24 * 60 * 60 * 1000, // 24 hours
			};
		}

		// Optimize module resolution for better performance
		config.resolve.cacheWithContext = false;

		return config;
	},
};

// MINIMAL PWA CONFIGURATION
const configWithPWA = withPWA({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development",
	exclude: [
		/\.map$/,
		/^\/tailwind\.css$/, // Exclude static tailwind.css from caching
	],
})(nextConfig);

// SENTRY CONFIGURATION
export default withSentryConfig(configWithPWA, {
	// For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options
	org: "utilitek-solutions",
	project: "agenitix",

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Disable source map widening to reduce cache size and improve build performance
	widenClientFileUpload: false,

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

	// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
	// See the following for more information:
	// https://docs.sentry.io/product/crons/
	// https://vercel.com/docs/cron-jobs
	automaticVercelMonitors: true,
});
