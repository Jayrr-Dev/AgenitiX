import { logos } from "@/features/marketing/home-page/data";
import dynamic from "next/dynamic";

// Dynamically import the LogoTicker component
// Note: Make sure the default export from logo-ticker is named LogoTicker
const LogoTicker = dynamic(() => import("@/components/ui/logo-ticker"));

/**
 * Interface representing a logo entity
 */
interface Logo {
	name: string;
	key: string;
	customId: string | null;
	url: string;
	uploadedAt: string;
	width: number;
	height: number;
}

const logosArray: Logo[] = logos.map((logo) => ({
	name: logo.name,
	key: logo.key,
	customId: logo.customId,
	url: logo.url,
	width: logo.width,
	height: logo.height,
	uploadedAt: logo.uploadedAt,
}));

export const InfiniteLogoTicker = () => {
	return (
		<div className="w-full h-full flex flex-col items-center justify-center">
			<h3 className="text-4xl font-bold text-center w-2/3">Trusted by 150,000+ Content</h3>
			<h3 className="text-4xl font-bold text-center w-2/3">Creators, SEOs, Agencies, and Teams</h3>
			<LogoTicker logos={logosArray} />
		</div>
	);
};
