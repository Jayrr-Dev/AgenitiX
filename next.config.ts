import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		domains: ["placehold.co", "d63wj7axnd.ufs.sh", "86apvmagmm.ufs.sh", "images.unsplash.com"],
	},
};

// MINIMAL PWA CONFIGURATION
export default withPWA({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development",
})(nextConfig);
