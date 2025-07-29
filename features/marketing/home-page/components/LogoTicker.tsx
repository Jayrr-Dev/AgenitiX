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
		<div className="flex h-full w-full flex-col items-center justify-center">
			<h3 className="w-2/3 text-center font-bold text-4xl">Trusted by 150,000+ Content</h3>
			<h3 className="w-2/3 text-center font-bold text-4xl">Creators, SEOs, Agencies, and Teams</h3>
			<LogoTicker logos={logosArray} />
		</div>
	);
};
